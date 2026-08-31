<?php
function get_users_handler(): void {
    require_admin();
    $db   = get_db();
    $stmt = $db->query('SELECT UserID, Username, FirstName, `Last Name`, Email, Role, IsApproved, CreatedAt, LastLogin FROM User ORDER BY UserID DESC');
    $out  = [];
    foreach ($stmt->fetchAll() as $r) {
        $out[] = [
            'id'          => $r[0],
            'userID'      => $r[0],
            'username'    => $r[1],
            'firstName'   => $r[2],
            'lastName'    => $r[3],
            'email'       => $r[4],
            'role'        => $r[5],
            'isApproved'  => (bool)$r[6],
            'isActive'    => (bool)$r[6],
            'createdDate' => format_date($r[7]),
            'lastLogin'   => $r[8] ? substr((string)$r[8], 0, 19) : null,
        ];
    }
    json_out($out);
}

function create_user_handler(): void {
    require_admin();
    $data = get_body();
    $username = trim($data['username'] ?? '');
    $email    = trim($data['email']    ?? '');
    $password = $data['password'] ?? '';
    if (!$username || !$email || !$password) json_out(['error' => 'Username, email and password required'], 400);

    $db = get_db();
    $s  = $db->prepare('SELECT UserID FROM User WHERE Username = ? OR Email = ?');
    $s->execute([$username, $email]);
    if ($s->fetch()) json_out(['error' => 'Username or email already exists'], 400);

    $role       = $data['role']        ?? 'public';
    $is_approved = $data['isApproved'] ?? false;
    $first      = $data['firstName']   ?? '';
    $last       = $data['lastName']    ?? '';

    $db->prepare('INSERT INTO User (Username, Email, PasswordHash, Role, IsApproved, FirstName, `Last Name`, CreatedAt) VALUES (?,?,?,?,?,?,?,NOW())')
       ->execute([$username, $email, hash_password($password), $role, $is_approved ? 1 : 0, $first, $last]);

    json_out(['success' => true, 'user_id' => (int)$db->lastInsertId()], 201);
}

function update_user_handler(int $uid): void {
    require_admin();
    $data  = get_body();
    $db    = get_db();
    $first = trim($data['firstName'] ?? '');
    $last  = trim($data['lastName']  ?? '');
    $email = trim($data['email']     ?? '');
    $db->prepare('UPDATE User SET FirstName = ?, `Last Name` = ?, Email = ? WHERE UserID = ?')->execute([$first, $last, $email, $uid]);
    json_out(['success' => true]);
}

function change_user_role_handler(int $uid): void {
    require_admin();
    $data = get_body();
    $role = $data['role'] ?? '';
    if (!in_array($role, ['admin', 'private', 'public'])) json_out(['error' => 'Invalid role'], 400);

    $db = get_db();
    $s  = $db->prepare('SELECT Username FROM User WHERE UserID = ?');
    $s->execute([$uid]);
    if (!$s->fetch()) json_out(['error' => 'User not found'], 404);

    $db->prepare('UPDATE User SET Role = ? WHERE UserID = ?')->execute([$role, $uid]);
    json_out(['success' => true, 'role' => $role]);
}

function toggle_user_status_handler(int $uid): void {
    require_admin();
    $data       = get_body();
    $is_approved = $data['isApproved'] ?? null;
    if (!is_bool($is_approved) && !in_array($is_approved, [0, 1, '0', '1'])) {
        json_out(['error' => 'Invalid approval value'], 400);
    }
    $db = get_db();
    $s  = $db->prepare('SELECT Username FROM User WHERE UserID = ?');
    $s->execute([$uid]);
    if (!$s->fetch()) json_out(['error' => 'User not found'], 404);

    $val = $is_approved ? 1 : 0;
    $db->prepare('UPDATE User SET IsApproved = ? WHERE UserID = ?')->execute([$val, $uid]);
    json_out(['success' => true]);
}

function approve_user_handler(int $uid): void {
    require_admin();
    $data = get_body();
    $val  = ($data['isApproved'] ?? true) ? 1 : 0;
    get_db()->prepare('UPDATE User SET IsApproved = ? WHERE UserID = ?')->execute([$val, $uid]);
    json_out(['success' => true]);
}

function get_pending_approvals_handler(): void {
    require_admin();
    $db   = get_db();
    $stmt = $db->query("SELECT UserID, Username, FirstName, `Last Name`, Email, Role, CreatedAt FROM User WHERE IsApproved = 0 OR IsApproved = '0'");
    $out  = [];
    foreach ($stmt->fetchAll() as $r) {
        $full = trim(($r[2] ?? '') . ' ' . ($r[3] ?? '')) ?: ($r[1] ?? 'Unknown');
        $out[] = [
            'userID'      => $r[0],
            'name'        => $full,
            'firstName'   => $r[2],
            'lastName'    => $r[3],
            'email'       => $r[4] ?: null,
            'access'      => $r[5] ?? 'public',
            'currentRole' => $r[5],
            'createdAt'   => $r[6] ? substr((string)$r[6], 0, 19) : null,
        ];
    }
    json_out($out);
}

function admin_set_user_password_handler(int $uid): void {
    require_admin();
    $data     = get_body();
    $new_pass = $data['newPassword'] ?? '';
    if (strlen($new_pass) < 8) json_out(['error' => 'Password must be at least 8 characters'], 400);
    $db   = get_db();
    $stmt = $db->prepare('SELECT UserID FROM User WHERE UserID = ?');
    $stmt->execute([$uid]);
    if (!$stmt->fetch()) json_out(['error' => 'User not found'], 404);
    $db->prepare('UPDATE User SET PasswordHash = ? WHERE UserID = ?')
       ->execute([hash_password($new_pass), $uid]);
    json_out(['success' => true]);
}

function delete_user_handler(int $uid): void {
    require_admin();
    $current = require_auth();
    if ((int)$current['id'] === $uid) json_out(['error' => 'You cannot delete your own account'], 400);

    $db   = get_db();
    $stmt = $db->prepare('SELECT UserID FROM User WHERE UserID = ?');
    $stmt->execute([$uid]);
    if (!$stmt->fetch()) json_out(['error' => 'User not found'], 404);

    $db->prepare('DELETE FROM User WHERE UserID = ?')->execute([$uid]);
    json_out(['success' => true]);
}

function update_approval_handler(): void {
    require_admin();
    $data    = get_body();
    $user_id = $data['userID'] ?? null;
    $action  = $data['action'] ?? '';

    if (!$user_id) json_out(['error' => 'userID required'], 400);

    $db = get_db();
    if ($action === 'approve') {
        $db->prepare('UPDATE User SET IsApproved = 1 WHERE UserID = ?')->execute([$user_id]);
    } elseif ($action === 'reject') {
        $db->prepare("UPDATE User SET Role = 'public', IsApproved = 0 WHERE UserID = ?")->execute([$user_id]);
    } else {
        json_out(['error' => 'Invalid action'], 400);
    }
    json_out(['success' => true]);
}
