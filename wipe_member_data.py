"""
Wipe all test member data from BISMembershipDatabase.db.
Keeps all lookup tables, admin/user accounts, and system settings.
Creates a timestamped backup before wiping.

Run from the repo root:
    python wipe_member_data.py
"""
import sqlite3
import shutil
from datetime import datetime
from pathlib import Path

DB_PATH = Path(__file__).parent / "BISMembershipDatabase.db"
BACKUP_PATH = Path(__file__).parent / f"BISMembershipDatabase_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.db"

TABLES_TO_WIPE = [
    "MemberPhoneNumbers",
    "MemberRecognitions",
    "MemberRole",
    "IrishConnectionByCounty",
    "IrishConnectionBySurname",
    "IrishSurnames",
    "MemberAddress",
    "UserDefinedFieldValue",
    "AuditLog",
    "IssueLog",
    "SupportMessage",
    "SupportTickets",
    "Members",
]

def main():
    if not DB_PATH.exists():
        print(f"ERROR: Database not found at {DB_PATH}")
        return

    # Backup first
    shutil.copy2(DB_PATH, BACKUP_PATH)
    print(f"Backup created: {BACKUP_PATH.name}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("\nWiping tables:")
    for table in TABLES_TO_WIPE:
        cursor.execute(f"DELETE FROM [{table}]")
        print(f"  {table}: {cursor.rowcount} rows deleted")

    # Reset auto-increment counters for wiped tables
    cursor.execute("""
        DELETE FROM sqlite_sequence
        WHERE name IN ({})
    """.format(",".join(f"'{t}'" for t in TABLES_TO_WIPE)))
    print(f"\nReset {cursor.rowcount} auto-increment sequence(s)")

    conn.commit()
    conn.close()

    # Verify
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    print("\nVerification — row counts after wipe:")
    for table in TABLES_TO_WIPE:
        cursor.execute(f"SELECT COUNT(*) FROM [{table}]")
        count = cursor.fetchone()[0]
        status = "OK" if count == 0 else f"WARNING: {count} rows remain"
        print(f"  {table}: {status}")
    conn.close()

    print("\nDone. Database is clean and ready for re-import.")
    print(f"If anything went wrong, restore from: {BACKUP_PATH.name}")

if __name__ == "__main__":
    confirm = input("This will DELETE all member data. Type YES to continue: ")
    if confirm.strip() == "YES":
        main()
    else:
        print("Aborted.")
