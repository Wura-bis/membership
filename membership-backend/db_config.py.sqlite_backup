# Database configuration for BIS Membership System
import sqlite3
import os
from datetime import datetime, date

def adapt_datetime_iso(val):
    """Adapt datetime.datetime to ISO 8601 date."""
    return val.isoformat()

def adapt_date_iso(val):
    """Adapt datetime.date to ISO 8601 date."""
    return val.isoformat()

def convert_datetime(val):
    """Convert ISO 8601 datetime to datetime.datetime object."""
    try:
        return datetime.fromisoformat(val.decode())
    except (ValueError, AttributeError):
        return val

def convert_date(val):
    """Convert ISO 8601 date to datetime.date object."""
    try:
        return date.fromisoformat(val.decode())
    except (ValueError, AttributeError):
        return val

# Register adapters and converters to handle the deprecation warning
sqlite3.register_adapter(datetime, adapt_datetime_iso)
sqlite3.register_adapter(date, adapt_date_iso)
sqlite3.register_converter("datetime", convert_datetime)
sqlite3.register_converter("date", convert_date)

def get_db_connection():
    """Get database connection using SQLite for production"""
    # Path to the SQLite database file
    db_path = os.path.join(os.path.dirname(__file__), '..', 'BISMembershipDatabase.db')
    
    try:
        conn = sqlite3.connect(db_path, detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES)
        conn.row_factory = sqlite3.Row  # This allows accessing columns by name
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None
