<?php
const EXPORT_HEADERS = [
    'First Name','Last Name','Email',
    'Phone (Primary)','Phone (Cell)','Phone (Home)','Phone (Work)','Phone (Other)',
    'Place of Birth','Date of Birth','Occupation',
    'Irish Connections',
    'Current Street','Current City','Current Province','Current Country','Current Postal Code',
    'Previous Addresses',
    'Category','Active','Date Joined','Date Ended','Application Date','Proposal Date','Approval Date',
    'Approved By','Signed By','Proposer','Seconder',
    'Other Societies','Roles','Notes','Volunteering Interests',
];

function _parse_column_filter(): ?array {
    $cols = null;
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $body = get_body();
        if (isset($body['columns']) && is_array($body['columns']) && count($body['columns']) > 0) {
            $cols = array_map('trim', $body['columns']);
        }
    }
    if ($cols === null && !empty($_GET['columns'])) {
        $raw  = $_GET['columns'];
        $cols = is_array($raw) ? $raw : array_map('trim', explode(',', $raw));
    }
    if ($cols === null) return null;
    $valid = array_values(array_filter($cols, fn($c) => in_array($c, EXPORT_HEADERS)));
    return count($valid) > 0 ? $valid : null;
}

function _headers_filtered(?array $cols): array {
    if ($cols === null) return EXPORT_HEADERS;
    return array_values(array_filter(EXPORT_HEADERS, fn($h) => in_array($h, $cols)));
}

function _apply_column_filter(array $rows, ?array $cols): array {
    if ($cols === null) return $rows;
    $indices = array_keys(array_filter(EXPORT_HEADERS, fn($h) => in_array($h, $cols)));
    return array_map(fn($row) => array_values(array_map(fn($i) => $row[$i] ?? '', $indices)), $rows);
}

function _filtered_row_pairs(?array $cols, array $row): array {
    $pairs = [];
    foreach (EXPORT_HEADERS as $i => $h) {
        if ($cols === null || in_array($h, $cols)) $pairs[] = [$h, $row[$i] ?? ''];
    }
    return $pairs;
}

function _stream_csv(string $filename, array $headers, array $rows): void {
    header('Content-Type: text/csv; charset=utf-8');
    header("Content-Disposition: attachment; filename=\"$filename\"");
    header('Pragma: no-cache');
    $out = fopen('php://output', 'w');
    fputcsv($out, $headers);
    foreach ($rows as $row) fputcsv($out, $row);
    fclose($out);
    exit;
}

