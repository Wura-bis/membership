<?php
function json_out($data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function get_body(): ?array {
    static $cachedRaw = null;
    if ($cachedRaw === null) {
        $cachedRaw = file_get_contents('php://input');
    }
    $raw = $cachedRaw;
    $ct  = $_SERVER['CONTENT_TYPE'] ?? '';
    if (str_contains($ct, 'application/json') || str_starts_with(trim($raw), '{') || str_starts_with(trim($raw), '[')) {
        $parsed = json_decode($raw, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($parsed)) {
            return $parsed;
        }
    }
    return [];
}

function require_auth(): array {
    if (empty($_SESSION['user'])) {
        json_out(['error' => 'Unauthorized'], 401);
    }
    return $_SESSION['user'];
}

function require_admin(): array {
    $u = require_auth();
    if ($u['role'] !== 'admin') json_out(['error' => 'Admin access required'], 403);
    return $u;
}

function require_private_or_admin(): array {
    $u = require_auth();
    if (!in_array($u['role'], ['admin', 'private'])) json_out(['error' => 'Insufficient permissions'], 403);
    return $u;
}

function hash_password(string $password): string {
    return hash('sha256', $password);
}

function to_int(?string $value): ?int {
    if ($value === null || $value === '' || $value === 'null') return null;
    if (!is_numeric($value)) return null;
    return (int)$value;
}

function to_date(?string $value): ?string {
    if ($value === null || $value === '' || $value === 'null') return null;
    if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) return null;
    [$yyyy, $mm, $dd] = explode('-', $value);
    if (!checkdate((int)$mm, (int)$dd, (int)$yyyy)) return null;
    return $value;
}

function format_date($value): ?string {
    if (!$value) return null;
    if ($value instanceof DateTime) return $value->format('Y-m-d');
    $s = (string)$value;
    // MySQL datetime: 2020-01-15 00:00:00 → 2020-01-15
    $date = substr($s, 0, 10);
    if ($date === '0000-00-00') return null;
    return $date;
}

function bool_val($v): bool {
    if (is_bool($v)) return $v;
    if (is_int($v)) return $v !== 0;
    if (is_string($v)) return in_array(strtolower($v), ['1', 'true', 'yes', 'active']);
    return false;
}
