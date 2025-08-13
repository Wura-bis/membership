"""
Test the new get_member function to verify it returns proper data
"""
import requests
import json

def test_member_api():
    """Test the member API endpoint to verify foreign key resolution"""
    
    # Test the API health first
    try:
        health_response = requests.get('http://localhost:5000/api/health')
        print(f"✅ Backend health check: {health_response.status_code}")
        if health_response.status_code != 200:
            print("❌ Backend not responding properly")
            return
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return
    
    # Test member endpoint (this will require authentication)
    try:
        member_response = requests.get('http://localhost:5000/api/members/1')
        print(f"📡 Member API response status: {member_response.status_code}")
        
        if member_response.status_code == 401:
            print("🔐 Authentication required (expected)")
            print("✅ Backend is running and responding correctly")
            print("🎯 To test the full functionality:")
            print("   1. Open the frontend at http://localhost:5173")
            print("   2. Log in with your credentials")
            print("   3. Navigate to a member view/edit page")
            print("   4. Check that roles and fiscal years show names, not numbers")
            print("   5. Verify address fields are properly populated")
            
        elif member_response.status_code == 200:
            data = member_response.json()
            print("✅ Member data retrieved successfully!")
            print(f"   Member: {data.get('firstName', 'N/A')} {data.get('lastName', 'N/A')}")
            print(f"   Category: {data.get('memberCategory', 'N/A')} (ID: {data.get('memberCategoryID', 'N/A')})")
            print(f"   County: {data.get('county', 'N/A')} (ID: {data.get('countyID', 'N/A')})")
            
            # Check roles
            roles = data.get('roleFiscalYears', [])
            if roles:
                print(f"   Roles ({len(roles)}):")
                for role in roles:
                    role_name = role.get('role', role.get('roleName', 'N/A'))
                    fiscal_year = role.get('fiscalYear', role.get('fiscalYearLabel', 'N/A'))
                    print(f"     - {role_name} for {fiscal_year}")
            
            # Check addresses
            addresses = data.get('addresses', [])
            if addresses:
                print(f"   Addresses ({len(addresses)}):")
                for addr in addresses:
                    street = addr.get('addressLine1', 'N/A')
                    city = addr.get('city', 'N/A') 
                    fiscal_year = addr.get('fiscalYear', 'N/A')
                    print(f"     - {street}, {city} ({fiscal_year})")
                    
        else:
            print(f"❌ Unexpected response: {member_response.status_code}")
            print(f"Response: {member_response.text}")
            
    except Exception as e:
        print(f"❌ Error testing member API: {e}")

if __name__ == "__main__":
    test_member_api()
