# Database configuration for BIS Membership System (MySQL)
# To activate: copy this file over db_config.py
# Also revert the datetime('now', 'localtime') call in app.py ~line 330 back to NOW()
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
