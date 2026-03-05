"""
Creates the IssueLog table in the database and inserts all bugs fixed during
the current development session.
"""
import sqlite3
from datetime import date

DB_PATH = r'c:\Users\user\Documents\membership\BISMembershipDatabase.db'

conn = sqlite3.connect(DB_PATH)
c = conn.cursor()

# ── Create table ────────────────────────────────────────────────────────────
c.execute("""
CREATE TABLE IF NOT EXISTS IssueLog (
    IssueID     INTEGER PRIMARY KEY AUTOINCREMENT,
    DateFixed   TEXT    NOT NULL,
    Category    TEXT    NOT NULL,
    Severity    TEXT    NOT NULL,           -- Critical / High / Medium / Low
    Title       TEXT    NOT NULL,
    RootCause   TEXT,
    Fix         TEXT,
    AffectedFile TEXT
)
""")

today = str(date.today())

issues = [
    (today, 'SQL Syntax', 'Critical',
     'Support ticket system non-functional — SQL Server syntax used in SQLite',
     'Support endpoints used NOW(), @@IDENTITY, TEXT(255), MEMO, AdminID column '
     '— all SQL Server / Access syntax not valid in SQLite.',
     'Replaced NOW() → datetime("now"), @@IDENTITY → LAST_INSERT_ROWID() / '
     'cursor.lastrowid, TEXT(255)/MEMO → TEXT, AdminID → AdminUserID throughout.',
     'app.py'),

    (today, 'Configuration', 'High',
     'Session timeout setting ignored — hardcoded constant used instead of DB value',
     'SESSION_TIMEOUT was a hardcoded Python constant; the Settings table value '
     'was never read.',
     'Created get_session_timeout_seconds() that reads sessionTimeout from the '
     'Settings table; check_session_timeout() now calls this function. '
     'DB value set to 250 minutes.',
     'app.py'),

    (today, 'Schema', 'High',
     'All primary key ID columns stored as TEXT instead of INTEGER',
     'Original schema created ID columns as TEXT (e.g. MemberID, UserID, '
     'SocietyID, etc.) causing type-mismatch issues and preventing proper '
     'integer comparisons and auto-increment behaviour.',
     'Ran fix_all_id_types.py and fix_members_table.py to recreate affected '
     'columns as INTEGER with AUTOINCREMENT where appropriate.',
     'BISMembershipDatabase.db'),

    (today, 'Runtime Error', 'Critical',
     'Admin dashboard returns HTTP 500 — boolean column comparison failure',
     'IsActive and IsApproved are stored as TEXT ("0"/"1") but all WHERE '
     'clauses used integer literals (= 1 / = 0), causing SQLite to return '
     'no rows or type errors.',
     'Changed all boolean comparisons to the OR pattern: '
     'IsActive = \'1\' OR IsActive = 1, throughout admin_dashboard() and '
     'related queries.',
     'app.py'),

    (today, 'Runtime Error', 'Critical',
     'Admin dashboard returns HTTP 500 — datetime object not subscriptable',
     'After the Members table migration, CreatedAt returns a datetime.datetime '
     'object; code used row[2][:10] (string slicing) on it.',
     'Replaced string slice with: raw_date.strftime("%Y-%m-%d") if '
     'hasattr(raw_date, "strftime") else str(raw_date)[:10].',
     'app.py'),

    (today, 'Runtime Error', 'Critical',
     'Members list returns HTTP 500 — datetime.date vs datetime.datetime subtraction',
     'calculate_membership_years() subtracted a datetime.date (DateJoined from '
     'SQLite) from a datetime.datetime (datetime.now()), causing TypeError.',
     'Rewrote function with a to_datetime() normaliser that converts date, '
     'datetime.datetime, and string inputs to a uniform datetime.datetime '
     'before arithmetic.',
     'app.py'),

    (today, 'Frontend', 'Medium',
     'Frontend crash on Members page — members.filter is not a function',
     'members state initialised to {} (dict); React called .filter() on it '
     'when the API returned an error object instead of an array.',
     'Added guard: setMembers(Array.isArray(data) ? data : []) in member.jsx.',
     'membership-frontend/src/pages/members/member.jsx'),

    (today, 'Frontend', 'Medium',
     'Frontend crash on Dashboard — activities.slice is not a function',
     'recentActivities state was undefined when API returned an error; '
     '.slice(0, 3) was called on undefined.',
     'Added guard: setActivities(data.recentActivities || []) in '
     'enhanced-dashboard.jsx.',
     'membership-frontend/src/pages/admin/enhanced-dashboard.jsx'),

    (today, 'Frontend', 'Medium',
     'Pie chart missing "Historical" and "Honorary" categories',
     'enhanced-dashboard.jsx prepareChartData() only included Active, Inactive '
     'and Deceased (which does not exist as a DB category). private.jsx '
     'pieData also omitted Historical.',
     'Updated prepareChartData() to map breakdown.historical and '
     'breakdown.honorary. Updated private.jsx pieData to include Historical. '
     'Removed non-existent "Deceased" entry from both.',
     'enhanced-dashboard.jsx, private.jsx'),

    (today, 'SQL Syntax', 'Critical',
     'POST /api/members returns 500 — @@IDENTITY used after conn.commit()',
     '@@IDENTITY is SQL Server syntax and is invalid in SQLite; additionally '
     'it was called after conn.commit() which would return NULL even in '
     'SQL Server.',
     'Replaced with cursor.lastrowid (captured immediately after INSERT, '
     'before commit). Applied same fix to all other @@IDENTITY occurrences.',
     'app.py'),

    (today, 'Database', 'High',
     'GET /api/notifications returns 500 — wrong table name',
     'Endpoint queried "Notifications" (plural) but the actual table is '
     '"Notification" (singular). INSERT also used the wrong name.',
     'Fixed all queries in the notifications endpoints to use the correct '
     'table name "Notification".',
     'app.py'),

    (today, 'Database', 'High',
     'POST /api/support returns 500 — table "Support" does not exist',
     'The submit_support and submit_support_message functions both inserted '
     'into a table named "Support" which was never created. The actual table '
     'is "SupportMessage".',
     'Replaced all references to "Support" table in the /api/support '
     'POST, GET, GET /mine, and PUT endpoints with "SupportMessage". '
     'Also fixed @@IDENTITY → cursor.lastrowid and returns 201 on create.',
     'app.py'),

    (today, 'Security', 'High',
     'GET /api/check-auth always returns 200 — no session validation',
     'The check_auth() function returned {"success": True} unconditionally '
     'without checking whether the user had an active session. This allowed '
     'any unauthenticated request to appear "authenticated" to the frontend.',
     'Added session check: if "user_id" not in session: return 401.',
     'app.py'),

    (today, 'Runtime Error', 'Low',
     'GET /api/members/<id>/fiscal-years returns 500 — MemberFiscalYear table missing',
     'The endpoint queries a MemberFiscalYear table that was never created '
     'in the database.',
     'Added graceful fallback: catch "no such table" OperationalError and '
     'return an empty list [] instead of 500.',
     'app.py'),
]

c.executemany("""
    INSERT INTO IssueLog (DateFixed, Category, Severity, Title, RootCause, Fix, AffectedFile)
    VALUES (?, ?, ?, ?, ?, ?, ?)
""", issues)

conn.commit()

# Verify
c.execute("SELECT COUNT(*) FROM IssueLog")
count = c.fetchone()[0]
print(f"IssueLog table created. {count} issue{'s' if count != 1 else ''} recorded.")

c.execute("SELECT IssueID, Severity, Title FROM IssueLog ORDER BY IssueID")
for row in c.fetchall():
    print(f"  [{row[1]:8s}] #{row[0]:02d} {row[2]}")

conn.close()
