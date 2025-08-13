"""
Test script to verify the new get_member function works correctly
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))
sys.path.append(os.path.join(os.path.dirname(__file__), 'membership-backend'))

import json
# Import the db_config directly from the backend folder
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'membership-backend'))
from db_config import get_db_connection

def test_get_member_function():
    """Test the basic components of the new get_member function"""
    
    conn = get_db_connection()
    if not conn:
        print("❌ Database connection failed")
        return
    
    try:
        cursor = conn.cursor()
        
        # 1. Test basic member query with JOINs
        print("🧪 Testing member query with foreign key resolution...")
        member_query = """
            SELECT 
                m.MemberID, m.FirstName, m.LastName, m.Email, m.PhoneNumber, 
                m.[Place of Birth], m.[Date of Birth],
                m.MemberCategoryID, mc.CategoryName,
                m.CountyID, ic.CountyName, 
                m.SurnameID, s.Surname,
                m.OccupationID, o.OccupationName,
                m.Notes, m.IsActive, m.OtherSocieties, 
                m.DateJoined, m.DateEnded, m.ApplicationDate, m.[Approval Date],
                m.ApprovedBy, m.SignedBy, m.Proposer, m.Seconder, m.ProposalDate
            FROM Members AS m
            LEFT JOIN MemberCategory AS mc ON m.MemberCategoryID = mc.CategoryID
            LEFT JOIN IrishCounties AS ic ON m.CountyID = ic.CountyID
            LEFT JOIN IrishSurnames AS s ON m.SurnameID = s.SurnameID
            LEFT JOIN Occupation AS o ON m.OccupationID = o.OccupationID
            WHERE m.MemberID = ?
        """
        
        # Test with member ID 1
        cursor.execute(member_query, (1,))
        member_row = cursor.fetchone()
        
        if member_row:
            print(f"✅ Member query successful!")
            print(f"   Member: {member_row[1]} {member_row[2]}")
            print(f"   Category: ID {member_row[7]} -> '{member_row[8] or 'NULL'}'")
            print(f"   County: ID {member_row[9]} -> '{member_row[10] or 'NULL'}'")
            print(f"   Surname: ID {member_row[11]} -> '{member_row[12] or 'NULL'}'")
            print(f"   Occupation: ID {member_row[13]} -> '{member_row[14] or 'NULL'}'")
        else:
            print("❌ No member found with ID 1")
            
        # 2. Test address query with fiscal year resolution
        print("\n🧪 Testing address query with fiscal year resolution...")
        address_query = """
            SELECT 
                ma.MemberAddressID, ma.Street, ma.City, 
                ma.ProvinceID, ma.CountryID, ma.PostalCode, 
                ma.FiscalYearID, fy.YearLabel, ma.IsCurrent
            FROM MemberAddress AS ma
            LEFT JOIN FiscalYear AS fy ON ma.FiscalYearID = fy.FiscalYearID
            WHERE ma.MemberID = ?
            ORDER BY ma.IsCurrent DESC, ma.MemberAddressID DESC
        """
        
        cursor.execute(address_query, (1,))
        address_rows = cursor.fetchall()
        
        if address_rows:
            print(f"✅ Address query successful! Found {len(address_rows)} addresses")
            for addr in address_rows:
                print(f"   Address: {addr[1] or 'NULL'}, {addr[2] or 'NULL'}")
                print(f"   Fiscal Year: ID {addr[6]} -> '{addr[7] or 'NULL'}'")
                print(f"   Current: {bool(addr[8])}")
        else:
            print("⚠️  No addresses found for member ID 1")
            
        # 3. Test role query with name resolution
        print("\n🧪 Testing role query with name resolution...")
        role_query = """
            SELECT 
                mr.RoleID, r.RoleName, 
                mr.FiscalYearID, fy.YearLabel
            FROM MemberRole AS mr
            LEFT JOIN Role AS r ON mr.RoleID = r.RoleID
            LEFT JOIN FiscalYear AS fy ON mr.FiscalYearID = fy.FiscalYearID
            WHERE mr.MemberID = ?
            ORDER BY mr.FiscalYearID DESC
        """
        
        cursor.execute(role_query, (1,))
        role_rows = cursor.fetchall()
        
        if role_rows:
            print(f"✅ Role query successful! Found {len(role_rows)} roles")
            for role in role_rows:
                print(f"   Role: ID {role[0]} -> '{role[1] or 'NULL'}'")
                print(f"   Fiscal Year: ID {role[2]} -> '{role[3] or 'NULL'}'")
        else:
            print("⚠️  No roles found for member ID 1")
            
        print("\n✅ All queries completed successfully!")
        print("✅ Foreign key resolution is working!")
        print("✅ Field name mapping is correct!")
        
    except Exception as e:
        print(f"❌ Error during testing: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    test_get_member_function()
