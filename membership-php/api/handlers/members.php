<?php
// ── List members ──────────────────────────────────────────────────────────────
function get_members_list(): void {
    $user = require_auth();
    $role = $user['role'];
    $db   = get_db();

    $sort_by    = $_GET['sortBy']    ?? 'lastName';
    $sort_order = strtoupper($_GET['sortOrder'] ?? 'ASC');
    $allowed_sorts = ['firstName','lastName','dateOfBirth','isActive','category','dateJoined','dateEnded','email','phoneNumber','occupation'];
    if (!in_array($sort_by, $allowed_sorts))       $sort_by    = 'lastName';
    if (!in_array($sort_order, ['ASC','DESC']))    $sort_order = 'ASC';
    $sort_map = [
        'firstName'   => 'm.FirstName',
        'lastName'    => 'm.LastName',
        'dateOfBirth' => 'm.`Date of Birth`',
        'isActive'    => 'm.IsActive',
        'category'    => 'mc.CategoryName',
        'dateJoined'  => 'm.DateJoined',
        'dateEnded'   => 'm.DateEnded',
        'email'       => 'm.Email',
        'phoneNumber' => 'm.PhoneNumber',
        'occupation'  => 'o.OccupationName',
    ];
    $sort_col = $sort_map[$sort_by] ?? 'm.LastName';
    $where    = ($role === 'public') ? "WHERE mc.CategoryName = 'Historical'" : '';

    // Single query — replaces 7 round-trips with one
    $sql = "
        SELECT
            m.MemberID, m.FirstName, m.LastName,
            m.`Place of Birth`, m.`Date of Birth`,
            m.IsActive, mc.CategoryName,
            m.DateJoined, m.DateEnded,
            m.Email, m.PhoneNumber,
            m.ApprovedBy, m.SignedBy, m.Proposer, m.Seconder,
            o.OccupationName, m.OtherSocieties, m.Notes,
            counties.allCounties,
            surnames.irishSurnames,
            phones.allPhones,
            addrs.address, addrs.addressSearch,
            volunteering.volunteeringInterests,
            roles.role
        FROM Members m
        LEFT JOIN MemberCategory  mc ON m.MemberCategoryID = mc.CategoryID
        LEFT JOIN Occupation       o  ON m.OccupationID    = o.OccupationID
        LEFT JOIN (
            SELECT ic.MemberID, GROUP_CONCAT(ict.CountyName SEPARATOR '|||') AS allCounties
            FROM IrishConnectionByCounty ic
            LEFT JOIN IrishCounties ict ON ic.CountyID = ict.CountyID
            WHERE ict.CountyName IS NOT NULL
            GROUP BY ic.MemberID
        ) counties ON m.MemberID = counties.MemberID
        LEFT JOIN (
            SELECT ics.MemberID, GROUP_CONCAT(isur.Surname SEPARATOR '|||') AS irishSurnames
            FROM IrishConnectionBySurname ics
            LEFT JOIN IrishSurnames isur ON ics.SurnameID = isur.SurnameID
            WHERE isur.Surname IS NOT NULL
            GROUP BY ics.MemberID
        ) surnames ON m.MemberID = surnames.MemberID
        LEFT JOIN (
            SELECT MemberID, GROUP_CONCAT(PhoneNumber SEPARATOR '|||') AS allPhones
            FROM MemberPhoneNumbers
            WHERE PhoneNumber IS NOT NULL
            GROUP BY MemberID
        ) phones ON m.MemberID = phones.MemberID
        LEFT JOIN (
            SELECT ma.MemberID,
                   MIN(CONCAT_WS(', ', ma.Street, ma.City)) AS address,
                   MIN(CONCAT_WS(' ', ma.Street, ma.City, p.ProvinceName, ma.PostalCode)) AS addressSearch
            FROM MemberAddress ma
            LEFT JOIN Provinces p ON CAST(ma.ProvinceID AS UNSIGNED) = p.ProvinceID
            WHERE ma.IsCurrent = 1
            GROUP BY ma.MemberID
        ) addrs ON m.MemberID = addrs.MemberID
        LEFT JOIN (
            SELECT udfv.MemberID, GROUP_CONCAT(udfv.ValueText SEPARATOR '|||') AS volunteeringInterests
            FROM UserDefinedFieldValue udfv
            INNER JOIN UserDefinedField udf ON udfv.FieldID = udf.FieldID
            WHERE udf.FieldLabel = 'Volunteering Interests' AND udfv.ValueText IS NOT NULL
            GROUP BY udfv.MemberID
        ) volunteering ON m.MemberID = volunteering.MemberID
        LEFT JOIN (
            SELECT mr.MemberID, GROUP_CONCAT(r.RoleName ORDER BY fy.YearLabel DESC SEPARATOR ', ') AS role
            FROM MemberRole mr
            LEFT JOIN Role       r  ON mr.RoleID       = r.RoleID
            LEFT JOIN FiscalYear fy ON mr.FiscalYearID = fy.FiscalYearID
            WHERE r.RoleName IS NOT NULL
            GROUP BY mr.MemberID
        ) roles ON m.MemberID = roles.MemberID
        $where
        ORDER BY $sort_col $sort_order
    ";

    $rows    = $db->query($sql)->fetchAll();
    $members = [];

    foreach ($rows as $r) {
        $mid       = $r[0];
        $is_active = (bool)($r[5] == 1 || $r[5] === '1' || $r[5] === 'True');
        $joined    = format_date($r[7]);
        $ended     = format_date($r[8]);
        $years     = null;
        if ($joined) {
            $end_dt   = $ended ? new DateTime($ended) : new DateTime();
            $start_dt = new DateTime($joined);
            $years    = (int)$start_dt->diff($end_dt)->y;
        }
        $allCounties           = $r[18] ? explode('|||', $r[18]) : [];
        $irishSurnames         = $r[19] ? explode('|||', $r[19]) : [];
        $allPhones             = $r[20] ? explode('|||', $r[20]) : [];
        $volunteeringInterests = $r[23] ? explode('|||', $r[23]) : [];

        $members[] = [
            'id'               => $mid,
            'firstName'        => $r[1],
            'lastName'         => $r[2],
            'placeOfBirth'     => $r[3] ?? '',
            'dateOfBirth'      => format_date($r[4]),
            'isActive'         => $is_active,
            'category'         => $r[6] ?? '',
            'county'           => $allCounties[0] ?? '',
            'dateJoined'       => $joined,
            'dateEnded'        => $ended,
            'membershipYears'  => $years,
            'address'          => $r[21] ?? '',
            'addressSearch'    => $r[22] ?? '',
            'role'             => $r[24] ?? '',
            'email'            => $r[9]  ?? '',
            'phoneNumber'      => $r[10] ?? '',
            'approvedBy'       => $r[11] ?? '',
            'signedBy'         => $r[12] ?? '',
            'proposer'         => $r[13] ?? '',
            'seconder'         => $r[14] ?? '',
            'occupation'       => $r[15] ?? '',
            'otherSocieties'   => $r[16] ?? '',
            'notes'            => $r[17] ?? '',
            'volunteeringInterests' => $volunteeringInterests,
            'irishSurnames'    => $irishSurnames,
            'allPhones'        => $allPhones,
            'allCounties'      => $allCounties,
        ];
    }

    json_out($members);
}

