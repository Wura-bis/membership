<?php
ini_set('display_errors', '1');
ini_set('display_startup_errors', '1');
error_reporting(E_ALL);

register_shutdown_function(function () {
    $error = error_get_last();
    if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR], true)) {
        http_response_code(500);
        header('Content-Type: text/plain; charset=utf-8');
        $message = sprintf("Fatal error: %s in %s on line %d", $error['message'], $error['file'], $error['line']);
        echo $message;
        @file_put_contents(__DIR__ . '/export_debug.log', json_encode([
            'ts' => date('c'),
            'fatal_error' => $error,
            'request_uri' => $_SERVER['REQUEST_URI'] ?? null,
            'request_method' => $_SERVER['REQUEST_METHOD'] ?? null,
            'content_type' => $_SERVER['CONTENT_TYPE'] ?? null,
            'get' => $_GET,
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT) . "\n", FILE_APPEND);
    }
});

session_start();

// CORS — needed for local dev (React on :5173 talking to PHP on a different port)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = ['http://localhost:5173', 'http://localhost:3000', 'https://bisofpei.com'];
if (in_array($origin, $allowed)) {
    header("Access-Control-Allow-Origin: $origin");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/helpers.php';

$method = $_SERVER['REQUEST_METHOD'];

// Log requests for debugging when export failures occur
error_log(json_encode([
    'ts' => date('c'),
    'method' => $method,
    'uri' => $_SERVER['REQUEST_URI'] ?? null,
    'path' => preg_replace('#^.*?/api/?#', '', parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)),
    'query' => $_GET,
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? null,
]));

// Normalise path: strip everything up to and including /api, then trim slashes
$uri  = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = preg_replace('#^.*?/api/?#', '', $uri);
$path = trim($path, '/');

// Split into segments for parameterised matching
$seg = explode('/', $path);

// ── Helper: load handler file once ───────────────────────────────────────────
function h(string $file): void {
    static $loaded = [];
    if (!isset($loaded[$file])) {
        require_once __DIR__ . '/handlers/' . $file . '.php';
        $loaded[$file] = true;
    }
}

// ── Routing ───────────────────────────────────────────────────────────────────

// Health
if ($path === 'health' && $method === 'GET') {
    json_out(['status' => 'ok']);
}

// Auth
if ($path === 'login'      && $method === 'POST')  { h('auth'); handle_login(); }
if ($path === 'logout'     && $method === 'POST')  { h('auth'); handle_logout(); }
if ($path === 'check-auth' && $method === 'GET')   { h('auth'); handle_check_auth(); }
if ($path === 'signup'     && $method === 'POST')  { h('auth'); handle_signup(); }
if ($path === 'forgot-password' && $method === 'POST') { h('auth'); handle_forgot_password(); }
if ($path === 'reset-password'  && $method === 'POST') { h('auth'); handle_reset_password(); }
if ($path === 'reset-password-noemail' && $method === 'POST') { h('auth'); handle_reset_password_noemail(); }
if ($path === 'forgot-password/manual'  && $method === 'POST') { h('auth'); handle_reset_password_noemail(); }

// My Profile
if ($path === 'my-profile' && $method === 'GET')  { h('auth'); handle_my_profile_get(); }
if ($path === 'my-profile' && $method === 'PUT')  { h('auth'); handle_my_profile_put(); }
if ($path === 'my-profile/change-password' && $method === 'POST') { h('auth'); handle_change_password(); }
if ($path === 'me/change-password'          && $method === 'PUT')  { h('auth'); handle_change_password(); }
if ($path === 'my-profile/request-private-access' && $method === 'POST') { h('auth'); handle_request_private_access(); }
if ($path === 'my-data/export'                   && $method === 'GET')  { h('auth'); handle_my_data_export(); }

// Members statistics
if ($path === 'members/statistics' && $method === 'GET') { h('statistics'); get_statistics_handler(); }

