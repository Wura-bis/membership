# Database configuration for BIS Membership System (SQLite)
# When migrating to MySQL, swap this file with db_config_mysql.py
import sqlite3
import os
from datetime import datetime, date


def adapt_datetime_iso(val):
    return val.isoformat()

def adapt_date_iso(val):
    return val.isoformat()

def convert_datetime(val):
    try:
        return datetime.fromisoformat(val.decode())
    except (ValueError, AttributeError):
        return val

def convert_date(val):
    try:
        return date.fromisoformat(val.decode())
    except (ValueError, AttributeError):
        return val

sqlite3.register_adapter(datetime, adapt_datetime_iso)
sqlite3.register_adapter(date, adapt_date_iso)
sqlite3.register_converter("datetime", convert_datetime)
sqlite3.register_converter("date", convert_date)


class _CursorAdapter:
    """Translates MySQL-style %s placeholders to SQLite-style ? at runtime."""
    def __init__(self, cursor):
        self._c = cursor

    def execute(self, sql, params=None):
        sql = sql.replace('%s', '?')
        if params is None:
            return self._c.execute(sql)
        return self._c.execute(sql, params)

    def executemany(self, sql, params):
        sql = sql.replace('%s', '?')
        return self._c.executemany(sql, params)

    def __iter__(self):
        return iter(self._c)

    def __getattr__(self, name):
        return getattr(self._c, name)


class _ConnectionAdapter:
    """Wraps sqlite3.Connection to return _CursorAdapter from cursor()."""
    def __init__(self, conn):
        self._conn = conn

    def cursor(self):
        return _CursorAdapter(self._conn.cursor())

    def __getattr__(self, name):
        return getattr(self._conn, name)


def get_db_connection():
    db_path = os.path.join(os.path.dirname(__file__), '..', 'BISMembershipDatabase.db')
    try:
        conn = sqlite3.connect(db_path, detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES)
        conn.row_factory = sqlite3.Row
        return _ConnectionAdapter(conn)
    except Exception as e:
        print(f"Database connection error: {e}")
        return None