// ── Lookup members (for duplicate detection) ─────────────────────────────────
function lookup_members_handler(): void {
    require_auth();
    $db = get_db();

    $first = trim($_GET['firstName'] ?? '');
    $last  = trim($_GET['lastName'] ?? '');
    $email = trim($_GET['email'] ?? '');
    $phone = trim($_GET['phone'] ?? '');
    $dob   = to_date($_GET['dateOfBirth'] ?? null);

    // Library placeholder email is not a real contact identifier
    if ($email === 'bisofpeilibrary@gmail.com') $email = '';

    // Name is always required; at least one contact field must also match
    if (!$first || !$last) json_out([]);

    $contact_conds = [];
    $contact_params = [];

    if ($email) {
        $contact_conds[] = 'LOWER(Email) = LOWER(?)';
        $contact_params[] = $email;
    }
    if ($phone) {
        $contact_conds[] = '(PhoneNumber = ? OR EXISTS (SELECT 1 FROM MemberPhoneNumbers mpn WHERE mpn.MemberID = m.MemberID AND mpn.PhoneNumber = ?))';
        $contact_params[] = $phone;
        $contact_params[] = $phone;
    }
    if ($dob) {
        $contact_conds[] = '`Date of Birth` = ?';
        $contact_params[] = $dob;
    }

    if (empty($contact_conds)) json_out([]);

    $contact_where = implode(' OR ', array_map(fn($c) => "($c)", $contact_conds));
    $params = array_merge([$first, $last], $contact_params);

    $sql = "SELECT m.MemberID, m.FirstName, m.LastName, m.Email, m.PhoneNumber, m.`Date of Birth`, m.DateJoined
            FROM Members m
            WHERE LOWER(TRIM(m.FirstName)) = LOWER(TRIM(?))
              AND LOWER(TRIM(m.LastName)) = LOWER(TRIM(?))
              AND ($contact_where)
            LIMIT 10";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Normalize output
    $out = array_map(function($r){
        return [
            'id' => (int)$r['MemberID'],
            'firstName' => $r['FirstName'] ?? '',
            'lastName' => $r['LastName'] ?? '',
            'email' => $r['Email'] ?? '',
            'phoneNumber' => $r['PhoneNumber'] ?? '',
            'dateOfBirth' => format_date($r['Date of Birth'] ?? null),
            'dateJoined' => format_date($r['DateJoined'] ?? null),
        ];
    }, $rows);

    json_out($out);
}

