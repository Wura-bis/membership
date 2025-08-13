import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'membership-backend'))

from db_config import get_db_connection

def check_table_structure():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return
    
    cursor = conn.cursor()
    
    # Check FiscalYear table structure
    try:
        cursor.execute("SELECT * FROM FiscalYear WHERE 1=0")
        print("FiscalYear columns:", [desc[0] for desc in cursor.description])
    except Exception as e:
        print("FiscalYear table error:", e)
    
    # Check Countries table structure
    try:
        cursor.execute("SELECT * FROM Countries WHERE 1=0")
        print("Countries columns:", [desc[0] for desc in cursor.description])
    except Exception as e:
        print("Countries table error:", e)
    
    # Check MemberAddress structure
    try:
        cursor.execute("SELECT * FROM MemberAddress WHERE 1=0")
        print("MemberAddress columns:", [desc[0] for desc in cursor.description])
    except Exception as e:
        print("MemberAddress table error:", e)
    
    # Check Role table structure
    try:
        cursor.execute("SELECT * FROM Role WHERE 1=0")
        print("Role columns:", [desc[0] for desc in cursor.description])
    except Exception as e:
        print("Role table error:", e)
    
    # Check MemberRole table structure
    try:
        cursor.execute("SELECT * FROM MemberRole WHERE 1=0")
        print("MemberRole columns:", [desc[0] for desc in cursor.description])
    except Exception as e:
        print("MemberRole table error:", e)
    
    conn.close()

if __name__ == "__main__":
    check_table_structure()
