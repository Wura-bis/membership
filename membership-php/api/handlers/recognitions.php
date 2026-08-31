<?php
function get_recognitions_handler(): void {
    require_private_or_admin();
    $db   = get_db();
    $stmt = $db->query('
        SELECT mr.RecognitionID, mr.MemberID, CONCAT(m.FirstName,\' \',m.LastName) AS MemberName,
               rt.RecognitionTypeID, rt.Name AS RecognitionType,
               mr.Notes, mr.IsActive
        FROM MemberRecognitions mr
        LEFT JOIN Members m ON mr.MemberID = m.MemberID
        LEFT JOIN RecognitionTypes rt ON mr.RecognitionTypeID = rt.RecognitionTypeID
        ORDER BY mr.RecognitionID DESC
    ');
    $out = [];
    foreach ($stmt->fetchAll() as $r) {
        $out[] = [
            'id'                => $r[0],
            'memberId'          => $r[1],
            'memberName'        => $r[2],
            'recognitionTypeId' => $r[3],
            'recognitionType'   => $r[4],
            'notes'             => $r[5],
            'isActive'          => (bool)$r[6],
        ];
    }
    json_out($out);
}

function get_recognition_types_handler(): void {
    require_auth();
    $db   = get_db();
    $stmt = $db->query('SELECT RecognitionTypeID, Name, Description FROM RecognitionTypes ORDER BY Name');
    $out  = [];
    foreach ($stmt->fetchAll() as $r) {
        $out[] = ['id' => $r[0], 'name' => $r[1], 'description' => $r[2]];
    }
    json_out($out);
}

function create_recognition_handler(): void {
    require_admin();
    $data   = get_body();
    $mem_id = to_int($data['memberId']          ?? null);
    $type_id = to_int($data['recognitionTypeId'] ?? null);
    $notes  = $data['notes'] ?? '';
    if (!$mem_id || !$type_id) json_out(['error' => 'memberId and recognitionTypeId required'], 400);

    $db = get_db();
    $db->prepare('INSERT INTO MemberRecognitions (MemberID, RecognitionTypeID, Notes, IsActive) VALUES (?,?,?,1)')
       ->execute([$mem_id, $type_id, $notes]);
    json_out(['success' => true, 'id' => (int)$db->lastInsertId()], 201);
}

function update_recognition_handler(int $rid): void {
    require_admin();
    $data  = get_body();
    $notes = $data['notes']    ?? '';
    $active = ($data['isActive'] ?? true) ? 1 : 0;
    get_db()->prepare('UPDATE MemberRecognitions SET Notes = ?, IsActive = ? WHERE RecognitionID = ?')->execute([$notes, $active, $rid]);
    json_out(['success' => true]);
}

function delete_recognition_handler(int $rid): void {
    require_admin();
    get_db()->prepare('UPDATE MemberRecognitions SET IsActive = 0 WHERE RecognitionID = ?')->execute([$rid]);
    json_out(['success' => true]);
}

function get_fiscal_years_handler(): void {
    require_auth();
    $stmt = get_db()->query('SELECT FiscalYearID, YearLabel FROM FiscalYear ORDER BY FiscalYearID DESC');
    $out  = [];
    foreach ($stmt->fetchAll() as $r) $out[] = ['id' => $r[0], 'yearLabel' => $r[1]];
    json_out($out);
}
