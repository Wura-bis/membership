import sys
import os
import json
sys.path.append(os.path.join(os.path.dirname(__file__), 'membership-backend'))

from db_config import get_db_connection

def test_lookups():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return
    
    cursor = conn.cursor()
    
    print("=== TESTING LOOKUPS API ===")
    
    # Counties
    try:
        cursor.execute("SELECT [CountyID], [CountyName] FROM [IrishCounties] ORDER BY [CountyName]")
        counties = [{'value': row[0], 'label': row[1]} for row in cursor.fetchall()]
        print(f"Counties ({len(counties)}): {json.dumps(counties[:3], indent=2)}")
    except Exception as e:
        print("Counties error:", e)
    
    # Categories
    try:
        cursor.execute("SELECT [CategoryID], [CategoryName] FROM [MemberCategory] ORDER BY [CategoryName]")
        categories = [{'value': row[0], 'label': row[1]} for row in cursor.fetchall()]
        print(f"Categories ({len(categories)}): {json.dumps(categories, indent=2)}")
    except Exception as e:
        print("Categories error:", e)
    
    # Fiscal Years
    try:
        cursor.execute("SELECT [FiscalYearID], [YearLabel] FROM [FiscalYear] ORDER BY [FiscalYearID] DESC")
        fiscalYears = [{'value': row[0], 'label': row[1]} for row in cursor.fetchall()]
        print(f"Fiscal Years ({len(fiscalYears)}): {json.dumps(fiscalYears, indent=2)}")
    except Exception as e:
        print("Fiscal Years error:", e)
    
    # Roles
    try:
        cursor.execute("SELECT [RoleID], [RoleName] FROM [Role] ORDER BY [RoleName]")
        roles = [{'value': row[0], 'label': row[1]} for row in cursor.fetchall()]
        print(f"Roles ({len(roles)}): {json.dumps(roles, indent=2)}")
    except Exception as e:
        print("Roles error:", e)
    
    # Surnames
    try:
        cursor.execute("SELECT [SurnameID], [Surname] FROM [IrishSurnames] ORDER BY [Surname]")
        surnames = [{'value': row[0], 'label': row[1]} for row in cursor.fetchall()]
        print(f"Surnames ({len(surnames)}): {json.dumps(surnames, indent=2)}")
    except Exception as e:
        print("Surnames error:", e)
    
    # Occupations
    try:
        cursor.execute("SELECT [OccupationID], [OccupationName] FROM [Occupation] ORDER BY [OccupationName]")
        occupations = [{'value': row[0], 'label': row[1]} for row in cursor.fetchall()]
        print(f"Occupations ({len(occupations)}): {json.dumps(occupations[:3], indent=2)}")
    except Exception as e:
        print("Occupations error:", e)
    
    conn.close()

if __name__ == "__main__":
    test_lookups()