function _optional_member_cols(PDO $db): array {
    $chk = $db->query("
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='Members'
          AND COLUMN_NAME IN ('ApplicationDate','ProposalDate','Approval Date')
    ");
    $found = [];
    foreach ($chk->fetchAll() as $c) $found[$c[0]] = true;
    return $found;
}

function _full_member_query(PDO $db, ?int $member_id = null, array $member_ids = []): PDOStatement {
    $opt       = _optional_member_cols($db);
    $app_date  = !empty($opt['ApplicationDate']) ? 'm.ApplicationDate' : 'NULL';
    $prop_date = !empty($opt['ProposalDate'])    ? 'm.ProposalDate'    : 'NULL';
    $appr_date = !empty($opt['Approval Date'])   ? 'm.`Approval Date`' : 'NULL';

    if (!empty($member_ids)) {
        $placeholders = implode(',', array_fill(0, count($member_ids), '?'));
        $where = "WHERE m.MemberID IN ($placeholders)";
    } elseif ($member_id !== null) {
        $where = 'WHERE m.MemberID = ?';
    } else {
        $where = '';
    }

    $sql = "
        SELECT
            m.FirstName, m.LastName, m.Email, m.PhoneNumber,
            (SELECT mpn.PhoneNumber FROM MemberPhoneNumbers mpn
             WHERE mpn.MemberID=m.MemberID AND mpn.PhoneType='Cell'  LIMIT 1) AS CellPhone,
            (SELECT mpn.PhoneNumber FROM MemberPhoneNumbers mpn
             WHERE mpn.MemberID=m.MemberID AND mpn.PhoneType='Home'  LIMIT 1) AS HomePhone,
            (SELECT mpn.PhoneNumber FROM MemberPhoneNumbers mpn
             WHERE mpn.MemberID=m.MemberID AND mpn.PhoneType='Work'  LIMIT 1) AS WorkPhone,
            (SELECT mpn.PhoneNumber FROM MemberPhoneNumbers mpn
             WHERE mpn.MemberID=m.MemberID AND mpn.PhoneType='Other' LIMIT 1) AS OtherPhone,
            m.`Place of Birth`,
            m.`Date of Birth`,
            o.OccupationName,
            (SELECT GROUP_CONCAT(
                CONCAT(COALESCE(NULLIF(TRIM(icc.ConnectionType),''),'Paternal'), '|', COALESCE(ic.CountyName,''))
                ORDER BY COALESCE(NULLIF(TRIM(icc.ConnectionType),''),'Paternal'), ic.CountyName
                SEPARATOR ';')
             FROM IrishConnectionByCounty icc
             LEFT JOIN IrishCounties ic ON icc.CountyID=ic.CountyID
             WHERE icc.MemberID=m.MemberID) AS RawCounties,
            (SELECT GROUP_CONCAT(
                CONCAT(COALESCE(NULLIF(TRIM(ics2.ConnectionType),''),'Paternal'), '|', COALESCE(isur2.Surname,''))
                ORDER BY COALESCE(NULLIF(TRIM(ics2.ConnectionType),''),'Paternal'), isur2.Surname
                SEPARATOR ';')
             FROM IrishConnectionBySurname ics2
             LEFT JOIN IrishSurnames isur2 ON ics2.SurnameID=isur2.SurnameID
             WHERE ics2.MemberID=m.MemberID) AS RawSurnames,
            ma.Street, ma.City,
            COALESCE(p.ProvinceName, ma.ProvinceID) AS Province,
            ma.CountryID AS Country,
            ma.PostalCode,
            (SELECT GROUP_CONCAT(
                CONCAT_WS(', ',
                    NULLIF(TRIM(ma2.Street),''),
                    NULLIF(TRIM(ma2.City),''),
                    NULLIF(COALESCE(p2.ProvinceName, ma2.ProvinceID),''),
                    NULLIF(TRIM(ma2.CountryID),''),
                    NULLIF(TRIM(ma2.PostalCode),'')
                )
                ORDER BY ma2.MemberAddressID
                SEPARATOR ' | '
             ) FROM MemberAddress ma2
             LEFT JOIN Provinces p2 ON ma2.ProvinceID=p2.ProvinceID
             WHERE ma2.MemberID=m.MemberID AND ma2.IsCurrent=0) AS PreviousAddresses,
            mc.CategoryName,
            CASE WHEN m.IsActive=1 THEN 'Active' ELSE 'Inactive' END AS Active,
            m.DateJoined,
            m.DateEnded,
            $app_date  AS ApplicationDate,
            $prop_date AS ProposalDate,
            $appr_date AS ApprovalDate,
            m.ApprovedBy, m.SignedBy, m.Proposer, m.Seconder,
            m.OtherSocieties,
            (SELECT GROUP_CONCAT(
                CASE WHEN fy.YearLabel IS NOT NULL
                     THEN CONCAT(r.RoleName, ' (', fy.YearLabel, ')')
                     ELSE r.RoleName
                END
                ORDER BY COALESCE(fy.YearLabel,''), r.RoleName SEPARATOR '; ')
             FROM MemberRole mr
             JOIN Role r ON mr.RoleID=r.RoleID
             LEFT JOIN FiscalYear fy ON mr.FiscalYearID=fy.FiscalYearID
             WHERE mr.MemberID=m.MemberID) AS Roles,
            m.Notes,
            (SELECT GROUP_CONCAT(udfv.ValueText ORDER BY udfv.ValueText SEPARATOR '; ')
             FROM UserDefinedFieldValue udfv
             INNER JOIN UserDefinedField udf ON udfv.FieldID=udf.FieldID
             WHERE udfv.MemberID=m.MemberID AND udf.FieldLabel='Volunteering Interests') AS VolunteeringInterests
        FROM Members m
        LEFT JOIN MemberCategory mc ON m.MemberCategoryID=mc.CategoryID
        LEFT JOIN Occupation o ON m.OccupationID=o.OccupationID
        LEFT JOIN MemberAddress ma ON m.MemberID=ma.MemberID AND ma.IsCurrent=1
        LEFT JOIN Provinces p ON ma.ProvinceID=p.ProvinceID
        $where
        ORDER BY m.LastName, m.FirstName
    ";

    $stmt = $db->prepare($sql);
    if (!empty($member_ids)) $stmt->execute($member_ids);
    elseif ($member_id !== null) $stmt->execute([$member_id]);
    else $stmt->execute();
    return $stmt;
}

function _format_irish_connections(?string $raw_counties, ?string $raw_surnames): string {
    $groups = [];
    if ($raw_counties) {
        foreach (explode(';', $raw_counties) as $item) {
            [$type, $county] = array_pad(explode('|', $item, 2), 2, '');
            if ($county !== '') $groups[$type]['counties'][] = 'County ' . $county;
            elseif (!isset($groups[$type])) $groups[$type] = [];
        }
    }
    if ($raw_surnames) {
        foreach (explode(';', $raw_surnames) as $item) {
            [$type, $surname] = array_pad(explode('|', $item, 2), 2, '');
            if ($surname !== '') $groups[$type]['surnames'][] = 'Surname ' . $surname;
        }
    }
    if (empty($groups)) return '';
    ksort($groups);
    $out = [];
    foreach ($groups as $type => $data) {
        $items = array_merge($data['counties'] ?? [], $data['surnames'] ?? []);
        $out[] = $items ? $type . ': ' . implode(' / ', $items) : $type;
    }
    return implode('; ', $out);
}

function _row_to_csv(array $r): array {
    // SQL returns 34 columns: r[11]=RawCounties, r[12]=RawSurnames (type|value pairs)
    // grouped by connection type and merged into a single Irish Connections output column.
    $irish = _format_irish_connections($r[11] ?? null, $r[12] ?? null);
    return [
        $r[0]  ?? '',                         // First Name
        $r[1]  ?? '',                         // Last Name
        $r[2]  ?? '',                         // Email
        $r[3]  ?? '',                         // Phone (Primary)
        $r[4]  ?? '',                         // Phone (Cell)
        $r[5]  ?? '',                         // Phone (Home)
        $r[6]  ?? '',                         // Phone (Work)
        $r[7]  ?? '',                         // Phone (Other)
        $r[8]  ?? '',                         // Place of Birth
        format_date($r[9]  ?? ''),            // Date of Birth
        $r[10] ?? '',                         // Occupation
        $irish,                               // Irish Connections
        $r[13] ?? '',                         // Current Street
        $r[14] ?? '',                         // Current City
        $r[15] ?? '',                         // Current Province
        $r[16] ?? '',                         // Current Country
        $r[17] ?? '',                         // Current Postal Code
        $r[18] ?? '',                         // Previous Addresses
        $r[19] ?? '',                         // Category
        $r[20] ?? '',                         // Active
        format_date($r[21] ?? ''),            // Date Joined
        format_date($r[22] ?? ''),            // Date Ended
        format_date($r[23] ?? ''),            // Application Date
        format_date($r[24] ?? ''),            // Proposal Date
        format_date($r[25] ?? ''),            // Approval Date
        $r[26] ?? '',                         // Approved By
        $r[27] ?? '',                         // Signed By
        $r[28] ?? '',                         // Proposer
        $r[29] ?? '',                         // Seconder
        $r[30] ?? '',                         // Other Societies
        $r[31] ?? '',                         // Roles
        $r[32] ?? '',                         // Notes
        $r[33] ?? '',                         // Volunteering Interests
    ];
}

function export_all_members_csv(): void {
    require_private_or_admin();
    $db   = get_db();
    $stmt = _full_member_query($db);
    $rows = [];
    foreach ($stmt->fetchAll() as $r) $rows[] = _row_to_csv($r);
    $cols = _parse_column_filter();
    _stream_csv('members.csv', _headers_filtered($cols), _apply_column_filter($rows, $cols));
}

function _parse_export_ids(): array {
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $body = get_body();
        $ids  = $body['ids'] ?? [];
        $dbg  = [
            'ts'           => date("c"),
            'method'       => $_SERVER['REQUEST_METHOD'] ?? null,
            'request_uri'  => $_SERVER['REQUEST_URI']    ?? null,
            'content_type' => $_SERVER['CONTENT_TYPE']   ?? null,
            'get'          => $_GET,
            'body'         => $body,
            'ids_field'    => $ids,
        ];
        if (function_exists('getallheaders')) $dbg['headers'] = getallheaders();
        @file_put_contents(__DIR__ . '/../export_debug.log', json_encode($dbg, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT) . "\n", FILE_APPEND);
    } else {
        $ids = $_GET['ids'] ?? [];
    }
    if (is_string($ids)) $ids = explode(',', $ids);
    return array_filter(array_map('intval', (array)$ids), fn($id) => $id > 0);
}

