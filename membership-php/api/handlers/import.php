<?php
// Column name aliases → canonical field name
const COL_MAP = [
    'firstname'           => 'firstName',     'first name'          => 'firstName',     'first'               => 'firstName',
    'lastname'            => 'lastName',      'last name'           => 'lastName',      'last'                => 'lastName',
    'email'               => 'email',         'email address'       => 'email',
    'phone'               => 'phoneNumber',   'telephone'           => 'phoneNumber',   'phonenumber'         => 'phoneNumber',
    'phone (primary)'     => 'phoneNumber',   'primary phone'       => 'phoneNumber',   'phone primary'       => 'phoneNumber',
    'other (primary)'     => 'phoneNumber',   'primary'             => 'phoneNumber',
    'home'                => 'homePhone',     'home phone'          => 'homePhone',     'phone (home)'        => 'homePhone',
    'cell'                => 'cellPhone',     'cell phone'          => 'cellPhone',     'mobile'              => 'cellPhone',
    'phone (cell)'        => 'cellPhone',     'phone (mobile)'      => 'cellPhone',
    'work'                => 'workPhone',     'work phone'          => 'workPhone',     'phone (work)'        => 'workPhone',
    'other phone'         => 'otherPhone',    'phone (other)'       => 'otherPhone',
    'dateofbirth'         => 'dateOfBirth',   'date of birth'       => 'dateOfBirth',   'dob'                 => 'dateOfBirth',   'birth date' => 'dateOfBirth',
    'placeofbirth'        => 'placeOfBirth',  'place of birth'      => 'placeOfBirth',
    'datejoined'          => 'dateJoined',    'date joined'         => 'dateJoined',    'joined'              => 'dateJoined',
    'dateended'           => 'dateEnded',     'date ended'          => 'dateEnded',     'ended'               => 'dateEnded',
    'application'         => 'applicationDate','application date'   => 'applicationDate','applicationdate'    => 'applicationDate',
    'proposal date'       => 'proposalDate',  'proposaldate'        => 'proposalDate',  'proposal'            => 'proposalDate',
    'approval date'       => 'approvalDate',  'approvaldate'        => 'approvalDate',
    'date approved'       => 'approvalDate',  'dateapproved'        => 'approvalDate',  'approved date'       => 'approvalDate',
    'category'            => 'category',      'membercategory'      => 'category',      'member category'     => 'category',
    'county'              => 'county',        'irishcounty'         => 'county',        'irish county'        => 'county',        'irish counties'      => 'county',
    'surname'             => 'irishSurname',  'irish surname'       => 'irishSurname',  'irishsurname'        => 'irishSurname',   'irish surnames'      => 'irishSurname',
    'connectiontype'      => 'connectionType','connection type'     => 'connectionType','irish connection'    => 'connectionType',  'irish conn'          => 'connectionType', 'irish connection types' => 'connectionType',
    'occupation'          => 'occupation',
    'notes'               => 'notes',         'note'                => 'notes',         'comments'            => 'notes',          'member notes' => 'notes',
    'isactive'            => 'isActive',      'active'              => 'isActive',      'status'              => 'isActive',
    'approvedby'          => 'approvedBy',    'approved by'         => 'approvedBy',    'approved'            => 'approvedBy',
    'signedby'            => 'signedBy',      'signed by'           => 'signedBy',
    'proposer'            => 'proposer',
    'seconder'            => 'seconder',
    'othersocieties'      => 'otherSocieties','other societies'     => 'otherSocieties',
    'street'              => 'street',        'address'             => 'street',        'address1'            => 'street',
    'address line 1'      => 'street',        'streetaddress'       => 'street',
    'current street'      => 'street',        'current st'          => 'street',        'current address'     => 'street',
    'city'                => 'city',          'town'                => 'city',
    'current city'        => 'city',          'current ci'          => 'city',
    'province'            => 'province',      'state'               => 'province',
    'current province'    => 'province',      'current pr'          => 'province',      'current state'       => 'province',
    'country'             => 'country',
    'current country'     => 'country',       'current co'          => 'country',
    'postalcode'          => 'postalCode',    'postal code'         => 'postalCode',    'postcode'            => 'postalCode',
    'zip'                 => 'postalCode',    'zip code'            => 'postalCode',    'zipcode'             => 'postalCode',
    'current postal code' => 'postalCode',    'current postal'      => 'postalCode',    'current postcode'    => 'postalCode',
    'current po'          => 'postalCode',
    'volunteering'        => 'volunteeringInterests', 'volunteering interests' => 'volunteeringInterests',
    'volunteeringinterests' => 'volunteeringInterests', 'interests'  => 'volunteeringInterests',
];

