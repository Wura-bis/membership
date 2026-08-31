<?php
function get_lookups_handler(): void {
    require_auth();
    $db = get_db();

    $counties = $db->query('SELECT CountyID, CountyName FROM IrishCounties ORDER BY CountyName')->fetchAll();
    $counties = array_map(fn($r) => ['value' => $r[0], 'label' => $r[1]], $counties);

    $provinces = $db->query("SELECT ProvinceID, ProvinceName, CountryCode, CountryName FROM Provinces WHERE CountryName IN ('Canada','United States','Ireland') ORDER BY CountryName, ProvinceName")->fetchAll();
    $provinces = array_map(fn($r) => ['value' => $r[0], 'label' => $r[1], 'countryCode' => $r[2], 'countryName' => $r[3]], $provinces);

    $cats = $db->query('SELECT CategoryID, CategoryName FROM MemberCategory ORDER BY CategoryID')->fetchAll();
    $categories = [];
    foreach ($cats as $r) {
        if ($r[0] === null) continue;
        $categories[] = ['value' => (int)$r[0], 'label' => $r[1]];
    }

    $fy = $db->query('SELECT FiscalYearID, YearLabel FROM FiscalYear ORDER BY FiscalYearID DESC')->fetchAll();
    $fiscalYears = array_filter(array_map(fn($r) => $r[0] !== null ? ['value' => $r[0], 'label' => $r[1]] : null, $fy));

    $soc = $db->query('SELECT SocietyID, SocietyName FROM Society ORDER BY SocietyName')->fetchAll();
    $societies = array_map(fn($r) => ['value' => $r[0], 'label' => $r[1]], $soc);

    $rol = $db->query('SELECT RoleID, RoleName FROM Role ORDER BY RoleName')->fetchAll();
    $roles = array_map(fn($r) => ['value' => $r[0], 'label' => $r[1]], $rol);

    $sur = $db->query('SELECT SurnameID, Surname FROM IrishSurnames ORDER BY Surname')->fetchAll();
    $surnames = array_map(fn($r) => ['value' => $r[0], 'label' => $r[1]], $sur);

    $occ = $db->query('SELECT OccupationID, OccupationName FROM Occupation ORDER BY OccupationName')->fetchAll();
    $occupations = array_map(fn($r) => ['value' => $r[0], 'label' => $r[1]], $occ);

    $predefined = [
        'Building Maintenance','Ceilidh Activities','Cultural Activities',
        'Finance and Admin','Other','Social Activities',"St. Patrick's Festival",
    ];
    $stmt = $db->query("SELECT DISTINCT ValueText FROM UserDefinedFieldValue WHERE FieldID = (SELECT FieldID FROM UserDefinedField WHERE FieldLabel = 'Volunteering Interests') AND ValueText IS NOT NULL ORDER BY ValueText");
    $db_interests = array_column($stmt->fetchAll(), 0);
    $merged = [];
    foreach ($predefined  as $v) $merged[strtolower($v)] = $v;
    foreach ($db_interests as $v) { if (!isset($merged[strtolower($v)])) $merged[strtolower($v)] = $v; }
    uksort($merged, fn($a,$b) => strcmp($a,$b));
    $volunteering = array_values($merged);

    json_out([
        'counties'             => $counties,
        'provinces'            => array_values($provinces),
        'categories'           => $categories,
        'fiscalYears'          => array_values($fiscalYears),
        'societies'            => $societies,
        'roles'                => $roles,
        'surnames'             => $surnames,
        'occupations'          => $occupations,
        'volunteeringInterests'=> $volunteering,
    ]);
}

// ── Generic lookup creator ────────────────────────────────────────────────────
function _create_lookup(string $table, string $col, string $field_key, string $payload_key): void {
    require_admin();
    $data  = get_body();
    $value = trim($data[$payload_key] ?? '');
    if (!$value) json_out(['error' => "$payload_key is required"], 400);

    $db = get_db();
    $s  = $db->prepare("SELECT $field_key FROM $table WHERE $col = ?");
    $s->execute([$value]);
    if ($s->fetch()) json_out(['error' => ucfirst($payload_key) . ' already exists'], 409);

    $db->prepare("INSERT INTO $table ($col) VALUES (?)")->execute([$value]);
    json_out(['success' => true, 'id' => (int)$db->lastInsertId(), $payload_key => $value], 201);
}

function _create_lookup_ci(string $table, string $id_col, string $name_col, string $payload_key): void {
    require_admin();
    $data  = get_body();
    $value = trim($data[$payload_key] ?? '');
    if (!$value) json_out(['error' => "$payload_key is required"], 400);

    $db  = get_db();
    $all = $db->query("SELECT $name_col FROM $table")->fetchAll();
    foreach ($all as $r) {
        if (strtolower($r[0]) === strtolower($value)) json_out(['error' => ucfirst($payload_key) . ' already exists'], 409);
    }
    $db->prepare("INSERT INTO $table ($name_col) VALUES (?)")->execute([$value]);
    json_out(['success' => true, 'id' => (int)$db->lastInsertId(), $payload_key => $value], 201);
}

function create_fiscal_year_handler(): void { _create_lookup('FiscalYear',    'YearLabel',      'FiscalYearID', 'yearLabel'); }
function create_category_handler():    void { _create_lookup('MemberCategory','CategoryName',   'CategoryID',   'categoryName'); }
function create_society_handler():     void { _create_lookup('Society',       'SocietyName',    'SocietyID',    'societyName'); }
function create_occupation_handler():  void { _create_lookup('Occupation',    'OccupationName', 'OccupationID', 'occupationName'); }
function create_role_handler():        void { _create_lookup_ci('Role',        'RoleID',    'RoleName',  'roleName'); }
function create_surname_handler():     void { _create_lookup_ci('IrishSurnames','SurnameID','Surname',   'surname'); }

// ── Deleters ──────────────────────────────────────────────────────────────────
function _delete_lookup(string $table, string $id_col, int $id): void {
    require_admin();
    get_db()->prepare("DELETE FROM $table WHERE $id_col = ?")->execute([$id]);
    json_out(['success' => true]);
}

function delete_fiscal_year_handler(int $id): void  { _delete_lookup('FiscalYear',    'FiscalYearID', $id); }
function delete_category_handler(int $id): void     { _delete_lookup('MemberCategory','CategoryID',   $id); }
function delete_role_handler(int $id): void         { _delete_lookup('Role',          'RoleID',       $id); }
function delete_occupation_handler(int $id): void   { _delete_lookup('Occupation',    'OccupationID', $id); }
function delete_surname_handler(int $id): void      { _delete_lookup('IrishSurnames', 'SurnameID',    $id); }
