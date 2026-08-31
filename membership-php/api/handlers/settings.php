<?php
$DEFAULT_SETTINGS = [
    'systemName'         => 'BIS Membership System',
    'adminEmail'         => '',
    'maxUploadSize'      => '10',
    'autoApproval'       => false,
    'emailNotifications' => true,
    'maintenanceMode'    => false,
    'publicRegistration' => true,
    'defaultRole'        => 'public',
    'sessionTimeout'     => '30',
    'backupFrequency'    => 'daily',
    'contactEmail'       => '',
    'contactPhone'       => '',
    'contactHours'       => '',
];

$BOOL_SETTINGS = ['autoApproval', 'emailNotifications', 'maintenanceMode', 'publicRegistration'];

function get_settings_handler(): void {
    global $DEFAULT_SETTINGS, $BOOL_SETTINGS;
    require_admin();
    $db = get_db();
    $settings = $DEFAULT_SETTINGS;
    try {
        $rows = $db->query('SELECT SettingKey, SettingValue FROM Settings')->fetchAll();
        foreach ($rows as $r) {
            $key = $r[0];
            $val = $r[1];
            if (in_array($key, $BOOL_SETTINGS)) {
                $val = ($val === 'true' || $val === '1');
            }
            $settings[$key] = $val;
        }
    } catch (Exception $e) {}
    json_out($settings);
}

function update_settings_handler(): void {
    global $BOOL_SETTINGS;
    require_admin();
    $data = get_body();
    if (!$data) json_out(['error' => 'No settings data'], 400);

    $db = get_db();
    try {
        foreach ($data as $key => $value) {
            if (in_array($key, $BOOL_SETTINGS) || is_bool($value)) {
                $value = $value ? 'true' : 'false';
            }
            $s = $db->prepare('SELECT SettingID FROM Settings WHERE SettingKey = ?');
            $s->execute([$key]);
            if ($s->fetch()) {
                $db->prepare('UPDATE Settings SET SettingValue = ? WHERE SettingKey = ?')->execute([$value, $key]);
            } else {
                $db->prepare('INSERT INTO Settings (SettingKey, SettingValue) VALUES (?,?)')->execute([$key, $value]);
            }
        }
        json_out(['success' => true]);
    } catch (Exception $e) {
        error_log('Settings update error: ' . $e->getMessage());
        json_out(['error' => 'Failed to save settings: ' . $e->getMessage()], 500);
    }
}

function get_contact_info_handler(): void {
    $keys     = ['contactEmail', 'contactPhone', 'contactHours'];
    $defaults = ['contactEmail' => '', 'contactPhone' => '', 'contactHours' => ''];
    $db = get_db();
    try {
        $ph   = implode(',', array_fill(0, count($keys), '?'));
        $stmt = $db->prepare("SELECT SettingKey, SettingValue FROM Settings WHERE SettingKey IN ($ph)");
        $stmt->execute($keys);
        foreach ($stmt->fetchAll() as $r) $defaults[$r[0]] = $r[1];
    } catch (Exception $e) {}
    json_out($defaults);
}

function update_single_setting_handler(string $key): void {
    require_admin();
    $data  = get_body();
    $value = $data['value'] ?? '';

    $db = get_db();
    try {
        $s = $db->prepare('SELECT SettingID FROM Settings WHERE SettingKey = ?');
        $s->execute([$key]);
        if ($s->fetch()) {
            $db->prepare('UPDATE Settings SET SettingValue = ? WHERE SettingKey = ?')->execute([$value, $key]);
        } else {
            $db->prepare('INSERT INTO Settings (SettingKey, SettingValue) VALUES (?,?)')->execute([$key, $value]);
        }
        json_out(['success' => true]);
    } catch (Exception $e) {
        json_out(['error' => 'Failed to update setting'], 500);
    }
}