function export_selected_members_csv(?string $ids_param = null): void {
    require_private_or_admin();

    $ids = $ids_param !== null
        ? array_filter(array_map('intval', explode(',', $ids_param)), fn($id) => $id > 0)
        : _parse_export_ids();
    if (empty($ids)) { http_response_code(400); echo 'No valid member IDs provided'; exit; }

    $cols = _parse_column_filter();
    try {
        $db   = get_db();
        $stmt = _full_member_query($db, null, $ids);
        $rows = [];
        foreach ($stmt->fetchAll() as $r) $rows[] = _row_to_csv($r);
        _stream_csv('members_export.csv', _headers_filtered($cols), _apply_column_filter($rows, $cols));
    } catch (Exception $e) {
        $info = [
            'ts'        => date("c"),
            'exception' => get_class($e),
            'message'   => $e->getMessage(),
            'code'      => $e->getCode(),
            'trace'     => $e->getTraceAsString(),
            'ids'       => $ids,
        ];
        @file_put_contents(__DIR__ . '/../export_debug.log', json_encode($info, JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT) . "\n", FILE_APPEND);
        http_response_code(500);
        header('Content-Type: text/plain; charset=utf-8');
        echo 'Export error: ' . $e->getMessage() . "\nDebug log written to export_debug.log";
        exit;
    }
}