// Members list / create
if ($path === 'members/lookup' && $method === 'GET') { h('members'); lookup_members_handler(); }
if ($path === 'members' && $method === 'GET')  { h('members'); get_members_list(); }
if ($path === 'members' && $method === 'POST') { h('members'); create_member_handler(); }
if ($path === 'members/bulk-deactivate' && ($method === 'PUT' || $method === 'POST')) { h('members'); bulk_deactivate_handler(); }
if ($path === 'members/merge' && $method === 'POST') { h('members'); merge_members_handler(); }
if ($path === 'members/search' && $method === 'GET') { h('members'); get_members_list(); }

// Members single
if (count($seg) === 2 && $seg[0] === 'members' && is_numeric($seg[1])) {
    $id = (int)$seg[1];
    if ($method === 'GET')    { h('members'); get_member_handler($id); }
    if ($method === 'PUT')    { h('members'); update_member_handler($id); }
    if ($method === 'DELETE') { h('members'); delete_member_handler($id); }
}
if (count($seg) === 3 && $seg[0] === 'members' && is_numeric($seg[1])) {
    $id   = (int)$seg[1];
    $sub  = $seg[2];
    if ($sub === 'deactivate' && $method === 'POST') { h('members'); deactivate_member_handler($id); }
    if ($sub === 'reinstate'  && $method === 'POST') { h('members'); reinstate_member_handler($id); }
    if ($sub === 'photos'     && $method === 'POST')   { h('members'); upload_photo_handler($id); }
    if ($sub === 'photos'     && $method === 'DELETE') { h('members'); delete_photo_handler($id); }
}

// Lookups
if ($path === 'lookups' && $method === 'GET') { h('lookups'); get_lookups_handler(); }
if ($path === 'lookups/fiscal-years' && $method === 'POST')   { h('lookups'); create_fiscal_year_handler(); }
if ($path === 'lookups/categories'   && $method === 'POST')   { h('lookups'); create_category_handler(); }
if ($path === 'lookups/roles'        && $method === 'POST')   { h('lookups'); create_role_handler(); }
if ($path === 'lookups/societies'    && $method === 'POST')   { h('lookups'); create_society_handler(); }
if ($path === 'lookups/occupations'  && $method === 'POST')   { h('lookups'); create_occupation_handler(); }
if ($path === 'lookups/surnames'     && $method === 'POST')   { h('lookups'); create_surname_handler(); }
if (count($seg) === 3 && $seg[0] === 'lookups' && is_numeric($seg[2]) && $method === 'DELETE') {
    h('lookups');
    switch ($seg[1]) {
        case 'fiscal-years':  delete_fiscal_year_handler((int)$seg[2]); break;
        case 'categories':    delete_category_handler((int)$seg[2]); break;
        case 'roles':         delete_role_handler((int)$seg[2]); break;
        case 'occupations':   delete_occupation_handler((int)$seg[2]); break;
        case 'surnames':      delete_surname_handler((int)$seg[2]); break;
    }
}

// Users
if ($path === 'users' && $method === 'GET')  { h('users'); get_users_handler(); }
if ($path === 'users' && $method === 'POST') { h('users'); create_user_handler(); }
if (count($seg) === 3 && $seg[0] === 'users' && is_numeric($seg[1])) {
    $uid = (int)$seg[1];
    $sub = $seg[2];
    if ($sub === 'role'     && $method === 'PUT') { h('users'); change_user_role_handler($uid); }
    if ($sub === 'status'   && $method === 'PUT') { h('users'); toggle_user_status_handler($uid); }
    if ($sub === 'approve'  && $method === 'PUT') { h('users'); approve_user_handler($uid); }
    if ($sub === 'password' && $method === 'PUT') { h('users'); admin_set_user_password_handler($uid); }
}
if (count($seg) === 2 && $seg[0] === 'users' && is_numeric($seg[1]) && $method === 'PUT') {
    h('users'); update_user_handler((int)$seg[1]);
}
if (count($seg) === 2 && $seg[0] === 'users' && is_numeric($seg[1]) && $method === 'DELETE') {
    h('users'); delete_user_handler((int)$seg[1]);
}

// Admin approvals
if ($path === 'admin/approvals' && $method === 'GET')  { h('users'); get_pending_approvals_handler(); }
if ($path === 'admin/approvals' && $method === 'POST') { h('users'); update_approval_handler(); }