const LIBRARY_EMAIL = 'bisofpeilibrary@gmail.com';

// Split a field that may contain multiple values separated by ;
// Returns clean array, stripping blanks and literal dashes
function _split_multi(?string $v): array {
    if (!$v || trim($v) === '' || trim($v) === '-') return [];
    $parts = preg_split('/\s*[;,]\s*/', trim($v));
    return array_values(array_filter(array_map('trim', $parts), function($p) { return $p !== '' && $p !== '-'; }));
}

function _parse_csv_date(?string $v): ?string {
    if (!$v || trim($v) === '' || trim($v) === '-') return null;
    $v = trim($v);
    foreach (['Y-m-d','d/m/Y','m/d/Y','d-m-Y','Y/m/d'] as $fmt) {
        $dt = DateTime::createFromFormat($fmt, $v);
        if ($dt && $dt->format($fmt) === $v) return $dt->format('Y-m-d');
    }
    $ts = @strtotime($v);
    return $ts !== false ? date('Y-m-d', $ts) : null;
}

function _map_headers(array $headers): array {
    $map = [];
    foreach ($headers as $i => $h) {
        $key = strtolower(trim($h));
        if (isset(COL_MAP[$key])) $map[COL_MAP[$key]] = $i;
    }
    return $map;
}

function _col(?int $idx, array $row): string {
    if ($idx === null) return '';
    return trim($row[$idx] ?? '');
}

function _find_duplicate(PDO $db, string $first, string $last, ?string $email, ?string $phone, ?string $dob): ?int {
    if ($email && $email !== LIBRARY_EMAIL) {
        $s = $db->prepare('SELECT MemberID FROM Members WHERE TRIM(FirstName)=? AND TRIM(LastName)=? AND Email=?');
        $s->execute([$first, $last, $email]);
        $r = $s->fetch(); if ($r) return (int)$r[0];
    }
    if ($phone) {
        $s = $db->prepare('SELECT MemberID FROM Members WHERE TRIM(FirstName)=? AND TRIM(LastName)=? AND PhoneNumber=?');
        $s->execute([$first, $last, $phone]);
        $r = $s->fetch(); if ($r) return (int)$r[0];
    }
    if ($dob) {
        $s = $db->prepare('SELECT MemberID FROM Members WHERE TRIM(FirstName)=? AND TRIM(LastName)=? AND `Date of Birth`=?');
        $s->execute([$first, $last, $dob]);
        $r = $s->fetch(); if ($r) return (int)$r[0];
    }
    $s = $db->prepare('SELECT MemberID FROM Members WHERE TRIM(FirstName)=? AND TRIM(LastName)=?');
    $s->execute([$first, $last]);
    $all = $s->fetchAll();
    if (count($all) === 1) return (int)$all[0][0];
    return null;
}

function _resolve_category(PDO $db, string $name): ?int {
    if (!$name) return null;
    $s = $db->prepare('SELECT CategoryID FROM MemberCategory WHERE LOWER(CategoryName)=LOWER(?)');
    $s->execute([$name]);
    $r = $s->fetch(); return $r ? (int)$r[0] : null;
}

function _resolve_county(PDO $db, string $name): ?int {
    if (!$name || trim($name) === '' || trim($name) === '-') return null;
    $name = trim($name);
    $s = $db->prepare('SELECT CountyID FROM IrishCounties WHERE LOWER(CountyName)=LOWER(?)');
    $s->execute([$name]);
    $r = $s->fetch();
    if ($r) return (int)$r[0];
    $db->prepare('INSERT INTO IrishCounties (CountyName) VALUES (?)')->execute([$name]);
    return (int)$db->lastInsertId();
}

function _resolve_surname(PDO $db, string $name): ?int {
    if (!$name || trim($name) === '' || trim($name) === '-') return null;
    $name = trim($name);
    $s = $db->prepare('SELECT SurnameID FROM IrishSurnames WHERE LOWER(Surname)=LOWER(?)');
    $s->execute([$name]);
    $r = $s->fetch();
    if ($r) return (int)$r[0];
    $db->prepare('INSERT INTO IrishSurnames (Surname) VALUES (?)')->execute([$name]);
    return (int)$db->lastInsertId();
}