// ── Single member ─────────────────────────────────────────────────────────────
function get_member_handler(int $member_id): void {
    require_auth();
    $db   = get_db();

    $stmt = $db->prepare('
        SELECT m.MemberID, m.FirstName, m.LastName,
               m.`Place of Birth`, m.`Date of Birth`,
               m.IsActive, mc.CategoryID, mc.CategoryName,
               m.DateJoined, m.DateEnded, m.ApplicationDate, m.`Approval Date`,
               m.ApprovedBy, m.SignedBy, m.Proposer, m.Seconder, m.ProposalDate,
               m.Email, m.PhoneNumber,
               m.OccupationID, o.OccupationName,
               m.Notes, m.OtherSocieties, m.MemberCategoryID,
               m.CountyID, m.SurnameID, m.MemberNumber
        FROM Members AS m
        LEFT JOIN MemberCategory AS mc ON m.MemberCategoryID = mc.CategoryID
        LEFT JOIN Occupation AS o ON m.OccupationID = o.OccupationID
        WHERE m.MemberID = ?
    ');
    $stmt->execute([$member_id]);
    $m = $stmt->fetch();
    if (!$m) json_out(['error' => 'Member not found'], 404);

    // Addresses
    $stmt = $db->prepare('
        SELECT ma.MemberAddressID, ma.Street, ma.City, COALESCE(p.ProvinceName, ma.ProvinceID), ma.PostalCode,
               ma.CountryID, ma.IsCurrent, ma.ProvinceID
        FROM MemberAddress AS ma
        LEFT JOIN Provinces AS p ON CAST(ma.ProvinceID AS UNSIGNED) = p.ProvinceID
        WHERE ma.MemberID = ?
    ');
    $stmt->execute([$member_id]);
    $addresses = [];
    foreach ($stmt->fetchAll() as $a) {
        $prov = $a[3] ?? '';
        // Numeric values are unresolved legacy ProvinceIDs — treat as empty
        if (is_numeric($prov) && $prov !== '') $prov = '';
        $addresses[] = [
            'id'         => $a[0],
            'street'     => $a[1] ?? '',
            'city'       => $a[2] ?? '',
            'province'   => $prov,
            'postalCode' => $a[4] ?? '',
            'country'    => $a[5] ?? '',
            'isCurrent'  => (bool)$a[6],
        ];
    }

    // Phone numbers
    $stmt = $db->prepare('SELECT PhoneID, PhoneType, PhoneNumber, IsPreferred FROM MemberPhoneNumbers WHERE MemberID = ?');
    $stmt->execute([$member_id]);
    $phones = [];
    foreach ($stmt->fetchAll() as $p) {
        $phones[] = ['id' => $p[0], 'type' => $p[1], 'number' => $p[2], 'isPreferred' => (bool)$p[3]];
    }

    // Irish connections
    $stmt = $db->prepare('
        SELECT ic.CountyID, ict.CountyName, ic.ConnectionType, ic.ConnectionGroup
        FROM IrishConnectionByCounty AS ic
        LEFT JOIN IrishCounties AS ict ON ic.CountyID = ict.CountyID
        WHERE ic.MemberID = ?
        ORDER BY COALESCE(ic.ConnectionGroup, 999999), ic.CountyID
    ');
    $stmt->execute([$member_id]);
    $county_conns = [];
    foreach ($stmt->fetchAll() as $ic) {
        $county_conns[] = ['countyId' => $ic[0], 'countyName' => $ic[1], 'type' => $ic[2], 'group' => $ic[3]];
    }

    $stmt = $db->prepare('
        SELECT ics.SurnameID, isur.Surname, ics.ConnectionType, ics.ConnectionGroup
        FROM IrishConnectionBySurname AS ics
        LEFT JOIN IrishSurnames AS isur ON ics.SurnameID = isur.SurnameID
        WHERE ics.MemberID = ?
        ORDER BY COALESCE(ics.ConnectionGroup, 999999), ics.SurnameID
    ');
    $stmt->execute([$member_id]);
    $surname_conns = [];
    foreach ($stmt->fetchAll() as $sc) {
        $surname_conns[] = ['surnameId' => $sc[0], 'surname' => $sc[1], 'type' => $sc[2], 'group' => $sc[3]];
    }

    // Determine whether ConnectionGroup values are present (added after initial deployment)
    $use_groups = !empty(array_filter(
        array_merge(array_column($county_conns, 'group'), array_column($surname_conns, 'group')),
        fn($g) => $g !== null
    ));

    $irish = [];
    if ($use_groups) {
        // Pair county and surname rows by (ConnectionType, ConnectionGroup)
        $county_map = [];
        foreach ($county_conns as $row) {
            $key = $row['type'] . '|' . (int)$row['group'];
            $county_map[$key] = $row;
        }
        $used_keys = [];
        foreach ($surname_conns as $row) {
            $key   = $row['type'] . '|' . (int)$row['group'];
            $county = $county_map[$key] ?? null;
            if ($county) $used_keys[$key] = true;
            $irish[] = [
                'type'       => $row['type'],
                'countyId'   => $county ? $county['countyId']   : '',
                'countyName' => $county ? $county['countyName'] : '',
                'surnameId'  => $row['surnameId'],
                'surname'    => $row['surname'],
            ];
        }
        // County-only entries with no matching surname at the same group
        foreach ($county_conns as $row) {
            $key = $row['type'] . '|' . (int)$row['group'];
            if (!isset($used_keys[$key])) {
                $irish[] = ['type' => $row['type'], 'countyId' => $row['countyId'], 'countyName' => $row['countyName'], 'surnameId' => '', 'surname' => ''];
            }
        }
    } else {
        // Legacy fallback: match by type only (for records saved before ConnectionGroup existed)
        foreach ($county_conns as $row) {
            $irish[] = ['type' => $row['type'], 'countyId' => $row['countyId'], 'countyName' => $row['countyName'], 'surnameId' => '', 'surname' => ''];
        }
        foreach ($surname_conns as $row) {
            $matched = false;
            foreach ($irish as &$ic) {
                if ($ic['type'] === $row['type'] && !$ic['surnameId']) {
                    $ic['surnameId'] = $row['surnameId'];
                    $ic['surname']   = $row['surname'];
                    $matched = true;
                    break;
                }
            }
            unset($ic);
            if (!$matched) {
                $irish[] = ['type' => $row['type'], 'countyId' => '', 'countyName' => '', 'surnameId' => $row['surnameId'], 'surname' => $row['surname']];
            }
        }
    }
    if (empty($irish)) $irish = [['type' => '', 'countyId' => '', 'surnameId' => '']];

    // Roles
    $stmt = $db->prepare('
        SELECT mr.MemberRoleID, mr.RoleID, r.RoleName, mr.FiscalYearID, fy.YearLabel
        FROM MemberRole AS mr
        LEFT JOIN Role AS r ON mr.RoleID = r.RoleID
        LEFT JOIN FiscalYear AS fy ON mr.FiscalYearID = fy.FiscalYearID
        WHERE mr.MemberID = ?
        ORDER BY fy.YearLabel ASC, r.RoleName ASC
    ');
    $stmt->execute([$member_id]);
    $role_fy = [];
    foreach ($stmt->fetchAll() as $rf) {
        $role_fy[] = ['memberRoleID' => $rf[0], 'roleID' => $rf[1], 'roleName' => $rf[2], 'fiscalYearID' => $rf[3], 'yearLabel' => $rf[4]];
    }

    // Volunteering interests
    $stmt = $db->prepare('
        SELECT udfv.ValueText FROM UserDefinedFieldValue AS udfv
        INNER JOIN UserDefinedField AS udf ON udfv.FieldID = udf.FieldID
        WHERE udf.FieldLabel = \'Volunteering Interests\' AND udfv.MemberID = ?
    ');
    $stmt->execute([$member_id]);
    $vi = array_column($stmt->fetchAll(), 0);

    // Most recent photo (table may not exist yet)
    $photo = null;
    try {
        $stmt = $db->prepare('SELECT FileName FROM Photos WHERE MemberID = ? ORDER BY UploadDate DESC LIMIT 1');
        $stmt->execute([$member_id]);
        $photo_row = $stmt->fetch();
        $photo = $photo_row ? $photo_row[0] : null;
    } catch (\Exception $e) {}

    json_out([
        'id'                => $m[0],
        'memberID'          => $m[0],
        'memberNumber'      => $m[26] !== null ? (int)$m[26] : $m[0],
        'firstName'         => $m[1],
        'lastName'          => $m[2],
        'placeOfBirth'      => $m[3] ?? '',
        'dateOfBirth'       => format_date($m[4]),
        'isActive'          => (bool)($m[5] == 1),
        'memberCategoryID'  => $m[6],
        'category'          => $m[7],
        'dateJoined'        => format_date($m[8]),
        'dateEnded'         => format_date($m[9]),
        'applicationDate'   => format_date($m[10]),
        'approvalDate'      => format_date($m[11]),
        'approvedBy'        => $m[12] ?? '',
        'signedBy'          => $m[13] ?? '',
        'proposer'          => $m[14] ?? '',
        'seconder'          => $m[15] ?? '',
        'proposalDate'      => format_date($m[16]),
        'email'             => $m[17] ?? '',
        'phoneNumber'       => $m[18] ?? '',
        'occupationID'      => $m[19],
        'occupation'        => $m[20] ?? '',
        'notes'             => $m[21] ?? '',
        'otherSocieties'    => $m[22] ?? '',
        'memberCategoryId'  => $m[23],
        'addresses'         => $addresses,
        'phoneNumbers'      => $phones,
        'irishConnections'  => $irish,
        'roleFiscalYears'   => $role_fy,
        'volunteeringInterests' => $vi,
        'photo'             => $photo,
    ]);
}

// ── Upload photo ──────────────────────────────────────────────────────────────
function upload_photo_handler(int $member_id): void {
    require_admin();
    $db = get_db();

    // Verify member exists
    $s = $db->prepare('SELECT MemberID FROM Members WHERE MemberID = ?');
    $s->execute([$member_id]);
    if (!$s->fetch()) json_out(['error' => 'Member not found'], 404);

    if (empty($_FILES['file'])) json_out(['error' => 'No file uploaded'], 400);
    $file = $_FILES['file'];
    if ($file['error'] !== UPLOAD_ERR_OK) json_out(['error' => 'Upload error'], 400);

    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mime  = $finfo->file($file['tmp_name']);
    if (!in_array($mime, $allowed_types, true)) json_out(['error' => 'Invalid file type'], 400);

    $ext       = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename  = 'member_' . $member_id . '_' . time() . '.' . strtolower($ext);
    $upload_dir = dirname(__DIR__, 2) . '/uploads/photos/';

    if (!is_dir($upload_dir)) mkdir($upload_dir, 0755, true);
    if (!move_uploaded_file($file['tmp_name'], $upload_dir . $filename)) {
        json_out(['error' => 'Failed to save file'], 500);
    }

    $stmt = $db->prepare('INSERT INTO Photos (MemberID, FileName, Description, UploadDate) VALUES (?, ?, ?, NOW())');
    $stmt->execute([$member_id, $filename, '']);

    json_out(['filename' => $filename], 201);
}

// ── Delete photo ──────────────────────────────────────────────────────────────
function delete_photo_handler(int $member_id): void {
    require_admin();
    $db = get_db();

    try {
        $stmt = $db->prepare('SELECT PhotoID, FileName FROM Photos WHERE MemberID = ? ORDER BY UploadDate DESC LIMIT 1');
        $stmt->execute([$member_id]);
        $row = $stmt->fetch();
    } catch (\Exception $e) {
        json_out(['error' => 'Photos table not available'], 500);
    }

    if (!$row) json_out(['error' => 'No photo found'], 404);

    $photo_id = $row[0];
    $filename  = $row[1];

    $file_path = dirname(__DIR__, 2) . '/uploads/photos/' . $filename;
    if (file_exists($file_path)) @unlink($file_path);

    $stmt = $db->prepare('DELETE FROM Photos WHERE PhotoID = ?');
    $stmt->execute([$photo_id]);

    json_out(['success' => true]);
}

// ── Create member ─────────────────────────────────────────────────────────────
function create_member_handler(): void {
    require_admin();
    $data = get_body();
    if (!$data) json_out(['error' => 'Invalid input'], 400);

    $first = trim($data['firstName'] ?? '');
    $last  = trim($data['lastName']  ?? '');
    if (!$first || !$last) json_out(['error' => 'First and last name required'], 400);

    $db  = get_db();

    // Duplicate check
    $email    = trim($data['email']       ?? '') ?: null;
    $phone_raw = trim($data['phoneNumber'] ?? '');
    $phone    = $phone_raw ? _normalize_phone($phone_raw) : null;
    $dob      = to_date($data['dateOfBirth'] ?? null);
    $lib_email = 'bisofpeilibrary@gmail.com';
    if ($email === $lib_email) $email = null;

    $dup = null;
    if ($email) {
        $s = $db->prepare('SELECT MemberID FROM Members WHERE FirstName = ? AND LastName = ? AND Email = ?');
        $s->execute([$first, $last, $email]);
        if ($s->fetch()) $dup = "A member named $first $last with that email already exists.";
    }
    if (!$dup && $phone) {
        $s = $db->prepare('SELECT MemberID FROM Members WHERE FirstName = ? AND LastName = ? AND PhoneNumber = ?');
        $s->execute([$first, $last, $phone]);
        if ($s->fetch()) $dup = "A member named $first $last with that phone number already exists.";
    }
    if (!$dup && $dob) {
        $s = $db->prepare('SELECT MemberID FROM Members WHERE FirstName = ? AND LastName = ? AND `Date of Birth` = ?');
        $s->execute([$first, $last, $dob]);
        if ($s->fetch()) $dup = "A member named $first $last with that date of birth already exists.";
    }
    if (!$dup && !$email && !$phone && !$dob) {
        $s = $db->prepare('SELECT MemberID FROM Members WHERE FirstName = ? AND LastName = ?');
        $s->execute([$first, $last]);
        if ($s->fetch()) $dup = "A member named $first $last already exists. Provide email, phone, or date of birth to confirm this is a different person.";
    }
    if ($dup) json_out(['error' => 'duplicate', 'message' => $dup], 409);

    // Age validation: ensure Date of Birth implies age >= 18 if provided
    if ($dob) {
        try {
            $dob_dt = new DateTime($dob);
            $today = new DateTime();
            $age = $dob_dt->diff($today)->y;
            if ($age < 18) {
                json_out(['error' => 'underage', 'message' => 'Members must be at least 18 years old.'], 400);
            }
        } catch (Exception $e) {
            // ignore parse errors here; to_date already normalises
        }
    }

    // Derive IsActive from category
    $cat_id   = to_int($data['memberCategoryId'] ?? null);
    $is_active = true;
    if ($cat_id) {
        $s = $db->prepare('SELECT CategoryName FROM MemberCategory WHERE CategoryID = ?');
        $s->execute([$cat_id]);
        $cat = $s->fetch();
        if ($cat) $is_active = in_array(strtolower($cat[0]), ['active', 'honorary']);
    }

    $date_joined = to_date($data['dateJoined'] ?? null); // Allow null for DateJoined

    // Other societies list → comma string
    $other_soc = $data['otherSocieties'] ?? null;
    if (is_array($other_soc)) $other_soc = implode(', ', array_filter($other_soc)) ?: null;

    $db->prepare('
        INSERT INTO Members (
            FirstName, LastName, Email, PhoneNumber,
            `Place of Birth`, `Date of Birth`, MemberCategoryID,
            OccupationID, Notes, IsActive, OtherSocieties,
            DateJoined, DateEnded, ApplicationDate, `Approval Date`,
            ApprovedBy, SignedBy, Proposer, Seconder, ProposalDate, CreatedAt
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW())
    ')->execute([
        $first,
        $last,
        $data['email'] ?? null,
        $phone,
        $data['placeOfBirth'] ?? null,
        $dob,
        $cat_id,
        to_int($data['occupationId'] ?? null),
        $data['notes'] ?? '',
        $is_active ? 1 : 0,
        $other_soc,
        $date_joined,
        to_date($data['dateEnded']       ?? null),
        to_date($data['applicationDate'] ?? null),
        to_date($data['approvalDate']    ?? null),
        $data['approvedBy']  ?? null,
        $data['signedBy']    ?? null,
        $data['proposer']    ?? null,
        $data['seconder']    ?? null,
        to_date($data['proposalDate'] ?? null),
    ]);
    $member_id = (int)$db->lastInsertId();

    $next_num = (int)$db->query('SELECT COALESCE(MAX(MemberNumber), 0) + 1 FROM Members WHERE MemberID != ' . $member_id)->fetchColumn();
    $db->prepare('UPDATE Members SET MemberNumber = ? WHERE MemberID = ?')->execute([$next_num, $member_id]);

    _save_member_related($db, $member_id, $data);

    json_out(['success' => true, 'member_id' => $member_id], 201);
}

// ── Update member ─────────────────────────────────────────────────────────────
function update_member_handler(int $member_id): void {
    require_admin();
    $data = get_body();
    if (!$data) json_out(['error' => 'Invalid input'], 400);

    $db = get_db();
    $s = $db->prepare('SELECT MemberID FROM Members WHERE MemberID = ?');
    $s->execute([$member_id]);
    if (!$s->fetch()) json_out(['error' => 'Member not found'], 404);

    $cat_id    = to_int($data['memberCategoryId'] ?? null);
    $is_active = true;
    if ($cat_id) {
        $s = $db->prepare('SELECT CategoryName FROM MemberCategory WHERE CategoryID = ?');
        $s->execute([$cat_id]);
        $cat = $s->fetch();
        if ($cat) $is_active = in_array(strtolower($cat[0]), ['active', 'honorary']);
    }

    $other_soc = $data['otherSocieties'] ?? null;
    if (is_array($other_soc)) $other_soc = implode(', ', array_filter($other_soc)) ?: null;

    // Age validation: ensure Date of Birth implies age >= 18 if provided
    $dob = to_date($data['dateOfBirth'] ?? null);
    if ($dob) {
        try {
            $dob_dt = new DateTime($dob);
            $today = new DateTime();
            $age = $dob_dt->diff($today)->y;
            if ($age < 18) {
                json_out(['error' => 'underage', 'message' => 'Members must be at least 18 years old.'], 400);
            }
        } catch (Exception $e) {
            // ignore
        }
    }

    $db->prepare('
        UPDATE Members SET
            FirstName = ?, LastName = ?, Email = ?, PhoneNumber = ?,
            `Place of Birth` = ?, `Date of Birth` = ?, MemberCategoryID = ?,
            OccupationID = ?, Notes = ?, IsActive = ?, OtherSocieties = ?,
            DateJoined = ?, DateEnded = ?, ApplicationDate = ?, `Approval Date` = ?,
            ApprovedBy = ?, SignedBy = ?, Proposer = ?, Seconder = ?, ProposalDate = ?
        WHERE MemberID = ?
    ')->execute([
        trim($data['firstName'] ?? ''),
        trim($data['lastName']  ?? ''),
        $data['email']       ?? null,
        ($data['phoneNumber'] ?? '') !== '' ? _normalize_phone($data['phoneNumber']) : null,
        $data['placeOfBirth'] ?? null,
        to_date($data['dateOfBirth']    ?? null),
        $cat_id,
        to_int($data['occupationId']   ?? null),
        $data['notes']       ?? '',
        $is_active ? 1 : 0,
        $other_soc,
        to_date($data['dateJoined']      ?? null),
        to_date($data['dateEnded']       ?? null),
        to_date($data['applicationDate'] ?? null),
        to_date($data['approvalDate']    ?? null),
        $data['approvedBy']  ?? null,
        $data['signedBy']    ?? null,
        $data['proposer']    ?? null,
        $data['seconder']    ?? null,
        to_date($data['proposalDate']    ?? null),
        $member_id,
    ]);

    _delete_member_related($db, $member_id);
    _save_member_related($db, $member_id, $data);

    json_out(['success' => true]);
}

// ── Deactivate / Reinstate / Delete ──────────────────────────────────────────
function deactivate_member_handler(int $member_id): void {
    require_admin();
    $db = get_db();
    $cat = $db->query("SELECT CategoryID FROM MemberCategory WHERE CategoryName = 'Inactive' LIMIT 1")->fetch();
    if ($cat) {
        $db->prepare("UPDATE Members SET IsActive = 0, MemberCategoryID = ? WHERE MemberID = ?")->execute([$cat[0], $member_id]);
    } else {
        $db->prepare("UPDATE Members SET IsActive = 0 WHERE MemberID = ?")->execute([$member_id]);
    }
    json_out(['success' => true]);
}

function reinstate_member_handler(int $member_id): void {
    require_admin();
    $db = get_db();
    $cat = $db->query("SELECT CategoryID FROM MemberCategory WHERE CategoryName = 'Active' LIMIT 1")->fetch();
    if ($cat) {
        $db->prepare("UPDATE Members SET IsActive = 1, DateEnded = NULL, MemberCategoryID = ? WHERE MemberID = ?")->execute([$cat[0], $member_id]);
    } else {
        $db->prepare("UPDATE Members SET IsActive = 1, DateEnded = NULL WHERE MemberID = ?")->execute([$member_id]);
    }
    json_out(['success' => true]);
}

function delete_member_handler(int $member_id): void {
    require_admin();
    $db = get_db();
    $db->prepare("UPDATE Members SET IsActive = 0 WHERE MemberID = ?")->execute([$member_id]);
    json_out(['success' => true]);
}

function bulk_deactivate_handler(): void {
    require_admin();
    $data = get_body();
    $ids  = $data['memberIds'] ?? $data['member_ids'] ?? [];
    if (!is_array($ids) || empty($ids)) json_out(['error' => 'No member IDs provided'], 400);
    $ph = implode(',', array_fill(0, count($ids), '?'));
    $db = get_db();
    $db->prepare("UPDATE Members SET IsActive = 0 WHERE MemberID IN ($ph)")->execute($ids);
    json_out(['success' => true, 'count' => count($ids)]);
}

// ── Shared helpers ────────────────────────────────────────────────────────────
function _normalize_phone(string $raw): string {
    $digits = preg_replace('/\D/', '', $raw);
    if (strlen($digits) === 11 && $digits[0] === '1') {
        $digits = substr($digits, 1);
    }
    if (strlen($digits) === 10) {
        return '(' . substr($digits, 0, 3) . ') ' . substr($digits, 3, 3) . '-' . substr($digits, 6);
    }
    return $raw;
}

function _delete_member_related(PDO $db, int $member_id): void {
    $db->prepare('DELETE FROM MemberAddress WHERE MemberID = ?')->execute([$member_id]);
    $db->prepare('DELETE FROM IrishConnectionByCounty WHERE MemberID = ?')->execute([$member_id]);
    $db->prepare('DELETE FROM IrishConnectionBySurname WHERE MemberID = ?')->execute([$member_id]);
    $db->prepare('DELETE FROM MemberRole WHERE MemberID = ?')->execute([$member_id]);
    $db->prepare('DELETE FROM MemberPhoneNumbers WHERE MemberID = ?')->execute([$member_id]);
    $fid = _get_volunteering_field_id($db);
    if ($fid) $db->prepare('DELETE FROM UserDefinedFieldValue WHERE FieldID = ? AND MemberID = ?')->execute([$fid, $member_id]);
}

function _save_member_related(PDO $db, int $member_id, array $data): void {
    // Addresses
    foreach ($data['addresses'] ?? [] as $addr) {
        $has_data = array_filter([$addr['street'] ?? '', $addr['city'] ?? '', $addr['province'] ?? '', $addr['country'] ?? '', $addr['postalCode'] ?? '']);
        if (!$has_data) continue;
        // Always store province as the text name — COALESCE on read handles both
        // old numeric IDs (via CAST) and new text values.
        $prov_id = !empty($addr['province']) ? $addr['province'] : null;
        $db->prepare('
            INSERT INTO MemberAddress (MemberID, Street, City, ProvinceID, CountryID, PostalCode, IsCurrent)
            VALUES (?,?,?,?,?,?,?)
        ')->execute([
            $member_id,
            $addr['street']     ?? null,
            $addr['city']       ?? null,
            $prov_id,
            $addr['country']    ?? null,
            $addr['postalCode'] ?? null,
            ($addr['isCurrent'] ?? false) ? 1 : 0,
        ]);
    }

    // Irish connections — ConnectionGroup preserves form row order so county+surname pair correctly on read
    foreach ($data['irishConnections'] ?? [] as $idx => $ic) {
        $county_id  = to_int($ic['countyId']  ?? null);
        $surname_id = to_int($ic['surnameId'] ?? null);
        $type       = trim($ic['type'] ?? '');
        if (!$type) continue;
        // Insert county row when: county is set, OR neither county nor surname (type-only connection)
        if ($county_id !== null || $surname_id === null) {
            $db->prepare('INSERT INTO IrishConnectionByCounty (MemberID, CountyID, ConnectionType, ConnectionGroup) VALUES (?,?,?,?)')->execute([$member_id, $county_id, $type, $idx]);
        }
        if ($surname_id !== null) {
            $db->prepare('INSERT INTO IrishConnectionBySurname (MemberID, SurnameID, ConnectionType, ConnectionGroup) VALUES (?,?,?,?)')->execute([$member_id, $surname_id, $type, $idx]);
        }
    }

    // Role / Fiscal Year
    foreach ($data['roleFiscalYears'] ?? [] as $rf) {
        $role_id = to_int($rf['role'] ?? $rf['roleID'] ?? null);
        $fy_id   = to_int($rf['fiscalYear'] ?? $rf['fiscalYearID'] ?? null);
        if ($role_id && $fy_id) {
            $db->prepare('INSERT INTO MemberRole (MemberID, RoleID, FiscalYearID) VALUES (?,?,?)')->execute([$member_id, $role_id, $fy_id]);
        }
    }

    // Phone numbers (dedup by type+number to prevent duplicate rows)
    $valid_types  = ['Home', 'Cell', 'Work', 'Other'];
    $seen_phones  = [];
    foreach ($data['phoneNumbers'] ?? [] as $ph) {
        $type   = $ph['type']   ?? 'Other';
        $number = _normalize_phone(trim($ph['number'] ?? ''));
        $key    = strtolower($type . '|' . $number);
        if ($number && in_array($type, $valid_types) && !isset($seen_phones[$key])) {
            $seen_phones[$key] = true;
            $db->prepare('INSERT INTO MemberPhoneNumbers (MemberID, PhoneType, PhoneNumber, IsPreferred) VALUES (?,?,?,?)')->execute([
                $member_id, $type, $number, ($ph['isPreferred'] ?? false) ? 1 : 0,
            ]);
        }
    }

    // Volunteering interests
    $fid = _get_volunteering_field_id($db);
    if ($fid) {
        foreach ($data['volunteeringInterests'] ?? [] as $interest) {
            if ($interest) {
                $db->prepare('INSERT INTO UserDefinedFieldValue (FieldID, MemberID, ValueText) VALUES (?,?,?)')->execute([$fid, $member_id, $interest]);
            }
        }
    }
}

function _get_volunteering_field_id(PDO $db): ?int {
    static $fid = false;
    if ($fid === false) {
        $s = $db->prepare("SELECT FieldID FROM UserDefinedField WHERE FieldLabel = 'Volunteering Interests'");
        $s->execute();
        $row = $s->fetch();
        $fid = $row ? (int)$row[0] : null;
    }
    return $fid;
}

// ── Merge members ─────────────────────────────────────────────────────────────
function merge_members_handler(): void {
    require_admin();
    $data = get_body();
    if (!$data) json_out(['error' => 'Invalid input'], 400);

    $primary_id = to_int($data['primaryMemberId'] ?? null);
    $secondary_id = to_int($data['secondaryMemberId'] ?? null);
    $keep_data = $data['keepData'] ?? 'primary'; // 'primary' or 'secondary' - which member's data to keep for conflicts

    if (!$primary_id || !$secondary_id || $primary_id === $secondary_id) {
        json_out(['error' => 'Invalid member IDs'], 400);
    }

    $db = get_db();

    // Verify both members exist
    $s = $db->prepare('SELECT MemberID FROM Members WHERE MemberID = ?');
    $s->execute([$primary_id]);
    if (!$s->fetch()) json_out(['error' => 'Primary member not found'], 404);

    $s->execute([$secondary_id]);
    if (!$s->fetch()) json_out(['error' => 'Secondary member not found'], 404);

    try {
        $db->beginTransaction();

        // Get both member rows
        $s = $db->prepare('SELECT * FROM Members WHERE MemberID = ?');
        $s->execute([$secondary_id]);
        $secondary = $s->fetch(PDO::FETCH_ASSOC);

        $s->execute([$primary_id]);
        $primary = $s->fetch(PDO::FETCH_ASSOC);

        // Fill blank fields on the primary from the secondary.
        // If keep_data === 'secondary', overwrite all non-null secondary values.
        // Otherwise only fill fields that are NULL or empty on the primary.
        // Notes and OtherSocieties are handled separately below (concatenate/union)
        $fillable = [
            'Email', 'PhoneNumber', 'Place of Birth', 'Date of Birth',
            'MemberCategoryID', 'CountyID', 'SurnameID', 'OccupationID',
            'Photos', 'DateJoined', 'DateEnded',
            'ApplicationDate', 'Approval Date', 'ApprovedBy', 'SignedBy',
            'Proposer', 'Seconder', 'ProposalDate'
        ];

        $sets = [];
        $set_params = [];
        foreach ($fillable as $field) {
            $pv = $primary[$field] ?? null;
            $sv = $secondary[$field] ?? null;
            if ($sv === null || $sv === '') continue;
            $fill = ($keep_data === 'secondary') || ($pv === null || $pv === '');
            if ($fill) {
                $sets[] = "`$field` = ?";
                $set_params[] = $sv;
            }
        }
        if (!empty($sets)) {
            $set_params[] = $primary_id;
            $db->prepare('UPDATE Members SET ' . implode(', ', $sets) . ' WHERE MemberID = ?')
               ->execute($set_params);
        }

        // Merge addresses — add secondary's addresses not already on primary (match by Street+City)
        $s = $db->prepare('SELECT Street, City FROM MemberAddress WHERE MemberID = ?');
        $s->execute([$primary_id]);
        $primary_addr_keys = array_map(
            fn($a) => strtolower(trim($a['Street'] ?? '')) . '|' . strtolower(trim($a['City'] ?? '')),
            $s->fetchAll(PDO::FETCH_ASSOC)
        );

        $s = $db->prepare('SELECT MemberAddressID, Street, City FROM MemberAddress WHERE MemberID = ?');
        $s->execute([$secondary_id]);
        foreach ($s->fetchAll(PDO::FETCH_ASSOC) as $addr) {
            $key = strtolower(trim($addr['Street'] ?? '')) . '|' . strtolower(trim($addr['City'] ?? ''));
            if (!in_array($key, $primary_addr_keys)) {
                $db->prepare('UPDATE MemberAddress SET MemberID = ? WHERE MemberAddressID = ?')->execute([$primary_id, $addr['MemberAddressID']]);
            }
        }

        // Merge phone numbers (keep primary's, add secondary's if no duplicates)
        $s = $db->prepare('SELECT PhoneNumber FROM MemberPhoneNumbers WHERE MemberID = ?');
        $s->execute([$primary_id]);
        $primary_phones = array_column($s->fetchAll(PDO::FETCH_ASSOC), 'PhoneNumber');

        $s = $db->prepare('SELECT PhoneID, PhoneNumber FROM MemberPhoneNumbers WHERE MemberID = ?');
        $s->execute([$secondary_id]);
        foreach ($s->fetchAll(PDO::FETCH_ASSOC) as $phone) {
            if (!in_array($phone['PhoneNumber'], $primary_phones)) {
                $db->prepare('UPDATE MemberPhoneNumbers SET MemberID = ? WHERE PhoneID = ?')->execute([$primary_id, $phone['PhoneID']]);
            }
        }

        // Merge Irish connections — these tables have no PK so INSERT new rows rather than UPDATE
        // Offset secondary's ConnectionGroup values to avoid collision with primary's existing groups
        $pg = $db->prepare('SELECT COALESCE(MAX(ConnectionGroup), -1) FROM IrishConnectionByCounty WHERE MemberID = ?');
        $pg->execute([$primary_id]);
        $max_cg = (int)$pg->fetchColumn();
        $pg = $db->prepare('SELECT COALESCE(MAX(ConnectionGroup), -1) FROM IrishConnectionBySurname WHERE MemberID = ?');
        $pg->execute([$primary_id]);
        $max_sg = (int)$pg->fetchColumn();
        $group_offset = max($max_cg, $max_sg) + 1;

        $s = $db->prepare('SELECT CountyID, ConnectionType FROM IrishConnectionByCounty WHERE MemberID = ?');
        $s->execute([$primary_id]);
        $primary_county_keys = array_map(fn($r) => ($r[0] ?? '') . ':' . ($r[1] ?? ''), $s->fetchAll(PDO::FETCH_NUM));

        $s = $db->prepare('SELECT CountyID, ConnectionType, ConnectionGroup FROM IrishConnectionByCounty WHERE MemberID = ?');
        $s->execute([$secondary_id]);
        $ins_county = $db->prepare('INSERT INTO IrishConnectionByCounty (MemberID, CountyID, ConnectionType, ConnectionGroup) VALUES (?,?,?,?)');
        foreach ($s->fetchAll(PDO::FETCH_ASSOC) as $ic) {
            $key = ($ic['CountyID'] ?? '') . ':' . ($ic['ConnectionType'] ?? '');
            if (!in_array($key, $primary_county_keys)) {
                $new_group = $ic['ConnectionGroup'] !== null ? (int)$ic['ConnectionGroup'] + $group_offset : null;
                $ins_county->execute([$primary_id, $ic['CountyID'], $ic['ConnectionType'], $new_group]);
            }
        }

        $s = $db->prepare('SELECT SurnameID, ConnectionType FROM IrishConnectionBySurname WHERE MemberID = ?');
        $s->execute([$primary_id]);
        $primary_surname_keys = array_map(fn($r) => ($r[0] ?? '') . ':' . ($r[1] ?? ''), $s->fetchAll(PDO::FETCH_NUM));

        $s = $db->prepare('SELECT SurnameID, ConnectionType, ConnectionGroup FROM IrishConnectionBySurname WHERE MemberID = ?');
        $s->execute([$secondary_id]);
        $ins_surname = $db->prepare('INSERT INTO IrishConnectionBySurname (MemberID, SurnameID, ConnectionType, ConnectionGroup) VALUES (?,?,?,?)');
        foreach ($s->fetchAll(PDO::FETCH_ASSOC) as $ic) {
            $key = ($ic['SurnameID'] ?? '') . ':' . ($ic['ConnectionType'] ?? '');
            if (!in_array($key, $primary_surname_keys)) {
                $new_group = $ic['ConnectionGroup'] !== null ? (int)$ic['ConnectionGroup'] + $group_offset : null;
                $ins_surname->execute([$primary_id, $ic['SurnameID'], $ic['ConnectionType'], $new_group]);
            }
        }

        // Merge roles — deduplicate by RoleID+FiscalYearID pair so the same role in a different year is preserved
        $s = $db->prepare('SELECT RoleID, FiscalYearID FROM MemberRole WHERE MemberID = ?');
        $s->execute([$primary_id]);
        $primary_role_keys = array_map(
            fn($r) => ($r['RoleID'] ?? '') . ':' . ($r['FiscalYearID'] ?? ''),
            $s->fetchAll(PDO::FETCH_ASSOC)
        );

        $s = $db->prepare('SELECT MemberRoleID, RoleID, FiscalYearID FROM MemberRole WHERE MemberID = ?');
        $s->execute([$secondary_id]);
        foreach ($s->fetchAll(PDO::FETCH_ASSOC) as $role) {
            $key = ($role['RoleID'] ?? '') . ':' . ($role['FiscalYearID'] ?? '');
            if (!in_array($key, $primary_role_keys)) {
                $db->prepare('UPDATE MemberRole SET MemberID = ? WHERE MemberRoleID = ?')->execute([$primary_id, $role['MemberRoleID']]);
            }
        }

        // Merge volunteering interests (add secondary's if not already present)
        $fid = _get_volunteering_field_id($db);
        if ($fid) {
            $s = $db->prepare('SELECT ValueText FROM UserDefinedFieldValue WHERE FieldID = ? AND MemberID = ?');
            $s->execute([$fid, $primary_id]);
            $primary_interests = array_column($s->fetchAll(), 0);

            $s = $db->prepare('SELECT FieldID, ValueText FROM UserDefinedFieldValue WHERE FieldID = ? AND MemberID = ?');
            $s->execute([$fid, $secondary_id]);
            foreach ($s->fetchAll(PDO::FETCH_ASSOC) as $interest) {
                if (!in_array($interest['ValueText'], $primary_interests)) {
                    $db->prepare('UPDATE UserDefinedFieldValue SET MemberID = ? WHERE FieldID = ? AND MemberID = ? AND ValueText = ?')->execute([$primary_id, $fid, $secondary_id, $interest['ValueText']]);
                }
            }
        }

        // Merge Notes: concatenate both if secondary has content primary doesn't
        $pnotes = trim($primary['Notes'] ?? '');
        $snotes = trim($secondary['Notes'] ?? '');
        if ($snotes !== '') {
            $merged_notes = ($pnotes !== '' && $pnotes !== $snotes)
                ? $pnotes . "\n\n---\n\n" . $snotes
                : ($pnotes !== '' ? $pnotes : $snotes);
            $db->prepare('UPDATE Members SET Notes = ? WHERE MemberID = ?')->execute([$merged_notes, $primary_id]);
        }

        // Merge OtherSocieties: union of comma-separated values
        $ps = array_filter(array_map('trim', explode(',', $primary['OtherSocieties'] ?? '')));
        $ss = array_filter(array_map('trim', explode(',', $secondary['OtherSocieties'] ?? '')));
        $merged_societies = array_unique(array_merge($ps, $ss));
        if (count($merged_societies) > count($ps)) {
            $db->prepare('UPDATE Members SET OtherSocieties = ? WHERE MemberID = ?')->execute([implode(', ', $merged_societies), $primary_id]);
        }

        // Transfer recognitions from secondary to primary
        try {
            $db->prepare('UPDATE MemberRecognitions SET MemberID = ? WHERE MemberID = ?')->execute([$primary_id, $secondary_id]);
        } catch (\Exception $e) {}

        // Transfer photos from secondary to primary (prevents CASCADE delete from wiping them)
        try {
            $db->prepare('UPDATE Photos SET MemberID = ? WHERE MemberID = ?')->execute([$primary_id, $secondary_id]);
        } catch (\Exception $e) {}

        // Delete any remaining orphaned records from secondary
        _delete_member_related($db, $secondary_id);

        // Delete the secondary member
        $db->prepare('DELETE FROM Members WHERE MemberID = ?')->execute([$secondary_id]);

        // Resequence MemberNumber with no gaps
        $ids = $db->query('SELECT MemberID FROM Members ORDER BY MemberID')->fetchAll(PDO::FETCH_COLUMN);
        $upd = $db->prepare('UPDATE Members SET MemberNumber = ? WHERE MemberID = ?');
        foreach ($ids as $i => $id) {
            $upd->execute([$i + 1, $id]);
        }

        $db->commit();
        json_out(['success' => true, 'message' => "Members merged successfully. Member #$secondary_id has been removed."]);
    } catch (Exception $e) {
        $db->rollBack();
        json_out(['error' => 'Merge failed: ' . $e->getMessage()], 500);
    }
}

