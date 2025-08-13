import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'membership-backend'))

from db_config import get_db_connection

def test_get_member_query(member_id=5):
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return
    
    cursor = conn.cursor()
    
    print(f"Testing member {member_id}...")
    
    # Test member details query
    try:
        sql = """
            SELECT m.MemberID, m.FirstName, m.LastName, m.Email, m.PhoneNumber, m.[Place of Birth], m.[Date of Birth],
                   m.MemberCategoryID, c.CategoryName, m.CountyID, co.CountyName, m.SurnameID, s.Surname, m.OccupationID, o.OccupationName,
                   m.Notes, m.IsActive, m.OtherSocieties, m.[DateJoined], m.[DateEnded], m.[ApplicationDate], m.[Approval Date],
                   m.ApprovedBy, m.SignedBy, m.Proposer, m.Seconder, m.[ProposalDate]
            FROM (((((Members AS m
            LEFT JOIN MemberCategory AS c ON m.MemberCategoryID = c.CategoryID)
            LEFT JOIN IrishCounties AS co ON m.CountyID = co.CountyID)
            LEFT JOIN IrishSurnames AS s ON m.SurnameID = s.SurnameID)
            LEFT JOIN Occupation AS o ON m.OccupationID = o.OccupationID))
            WHERE m.MemberID = ?
        """
        cursor.execute(sql, (member_id,))
        member = cursor.fetchone()
        print("Member details:", member)
    except Exception as e:
        print("Member details error:", e)
    
    # Test address query
    try:
        cursor.execute("""
            SELECT ma.MemberAddressID, ma.Street, ma.City, ma.ProvinceID, ma.CountryID, ma.PostalCode, ma.FiscalYearID, fy.YearLabel, ma.IsCurrent
            FROM MemberAddress AS ma
            LEFT JOIN FiscalYear AS fy ON ma.FiscalYearID = fy.FiscalYearID
            WHERE ma.MemberID = ?
            ORDER BY ma.IsCurrent DESC
        """, (member_id,))
        addresses = cursor.fetchall()
        print("Addresses:", addresses)
    except Exception as e:
        print("Address error:", e)
    
    # Test role query
    try:
        # Try simpler role query first
        cursor.execute("SELECT RoleID, FiscalYearID FROM MemberRole WHERE MemberID = ?", (member_id,))
        simple_roles = cursor.fetchall()
        print("Simple roles:", simple_roles)
        
        # Try role name lookup separately
        cursor.execute("SELECT RoleID, RoleName FROM Role")
        role_names = cursor.fetchall()
        print("Role names:", role_names)
        
        # Try fiscal year lookup separately
        cursor.execute("SELECT FiscalYearID, YearLabel FROM FiscalYear")
        fiscal_years = cursor.fetchall()
        print("Fiscal years:", fiscal_years)
        
        # Now try the full query but with different field selection
        role_query = "SELECT mr.RoleID, mr.FiscalYearID FROM MemberRole AS mr WHERE mr.MemberID = ?"
        cursor.execute(role_query, (member_id,))
        basic_roles = cursor.fetchall()
        print("Basic roles:", basic_roles)
        
    except Exception as e:
        print("Role error:", e)
    
    conn.close()

if __name__ == "__main__":
    test_get_member_query()
