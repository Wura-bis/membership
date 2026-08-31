"""
Generate a MySQL-compatible SQL dump from BISMembershipDatabase.db.
Produces bis_membership.sql — give this file to the consultant to import.

Run from the repo root:
    python generate_mysql_dump.py
"""
import sqlite3
from pathlib import Path
from datetime import datetime

DB_PATH = Path(__file__).parent / "BISMembershipDatabase.db"
OUT_PATH = Path(__file__).parent / "bis_membership.sql"

# MySQL CREATE TABLE definitions (converted from SQLite schema)
SCHEMA = """
CREATE TABLE IF NOT EXISTS `Admin` (
    `AdminID` INT,
    `UserID` INT,
    `PasswordHash` TEXT,
    `Email` VARCHAR(255),
    `LastLogin` VARCHAR(50),
    `IsApproved` TINYINT(1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AssetType` (
    `AssetTypeID` INT AUTO_INCREMENT PRIMARY KEY,
    `AssetName` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Assets` (
    `AssetID` INT,
    `SocietyID` INT,
    `AssetTypeID` INT,
    `AssetName` VARCHAR(255),
    `Description` TEXT,
    `AcquiredDate` DATE,
    `Quantity` INT,
    `Status` VARCHAR(50),
    `Notes` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `AuditLog` (
    `AuditLogID` INT AUTO_INCREMENT PRIMARY KEY,
    `UserID` INT,
    `Action` TEXT NOT NULL,
    `TableName` VARCHAR(100),
    `RecordID` INT,
    `Details` TEXT,
    `Timestamp` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `FiscalYear` (
    `FiscalYearID` INT AUTO_INCREMENT PRIMARY KEY,
    `YearLabel` VARCHAR(20) UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `FiscalYears` (
    `FiscalYearID` INT PRIMARY KEY,
    `FiscalYear` VARCHAR(20),
    `StartDate` DATE,
    `EndDate` DATE,
    `IsActive` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `IrishConnectionByCounty` (
    `ID` INT,
    `MemberID` INT,
    `CountyID` INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `IrishConnectionBySurname` (
    `ID` INT,
    `MemberID` INT,
    `SurnameID` INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `IrishCounties` (
    `CountyID` INT AUTO_INCREMENT PRIMARY KEY,
    `CountyName` VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `IrishSurnames` (
    `SurnameID` INT AUTO_INCREMENT PRIMARY KEY,
    `Surname` VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `IssueLog` (
    `IssueID` INT AUTO_INCREMENT PRIMARY KEY,
    `DateFixed` VARCHAR(50) NOT NULL,
    `Category` VARCHAR(100) NOT NULL,
    `Severity` VARCHAR(20) NOT NULL,
    `Title` VARCHAR(255) NOT NULL,
    `RootCause` TEXT,
    `Fix` TEXT,
    `AffectedFile` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `MemberAddress` (
    `MemberAddressID` INT,
    `MemberID` INT,
    `Street` VARCHAR(255),
    `City` VARCHAR(100),
    `ProvinceID` INT,
    `CountryID` VARCHAR(100),
    `PostalCode` VARCHAR(20),
    `FiscalYearID` INT,
    `IsCurrent` TINYINT(1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `MemberCategories` (
    `CategoryID` INT PRIMARY KEY,
    `CategoryName` VARCHAR(100),
    `Description` TEXT,
    `AnnualFee` DECIMAL(10,2),
    `IsActive` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `MemberCategory` (
    `CategoryID` INT PRIMARY KEY,
    `CategoryName` VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `MemberPhoneNumbers` (
    `PhoneID` INT AUTO_INCREMENT PRIMARY KEY,
    `MemberID` INT,
    `PhoneType` VARCHAR(20),
    `PhoneNumber` VARCHAR(50),
    `IsPreferred` TINYINT(1),
    `CreatedAt` DATETIME,
    `UpdatedAt` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `MemberRecognitions` (
    `RecognitionID` INT AUTO_INCREMENT PRIMARY KEY,
    `MemberID` INT,
    `RecognitionTypeID` INT,
    `AwardedDate` DATE,
    `AwardedBy` VARCHAR(100),
    `Notes` TEXT,
    `IsActive` TINYINT(1),
    `CreatedAt` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `MemberRole` (
    `MemberRoleID` INT,
    `MemberID` INT,
    `RoleID` INT,
    `FiscalYearID` INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Members` (
    `MemberID` INT NOT NULL AUTO_INCREMENT,
    `FirstName` VARCHAR(100),
    `LastName` VARCHAR(100),
    `Email` VARCHAR(255),
    `PhoneNumber` VARCHAR(50),
    `Place of Birth` VARCHAR(100),
    `Date of Birth` DATE,
    `MemberCategoryID` INT,
    `CountyID` INT,
    `SurnameID` INT,
    `OccupationID` INT,
    `Photos` TEXT,
    `Notes` TEXT,
    `IsActive` TINYINT(1) DEFAULT 0,
    `OtherSocieties` TEXT,
    `DateJoined` DATE,
    `DateEnded` DATE,
    `ApplicationDate` DATE,
    `Approval Date` DATE,
    `ApprovedBy` VARCHAR(100),
    `SignedBy` VARCHAR(100),
    `Proposer` VARCHAR(100),
    `Seconder` VARCHAR(100),
    `ProposalDate` DATE,
    `CreatedAt` DATETIME,
    PRIMARY KEY (`MemberID`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Notification` (
    `NotificationID` INT,
    `UserID` INT,
    `Message` TEXT,
    `DateCreated` DATETIME,
    `IsRead` TINYINT(1),
    `Type` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Occupation` (
    `OccupationID` INT AUTO_INCREMENT PRIMARY KEY,
    `OccupationName` VARCHAR(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Provinces` (
    `ProvinceID` INT AUTO_INCREMENT PRIMARY KEY,
    `ProvinceName` VARCHAR(255) NOT NULL,
    `CountryCode` VARCHAR(10) NOT NULL,
    `CountryName` VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `RecognitionType` (
    `RecognitionTypeID` INT AUTO_INCREMENT PRIMARY KEY,
    `TypeName` VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `RecognitionTypes` (
    `RecognitionTypeID` INT AUTO_INCREMENT PRIMARY KEY,
    `Name` VARCHAR(255) NOT NULL,
    `Description` TEXT,
    `Category` VARCHAR(50),
    `Icon` VARCHAR(50),
    `IsActive` TINYINT(1) DEFAULT 1,
    `CreatedAt` VARCHAR(50),
    `CreatedBy` VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Recognitions` (
    `RecognitionID` INT,
    `SocietyID` INT,
    `RecognitionTypeID` INT,
    `FiscalYearID` INT,
    `Description` TEXT,
    `IsActive` TINYINT(1),
    `DateAwarded` DATE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Role` (
    `RoleID` INT AUTO_INCREMENT PRIMARY KEY,
    `RoleName` VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Settings` (
    `SettingID` INT AUTO_INCREMENT PRIMARY KEY,
    `SettingKey` VARCHAR(100),
    `SettingValue` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Society` (
    `SocietyID` INT AUTO_INCREMENT PRIMARY KEY,
    `SocietyName` VARCHAR(255),
    `Description` TEXT,
    `FoundedDate` DATE,
    `IncorporatedDate` DATE,
    `CharityNumber` VARCHAR(50),
    `Non-profitNumber` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Stats` (
    `StatID` INT AUTO_INCREMENT PRIMARY KEY,
    `StatType` VARCHAR(100),
    `StatValue` TEXT,
    `FiscalYear` VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SupportMessage` (
    `SupportID` INT,
    `UserID` INT,
    `Subject` VARCHAR(255),
    `MessageBody` TEXT,
    `DateSubmitted` DATETIME,
    `Status` VARCHAR(50)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `SupportTickets` (
    `TicketID` INT AUTO_INCREMENT PRIMARY KEY,
    `UserID` INT NOT NULL,
    `Subject` VARCHAR(255) NOT NULL,
    `Message` TEXT NOT NULL,
    `Priority` VARCHAR(20) DEFAULT 'normal',
    `Status` VARCHAR(20) DEFAULT 'open',
    `DateCreated` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `DateUpdated` DATETIME,
    `AdminResponse` TEXT,
    `AdminUserID` INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `User` (
    `UserID` INT AUTO_INCREMENT PRIMARY KEY,
    `Username` VARCHAR(100),
    `FirstName` VARCHAR(100),
    `Last Name` VARCHAR(100),
    `Email` VARCHAR(255),
    `PasswordHash` TEXT,
    `Role` VARCHAR(50),
    `IsApproved` TINYINT(1),
    `CreatedAt` VARCHAR(50),
    `LastLogin` VARCHAR(50),
    `ResetToken` VARCHAR(255),
    `ResetRequestedAt` VARCHAR(50),
    `Preferences` TEXT,
    `Photo` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `UserDefinedField` (
    `FieldID` INT AUTO_INCREMENT PRIMARY KEY,
    `FieldLabel` VARCHAR(255) NOT NULL,
    `FieldType` VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `UserDefinedFieldValue` (
    `ValueID` INT AUTO_INCREMENT PRIMARY KEY,
    `FieldID` INT,
    `MemberID` INT,
    `ValueText` TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

# Tables to export data for (in safe order — no FK deps enforced but logical grouping)
EXPORT_ORDER = [
    "MemberCategory", "MemberCategories", "IrishCounties", "IrishSurnames",
    "FiscalYear", "FiscalYears", "Role", "Occupation", "RecognitionType",
    "RecognitionTypes", "Society", "AssetType", "Provinces", "Settings",
    "UserDefinedField", "Admin", "User",
    "Members", "MemberAddress", "MemberPhoneNumbers", "MemberRole",
    "MemberRecognitions", "IrishConnectionByCounty", "IrishConnectionBySurname",
    "AuditLog", "IssueLog", "Notification", "Assets", "Recognitions",
    "SupportMessage", "SupportTickets", "Stats", "UserDefinedFieldValue",
]


def escape(val):
    """Escape a value for safe insertion into a MySQL INSERT statement."""
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    s = str(val)
    s = s.replace("\\", "\\\\")
    s = s.replace("'", "\\'")
    s = s.replace("\n", "\\n")
    s = s.replace("\r", "\\r")
    s = s.replace("\x00", "")
    return f"'{s}'"


def export_table(cursor, table):
    lines = []
    try:
        cursor.execute(f"SELECT * FROM [{table}]")
        rows = cursor.fetchall()
        if not rows:
            return lines
        cols = [d[0] for d in cursor.description]
        col_str = ", ".join(f"`{c}`" for c in cols)
        # Batch into chunks of 100 rows per INSERT
        chunk_size = 100
        for i in range(0, len(rows), chunk_size):
            chunk = rows[i:i + chunk_size]
            val_rows = []
            for row in chunk:
                vals = ", ".join(escape(v) for v in row)
                val_rows.append(f"({vals})")
            lines.append(
                f"INSERT INTO `{table}` ({col_str}) VALUES\n"
                + ",\n".join(val_rows) + ";"
            )
        print(f"  {table}: {len(rows)} rows")
    except Exception as e:
        print(f"  WARNING: Could not export {table}: {e}")
    return lines


def main():
    if not DB_PATH.exists():
        print(f"ERROR: Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        # Header
        f.write(f"-- BIS Membership System — MySQL dump\n")
        f.write(f"-- Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"-- Source: {DB_PATH.name}\n\n")

        f.write("CREATE DATABASE IF NOT EXISTS `bis_membership`\n")
        f.write("  DEFAULT CHARACTER SET utf8mb4\n")
        f.write("  COLLATE utf8mb4_unicode_ci;\n\n")
        f.write("USE `bis_membership`;\n\n")

        f.write("SET FOREIGN_KEY_CHECKS = 0;\n\n")

        # Schema
        f.write("-- ── SCHEMA ─────────────────────────────────────────────\n\n")
        f.write(SCHEMA.strip())
        f.write("\n\n")

        # Data
        f.write("-- ── DATA ───────────────────────────────────────────────\n\n")
        print("Exporting tables:")
        for table in EXPORT_ORDER:
            lines = export_table(cursor, table)
            if lines:
                f.write(f"-- {table}\n")
                f.write("\n".join(lines))
                f.write("\n\n")

        f.write("SET FOREIGN_KEY_CHECKS = 1;\n")

    conn.close()
    print(f"\nDone. Dump written to: {OUT_PATH.name}")
    print("Give bis_membership.sql to the consultant.")
    print("They import it with:  mysql -u root -p < bis_membership.sql")


if __name__ == "__main__":
    main()
