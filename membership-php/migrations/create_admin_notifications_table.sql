-- Run once on the MySQL database to create the admin notification system
CREATE TABLE IF NOT EXISTS AdminNotifications (
  NotificationID INT AUTO_INCREMENT PRIMARY KEY,
  Type           VARCHAR(50)  NOT NULL,
  Title          VARCHAR(255) NOT NULL,
  Body           TEXT,
  ReferenceID    INT          DEFAULT NULL,
  IsRead         TINYINT(1)   NOT NULL DEFAULT 0,
  CreatedAt      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
