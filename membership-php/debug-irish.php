<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

$out = [];

try {
    require_once __DIR__ . '/../api/config.php';
    require_once __DIR__ . '/../api/helpers.php';
    $db = get_db();
} catch (Throwable $e) {
    echo json_encode(['boot_error' => $e->getMessage()], JSON_PRETTY_PRINT);
    exit;
}

// Get a real MemberID
$test_mid = null;
try {
    $r = $db->query('SELECT MemberID FROM Members ORDER BY MemberID LIMIT 1')->fetch();
    $test_mid = $r ? (int)$r[0] : null;
    $out['test_member_id'] = $test_mid;
} catch (Throwable $e) {
    $out['member_lookup_error'] = $e->getMessage();
}

// 1. Test to_int with the exact types that arrive from JSON
$out['to_int_tests'] = [];
$cases = [
    'string_19'  => '19',
    'string_8'   => '8',
    'int_8'      => 8,
    'int_19'     => 19,
    'empty'      => '',
    'null_val'   => null,
    'string_null'=> 'null',
    'zero'       => 0,
];
foreach ($cases as $label => $val) {
    $result = null;
    $error  = null;
    try {
        $result = to_int($val);
    } catch (Throwable $e) {
        $error = $e->getMessage();
    }
    $out['to_int_tests'][$label] = ['input' => $val, 'result' => $result, 'error' => $error];
}

// 2. Simulate exact _save_member_related Irish connection logic
//    using both string countyId and integer surnameId (as frontend sends)
if ($test_mid) {
    // Clean slate
    $db->prepare('DELETE FROM IrishConnectionByCounty WHERE MemberID=?')->execute([$test_mid]);
    $db->prepare('DELETE FROM IrishConnectionBySurname WHERE MemberID=?')->execute([$test_mid]);

    // Exactly what the frontend sends: countyId is string "19", surnameId is int 8
    $test_ic = ['type' => 'Paternal', 'countyId' => '19', 'surnameId' => 8];

    $county_id  = null;
    $surname_id = null;
    $county_err = null;
    $surname_err = null;

    try {
        $county_id = to_int($test_ic['countyId'] ?? null);
    } catch (Throwable $e) {
        $county_err = $e->getMessage();
    }
    try {
        $surname_id = to_int($test_ic['surnameId'] ?? null);
    } catch (Throwable $e) {
        $surname_err = $e->getMessage();
    }

    $out['sim_county_id']  = $county_id;
    $out['sim_surname_id'] = $surname_id;
    $out['sim_county_err'] = $county_err;
    $out['sim_surname_err']= $surname_err;

    // Attempt inserts
    if ($county_id) {
        try {
            $db->prepare('INSERT INTO IrishConnectionByCounty (MemberID, CountyID) VALUES (?,?)')->execute([$test_mid, $county_id]);
            $out['sim_county_insert'] = 'SUCCESS';
        } catch (Throwable $e) {
            $out['sim_county_insert'] = 'FAILED: ' . $e->getMessage();
        }
    } else {
        $out['sim_county_insert'] = 'SKIPPED (county_id falsy)';
    }

    if ($surname_id) {
        try {
            $db->prepare('INSERT INTO IrishConnectionBySurname (MemberID, SurnameID) VALUES (?,?)')->execute([$test_mid, $surname_id]);
            $out['sim_surname_insert'] = 'SUCCESS';
        } catch (Throwable $e) {
            $out['sim_surname_insert'] = 'FAILED: ' . $e->getMessage();
        }
    } else {
        $out['sim_surname_insert'] = 'SKIPPED (surname_id falsy)';
    }

    // Verify rows exist
    $r = $db->query('SELECT COUNT(*) FROM IrishConnectionByCounty')->fetch();
    $out['county_count_after_sim'] = (int)$r[0];
    $r = $db->query('SELECT COUNT(*) FROM IrishConnectionBySurname')->fetch();
    $out['surname_count_after_sim'] = (int)$r[0];

    // Cleanup
    $db->prepare('DELETE FROM IrishConnectionByCounty WHERE MemberID=?')->execute([$test_mid]);
    $db->prepare('DELETE FROM IrishConnectionBySurname WHERE MemberID=?')->execute([$test_mid]);
}

// 3. Check MemberAddress table — verify addresses CAN be inserted
if ($test_mid) {
    try {
        $db->prepare('INSERT INTO MemberAddress (MemberID, Street, City, ProvinceID, CountryID, PostalCode, IsCurrent) VALUES (?,?,?,?,?,?,?)')->execute([$test_mid, '123 Test St', 'Charlottetown', null, 'Canada', 'C1A 1A1', 1]);
        $out['test_address_insert'] = 'SUCCESS';
        $r = $db->query('SELECT COUNT(*) FROM MemberAddress')->fetch();
        $out['address_count_after_insert'] = (int)$r[0];
        $db->prepare('DELETE FROM MemberAddress WHERE MemberID=? AND Street=?')->execute([$test_mid, '123 Test St']);
    } catch (Throwable $e) {
        $out['test_address_insert'] = 'FAILED: ' . $e->getMessage();
    }
}

// 4. Log what the PUT request body looks like (only useful when called via POST with test body)
//    Simulate: POST this page with JSON body to capture it
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    $body = json_decode($raw, true);
    $out['received_body'] = $body;
    $out['raw_body_length'] = strlen($raw);
    if ($body && isset($body['irishConnections'])) {
        foreach ($body['irishConnections'] as $idx => $ic) {
            $out['ic_' . $idx] = [
                'countyId_raw'  => $ic['countyId']  ?? 'MISSING',
                'countyId_type' => gettype($ic['countyId'] ?? null),
                'surnameId_raw' => $ic['surnameId'] ?? 'MISSING',
                'surnameId_type'=> gettype($ic['surnameId'] ?? null),
                'county_to_int' => to_int($ic['countyId'] ?? null),
                'surname_to_int'=> to_int($ic['surnameId'] ?? null),
            ];
        }
    }
}

echo json_encode($out, JSON_PRETTY_PRINT);