function export_member_csv(int $member_id): void {
    require_private_or_admin();
    $db   = get_db();
    $stmt = _full_member_query($db, $member_id);
    $m    = $stmt->fetch();
    if (!$m) { http_response_code(404); echo 'Not found'; exit; }
    $row  = _row_to_csv($m);
    $rows = [];
    foreach (EXPORT_HEADERS as $i => $label) $rows[] = [$label, $row[$i] ?? ''];
    _stream_csv("member_{$member_id}.csv", ['Field', 'Value'], $rows);
}

function export_member_pdf(int $member_id): void {
    require_private_or_admin();
    $db   = get_db();
    $stmt = _full_member_query($db, $member_id);
    $m    = $stmt->fetch();
    if (!$m) { http_response_code(404); echo 'Not found'; exit; }
    $row  = _row_to_csv($m);
    $name = htmlspecialchars(trim(($m[0] ?? '') . ' ' . ($m[1] ?? '')));

    $cols = _parse_column_filter();
    header('Content-Type: text/html; charset=utf-8');
    echo "<!DOCTYPE html><html><head><meta charset='utf-8'><title>$name</title>
    <style>
        body{font-family:Arial,sans-serif;margin:40px;font-size:13px}
        h1{color:#0f766e;margin-bottom:4px}
        h2{color:#0f766e;margin-bottom:16px;font-size:16px}
        table{border-collapse:collapse;width:100%}
        td,th{border:1px solid #ccc;padding:7px 12px;vertical-align:top}
        th{background:#f0fdfa;text-align:left;width:32%;font-weight:600}
        @media print{body{margin:10px}}
    </style></head><body>
    <h1>BIS Member Profile</h1><h2>$name</h2><table>";

    foreach (_filtered_row_pairs($cols, $row) as [$label, $v]) {
        $v = htmlspecialchars((string)$v);
        if ($v === '') continue;
        echo "<tr><th>$label</th><td>$v</td></tr>";
    }
    echo '</table><script>window.print()</script></body></html>';
    exit;
}

function export_all_members_pdf(): void {
    require_private_or_admin();
    $db  = get_db();
    $ids = [];
    if (!empty($_GET['ids'])) {
        $ids = array_filter(array_map('intval', explode(',', $_GET['ids'])), fn($id) => $id > 0);
        if (empty($ids)) { http_response_code(400); echo 'No valid IDs'; exit; }
    }

    $stmt  = _full_member_query($db, null, $ids);
    $rows  = [];
    foreach ($stmt->fetchAll() as $r) $rows[] = _row_to_csv($r);
    $count = count($rows);
    $date  = date('d F Y');
    $title = empty($ids) ? 'BIS Member Directory' : "BIS Member Export ($count selected)";
    $cols  = _parse_column_filter();

    header('Content-Type: text/html; charset=utf-8');
    echo "<!DOCTYPE html><html><head><meta charset='utf-8'><title>$title</title>
<style>
  body{font-family:Arial,sans-serif;margin:30px;font-size:12px;color:#1e293b}
  h1{color:#0f766e;margin-bottom:4px;font-size:20px}
  .meta{color:#64748b;font-size:12px;margin-bottom:24px}
  .member{page-break-after:always;margin-bottom:40px}
  .member:last-child{page-break-after:auto}
  .member-name{color:#0f766e;font-size:16px;font-weight:700;margin:0 0 2px}
  .member-sub{color:#64748b;font-size:11px;margin:0 0 10px}
  table{border-collapse:collapse;width:100%}
  td,th{border:1px solid #cbd5e1;padding:5px 10px;vertical-align:top}
  th{background:#f0fdfa;text-align:left;width:34%;font-weight:600;color:#0f766e;font-size:11px}
  @media print{body{margin:10px}}
</style></head><body>
<h1>$title</h1><p class='meta'>$count member(s) &mdash; exported $date</p>";

    foreach ($rows as $row) {
        $name = htmlspecialchars(trim(($row[0] ?? '') . ' ' . ($row[1] ?? '')));
        $cat  = htmlspecialchars($row[19] ?? '');
        echo "<div class='member'><p class='member-name'>$name</p><p class='member-sub'>$cat</p><table>";
        foreach (_filtered_row_pairs($cols, $row) as [$label, $v]) {
            $v = htmlspecialchars((string)$v);
            if ($v === '') continue;
            echo "<tr><th>$label</th><td>$v</td></tr>";
        }
        echo "</table></div>";
    }
    echo '<script>window.print()</script></body></html>';
    exit;
}

function export_fiscal_year_csv(): void {
    require_private_or_admin();
    $fy  = $_GET['fiscalYear'] ?? '';
    $db  = get_db();
    $sql = '
        SELECT DISTINCT m.MemberID, m.FirstName, m.LastName, mc.CategoryName,
               m.DateJoined, m.IsActive, r.RoleName, fy.YearLabel
        FROM Members m
        LEFT JOIN MemberCategory mc ON m.MemberCategoryID = mc.CategoryID
        LEFT JOIN MemberRole mr ON m.MemberID = mr.MemberID
        LEFT JOIN Role r ON mr.RoleID = r.RoleID
        LEFT JOIN FiscalYear fy ON mr.FiscalYearID = fy.FiscalYearID
    ';
    $params = [];
    if ($fy) { $sql .= ' WHERE fy.YearLabel = ?'; $params[] = $fy; }
    $sql .= ' ORDER BY m.LastName, m.FirstName';
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = [];
    foreach ($stmt->fetchAll() as $r) {
        $rows[] = [$r[0], $r[1], $r[2], $r[3] ?? '', format_date($r[4] ?? ''), $r[5] == 1 ? 'Active' : 'Inactive', $r[6] ?? '', $r[7] ?? ''];
    }
    _stream_csv('members_fiscal_year.csv', ['ID','First Name','Last Name','Category','Date Joined','Status','Role','Fiscal Year'], $rows);
}

function export_recognitions_csv(): void {
    require_private_or_admin();
    $db   = get_db();
    $stmt = $db->query('
        SELECT mr.RecognitionID, m.FirstName, m.LastName, rt.Name, mr.Notes
        FROM MemberRecognitions mr
        LEFT JOIN Members m ON mr.MemberID = m.MemberID
        LEFT JOIN RecognitionTypes rt ON mr.RecognitionTypeID = rt.RecognitionTypeID
        WHERE mr.IsActive = 1
        ORDER BY m.LastName, m.FirstName
    ');
    $rows = [];
    foreach ($stmt->fetchAll() as $r) $rows[] = [$r[0], $r[1], $r[2], $r[3] ?? '', $r[4] ?? ''];
    _stream_csv('recognitions.csv', ['ID','First Name','Last Name','Recognition','Notes'], $rows);
}