// Dashboard
if ($path === 'public/dashboard'  && $method === 'GET') { h('dashboard'); public_dashboard_handler(); }
if ($path === 'dashboard-stats'   && $method === 'GET') { h('dashboard'); dashboard_stats_handler(); }
if ($path === 'dashboard'         && $method === 'GET') { h('dashboard'); dashboard_handler(); }
if ($path === 'admin/dashboard'   && $method === 'GET') { h('dashboard'); dashboard_handler(); }
if ($path === 'admin/stats'       && $method === 'GET') { h('dashboard'); dashboard_stats_handler(); }
if ($path === 'stats'             && $method === 'GET') { h('dashboard'); dashboard_stats_handler(); }

// Import
if ($path === 'import/members/preview'  && $method === 'POST') { h('import'); import_preview_handler(); }
if ($path === 'import/members/confirm'  && $method === 'POST') { h('import'); import_confirm_handler(); }
if ($path === 'import/members/template' && $method === 'GET')  { h('import'); import_template_handler(); }

// Export
if ($path === 'export/members/csv'    && $method === 'GET') { 
    if (isset($_GET['ids'])) {
        h('export'); export_selected_members_csv($_GET['ids']);
    } else {
        h('export'); export_all_members_csv();
    }
}
if ($path === 'export/members/csv'    && $method === 'POST') {
    h('export');
    $body = get_body();
    if (!empty($body['ids'])) export_selected_members_csv();
    else export_all_members_csv();
}
if ($path === 'export/members/pdf'    && $method === 'GET') { h('export'); export_all_members_pdf(); }
if (count($seg) === 4 && $seg[0] === 'export' && $seg[1] === 'member' && is_numeric($seg[2])) {
    $mid = (int)$seg[2];
    if ($seg[3] === 'csv' && $method === 'GET') { h('export'); export_member_csv($mid); }
    if ($seg[3] === 'pdf' && $method === 'GET') { h('export'); export_member_pdf($mid); }
}
if ($path === 'export/members/fiscalyear/csv' && $method === 'GET') { h('export'); export_fiscal_year_csv(); }
if ($path === 'export/recognitions/csv'       && $method === 'GET') { h('export'); export_recognitions_csv(); }

// Contact info (public — no auth required)
if ($path === 'contact-info' && $method === 'GET') { h('settings'); get_contact_info_handler(); }

// Settings
if ($path === 'settings'        && $method === 'GET') { h('settings'); get_settings_handler(); }
if ($path === 'admin/settings'  && $method === 'GET') { h('settings'); get_settings_handler(); }
if ($path === 'admin/settings'  && $method === 'PUT') { h('settings'); update_settings_handler(); }
if (count($seg) === 2 && $seg[0] === 'settings' && $method === 'PUT') {
    h('settings'); update_single_setting_handler($seg[1]);
}

// Notifications
if ($path === 'admin/notifications' && $method === 'GET')  { h('notifications'); get_notifications_handler(); }
if ($path === 'admin/notifications/read-all' && $method === 'POST') { h('notifications'); mark_all_notifications_read_handler(); }
if (count($seg) === 4 && $seg[0] === 'admin' && $seg[1] === 'notifications' && is_numeric($seg[2]) && $seg[3] === 'read' && $method === 'PUT') {
    h('notifications'); mark_notification_read_handler((int)$seg[2]);
}

// Support
if ($path === 'support'                && $method === 'POST') { h('support'); submit_support_handler(); }
if ($path === 'support'                && $method === 'GET')  { h('support'); get_support_handler(); }
if ($path === 'support/contact'        && $method === 'POST') { h('support'); submit_support_handler(); }
if ($path === 'support/my-tickets'     && $method === 'GET')  { h('support'); get_my_tickets_handler(); }
if ($path === 'support/mine'           && $method === 'GET')  { h('support'); get_my_tickets_handler(); }
if ($path === 'admin/support/tickets'  && $method === 'GET')  { h('support'); get_all_tickets_handler(); }
if (count($seg) === 4 && $seg[0] === 'admin' && $seg[1] === 'support' && $seg[2] === 'tickets' && is_numeric($seg[3]) && $method === 'PUT') {
    h('support'); update_ticket_handler((int)$seg[3]);
}


// 404
json_out(['error' => 'Not found', 'path' => $path, 'method' => $method], 404);
