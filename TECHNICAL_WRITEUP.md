# BIS Membership System — Technical Overview

**Prepared for:** Proposed SQL/MySQL Server Host  
**Date:** May 2026

---

## 1. Frontend Application

The member-facing and administrative interface is built as a **React 19** single-page application, bundled with **Vite 7**. Page routing is handled by **React Router 7**, allowing the app to navigate between the member directory, admin dashboard, and settings pages without full page reloads. Charts and statistics on the dashboard are rendered using **Recharts**, and icons throughout the interface come from the **Lucide React** library. Styling is done with **Tailwind CSS 4** alongside custom inline styles for component-level layout. The frontend communicates with the backend exclusively through a REST API using the browser's built-in Fetch API, with session cookies maintained for authentication.

The application has three access tiers:

- **Public** — An open member directory accessible without login, showing limited member information available to anyone visiting the site.
- **Member (Private)** — Authenticated members can view full member profiles and detailed records but cannot make changes. This view is read-only.
- **Admin** — Administrators have full edit access: adding and updating member records, managing lookups, performing bulk imports, running reports, and configuring the system. All admin routes enforce a role check at the component level, redirecting non-admin users automatically.

---

## 2. Backend & Current Database Structure

The backend is a **Python 3 Flask** application that exposes a RESTful API consumed by the React frontend. Authentication is session-based, managed entirely server-side.

The current database is **SQLite** (a single portable file: `BISMembershipDatabase.db`), which was chosen during development for its simplicity — no server installation required. The schema consists of **34 tables**. The core tables are:

| Table | Purpose |
|---|---|
| `Members` | Central member records (25 columns: name, DOB, email, phone, category, county, etc.) |
| `MemberAddress` | Member address history with current-address flag |
| `MemberCategory` | Membership types (Active, Honorary, Inactive, Historical/Deceased) |
| `IrishCounties` | 32 Irish county lookup |
| `Roles` | Member role assignments per fiscal year |
| `FiscalYear` | Society fiscal year periods |
| `Society` | Affiliated societies |
| `Occupations`, `Connections`, `VolunteeringInterests` | Supplemental member profile lookups |
| `Provinces` | Global province/state lookup (195+ countries) |
| `AuditLog` | Tracks all record changes with timestamp and user |
| `Recognitions`, `RecognitionType` | Awards and honours tracking |
| `AdminUsers` | System admin credentials |

The current live dataset holds approximately **207 member records**, accumulated from the society's MS Access database and entered manually since launch.

---

## 3. Data Migration Plan — MS Access to MySQL

The 207 existing member records are currently held in a **Microsoft Access database (.accdb)**. The migration to the hosted MySQL server will proceed in the following steps:

1. **Export from Access** — Export each relevant table from the Access database to CSV format using Access's built-in export tool.

2. **Import into current system** — Use the web application's built-in **Bulk Import** feature to load member records directly from the Excel worksheet (or a CSV export) into the SQLite database. This validates each record (checking for duplicates, required fields, and date formats) before committing.

3. **Schema conversion** — Once all 207 members are confirmed in the SQLite system, the schema will be ported to **MySQL**. SQLite data types map cleanly: `INTEGER` → `INT`, `TEXT` → `VARCHAR`/`TEXT`, `BOOLEAN` → `TINYINT(1)`, `REAL` → `DECIMAL`. Foreign keys and indexes will be recreated from the existing schema.

4. **Data export from SQLite** — A one-time export script (Python, using `sqlite3` → `mysql-connector-python`) will read each table and INSERT the rows into MySQL, preserving all primary keys and foreign key relationships.

5. **Backend switchover** — The Flask backend's database connection will be updated from `sqlite3` to `mysql-connector-python` (or `PyMySQL`). Connection parameters (host, port, database name, credentials) will be supplied via environment variables. Parameter binding syntax changes from `?` to `%s` for MySQL, and a small number of SQLite-specific functions (e.g. `INSTR`) will be replaced with MySQL equivalents.

6. **Testing & validation** — Row counts, spot-check queries, and a full run of the admin interface will confirm data integrity before the SQLite file is retired.

**Estimated timeline:** 1 week for schema port and data migration, 1 week for backend switchover and testing.

**MySQL server requirements:** MySQL 8.0+, UTF-8 collation (`utf8mb4_unicode_ci`), a dedicated database user with SELECT/INSERT/UPDATE/DELETE privileges on the `bis_membership` database, and port 3306 accessible from the Flask application server.

---

*This system was built and is maintained in-house. Source code is version-controlled in a private Git repository.*
