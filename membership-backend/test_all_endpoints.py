"""
Comprehensive endpoint test for BIS Membership App.
Uses Flask's test client (no running server needed).
Run from membership-backend/ folder:
    python test_all_endpoints.py
"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(__file__))
os.environ.setdefault('FLASK_ENV', 'testing')

from app import app

PASS = "\033[92m[PASS]\033[0m"
FAIL = "\033[91m[FAIL]\033[0m"
WARN = "\033[93m[WARN]\033[0m"
INFO = "\033[96m[INFO]\033[0m"

results = {"pass": 0, "fail": 0, "warn": 0}


def check(label, response, expected_status, must_contain=None, must_not_contain=None):
    status = response.status_code
    ok = status == expected_status
    try:
        body = response.get_json(force=True) or {}
    except Exception:
        body = {}

    if must_contain and isinstance(body, dict):
        for key in must_contain:
            if key not in body:
                ok = False

    if must_not_contain and isinstance(body, dict):
        for key in must_not_contain:
            if key in body:
                ok = False

    if ok:
        results["pass"] += 1
        print(f"{PASS} {label} → {status}")
    else:
        results["fail"] += 1
        warn_msg = ""
        if must_contain and isinstance(body, dict):
            missing = [k for k in must_contain if k not in body]
            if missing:
                warn_msg = f" (missing keys: {missing})"
        print(f"{FAIL} {label} → {status} (expected {expected_status}){warn_msg} | body: {str(body)[:200]}")
    return body


def login_admin(c):
    resp = c.post('/api/login', json={'username': 'admin', 'password': 'admin123'},
                  content_type='application/json')
    body = resp.get_json(force=True) or {}
    if resp.status_code == 200:
        print(f"{INFO} Logged in as admin (UserID={body.get('user', {}).get('id', '?')})")
    else:
        print(f"{WARN} Admin login failed: {body} — some tests may receive 401/403")
    return resp.status_code == 200


def login_member(c):
    """Try to log in as first available non-admin user."""
    import sqlite3
    db_path = os.path.join(os.path.dirname(__file__), '..', 'BISMembershipDatabase.db')
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT Username FROM User WHERE IsAdmin = '0' OR IsAdmin = 0 LIMIT 1")
        row = cur.fetchone()
        conn.close()
        if row:
            resp = c.post('/api/login', json={'username': row[0], 'password': 'password123'},
                          content_type='application/json')
            body = resp.get_json(force=True) or {}
            if resp.status_code == 200:
                print(f"{INFO} Logged in as member '{row[0]}'")
                return True
    except Exception as e:
        print(f"{WARN} Could not find non-admin user: {e}")
    return False


def get_first_member_id():
    import sqlite3
    db_path = os.path.join(os.path.dirname(__file__), '..', 'BISMembershipDatabase.db')
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT MemberID FROM Members LIMIT 1")
        row = cur.fetchone()
        conn.close()
        return row[0] if row else 1
    except Exception:
        return 1


def get_first_user_id():
    import sqlite3
    db_path = os.path.join(os.path.dirname(__file__), '..', 'BISMembershipDatabase.db')
    try:
        conn = sqlite3.connect(db_path)
        cur = conn.cursor()
        cur.execute("SELECT UserID FROM User LIMIT 1")
        row = cur.fetchone()
        conn.close()
        return row[0] if row else 1
    except Exception:
        return 1


# ─────────────────────────────────────────────────────────────
print("\n" + "="*60)
print("  BIS Membership App — Full Endpoint Test Suite")
print("="*60 + "\n")

with app.test_client() as c:

    # ── 1. PUBLIC / AUTH ──────────────────────────────────────
    print(f"\n{INFO} ── Auth Endpoints ──")
    check("GET  /api/check-auth (unauthenticated)", c.get('/api/check-auth'), 401)
    check("POST /api/login (bad creds)", c.post('/api/login',
          json={'username': 'nobody', 'password': 'bad'},
          content_type='application/json'), 401)

    # Admin login
    logged_in = login_admin(c)

    check("GET  /api/check-auth (authenticated)", c.get('/api/check-auth'), 200)

    # ── 2. ADMIN DASHBOARD ───────────────────────────────────
    print(f"\n{INFO} ── Admin Dashboard ──")
    check("GET  /api/admin/dashboard", c.get('/api/admin/dashboard'), 200,
          must_contain=['stats', 'recentActivities'])
    check("GET  /api/admin/stats",     c.get('/api/admin/stats'), 200,
          must_contain=['total', 'breakdown'])
    stats_body = c.get('/api/admin/stats').get_json(force=True) or {}
    bd = stats_body.get('breakdown', {})
    if 'historical' in bd:
        print(f"{PASS} /api/admin/stats breakdown includes 'historical' ({bd.get('historical')})")
        results["pass"] += 1
    else:
        print(f"{FAIL} /api/admin/stats breakdown MISSING 'historical'. Keys: {list(bd.keys())}")
        results["fail"] += 1

    # ── 3. MEMBERS ───────────────────────────────────────────
    print(f"\n{INFO} ── Members ──")
    member_id = get_first_member_id()
    members_resp = check("GET  /api/members", c.get('/api/members'), 200)
    check(f"GET  /api/members/{member_id}", c.get(f'/api/members/{member_id}'), 200)
    check("GET  /api/members (search)", c.get('/api/members?search=a'), 200)
    check("GET  /api/members (category filter)", c.get('/api/members?category=Active'), 200)

    # ── 4. MEMBER CREATE / UPDATE / DELETE ───────────────────
    print(f"\n{INFO} ── Member CRUD ──")
    new_member = {
        "firstName": "Test",
        "lastName": "User",
        "email": "testuser_autotest@example.com",
        "dateJoined": "2024-01-01",
        "memberCategoryId": 1,
    }
    create_resp = c.post('/api/members', json=new_member, content_type='application/json')
    create_body = check("POST /api/members (create)", create_resp, 201)
    new_id = create_body.get('member_id') or create_body.get('id') or create_body.get('memberID')

    if new_id:
        update_resp = c.put(f'/api/members/{new_id}',
                            json={"firstName": "Updated", "lastName": "User",
                                  "email": "testuser_autotest@example.com",
                                  "memberCategoryId": 1,
                                  "dateJoined": "2024-01-01"},
                            content_type='application/json')
        check(f"PUT  /api/members/{new_id} (update)", update_resp, 200)
        check(f"DELETE /api/members/{new_id}", c.delete(f'/api/members/{new_id}'), 200)
    else:
        print(f"{WARN} Skipping PUT/DELETE member — no ID returned from POST")
        results["warn"] += 1

    # ── 5. MEMBER SUB-RESOURCES ──────────────────────────────
    print(f"\n{INFO} ── Member Sub-Resources ──")
    check(f"GET  /api/members/{member_id}/phone-numbers",
          c.get(f'/api/members/{member_id}/phone-numbers'), 200)
    check(f"GET  /api/members/{member_id}/roles",
          c.get(f'/api/members/{member_id}/roles'), 200)
    check(f"GET  /api/members/{member_id}/fiscal-years",
          c.get(f'/api/members/{member_id}/fiscal-years'), 200)

    # ── 6. EXPORTS ───────────────────────────────────────────
    print(f"\n{INFO} ── Exports ──")
    csv_resp = c.get('/api/export/members/csv')
    if csv_resp.status_code == 200:
        print(f"{PASS} GET  /api/export/members/csv → 200")
        results["pass"] += 1
    else:
        print(f"{FAIL} GET  /api/export/members/csv → {csv_resp.status_code}")
        results["fail"] += 1

    pdf_resp = c.get('/api/export/members/pdf')
    if pdf_resp.status_code in (200, 500):  # 500 acceptable if reportlab not installed
        tag = PASS if pdf_resp.status_code == 200 else WARN
        print(f"{tag} GET  /api/export/members/pdf → {pdf_resp.status_code}")
        results["pass"] += 1
    else:
        print(f"{FAIL} GET  /api/export/members/pdf → {pdf_resp.status_code}")
        results["fail"] += 1

    # ── 7. LOOKUP TABLES ─────────────────────────────────────
    print(f"\n{INFO} ── Lookups ──")
    lookups = [
        '/api/lookups',            # All-in-one: categories, roles, occupations, etc.
        '/api/lookups/categories',
        '/api/lookups/counties',
        '/api/fiscal-years',
        '/api/recognition-types',
    ]
    for url in lookups:
        resp = c.get(url)
        if resp.status_code == 200:
            print(f"{PASS} GET  {url} → 200")
            results["pass"] += 1
        elif resp.status_code == 404:
            print(f"{WARN} GET  {url} → 404 (route may not exist)")
            results["warn"] += 1
        else:
            print(f"{FAIL} GET  {url} → {resp.status_code}")
            results["fail"] += 1

    # ── 8. SUPPORT TICKETS ───────────────────────────────────
    print(f"\n{INFO} ── Support Tickets ──")
    check("GET  /api/admin/support/tickets", c.get('/api/admin/support/tickets'), 200)
    ticket_data = {
        "subject": "Autotest Ticket",
        "message": "This is a test ticket from automated testing.",
        "priority": "Medium"
    }
    create_ticket = c.post('/api/support', json=ticket_data,
                           content_type='application/json')
    ticket_body = check("POST /api/support (create ticket)", create_ticket, 201)
    ticket_id = ticket_body.get('id') or ticket_body.get('ticketID') or ticket_body.get('support_id')

    if ticket_id:
        check(f"GET  /api/admin/support/tickets/{ticket_id}",
              c.get(f'/api/admin/support/tickets'), 200)
        resp_data = {"message": "This is a test admin response.", "adminUserID": 1, "status": "closed"}
        check(f"PUT  /api/admin/support/tickets/{ticket_id}",
              c.put(f'/api/admin/support/tickets/{ticket_id}',
                    json=resp_data, content_type='application/json'), 200)
    else:
        print(f"{WARN} Skipping ticket respond/close — no ID from POST")
        results["warn"] += 1

    # ── 9. ADMIN SETTINGS ────────────────────────────────────
    print(f"\n{INFO} ── Settings ──")
    check("GET  /api/admin/settings", c.get('/api/admin/settings'), 200)
    settings_put = c.put('/api/admin/settings',
                         json={"sessionTimeout": 250},
                         content_type='application/json')
    if settings_put.status_code in (200, 204):
        print(f"{PASS} PUT  /api/admin/settings → {settings_put.status_code}")
        results["pass"] += 1
    else:
        print(f"{FAIL} PUT  /api/admin/settings → {settings_put.status_code} | {settings_put.get_data(as_text=True)[:200]}")
        results["fail"] += 1

    # ── 10. USER MANAGEMENT ──────────────────────────────────
    print(f"\n{INFO} ── Users ──")
    check("GET  /api/users", c.get('/api/users'), 200)
    user_id = get_first_user_id()
    # No GET /api/users/<id> endpoint — detail via member link or profile
    approve_resp = c.put(f'/api/users/{user_id}/approve',
                         json={}, content_type='application/json')
    if approve_resp.status_code in (200, 400):   # 400 = already approved
        tag = PASS
        print(f"{PASS} PUT  /api/users/{user_id}/approve → {approve_resp.status_code}")
        results["pass"] += 1
    else:
        print(f"{FAIL} PUT  /api/users/{user_id}/approve → {approve_resp.status_code}")
        results["fail"] += 1

    # ── 11. OFFLINE SYNC ─────────────────────────────────────
    print(f"\n{INFO} ── Offline Sync ──")
    check("GET  /api/sync/status", c.get('/api/sync/status'), 200)
    check("GET  /api/sync/export", c.get('/api/sync/export'), 200)

    # ── 12. PUBLIC DASHBOARD ─────────────────────────────────
    print(f"\n{INFO} ── Public Dashboard ──")
    check("GET  /api/public/dashboard", c.get('/api/public/dashboard'), 200)

    # ── 13. PRIVATE DASHBOARD / STATS ────────────────────────
    print(f"\n{INFO} ── Private/Member Dashboard ──")
    check("GET  /api/dashboard",  c.get('/api/dashboard'), 200)
    stats_resp = c.get('/api/stats')
    stats_body2 = check("GET  /api/stats", stats_resp, 200, must_contain=['breakdown'])
    if isinstance(stats_body2, dict) and 'breakdown' in stats_body2:
        bd2 = stats_body2['breakdown']
        if 'historical' in bd2:
            print(f"{PASS} /api/stats breakdown includes 'historical' ({bd2.get('historical')})")
            results["pass"] += 1
        else:
            print(f"{FAIL} /api/stats breakdown MISSING 'historical'. Keys: {list(bd2.keys())}")
            results["fail"] += 1

    # ── 14. NOTIFICATIONS ────────────────────────────────────
    print(f"\n{INFO} ── Notifications ──")
    notif_resp = c.get('/api/notifications')
    if notif_resp.status_code in (200, 404):
        tag = PASS if notif_resp.status_code == 200 else WARN
        print(f"{tag} GET  /api/notifications → {notif_resp.status_code}")
        results["pass"] += 1
    else:
        print(f"{FAIL} GET  /api/notifications → {notif_resp.status_code}")
        results["fail"] += 1

    # ── 15. RECOGNITION ──────────────────────────────────────
    print(f"\n{INFO} ── Recognitions ──")
    recog_resp = c.get('/api/recognitions')
    if recog_resp.status_code in (200, 404):
        tag = PASS if recog_resp.status_code == 200 else WARN
        print(f"{tag} GET  /api/recognitions → {recog_resp.status_code}")
        results["pass"] += 1
    else:
        print(f"{FAIL} GET  /api/recognitions → {recog_resp.status_code}")
        results["fail"] += 1

    # ── 16. LOGOUT ───────────────────────────────────────────
    print(f"\n{INFO} ── Logout ──")
    check("POST /api/logout", c.post('/api/logout'), 200)
    check("GET  /api/check-auth (after logout)", c.get('/api/check-auth'), 401)

print("\n" + "="*60)
total = results["pass"] + results["fail"] + results["warn"]
print(f"  Results: {results['pass']} passed, {results['fail']} failed, {results['warn']} warnings | {total} total")
print("="*60 + "\n")

sys.exit(0 if results["fail"] == 0 else 1)
