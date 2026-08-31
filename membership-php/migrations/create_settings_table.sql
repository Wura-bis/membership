-- Run once on the MySQL database to create the Settings key-value store
CREATE TABLE IF NOT EXISTS Settings (
  SettingID   INT AUTO_INCREMENT PRIMARY KEY,
  SettingKey  VARCHAR(64)  NOT NULL UNIQUE,
  SettingValue TEXT,
  UpdatedAt   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed default values matching the frontend settings page keys
INSERT IGNORE INTO Settings (SettingKey, SettingValue) VALUES
  ('systemName',         'BIS Membership System'),
  ('adminEmail',         ''),
  ('maxUploadSize',      '10'),
  ('autoApproval',       'false'),
  ('emailNotifications', 'true'),
  ('maintenanceMode',    'false'),
  ('publicRegistration', 'true'),
  ('defaultRole',        'public'),
  ('sessionTimeout',     '30'),
  ('backupFrequency',    'daily'),
  ('contactEmail',       ''),
  ('contactPhone',       ''),
  ('contactHours',       '');
