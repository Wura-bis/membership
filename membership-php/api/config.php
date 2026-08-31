<?php
// Database credentials — fill these in after creating the MySQL DB in cPanel
define('DB_HOST', 'localhost');
define('DB_NAME', 'mecallaghan_bisdb');       // e.g. mecallaghan_bisdb
define('DB_USER', 'me_callaghan_Wura');       // e.g. mecallaghan_bisuser
define('DB_PASS', 'ceilidh2024');
define('DB_CHARSET', 'utf8mb4');

function get_db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf('mysql:host=%s;dbname=%s;charset=%s', DB_HOST, DB_NAME, DB_CHARSET);
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_NUM,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    }
    return $pdo;
}
