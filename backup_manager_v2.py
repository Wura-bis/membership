#!/usr/bin/env python3
"""
IMPROVED DATABASE BACKUP SYSTEM - Version 2
Fixes Problems #1, #2, #3, #7
- Configurable backup location
- Configurable retention policy
- Automatic integrity checking
- Organized backup folders
"""

import sqlite3
import shutil
import os
from datetime import datetime, timedelta
import logging
import zipfile
import hashlib

# Setup logging with UTF-8 encoding
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('backup.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class AdvancedBackupManager:
    """Advanced database backup manager with integrity checks"""
    
    def __init__(self, db_path='BISMembershipDatabase.db'):
        self.db_path = db_path
        self.get_backup_settings()
    
    def get_backup_settings(self):
        """Get all backup settings from database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get backup location
            cursor.execute(
                "SELECT SettingValue FROM Settings WHERE SettingKey = 'backupLocation'"
            )
            result = cursor.fetchone()
            self.backup_folder = result[0] if result and result[0] else 'backups'
            
            # Get backup frequency
            cursor.execute(
                "SELECT SettingValue FROM Settings WHERE SettingKey = 'backupFrequency'"
            )
            result = cursor.fetchone()
            self.frequency = result[0].lower() if result else 'daily'
            
            # Get retention count
            cursor.execute(
                "SELECT SettingValue FROM Settings WHERE SettingKey = 'backupRetentionCount'"
            )
            result = cursor.fetchone()
            self.retention_count = int(result[0]) if result and result[0] else 10
            
            # Get retention days
            cursor.execute(
                "SELECT SettingValue FROM Settings WHERE SettingKey = 'backupRetentionDays'"
            )
            result = cursor.fetchone()
            self.retention_days = int(result[0]) if result and result[0] else 30
            
            # Get compression enabled
            cursor.execute(
                "SELECT SettingValue FROM Settings WHERE SettingKey = 'backupCompressionEnabled'"
            )
            result = cursor.fetchone()
            self.compression_enabled = result[0].lower() == 'true' if result else True
            
            conn.close()
            
        except Exception as e:
            logger.warning(f"Using default settings: {e}")
            self.backup_folder = 'backups'
            self.frequency = 'daily'
            self.retention_count = 10
            self.retention_days = 30
            self.compression_enabled = True
        
        # Create backup folder if it doesn't exist
        os.makedirs(self.backup_folder, exist_ok=True)
    
    def should_backup(self):
        """Check if a backup should be performed"""
        backup_files = self._get_backup_files()
        
        if not backup_files:
            logger.info("No previous backups found, creating initial backup")
            return True
        
        most_recent = max(backup_files, key=lambda f: os.path.getmtime(f))
        last_backup_time = datetime.fromtimestamp(os.path.getmtime(most_recent))
        now = datetime.now()
        
        if self.frequency == 'hourly':
            return (now - last_backup_time) >= timedelta(hours=1)
        elif self.frequency == 'daily':
            return (now - last_backup_time) >= timedelta(days=1)
        elif self.frequency == 'weekly':
            return (now - last_backup_time) >= timedelta(weeks=1)
        elif self.frequency == 'monthly':
            return (now - last_backup_time) >= timedelta(days=30)
        
        return False
    
    def _get_backup_files(self):
        """Get list of backup files"""
        try:
            backup_files = []
            for file in os.listdir(self.backup_folder):
                if file.startswith('BISMembershipDatabase_backup_') and (file.endswith('.db') or file.endswith('.zip')):
                    backup_files.append(os.path.join(self.backup_folder, file))
            return backup_files
        except:
            return []
    
    def _calculate_checksum(self, filepath):
        """Calculate SHA256 checksum of a file"""
        sha256_hash = hashlib.sha256()
        try:
            with open(filepath, "rb") as f:
                for byte_block in iter(lambda: f.read(4096), b""):
                    sha256_hash.update(byte_block)
            return sha256_hash.hexdigest()
        except Exception as e:
            logger.error(f"Error calculating checksum: {e}")
            return None
    
    def _verify_backup_integrity(self, backup_path):
        """Verify backup file integrity"""
        try:
            if backup_path.endswith('.zip'):
                # Verify ZIP integrity
                with zipfile.ZipFile(backup_path, 'r') as z:
                    result = z.testzip()
                    if result is None:
                        logger.info(f"ZIP integrity check passed: {os.path.basename(backup_path)}")
                        return True
                    else:
                        logger.error(f"ZIP integrity check failed: {result}")
                        return False
            else:
                # Verify SQLite database integrity
                conn = sqlite3.connect(backup_path)
                cursor = conn.cursor()
                cursor.execute("PRAGMA integrity_check")
                result = cursor.fetchone()[0]
                conn.close()
                
                if result == 'ok':
                    logger.info(f"Database integrity check passed: {os.path.basename(backup_path)}")
                    return True
                else:
                    logger.error(f"Database integrity check failed: {result}")
                    return False
        except Exception as e:
            logger.error(f"Error verifying backup integrity: {e}")
            return False
    
    def create_backup(self):
        """Create a backup with compression and integrity check"""
        try:
            if not os.path.exists(self.db_path):
                logger.error(f"Database not found: {self.db_path}")
                return False
            
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Create backup filename
            if self.compression_enabled:
                backup_filename = f"BISMembershipDatabase_backup_{timestamp}.zip"
            else:
                backup_filename = f"BISMembershipDatabase_backup_{timestamp}.db"
            
            backup_path = os.path.join(self.backup_folder, backup_filename)
            
            # Create backup
            if self.compression_enabled:
                # Create compressed backup
                with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as z:
                    z.write(self.db_path, arcname=os.path.basename(self.db_path))
            else:
                # Create uncompressed backup
                conn = sqlite3.connect(self.db_path)
                backup_conn = sqlite3.connect(backup_path)
                with backup_conn:
                    conn.backup(backup_conn)
                conn.close()
                backup_conn.close()
            
            # Verify backup integrity
            if not self._verify_backup_integrity(backup_path):
                os.remove(backup_path)
                logger.error("Backup integrity check failed, backup removed")
                return False
            
            # Calculate and log checksum
            checksum = self._calculate_checksum(backup_path)
            backup_size = os.path.getsize(backup_path) / (1024 * 1024)  # MB
            
            logger.info(f"Backup created: {backup_filename} ({backup_size:.2f} MB)")
            if checksum:
                logger.info(f"SHA256: {checksum}")
            
            # Cleanup old backups
            self._cleanup_old_backups()
            
            return True
            
        except Exception as e:
            logger.error(f"Error creating backup: {e}")
            return False
    
    def _cleanup_old_backups(self):
        """Remove old backups based on retention policy"""
        try:
            backup_files = self._get_backup_files()
            
            # Sort by modification time
            sorted_files = sorted(backup_files, key=os.path.getmtime, reverse=True)
            
            # Remove if exceeds retention count
            if len(sorted_files) > self.retention_count:
                files_to_remove = sorted_files[self.retention_count:]
                for file in files_to_remove:
                    os.remove(file)
                    logger.info(f"Removed old backup: {os.path.basename(file)} (retention count exceeded)")
            
            # Remove if older than retention days
            cutoff_date = datetime.now() - timedelta(days=self.retention_days)
            for file in sorted_files:
                file_date = datetime.fromtimestamp(os.path.getmtime(file))
                if file_date < cutoff_date:
                    os.remove(file)
                    logger.info(f"Removed old backup: {os.path.basename(file)} (older than {self.retention_days} days)")
                    
        except Exception as e:
            logger.error(f"Error cleaning up old backups: {e}")
    
    def run(self):
        """Run the backup manager"""
        logger.info("=" * 70)
        logger.info(" DATABASE BACKUP MANAGER v2")
        logger.info("=" * 70)
        logger.info(f"Backup location: {os.path.abspath(self.backup_folder)}")
        logger.info(f"Backup frequency: {self.frequency}")
        logger.info(f"Retention: {self.retention_count} backups or {self.retention_days} days")
        logger.info(f"Compression: {'Enabled' if self.compression_enabled else 'Disabled'}")
        
        if self.should_backup():
            logger.info("Creating backup...")
            return self.create_backup()
        else:
            logger.info("No backup needed at this time")
            return True

def main():
    """Main entry point"""
    import sys
    db_path = sys.argv[1] if len(sys.argv) > 1 else 'BISMembershipDatabase.db'
    
    manager = AdvancedBackupManager(db_path)
    success = manager.run()
    
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
