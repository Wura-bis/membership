import sys
import os
import json
sys.path.append(os.path.join(os.path.dirname(__file__), 'membership-backend'))

from db_config import get_db_connection

def analyze_member_fields():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return
    
    cursor = conn.cursor()
    
    print("=== DATABASE FIELD ANALYSIS ===\n")
    
    # Get Members table structure
    try:
        cursor.execute("SELECT * FROM Members WHERE 1=0")
        members_fields = [desc[0] for desc in cursor.description]
        print("MEMBERS TABLE FIELDS:")
        for i, field in enumerate(members_fields, 1):
            print(f"  {i:2d}. {field}")
        print()
    except Exception as e:
        print("Members table error:", e)
    
    # Get MemberAddress table structure
    try:
        cursor.execute("SELECT * FROM MemberAddress WHERE 1=0")
        address_fields = [desc[0] for desc in cursor.description]
        print("MEMBER ADDRESS TABLE FIELDS:")
        for i, field in enumerate(address_fields, 1):
            print(f"  {i:2d}. {field}")
        print()
    except Exception as e:
        print("MemberAddress table error:", e)
    
    # Get MemberRole table structure
    try:
        cursor.execute("SELECT * FROM MemberRole WHERE 1=0")
        role_fields = [desc[0] for desc in cursor.description]
        print("MEMBER ROLE TABLE FIELDS:")
        for i, field in enumerate(role_fields, 1):
            print(f"  {i:2d}. {field}")
        print()
    except Exception as e:
        print("MemberRole table error:", e)
    
    # Get actual member data for member 5
    try:
        print("SAMPLE MEMBER DATA (ID=5):")
        cursor.execute("SELECT * FROM Members WHERE MemberID = 5")
        member = cursor.fetchone()
        if member:
            for i, (field, value) in enumerate(zip(members_fields, member)):
                print(f"  {field}: {value}")
        print()
    except Exception as e:
        print("Sample member error:", e)
    
    # Get address data for member 5
    try:
        print("SAMPLE ADDRESS DATA (Member ID=5):")
        cursor.execute("SELECT * FROM MemberAddress WHERE MemberID = 5")
        addresses = cursor.fetchall()
        for addr in addresses:
            for i, (field, value) in enumerate(zip(address_fields, addr)):
                print(f"  {field}: {value}")
        print()
    except Exception as e:
        print("Sample address error:", e)
    
    # Check lookup tables
    print("LOOKUP TABLES:")
    tables = [
        ("MemberCategory", "CategoryID", "CategoryName"),
        ("IrishCounties", "CountyID", "CountyName"), 
        ("IrishSurnames", "SurnameID", "Surname"),
        ("Occupation", "OccupationID", "OccupationName"),
        ("Role", "RoleID", "RoleName"),
        ("FiscalYear", "FiscalYearID", "YearLabel")
    ]
    
    for table, id_field, name_field in tables:
        try:
            cursor.execute(f"SELECT {id_field}, {name_field} FROM {table}")
            rows = cursor.fetchall()
            print(f"  {table}: {len(rows)} records")
            for row in rows[:3]:  # Show first 3
                print(f"    {row[0]}: {row[1]}")
            if len(rows) > 3:
                print(f"    ... and {len(rows) - 3} more")
            print()
        except Exception as e:
            print(f"  {table} error: {e}")
    
    conn.close()

if __name__ == "__main__":
    analyze_member_fields()
