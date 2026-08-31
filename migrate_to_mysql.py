"""
Converts app.py and db_config.py from SQLite to MySQL.
Run once from the repo root:
    python migrate_to_mysql.py
"""
import re
import shutil
from pathlib import Path

APP_PY = Path("membership-backend/app.py")
DB_CONFIG = Path("membership-backend/db_config.py")
REQUIREMENTS = Path("requirements.txt")

NEW_DB_CONFIG = '''\
# Database configuration for BIS Membership System (MySQL)
import mysql.connector
import os


def get_db_connection():
    """Connect to MySQL using environment variables."""
    try:
        conn = mysql.connector.connect(
            host=os.environ.get("DB_HOST", "localhost"),
            port=int(os.environ.get("DB_PORT", 3306)),
            database=os.environ.get("DB_NAME", "bis_membership"),
            user=os.environ.get("DB_USER", "bis_user"),
            password=os.environ.get("DB_PASSWORD", ""),
            charset="utf8mb4",
            collation="utf8mb4_unicode_ci",
            autocommit=False,
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None
'''


def patch_app(src: str) -> str:
    # 1. Remove sqlite3 import
    src = src.replace("import sqlite3\n", "")

    # 2. sqlite3.OperationalError → Exception
    src = src.replace("except sqlite3.OperationalError:", "except Exception:")

    # 3. Simplify the sqlite3.Row isinstance check (lines 4947-4948 area)
    src = src.replace(
        "cat_id = row['CategoryID'] if isinstance(row, sqlite3.Row) else row[0]",
        "cat_id = row[0]",
    )
    src = src.replace(
        "cat_name = row['CategoryName'] if isinstance(row, sqlite3.Row) else row[1]",
        "cat_name = row[1]",
    )

    # 4. SQLite-specific MemberID query → simple MAX
    src = src.replace(
        "SELECT MAX(CAST(MemberID AS INTEGER)) FROM Members WHERE MemberID NOT NULL AND INSTR(MemberID, '.') = 0",
        "SELECT MAX(MemberID) FROM Members",
    )

    # 5. SQLite datetime('now') → MySQL NOW()
    src = src.replace("datetime('now')", "NOW()")

    # 6. ? → %s  (all are SQL parameter placeholders in this app)
    src = src.replace("?", "%s")

    # 7. [Column Name] → `Column Name`
    #    Negative lookbehind on \w prevents replacing Python subscripts like var[index]
    src = re.sub(
        r"(?<!\w)\[([A-Za-z][A-Za-z0-9 _-]*)\]",
        lambda m: f"`{m.group(1)}`",
        src,
    )

    return src


def main():
    # Back up app.py
    shutil.copy2(APP_PY, APP_PY.with_suffix(".py.sqlite_backup"))
    print(f"Backup: {APP_PY.with_suffix('.py.sqlite_backup').name}")

    # Patch app.py
    src = APP_PY.read_text(encoding="utf-8")
    patched = patch_app(src)
    APP_PY.write_text(patched, encoding="utf-8")

    # Count changes
    q_replaced = src.count("?") - patched.count("?")
    bracket_replaced = len(re.findall(r"(?<!\w)\[[A-Za-z][A-Za-z0-9 _-]*\]", src))
    print(f"app.py: {q_replaced} ? -> %s replacements, {bracket_replaced} [col] -> `col` replacements")

    # Replace db_config.py
    shutil.copy2(DB_CONFIG, DB_CONFIG.with_suffix(".py.sqlite_backup"))
    DB_CONFIG.write_text(NEW_DB_CONFIG, encoding="utf-8")
    print("db_config.py: replaced with MySQL version")

    # Update requirements.txt
    req = REQUIREMENTS.read_text(encoding="utf-8")
    if "mysql-connector-python" not in req:
        req = req.rstrip() + "\nmysql-connector-python>=8.0.0\n"
        REQUIREMENTS.write_text(req, encoding="utf-8")
        print("requirements.txt: added mysql-connector-python")
    else:
        print("requirements.txt: mysql-connector-python already present")

    print("\nDone. Verify with: python -c \"import py_compile; py_compile.compile('membership-backend/app.py')\"")


if __name__ == "__main__":
    main()
