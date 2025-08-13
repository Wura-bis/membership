"""
Simple test to verify database queries work
"""

import pyodbc

# Database configuration
DATABASE_PATH = r'c:\Users\User\Documents\membership-system\BISMembershipDatabase.accdb'
CONNECTION_STRING = f'DRIVER={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={DATABASE_PATH};'

def test_queries():
    try:
        conn = pyodbc.connect(CONNECTION_STRING)
        cursor = conn.cursor()
        
        print("🧪 Testing member query with JOINs...")
        member_query = """
            SELECT 
                m.MemberID, m.FirstName, m.LastName, 
                m.MemberCategoryID, mc.CategoryName,
                m.CountyID, ic.CountyName
            FROM Members AS m
            LEFT JOIN MemberCategory AS mc ON m.MemberCategoryID = mc.CategoryID
            LEFT JOIN IrishCounties AS ic ON m.CountyID = ic.CountyID
            WHERE m.MemberID = ?
        """
        
        cursor.execute(member_query, (1,))
        result = cursor.fetchone()
        
        if result:
            print(f"✅ Member found: {result[1]} {result[2]}")
            print(f"   Category: ID {result[3]} -> Name '{result[4] or 'NULL'}'")
            print(f"   County: ID {result[5]} -> Name '{result[6] or 'NULL'}'")
            
            # If we got names, foreign keys are working!
            if result[4] or result[6]:
                print("🎉 FOREIGN KEY RESOLUTION IS WORKING!")
            else:
                print("⚠️  Foreign keys returning NULL - either no data or IDs are 0/NULL")
        else:
            print("❌ No member found with ID 1")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_queries()