// Resolve occupation by name, auto-creating it if it doesn't exist
function _resolve_occupation(PDO $db, string $name): ?int {
    if (!$name || trim($name) === '' || trim($name) === '-') return null;
    $name = trim($name);
    $s = $db->prepare('SELECT OccupationID FROM Occupation WHERE LOWER(OccupationName)=LOWER(?)');
    $s->execute([$name]);
    $r = $s->fetch();
    if ($r) return (int)$r[0];
    $db->prepare('INSERT INTO Occupation (OccupationName) VALUES (?)')->execute([$name]);
    return (int)$db->lastInsertId();
}

// Get or create the UserDefinedField row for volunteering interests
function _get_or_create_volunteering_field(PDO $db): ?int {
    static $fid = false;
    if ($fid === false) {
        $s = $db->prepare("SELECT FieldID FROM UserDefinedField WHERE FieldLabel = 'Volunteering Interests'");
        $s->execute();
        $row = $s->fetch();
        if ($row) {
            $fid = (int)$row[0];
        } else {
            $db->prepare("INSERT INTO UserDefinedField (FieldLabel, FieldType) VALUES ('Volunteering Interests', 'text')")->execute();
            $fid = (int)$db->lastInsertId();
        }
    }
    return $fid ?: null;
}

// Ensure ConnectionType column exists and no unique constraint blocks
// same county/surname with different connection types per member.
function _ensure_connection_type_columns(PDO $db, array &$errors): void {
    // Add ConnectionType column if missing
    $r = $db->query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA=DATABASE()
          AND TABLE_NAME IN ('IrishConnectionByCounty','IrishConnectionBySurname')
          AND COLUMN_NAME='ConnectionType'");
    $found = [];
    foreach ($r->fetchAll() as $row) $found[$row[0]] = true;
    if (empty($found['IrishConnectionByCounty'])) {
        $db->exec("ALTER TABLE IrishConnectionByCounty ADD COLUMN ConnectionType VARCHAR(50) NOT NULL DEFAULT 'Paternal'");
        $errors[] = 'Schema: added ConnectionType column to IrishConnectionByCounty';
    }
    if (empty($found['IrishConnectionBySurname'])) {
        $db->exec("ALTER TABLE IrishConnectionBySurname ADD COLUMN ConnectionType VARCHAR(50) NOT NULL DEFAULT 'Paternal'");
        $errors[] = 'Schema: added ConnectionType column to IrishConnectionBySurname';
    }

    $tables = [
        'IrishConnectionByCounty'  => 'CountyID',
        'IrishConnectionBySurname' => 'SurnameID',
    ];
    foreach ($tables as $tbl => $id_col) {
        // Report what columns are in the PRIMARY KEY
        $pk_cols = $db->query("
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
            WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='$tbl' AND CONSTRAINT_NAME='PRIMARY'
            ORDER BY ORDINAL_POSITION
        ")->fetchAll(PDO::FETCH_COLUMN);

        if (!in_array('ConnectionType', $pk_cols)) {
            $pk_blocks = in_array('MemberID', $pk_cols) && in_array($id_col, $pk_cols);
            if ($pk_blocks) {
                // PK is (MemberID, id_col) without ConnectionType — need to widen it
                $has_ai = (bool)$db->query("
                    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='$tbl' AND EXTRA LIKE '%auto_increment%'
                ")->fetchColumn();
                if ($has_ai) {
                    $errors[] = "Schema WARNING: $tbl has AUTO_INCREMENT; cannot modify PRIMARY KEY (MemberID, $id_col) — will rely on unique-index migration below";
                } else {
                    try {
                        $db->exec("ALTER TABLE `$tbl` DROP PRIMARY KEY, ADD PRIMARY KEY (MemberID, `$id_col`, ConnectionType)");
                        $errors[] = "Schema: widened PRIMARY KEY of $tbl to include ConnectionType";
                    } catch (Exception $e) {
                        $errors[] = "Schema ERROR modifying $tbl PRIMARY KEY: " . $e->getMessage();
                    }
                }
            }
        }

        // Drop any named unique index on (MemberID, id_col) that omits ConnectionType
        $stmt = $db->query("
            SELECT INDEX_NAME FROM INFORMATION_SCHEMA.STATISTICS
            WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='$tbl'
              AND NON_UNIQUE=0 AND INDEX_NAME!='PRIMARY'
            GROUP BY INDEX_NAME
            HAVING SUM(COLUMN_NAME='ConnectionType')=0
        ");
        foreach ($stmt->fetchAll() as $row) {
            try {
                $db->exec("ALTER TABLE `$tbl` DROP INDEX `{$row[0]}`");
                $errors[] = "Schema: dropped unique index `{$row[0]}` from $tbl (did not include ConnectionType)";
            } catch (Exception $e) {
                $errors[] = "Schema ERROR dropping index `{$row[0]}` from $tbl: " . $e->getMessage();
            }
        }
    }
}

function _parse_active(?string $v): ?bool {
    if (!$v || trim($v) === '' || trim($v) === '-') return null; // not specified in CSV
    return in_array(strtolower(trim($v)), ['1','true','yes','active','honorary']);
}

function import_preview_handler(): void {
    require_admin();

    if (empty($_FILES['file'])) json_out(['error' => 'No file uploaded'], 400);
    $file = $_FILES['file']['tmp_name'];
    if (!$file || !file_exists($file)) json_out(['error' => 'File upload failed'], 400);

    $handle = fopen($file, 'r');
    if (!$handle) json_out(['error' => 'Could not read file'], 500);

    // Detect BOM
    $bom = fread($handle, 3);
    if ($bom !== "\xEF\xBB\xBF") rewind($handle);

    $raw_headers = fgetcsv($handle);
    if (!$raw_headers) json_out(['error' => 'Empty or invalid CSV'], 400);

    $map = _map_headers($raw_headers);
    $db  = get_db();

    $results = ['new' => [], 'update' => []];
    $preview = [];
    $row_num = 1;

    while (($row = fgetcsv($handle)) !== false) {
        $row_num++;
        if (array_filter($row) === []) continue;

        $first = _col($map['firstName'] ?? null, $row);
        $last  = _col($map['lastName']  ?? null, $row);
        if (!$first && !$last) continue;

        $email = _col($map['email']       ?? null, $row) ?: null;
        $phone = _col($map['phoneNumber'] ?? null, $row) ?: null;
        $home  = _col($map['homePhone']   ?? null, $row) ?: null;
        $cell  = _col($map['cellPhone']   ?? null, $row) ?: null;
        $work  = _col($map['workPhone']   ?? null, $row) ?: null;
        $other = _col($map['otherPhone']  ?? null, $row) ?: null;
        $dob   = _parse_csv_date(_col($map['dateOfBirth'] ?? null, $row));

        $existing_id = _find_duplicate($db, $first, $last, $email, $phone ?? $home ?? $cell, $dob);

        $record = [
            'row'                    => $row_num,
            'firstName'              => $first,
            'lastName'               => $last,
            'email'                  => ($email && $email !== LIBRARY_EMAIL) ? $email : null,
            'phoneNumber'            => $phone,
            'homePhone'              => $home,
            'cellPhone'              => $cell,
            'workPhone'              => $work,
            'otherPhone'             => $other,
            'dateOfBirth'            => $dob,
            'placeOfBirth'           => _col($map['placeOfBirth']          ?? null, $row) ?: null,
            'dateJoined'             => _parse_csv_date(_col($map['dateJoined']        ?? null, $row)),
            'dateEnded'              => _parse_csv_date(_col($map['dateEnded']         ?? null, $row)),
            'applicationDate'        => _parse_csv_date(_col($map['applicationDate']   ?? null, $row)),
            'proposalDate'           => _parse_csv_date(_col($map['proposalDate']      ?? null, $row)),
            'approvalDate'           => _parse_csv_date(_col($map['approvalDate']      ?? null, $row)),
            'category'               => _col($map['category']              ?? null, $row) ?: null,
            'county'                 => _col($map['county']                ?? null, $row) ?: null,
            'irishSurname'           => _col($map['irishSurname']          ?? null, $row) ?: null,
            'connectionType'         => _col($map['connectionType']        ?? null, $row) ?: null,
            'street'                 => _col($map['street']                ?? null, $row) ?: null,
            'city'                   => _col($map['city']                  ?? null, $row) ?: null,
            'province'               => _col($map['province']              ?? null, $row) ?: null,
            'country'                => _col($map['country']               ?? null, $row) ?: null,
            'postalCode'             => _col($map['postalCode']            ?? null, $row) ?: null,
            'occupation'             => _col($map['occupation']            ?? null, $row) ?: null,
            'notes'                  => _col($map['notes']                 ?? null, $row) ?: null,
            'isActive'               => _parse_active(_col($map['isActive']    ?? null, $row)),
            'approvedBy'             => _col($map['approvedBy']            ?? null, $row) ?: null,
            'signedBy'               => _col($map['signedBy']              ?? null, $row) ?: null,
            'proposer'               => _col($map['proposer']              ?? null, $row) ?: null,
            'seconder'               => _col($map['seconder']              ?? null, $row) ?: null,
            'otherSocieties'         => _col($map['otherSocieties']        ?? null, $row) ?: null,
            'volunteeringInterests'  => _col($map['volunteeringInterests'] ?? null, $row) ?: null,
            'existingId'             => $existing_id,
        ];

        if ($existing_id) {
            $record['action'] = 'update';
            $results['update'][] = "$first $last (ID: $existing_id)";
        } else {
            $record['action'] = 'new';
            $results['new'][] = "$first $last";
        }
        $preview[] = $record;
    }
    fclose($handle);

    $_SESSION['import_preview'] = $preview;

    json_out([
        'preview'      => $preview,
        'errors'       => [],
        'total_count'  => count($preview),
        'insert_count' => count($results['new']),
        'update_count' => count($results['update']),
        'summary' => [
            'new'    => count($results['new']),
            'update' => count($results['update']),
            'total'  => count($preview),
        ],
    ]);
}

function import_confirm_handler(): void {
    require_admin();

    $preview = $_SESSION['import_preview'] ?? null;
    if (!$preview) json_out(['error' => 'No import preview found. Upload and preview the file first.'], 400);

    $db      = get_db();
    $errors  = [];
    _ensure_connection_type_columns($db, $errors);
    $created = 0;
    $updated = 0;

    // Track members created during this batch so that subsequent rows for the
    // same person (MS Access multi-row exports) are treated as updates, not
    // duplicate inserts.
    $batch_created = []; // 'lowercased first|last' => MemberID

    // Detect optional columns added by ALTER TABLE
    $chk = $db->query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Members'
          AND COLUMN_NAME IN ('ApplicationDate','ProposalDate','Approval Date')");
    $opt_cols = [];
    foreach ($chk->fetchAll() as $c) $opt_cols[$c[0]] = true;
    $has_app  = !empty($opt_cols['ApplicationDate']);
    $has_prop = !empty($opt_cols['ProposalDate']);
    $has_appr = !empty($opt_cols['Approval Date']);

    foreach ($preview as $rec) {
        try {
            $mid       = null; // reset each row so stale value never bleeds into relations
            $cat_id    = _resolve_category($db, $rec['category'] ?? '');
            $occ_id    = _resolve_occupation($db, $rec['occupation'] ?? '');
            $is_active = $rec['isActive'];

            if ($cat_id) {
                $s = $db->prepare('SELECT CategoryName FROM MemberCategory WHERE CategoryID=?');
                $s->execute([$cat_id]);
                $cat = $s->fetch();
                if ($cat) $is_active = in_array(strtolower($cat[0]), ['active','honorary']);
            }

            $email     = ($rec['email'] && $rec['email'] !== LIBRARY_EMAIL) ? $rec['email'] : null;
            $batch_key = strtolower(trim($rec['firstName']) . '|' . trim($rec['lastName']));

            if ($rec['action'] === 'update' && $rec['existingId']) {
                $mid  = $rec['existingId'];
                $sets = [];
                $vals = [];
                if ($rec['firstName'])    { $sets[] = 'FirstName=?';         $vals[] = $rec['firstName']; }
                if ($rec['lastName'])     { $sets[] = 'LastName=?';          $vals[] = $rec['lastName']; }
                if ($email)               { $sets[] = 'Email=?';             $vals[] = $email; }
                if ($rec['phoneNumber'])  { $sets[] = 'PhoneNumber=?';       $vals[] = $rec['phoneNumber']; }
                if ($rec['dateOfBirth'])  { $sets[] = '`Date of Birth`=?';   $vals[] = $rec['dateOfBirth']; }
                if ($rec['placeOfBirth']) { $sets[] = '`Place of Birth`=?';  $vals[] = $rec['placeOfBirth']; }
                if ($rec['dateJoined'])   { $sets[] = 'DateJoined=?';        $vals[] = $rec['dateJoined']; }
                if ($rec['dateEnded'])    { $sets[] = 'DateEnded=?';         $vals[] = $rec['dateEnded']; }
                if ($has_app  && $rec['applicationDate']) { $sets[] = 'ApplicationDate=?';   $vals[] = $rec['applicationDate']; }
                if ($has_prop && $rec['proposalDate'])    { $sets[] = 'ProposalDate=?';      $vals[] = $rec['proposalDate']; }
                if ($has_appr && $rec['approvalDate'])    { $sets[] = '`Approval Date`=?';   $vals[] = $rec['approvalDate']; }
                if ($cat_id)              { $sets[] = 'MemberCategoryID=?';  $vals[] = $cat_id; }
                if ($occ_id)              { $sets[] = 'OccupationID=?';      $vals[] = $occ_id; }
                if ($rec['notes']) {
                    $ex_notes = $db->prepare('SELECT Notes FROM Members WHERE MemberID=?');
                    $ex_notes->execute([$mid]);
                    $existing_notes = $ex_notes->fetchColumn();
                    if (!$existing_notes) {
                        $sets[] = 'Notes=?'; $vals[] = $rec['notes'];
                    } elseif (strpos($existing_notes, $rec['notes']) === false) {
                        $sets[] = 'Notes=?'; $vals[] = $existing_notes . "\n" . $rec['notes'];
                    }
                }
                if ($rec['approvedBy'])   { $sets[] = 'ApprovedBy=?';        $vals[] = $rec['approvedBy']; }
                if ($rec['signedBy'])     { $sets[] = 'SignedBy=?';          $vals[] = $rec['signedBy']; }
                if ($rec['proposer'])     { $sets[] = 'Proposer=?';          $vals[] = $rec['proposer']; }
                if ($rec['seconder'])     { $sets[] = 'Seconder=?';          $vals[] = $rec['seconder']; }
                if ($rec['otherSocieties']) {
                    $ex_soc = $db->prepare('SELECT OtherSocieties FROM Members WHERE MemberID=?');
                    $ex_soc->execute([$mid]);
                    $existing_soc = $ex_soc->fetchColumn();
                    $existing_arr = $existing_soc ? array_unique(array_filter(array_map('trim', explode(',', $existing_soc)))) : [];
                    $new_arr = array_unique(array_filter(array_map('trim', explode(',', $rec['otherSocieties']))));
                    $merged_soc = array_unique(array_merge($existing_arr, $new_arr));
                    $sets[] = 'OtherSocieties=?'; $vals[] = implode(', ', $merged_soc);
                }
                if ($is_active !== null) {
                    $db_active_stmt = $db->prepare('SELECT IsActive FROM Members WHERE MemberID=?');
                    $db_active_stmt->execute([$mid]);
                    $db_active = (bool)$db_active_stmt->fetchColumn();
                    $sets[] = 'IsActive=?'; $vals[] = ($db_active || $is_active) ? 1 : 0;
                }
                $vals[] = $mid;
                if ($sets) $db->prepare('UPDATE Members SET ' . implode(',', $sets) . ' WHERE MemberID=?')->execute($vals);
                $updated++;
                $batch_created[$batch_key] = $mid;
            } elseif (isset($batch_created[$batch_key])) {
                // Same person already created earlier in this batch — just add their relations
                $mid = $batch_created[$batch_key];
            } else {
                $extra_cols = $has_app  ? ', ApplicationDate' : '';
                $extra_cols .= $has_prop ? ', ProposalDate'   : '';
                $extra_cols .= $has_appr ? ', `Approval Date`' : '';
                $extra_phs  = $has_app  ? ', ?' : '';
                $extra_phs  .= $has_prop ? ', ?' : '';
                $extra_phs  .= $has_appr ? ', ?' : '';
                $extra_vals = [];
                if ($has_app)  $extra_vals[] = $rec['applicationDate'] ?? null;
                if ($has_prop) $extra_vals[] = $rec['proposalDate']    ?? null;
                if ($has_appr) $extra_vals[] = $rec['approvalDate']    ?? null;

                $db->prepare("
                    INSERT INTO Members (FirstName, LastName, Email, PhoneNumber, `Date of Birth`,
                        `Place of Birth`, MemberCategoryID, OccupationID, IsActive, Notes,
                        DateJoined, DateEnded, ApprovedBy, SignedBy, Proposer, Seconder,
                        OtherSocieties$extra_cols, CreatedAt)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?$extra_phs,NOW())
                ")->execute(array_merge([
                    $rec['firstName'], $rec['lastName'],
                    $email, $rec['phoneNumber'] ?? null,
                    $rec['dateOfBirth'] ?? null, $rec['placeOfBirth'] ?? null,
                    $cat_id, $occ_id, ($is_active ?? true) ? 1 : 0,
                    $rec['notes'] ?? null,
                    $rec['dateJoined'] ?? null, $rec['dateEnded'] ?? null,
                    $rec['approvedBy'] ?? null, $rec['signedBy'] ?? null,
                    $rec['proposer'] ?? null, $rec['seconder'] ?? null,
                    $rec['otherSocieties'] ?? null,
                ], $extra_vals));
                $mid = (int)$db->lastInsertId();
                $batch_created[$batch_key] = $mid;
                $created++;
            }

            if (!$mid) continue;

            // Irish connections — split semicolon-separated values
            $conn_types = _split_multi($rec['connectionType'] ?? '');
            $counties   = _split_multi($rec['county'] ?? '');
            $surnames   = _split_multi($rec['irishSurname'] ?? '');

            foreach ($counties as $i => $county_name) {
                try {
                    $county_id = _resolve_county($db, $county_name);
                    $conn      = $conn_types[$i] ?? 'Paternal';
                    if ($county_id) {
                        $chk2 = $db->prepare('SELECT 1 FROM IrishConnectionByCounty WHERE MemberID=? AND CountyID=? AND ConnectionType=?');
                        $chk2->execute([$mid, $county_id, $conn]);
                        if (!$chk2->fetch()) {
                            $db->prepare('INSERT INTO IrishConnectionByCounty (MemberID, CountyID, ConnectionType) VALUES (?,?,?)')->execute([$mid, $county_id, $conn]);
                        }
                    }
                } catch (Exception $e) {
                    $errors[] = "Warning row {$rec['row']}: county '$county_name' failed — " . $e->getMessage();
                }
            }

            foreach ($surnames as $i => $surname_name) {
                try {
                    $surname_id = _resolve_surname($db, $surname_name);
                    $conn       = $conn_types[$i] ?? 'Paternal';
                    if ($surname_id) {
                        $chk2 = $db->prepare('SELECT 1 FROM IrishConnectionBySurname WHERE MemberID=? AND SurnameID=? AND ConnectionType=?');
                        $chk2->execute([$mid, $surname_id, $conn]);
                        if (!$chk2->fetch()) {
                            $db->prepare('INSERT INTO IrishConnectionBySurname (MemberID, SurnameID, ConnectionType) VALUES (?,?,?)')->execute([$mid, $surname_id, $conn]);
                        }
                    }
                } catch (Exception $e) {
                    $errors[] = "Warning row {$rec['row']}: surname '$surname_name' failed — " . $e->getMessage();
                }
            }

            // Address — append if not already present (never delete existing addresses)
            if ($mid && ($rec['street'] || $rec['city'] || $rec['postalCode'])) {
                $prov_id = null;
                if (!empty($rec['province'])) {
                    $s = $db->prepare('SELECT ProvinceID FROM Provinces WHERE LOWER(ProvinceName)=LOWER(?)');
                    $s->execute([$rec['province']]);
                    $r = $s->fetch();
                    $prov_id = $r ? $r[0] : null;
                }
                $chk_addr = $db->prepare(
                    'SELECT AddressID FROM MemberAddress WHERE MemberID=?
                     AND TRIM(IFNULL(Street,""))=TRIM(?) AND TRIM(IFNULL(City,""))=TRIM(?)
                     AND TRIM(IFNULL(PostalCode,""))=TRIM(?)'
                );
                $chk_addr->execute([$mid, $rec['street'] ?? '', $rec['city'] ?? '', $rec['postalCode'] ?? '']);
                if (!$chk_addr->fetch()) {
                    $cnt_stmt = $db->prepare('SELECT COUNT(*) FROM MemberAddress WHERE MemberID=?');
                    $cnt_stmt->execute([$mid]);
                    $is_first = (int)$cnt_stmt->fetchColumn() === 0;
                    $db->prepare('INSERT INTO MemberAddress (MemberID, Street, City, ProvinceID, CountryID, PostalCode, IsCurrent) VALUES (?,?,?,?,?,?,?)')
                       ->execute([$mid, $rec['street'], $rec['city'], $prov_id, $rec['country'], $rec['postalCode'], $is_first ? 1 : 0]);
                }
            }

            // Additional phones (Home, Cell, Work, Other) — append if number not already present for this member
            foreach (['homePhone' => 'Home', 'cellPhone' => 'Cell', 'workPhone' => 'Work', 'otherPhone' => 'Other'] as $field => $type) {
                if (!empty($rec[$field])) {
                    $s = $db->prepare('SELECT PhoneID FROM MemberPhoneNumbers WHERE MemberID=? AND PhoneNumber=? AND PhoneType=?');
                    $s->execute([$mid, $rec[$field], $type]);
                    if (!$s->fetch()) {
                        $db->prepare('INSERT INTO MemberPhoneNumbers (MemberID, PhoneType, PhoneNumber, IsPreferred) VALUES (?,?,?,0)')->execute([$mid, $type, $rec[$field]]);
                    }
                }
            }

            // Volunteering interests — split by semicolons, store in UserDefinedFieldValue
            $vi_raw = $rec['volunteeringInterests'] ?? null;
            if ($vi_raw) {
                $interests = _split_multi($vi_raw);
                if ($interests) {
                    $fid = _get_or_create_volunteering_field($db);
                    if ($fid) {
                        foreach ($interests as $interest) {
                            $chk2 = $db->prepare('SELECT 1 FROM UserDefinedFieldValue WHERE FieldID=? AND MemberID=? AND ValueText=?');
                            $chk2->execute([$fid, $mid, $interest]);
                            if (!$chk2->fetch()) {
                                $db->prepare('INSERT INTO UserDefinedFieldValue (FieldID, MemberID, ValueText) VALUES (?,?,?)')->execute([$fid, $mid, $interest]);
                            }
                        }
                    }
                }
            }

        } catch (Exception $e) {
            $errors[] = "Row {$rec['row']}: " . $e->getMessage();
        }
    }

    unset($_SESSION['import_preview']);

    json_out([
        'success' => true,
        'created' => $created,
        'updated' => $updated,
        'errors'  => $errors,
    ]);
}

