<?php
function submit_support_handler(): void {
    $user = require_auth();
    $data = get_body();
    $subject  = trim($data['subject'] ?? $data['title'] ?? '');
    $message  = trim($data['message'] ?? $data['description'] ?? '');
    $priority = in_array($data['priority'] ?? '', ['normal','high','urgent']) ? $data['priority'] : 'normal';
    if (!$message) json_out(['error' => 'Message is required'], 400);

    $db = get_db();
    try {
        $db->prepare('INSERT INTO SupportTickets (UserID, Subject, Message, Status, Priority) VALUES (?,?,?,\'open\',?)')
           ->execute([$user['id'], $subject, $message, $priority]);
        $ticket_id = (int)$db->lastInsertId();

        try {
            $db->prepare('INSERT INTO AdminNotifications (Type, Title, Body, ReferenceID) VALUES (?,?,?,?)')
               ->execute(['support_ticket', 'New Support Ticket', "From {$user['username']}: {$subject}", $ticket_id]);
        } catch (Exception $e) {}

        json_out(['success' => true, 'ticket_id' => $ticket_id], 201);
    } catch (Exception $e) {
        error_log('SupportTickets INSERT error: ' . $e->getMessage());
        json_out(['error' => 'Failed to submit support ticket: ' . $e->getMessage()], 500);
    }
}

function get_support_handler(): void {
    require_admin();
    $db = get_db();
    try {
        $stmt = $db->query('SELECT t.TicketID, t.UserID, u.Username, u.Email, t.Subject, t.Message, t.Status, t.AdminResponse, t.CreatedAt, t.Priority FROM SupportTickets t LEFT JOIN User u ON t.UserID = u.UserID ORDER BY t.CreatedAt DESC');
        $out  = [];
        foreach ($stmt->fetchAll() as $r) {
            $out[] = [
                'ticket_id'      => $r[0],
                'id'             => $r[0],
                'userId'         => $r[1],
                'user_name'      => $r[2] ?? '',
                'username'       => $r[2] ?? '',
                'user_email'     => $r[3] ?? '',
                'subject'        => $r[4],
                'message'        => $r[5],
                'status'         => $r[6],
                'priority'       => $r[9] ?? 'normal',
                'admin_response' => $r[7],
                'adminResponse'  => $r[7],
                'date_created'   => $r[8] ? substr((string)$r[8], 0, 19) : null,
                'createdAt'      => format_date($r[8]),
            ];
        }
        json_out(['tickets' => $out]);
    } catch (Exception $e) {
        error_log('SupportTickets SELECT error: ' . $e->getMessage());
        json_out(['tickets' => []]);
    }
}

function get_all_tickets_handler(): void { get_support_handler(); }

function get_my_tickets_handler(): void {
    $user = require_auth();
    $db   = get_db();
    try {
        $stmt = $db->prepare('SELECT TicketID, Subject, Message, Status, AdminResponse, CreatedAt, Priority FROM SupportTickets WHERE UserID = ? ORDER BY CreatedAt DESC');
        $stmt->execute([$user['id']]);
        $out = [];
        foreach ($stmt->fetchAll() as $r) {
            $out[] = [
                'ticket_id'      => $r[0],
                'id'             => $r[0],
                'subject'        => $r[1],
                'message'        => $r[2],
                'status'         => $r[3],
                'priority'       => $r[6] ?? 'normal',
                'admin_response' => $r[4],
                'adminResponse'  => $r[4],
                'date_created'   => $r[5] ? substr((string)$r[5], 0, 19) : null,
                'createdAt'      => format_date($r[5]),
            ];
        }
        json_out(['tickets' => $out]);
    } catch (Exception $e) {
        error_log('SupportTickets my-tickets error: ' . $e->getMessage());
        json_out(['tickets' => []]);
    }
}

function update_ticket_handler(int $ticket_id): void {
    require_admin();
    $data     = get_body();
    $status   = $data['status']                                  ?? null;
    $resp     = $data['adminResponse'] ?? $data['admin_response'] ?? null;
    $priority = in_array($data['priority'] ?? '', ['normal','high','urgent']) ? $data['priority'] : null;

    $db = get_db();
    $parts  = ['Status = ?', 'AdminResponse = ?'];
    $params = [$status, $resp];
    if ($priority !== null) { $parts[] = 'Priority = ?'; $params[] = $priority; }
    $params[] = $ticket_id;
    $db->prepare('UPDATE SupportTickets SET ' . implode(', ', $parts) . ' WHERE TicketID = ?')->execute($params);
    json_out(['success' => true]);
}
