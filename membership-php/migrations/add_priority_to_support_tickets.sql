-- Run this once on the MySQL database to add Priority support to SupportTickets
ALTER TABLE SupportTickets
  ADD COLUMN Priority VARCHAR(20) NOT NULL DEFAULT 'normal'
  AFTER Status;