function import_template_handler(): void {
    require_admin();
    $headers = [
        'First Name','Last Name','Email',
        'Phone (Primary)','Phone (Cell)','Phone (Home)','Phone (Work)','Phone (Other)',
        'Date of Birth','Place of Birth',
        'Date Joined','Date Ended','Application Date','Proposal Date','Approval Date',
        'Category','Irish County','Irish Surname','Irish Connection',
        'Occupation','Notes','IsActive',
        'Approved By','Signed By','Proposer','Seconder','Other Societies',
        'Volunteering',
        'Current Street','Current City','Current Province','Current Country','Current Postal Code',
    ];
    _stream_csv('member_import_template.csv', $headers, [
        [
            'Jane','Doe','jane@example.com','','','','','',
            '1970-01-15','Dublin',
            '2010-06-01','','2010-04-01','2010-05-15','2010-06-15',
            'Active','Clare','Murphy; Kelly','Paternal; Maternal',
            'Teacher','','true',
            '','','','','',
            'Music; Events',
            '123 Main St','Charlottetown','Prince Edward Island','Canada','C1A 1A1',
        ],
    ]);
}

// Redefine locally if export.php is not loaded in this request
if (!function_exists('_stream_csv')) {
    function _stream_csv(string $filename, array $headers, array $rows): void {
        header('Content-Type: text/csv; charset=utf-8');
        header("Content-Disposition: attachment; filename=\"$filename\"");
        $out = fopen('php://output', 'w');
        fputcsv($out, $headers);
        foreach ($rows as $row) fputcsv($out, $row);
        fclose($out);
        exit;
    }
}
