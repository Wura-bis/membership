<?php
function handle_login(): void {
    $data = get_body();
    $username = trim($data['username'] ?? '');
    $password = $data['password'] ?? '';
    if (!$username || !$password) json_out(['error' => 'Username and password required'], 400);

    $db = get_db();
    $hashed = hash_password($password);

    $stmt = $db->prepare('
        SELECT UserID, Username, Email, Role, IsApproved, FirstName, `Last Name`
        FROM User
        WHERE (Username = ? OR Email = ? OR UserID = ?) AND PasswordHash = ?
    ');
    $stmt->execute([$username, $username, $username, $hashed]);
    $user = $stmt->fetch();

    if (!$user) json_out(['error' => 'Invalid username or password'], 401);

    [$uid, $uname, $email, $role, $is_approved, $first, $last] = $user;
    $role = strtolower((string)$role);
    $is_approved = (int)$is_approved;

    // Determine effective role
    $effective_role = $role;
    if ($role === 'private' && $is_approved === 0) $effective_role = 'public';
    if ($role === 'admin'   && $is_approved === 0) json_out(['error' => 'Account pending approval'], 403);

    // Update last login
    $db->prepare('UPDATE User SET LastLogin = NOW() WHERE UserID = ?')->execute([$uid]);

    $_SESSION['user'] = [
        'id'        => $uid,
        'username'  => $uname,
        'email'     => $email,
        'role'      => $effective_role,
        'firstName' => $first,
        'lastName'  => $last,
    ];

    json_out([
        'success'   => true,
        'user_id'   => $uid,
        'username'  => $uname,
        'email'     => $email,
        'role'      => $effective_role,
        'firstName' => $first,
        'lastName'  => $last,
    ]);
}

function handle_logout(): void {
    session_destroy();
    json_out(['success' => true]);
}

function handle_check_auth(): void {
    if (empty($_SESSION['user'])) json_out(['authenticated' => false], 401);
    $u = $_SESSION['user'];

    // Re-read role from DB so approval changes take effect without requiring re-login
    $db = get_db();
    $stmt = $db->prepare('SELECT Role, IsApproved FROM User WHERE UserID = ?');
    $stmt->execute([$u['id']]);
    $row = $stmt->fetch();
    if ($row) {
        $role        = strtolower((string)$row[0]);
        $is_approved = (int)$row[1];
        $effective   = ($role === 'private' && $is_approved === 0) ? 'public' : $role;
        $_SESSION['user']['role'] = $effective;
        $u['role'] = $effective;
    }

    json_out([
        'authenticated' => true,
        'user_id'       => $u['id'],
        'username'      => $u['username'],
        'email'         => $u['email'],
        'role'          => $u['role'],
        'firstName'     => $u['firstName'],
        'lastName'      => $u['lastName'],
    ]);
}

function handle_signup(): void {
    $data      = get_body();
    $email     = trim($data['email']     ?? '');
    $password  = $data['password']       ?? '';
    $first     = trim($data['firstName'] ?? '');
    $last      = trim($data['lastName']  ?? '');
    $no_email  = !empty($data['noEmail']);
    $req_priv  = !empty($data['requestPrivate']);

    if (!$first || !$password) {
        json_out(['error' => 'First name and password are required', 'message' => 'First name and password are required'], 400);
    }
    if (!$no_email && !$email) {
        json_out(['error' => 'Email is required', 'message' => 'Email is required'], 400);
    }

    $username = trim($data['username'] ?? $first);
    if (!$username) {
        json_out(['error' => 'Username is required', 'message' => 'Username is required'], 400);
    }

    $role = $req_priv ? 'private' : 'public';

    $db = get_db();

    $chk = $db->prepare('SELECT UserID FROM User WHERE Username = ?');
    $chk->execute([$username]);
    if ($chk->fetch()) {
        json_out(['error' => 'That username is already taken, please choose a different one.', 'message' => 'That username is already taken, please choose a different one.'], 409);
    }

    if ($email) {
        $stmt = $db->prepare('SELECT UserID FROM User WHERE Email = ?');
        $stmt->execute([$email]);
        if ($stmt->fetch()) json_out(['error' => 'That email is already registered', 'message' => 'That email is already registered'], 409);
    }

    // Check if public registration is enabled
    try {
        $s = $db->prepare("SELECT SettingValue FROM Settings WHERE SettingKey = 'publicRegistration'");
        $s->execute();
        $row = $s->fetch();
        if ($row && $row[0] === 'false') {
            json_out(['error' => 'Registration is currently disabled. Please contact an administrator.'], 403);
        }
    } catch (Exception $e) {}

    $hashed = hash_password($password);
    $is_approved = ($role === 'public') ? 1 : 0;

    // Auto-approve all roles if autoApproval is enabled
    try {
        $s = $db->prepare("SELECT SettingValue FROM Settings WHERE SettingKey = 'autoApproval'");
        $s->execute();
        $row = $s->fetch();
        if ($row && $row[0] === 'true') $is_approved = 1;
    } catch (Exception $e) {}

    $db->prepare('
        INSERT INTO User (Username, Email, PasswordHash, Role, IsApproved, FirstName, `Last Name`, CreatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    ')->execute([$username, $email ?: null, $hashed, $role, $is_approved, $first, $last]);

    $new_uid = (int)$db->lastInsertId();
    $disp    = trim("$first $last") ?: $username;
    try {
        $db->prepare('INSERT INTO AdminNotifications (Type, Title, Body, ReferenceID) VALUES (?,?,?,?)')
           ->execute(['new_signup', 'New User Registered', "{$disp} registered (" . ($req_priv ? 'private access request' : 'public account') . ")", $new_uid]);
    } catch (Exception $e) {}

    json_out(['success' => true], 201);
}

function handle_forgot_password(): void {
    $data  = get_body();
    $email = trim($data['email']     ?? '');
    $first = trim($data['firstName'] ?? '');
    $last  = trim($data['lastName']  ?? '');

    if (!$email) json_out(['error' => 'Email is required'], 400);
    if (!$first) json_out(['error' => 'First name is required'], 400);
    if (!$last)  json_out(['error' => 'Last name is required'], 400);

    $db   = get_db();
    $stmt = $db->prepare('SELECT UserID, FirstName, `Last Name` FROM User WHERE Email = ?');
    $stmt->execute([$email]);
    $row  = $stmt->fetch();

    if (!$row) {
        json_out(['error' => 'No account found with that email address.'], 404);
        return;
    }

    $db_first = strtolower(trim((string)($row[1] ?? '')));
    $db_last  = strtolower(trim((string)($row[2] ?? '')));

    if (strtolower($first) !== $db_first || strtolower($last) !== $db_last) {
        json_out(['error' => 'The name provided does not match our records.'], 403);
        return;
    }

    $token  = bin2hex(random_bytes(32));
    $expiry = date('Y-m-d H:i:s', strtotime('+1 hour'));

    $db->prepare('UPDATE User SET ResetToken = ?, ResetTokenExpiry = ? WHERE UserID = ?')
       ->execute([$token, $expiry, $row[0]]);

    $reset_url = 'https://bisofpei.com/membership/reset-password?token=' . urlencode($token);
    $subject   = 'BIS of PEI — Password Reset';
    $body      = implode("\r\n", [
        "Hello {$first},",
        '',
        'You requested a password reset for your BIS of PEI membership account.',
        '',
        'Click the link below to reset your password. This link is valid for 1 hour:',
        '',
        $reset_url,
        '',
        'If you did not request this, you can safely ignore this email.',
        '',
        '— BIS of PEI Membership System',
    ]);
    $headers = "From: BIS of PEI <noreply@bisofpei.com>\r\nContent-Type: text/plain; charset=utf-8";

    $sent = mail($email, $subject, $body, $headers);

    if (!$sent) {
        json_out(['error' => 'Failed to send the reset email. Please use the manual reset option or contact an admin.'], 500);
        return;
    }

    json_out(['success' => true, 'message' => 'A password reset link has been sent to your email address. Check your inbox (and spam folder).']);
}

function handle_reset_password(): void {
    $data = get_body();
    $token    = $data['token']    ?? '';
    $password = $data['password'] ?? '';
    if (!$token || !$password) json_out(['error' => 'Token and password required'], 400);

    $db = get_db();
    $stmt = $db->prepare('SELECT UserID FROM User WHERE ResetToken = ? AND ResetTokenExpiry > NOW()');
    $stmt->execute([$token]);
    $row = $stmt->fetch();
    if (!$row) json_out(['error' => 'Invalid or expired token'], 400);

    $hashed = hash_password($password);
    $db->prepare('UPDATE User SET PasswordHash = ?, ResetToken = NULL, ResetTokenExpiry = NULL WHERE UserID = ?')
       ->execute([$hashed, $row[0]]);
    json_out(['success' => true]);
}

function handle_reset_password_noemail(): void {
    $data = get_body();
    $user_id  = $data['userID']   ?? $data['userId']   ?? '';
    $password = $data['password'] ?? '';
    if (!$user_id || !$password) json_out(['error' => 'UserID and password required'], 400);

    $db = get_db();
    $stmt = $db->prepare('SELECT UserID FROM User WHERE UserID = ?');
    $stmt->execute([$user_id]);
    if (!$stmt->fetch()) json_out(['error' => 'User not found'], 404);

    $hashed = hash_password($password);
    $db->prepare('UPDATE User SET PasswordHash = ? WHERE UserID = ?')->execute([$hashed, $user_id]);
    json_out(['success' => true]);
}

function handle_my_profile_get(): void {
    $u = require_auth();
    $db = get_db();
    $stmt = $db->prepare('SELECT UserID, Username, Email, Role, IsApproved, FirstName, `Last Name`, CreatedAt, LastLogin FROM User WHERE UserID = ?');
    $stmt->execute([$u['id']]);
    $row = $stmt->fetch();
    if (!$row) json_out(['error' => 'User not found'], 404);

    json_out([
        'id'         => $row[0],
        'username'   => $row[1],
        'email'      => $row[2],
        'role'       => strtolower((string)$row[3]),
        'isApproved' => (bool)(int)$row[4],
        'firstName'  => $row[5],
        'lastName'   => $row[6],
        'createdAt'  => format_date($row[7]),
        'lastLogin'  => $row[8] ? substr((string)$row[8], 0, 19) : null,
    ]);
}

function handle_my_profile_put(): void {
    $u    = require_auth();
    $data = get_body();
    $db   = get_db();

    $username = trim($data['username'] ?? '');
    $first    = trim($data['firstName'] ?? '');
    $last     = trim($data['lastName']  ?? '');
    $email    = trim($data['email']     ?? '');

    if (!$username) json_out(['error' => 'Username is required'], 400);

    // Check uniqueness — another user can't already have this username
    $stmt = $db->prepare('SELECT UserID FROM User WHERE Username = ? AND UserID != ?');
    $stmt->execute([$username, $u['id']]);
    if ($stmt->fetch()) json_out(['error' => 'That username is already taken by another account'], 409);

    $db->prepare('UPDATE User SET Username = ?, FirstName = ?, `Last Name` = ?, Email = ? WHERE UserID = ?')
       ->execute([$username, $first, $last, $email, $u['id']]);

    $_SESSION['user']['username']  = $username;
    $_SESSION['user']['firstName'] = $first;
    $_SESSION['user']['lastName']  = $last;
    $_SESSION['user']['email']     = $email;

    json_out(['success' => true]);
}

function handle_change_password(): void {
    $u    = require_auth();
    $data = get_body();
    $current  = $data['currentPassword'] ?? $data['current_password'] ?? '';
    $new_pass = $data['newPassword']      ?? $data['new_password']      ?? '';

    if (!$current || !$new_pass) json_out(['error' => 'Current and new password required'], 400);

    $db = get_db();
    $stmt = $db->prepare('SELECT PasswordHash FROM User WHERE UserID = ?');
    $stmt->execute([$u['id']]);
    $row = $stmt->fetch();

    if (!$row || $row[0] !== hash_password($current)) {
        json_out(['error' => 'Current password is incorrect'], 400);
    }

    $db->prepare('UPDATE User SET PasswordHash = ? WHERE UserID = ?')
       ->execute([hash_password($new_pass), $u['id']]);
    json_out(['success' => true]);
}

function handle_request_private_access(): void {
    $u  = require_auth();
    $db = get_db();
    $db->prepare("UPDATE User SET Role = 'private', IsApproved = 0 WHERE UserID = ?")->execute([$u['id']]);
    json_out(['success' => true]);
}

function handle_my_data_export(): void {
    $u    = require_auth();
    $db   = get_db();
    $stmt = $db->prepare('SELECT UserID, Username, Email, Role, IsApproved, FirstName, `Last Name`, CreatedAt, LastLogin FROM User WHERE UserID = ?');
    $stmt->execute([$u['id']]);
    $row  = $stmt->fetch();
    if (!$row) { http_response_code(404); echo 'User not found'; exit; }

    $name       = htmlspecialchars(trim(($row[5] ?? '') . ' ' . ($row[6] ?? '')) ?: ($row[1] ?? 'User'));
    $username   = htmlspecialchars((string)($row[1] ?? ''));
    $email      = htmlspecialchars((string)($row[2] ?? ''));
    $role       = htmlspecialchars(ucfirst(strtolower((string)($row[3] ?? ''))));
    $approved   = $row[4] ? 'Yes' : 'No';
    $created    = $row[7] ? htmlspecialchars(substr((string)$row[7], 0, 10)) : '—';
    $last_login = $row[8] ? htmlspecialchars(substr((string)$row[8], 0, 19)) : '—';
    $date_now   = date('d F Y');

    header('Content-Type: text/html; charset=utf-8');
    echo "<!DOCTYPE html><html><head><meta charset='utf-8'><title>My Account Data — $name</title>
    <style>
        body{font-family:Arial,sans-serif;margin:40px;font-size:13px;color:#0f172a}
        h1{color:#4e5d2e;margin-bottom:4px}
        h2{color:#4e5d2e;margin-bottom:16px;font-size:15px;font-weight:normal}
        p.meta{color:#64748b;font-size:12px;margin-bottom:24px}
        table{border-collapse:collapse;width:100%;max-width:600px}
        td,th{border:1px solid #d1d5db;padding:8px 14px;vertical-align:top}
        th{background:#f8fafc;text-align:left;width:38%;font-weight:600;color:#374151}
        td{color:#0f172a}
        @media print{body{margin:10px}}
    </style></head><body>
    <h1>BIS Membership System</h1>
    <h2>Account Data Export — $name</h2>
    <p class='meta'>Generated: $date_now</p>
    <table>
        <tr><th>User ID</th><td>{$row[0]}</td></tr>
        <tr><th>Full Name</th><td>$name</td></tr>
        <tr><th>Username</th><td>$username</td></tr>
        <tr><th>Email Address</th><td>$email</td></tr>
        <tr><th>Account Role</th><td>$role</td></tr>
        <tr><th>Account Approved</th><td>$approved</td></tr>
        <tr><th>Account Created</th><td>$created</td></tr>
        <tr><th>Last Login</th><td>$last_login</td></tr>
    </table>
    <script>window.print()</script></body></html>";
    exit;
}
