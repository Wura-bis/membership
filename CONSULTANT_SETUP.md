# BIS Membership System — MySQL Setup Guide

## What you receive

| File / Folder | Contents |
|---|---|
| `bis_membership.sql` | Full MySQL schema + all member data |
| `membership-backend/` | Flask Python backend (MySQL-ready) |
| `membership-frontend/` | React frontend (pre-built in `dist/`) |
| `requirements.txt` | Python package list |

---

## Requirements

- MySQL 8.0+ (character set: `utf8mb4`, collation: `utf8mb4_unicode_ci`)
- Python 3.10+
- A dedicated database user with SELECT / INSERT / UPDATE / DELETE on `bis_membership`

---

## Step 1 — Import the database

```bash
mysql -u root -p < bis_membership.sql
```

This creates the `bis_membership` database, all tables, and loads all data.

---

## Step 2 — Create a MySQL user for the app

```sql
CREATE USER 'bis_user'@'%' IDENTIFIED BY 'choose_a_strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON bis_membership.* TO 'bis_user'@'%';
FLUSH PRIVILEGES;
```

Replace `'%'` with the specific host the Flask app runs on if you want to lock it down further.

---

## Step 3 — Configure the backend

The backend reads all database connection details from **environment variables**. Set these before starting the app:

| Variable | Description | Example |
|---|---|---|
| `DB_HOST` | MySQL server hostname | `db.example.com` |
| `DB_PORT` | MySQL port (default 3306) | `3306` |
| `DB_NAME` | Database name | `bis_membership` |
| `DB_USER` | MySQL username | `bis_user` |
| `DB_PASSWORD` | MySQL password | `your_password` |
| `SECRET_KEY` | Flask session secret (any long random string) | `change-me-to-something-random` |

You can set these in a `.env` file, a systemd unit, or however your hosting environment manages environment variables.

---

## Step 4 — Install Python dependencies

```bash
cd membership-backend
pip install -r ../requirements.txt
```

---

## Step 5 — Start the backend

```bash
cd membership-backend
python app.py
```

The backend listens on port **5000** by default. For production, run it behind a reverse proxy (nginx/Apache) and use a WSGI server such as gunicorn:

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

---

## Step 6 — Serve the frontend

The React frontend is pre-built. The Flask app already serves it from the `dist/` folder — no separate web server needed for the frontend unless you prefer to serve it via nginx.

If using nginx, point the document root at `membership-backend/dist/` and proxy `/api/` requests to the Flask app.

---

## Step 7 — Verify

1. Open the app in a browser and log in as admin.
2. Check the member directory shows all members.
3. Open one member record and confirm address and phone numbers appear.
4. Run a report or CSV export to confirm data integrity.

---

## CORS

If the frontend and backend are on different origins, update the `CORS` allowed origin in `membership-backend/app.py` (near the top of the file) to match the production domain.

---

## Notes

- Admin credentials are included in the database dump (`Admin` and `User` tables). Remove any test accounts after confirming the system works.
- The `SECRET_KEY` environment variable must be set to a long random string in production — it protects session cookies.
- All passwords in the database are bcrypt-hashed; the plain-text passwords are not recoverable from the dump.
