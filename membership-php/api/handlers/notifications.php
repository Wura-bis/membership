<?php
function get_notifications_handler(): void {
    require_admin();
    $db = get_db();
    try {
        $stmt = $db->query('SELECT NotificationID, Type, Title, Body, ReferenceID, IsRead, CreatedAt FROM AdminNotifications ORDER BY CreatedAt DESC LIMIT 50');
        $out  = [];
        foreach ($stmt->fetchAll() as $r) {
            $out[] = [
                'id'          => (int)$r[0],
                'type'        => $r[1],
                'title'       => $r[2],
                'body'        => $r[3] ?? '',
                'referenceId' => $r[4] !== null ? (int)$r[4] : null,
                'isRead'      => (bool)(int)$r[5],
                'createdAt'   => $r[6] ? substr((string)$r[6], 0, 19) : null,
            ];
        }
        $unread = count(array_filter($out, fn($n) => !$n['isRead']));
        json_out(['notifications' => $out, 'unread' => $unread]);
    } catch (Exception $e) {
        json_out(['notifications' => [], 'unread' => 0]);
    }
}

function mark_notification_read_handler(int $id): void {
    require_admin();
    try {
        get_db()->prepare('UPDATE AdminNotifications SET IsRead = 1 WHERE NotificationID = ?')->execute([$id]);
    } catch (Exception $e) {}
    json_out(['success' => true]);
}

function mark_all_notifications_read_handler(): void {
    require_admin();
    try {
        get_db()->exec('UPDATE AdminNotifications SET IsRead = 1');
    } catch (Exception $e) {}
    json_out(['success' => true]);
}
