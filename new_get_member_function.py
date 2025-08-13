@app.route('/api/members/<int:member_id>', methods=['GET'])
@auth_required
def get_member(member_id):
    """Get specific member details with properly resolved foreign keys"""
    print(f'DEBUG: Getting member {member_id}')
    
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    try:
        cursor = conn.cursor()

        # Check if user has permission to view this member
        if session['user_role'] == 'Public':
            cursor.execute("SELECT IsActive FROM Members WHERE MemberID = ?", (member_id,))
            result = cursor.fetchone()
            if not result or result[0]:  # Active member - public can't view
                return jsonify({'error': 'Access denied'}), 403

        # 1. GET MEMBER BASIC INFO with all foreign key resolutions
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
        
        cursor.execute(member_query, (member_id,))
        member_row = cursor.fetchone()
        
        if not member_row:
            return jsonify({'error': 'Member not found'}), 404

        # Build base member data
        member_data = {
            'id': member_row[0],
            'firstName': member_row[1] or '',
            'lastName': member_row[2] or '',
            'email': member_row[3] or '',
            'phoneNumber': member_row[4] or '',
            'placeOfBirth': member_row[5] or '',
            'dateOfBirth': member_row[6].strftime('%Y-%m-%d') if member_row[6] else '',
            # Category info
            'memberCategoryID': member_row[7],
            'memberCategory': member_row[8] or '',
            # County info  
            'countyID': member_row[9],
            'county': member_row[10] or '',
            # Surname info
            'surnameID': member_row[11],
            'surname': member_row[12] or '',
            # Occupation info
            'occupationID': member_row[13],
            'occupation': member_row[14] or '',
            # Other fields
            'notes': member_row[15] or '',
            'isActive': bool(member_row[16]),
            'otherSocieties': member_row[17] or '',
            'dateJoined': member_row[18].strftime('%Y-%m-%d') if member_row[18] else '',
            'dateEnded': member_row[19].strftime('%Y-%m-%d') if member_row[19] else '',
            'applicationDate': member_row[20].strftime('%Y-%m-%d') if member_row[20] else '',
            'approvalDate': member_row[21].strftime('%Y-%m-%d') if member_row[21] else '',
            'approvedBy': member_row[22] or '',
            'signedBy': member_row[23] or '',
            'proposer': member_row[24] or '',
            'seconder': member_row[25] or '',
            'proposalDate': member_row[26].strftime('%Y-%m-%d') if member_row[26] else '',
        }

        # 2. GET ADDRESSES with proper field mapping
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
        
        cursor.execute(address_query, (member_id,))
        address_rows = cursor.fetchall()
        
        addresses = []
        for addr in address_rows:
            addresses.append({
                'id': addr[0],
                'addressLine1': addr[1] or '',  # Street -> addressLine1
                'addressLine2': '',  # Not in database
                'city': addr[2] or '',
                'provinceID': addr[3],
                'province': '',  # Would need Province lookup table
                'countryID': addr[4], 
                'country': '',  # Would need Country lookup table
                'postalCode': addr[5] or '',
                'fiscalYearID': addr[6],
                'fiscalYear': addr[7] or '',  # Resolved from FiscalYear table
                'isCurrent': bool(addr[8])
            })
        
        member_data['addresses'] = addresses

        # 3. GET ROLES with proper name resolution
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
        
        cursor.execute(role_query, (member_id,))
        role_rows = cursor.fetchall()
        
        role_fiscal_years = []
        for role in role_rows:
            role_fiscal_years.append({
                'roleID': role[0],
                'role': role[1] or f'Role ID {role[0]}',  # Use name or fallback to ID
                'fiscalYearID': role[2],
                'fiscalYear': role[3] or f'Fiscal Year ID {role[2]}',  # Use label or fallback to ID
                'roleName': role[1] or '',  # For compatibility
                'fiscalYearLabel': role[3] or ''  # For compatibility
            })
        
        member_data['roleFiscalYears'] = role_fiscal_years

        # 4. GET IRISH CONNECTIONS with proper name resolution
        irish_connections = []
        try:
            # Get county connections
            cursor.execute("""
                SELECT icc.CountyID, ic.CountyName
                FROM IrishConnectionByCounty AS icc
                LEFT JOIN IrishCounties AS ic ON icc.CountyID = ic.CountyID
                WHERE icc.MemberID = ?
            """, (member_id,))
            county_rows = cursor.fetchall()
            
            # Get surname connections
            cursor.execute("""
                SELECT ics.SurnameID, isur.Surname
                FROM IrishConnectionBySurname AS ics
                LEFT JOIN IrishSurnames AS isur ON ics.SurnameID = isur.SurnameID
                WHERE ics.MemberID = ?
            """, (member_id,))
            surname_rows = cursor.fetchall()
            
            # Combine county and surname connections
            for county in county_rows:
                irish_connections.append({
                    'countyID': county[0],
                    'county': county[1] or f'County ID {county[0]}',
                    'surnameID': None,
                    'surname': ''
                })
                
            for surname in surname_rows:
                irish_connections.append({
                    'countyID': None,
                    'county': '',
                    'surnameID': surname[0],
                    'surname': surname[1] or f'Surname ID {surname[0]}'
                })
                    
        except Exception as e:
            print(f'DEBUG: Irish connections query failed: {e}')
        
        member_data['irishConnections'] = irish_connections

        print(f'DEBUG: Successfully built member data for {member_id}')
        return jsonify(member_data)

    except Exception as e:
        print(f'DEBUG ERROR in get_member: {e}')
        return jsonify({'error': f'Failed to fetch member details: {str(e)}'}), 500
    finally:
        conn.close()
