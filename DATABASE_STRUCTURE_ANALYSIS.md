# BIS Membership Database - Structure & Country/Province Analysis

## Executive Summary
This analysis explores the database structure of the BIS Membership Application, focusing on how countries and provinces are defined and used throughout the system.

---

## 1. PROVINCES TABLE STRUCTURE

### Database Schema
**Table Name:** `Provinces` (SQLite database)

**Columns:**
- `ProvinceID` (INTEGER, PRIMARY KEY)
- `ProvinceName` (TEXT) - Name of the state/province
- `CountryCode` (TEXT) - ISO 2-letter country code (e.g., "CA", "US", "IE")
- `CountryName` (TEXT) - Full country name (e.g., "Canada", "United States", "Ireland")

**Purpose:** Central lookup table that stores all provinces/states globally, organized by country.

### Current Countries in Database
The system supports **195+ countries and territories** worldwide, including:

**Primary focus countries:**
- Canada (provinces: ON, BC, AB, MB, SK, NS, NB, PE, NL, QC, YT, NT, NU)
- United States (all 50 states + DC)
- Ireland (all 32 counties)
- United Kingdom (England, Scotland, Wales, Northern Ireland)
- Australia, New Zealand

**Plus:** 190+ additional countries from Afghanistan to Zimbabwe, each with their respective provinces/states.

### Data Source
The `Province File.txt` in the root directory contains a comprehensive world provinces dataset with format:
```
CountryCode.ProvinceCode[TAB]ProvinceName[TAB]NormalizedName[TAB]GeonamesID
```

Example entries:
```
CA.ON	Ontario	Ontario	6091104
CA.BC	British Columbia	British Columbia	5909050
IE.01	Dublin	Dublin	2988507
US.CA	California	California	3687592
```

This file appears to be a source for populating the Provinces table but may not be fully imported yet.

---

## 2. BACKEND API - PROVINCES ENDPOINT

### Endpoint: `/api/lookups`
**Method:** GET  
**Authentication:** Not required (all users can access)  
**Response:** Returns all lookup tables including provinces

**Provinces Data Structure (JSON response):**
```json
{
  "provinces": [
    {
      "value": 1,
      "label": "Ontario",
      "countryCode": "CA",
      "countryName": "Canada"
    },
    {
      "value": 2,
      "label": "California",
      "countryCode": "US",
      "countryName": "United States"
    }
  ]
}
```

**Key Query:**
```sql
SELECT ProvinceID, ProvinceName, CountryCode, CountryName 
FROM Provinces 
ORDER BY CountryName, ProvinceName
```

This returns provinces sorted alphabetically by country, then by province name.

---

## 3. HARDCODED COUNTRY LIST (Frontend)

### Location: `memberform.jsx` (Line 352-375)

**Implementation:**
The frontend contains a **HARDCODED country list** of 195 countries used in address forms. This list is NOT dynamically fetched from the backend.

**Hardcoded Countries (in order):**
```javascript
const allCountries = [
  "Canada", "United States", "Ireland",  // Pinned first
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", 
  "Antigua and Barbuda", "Argentina", "Armenia", "Australia", "Austria",
  // ... (190+ more countries alphabetically)
  "Zimbabwe"
];
```

**Structure:**
- Primary countries (Canada, US, Ireland) pinned at top
- Remaining 192 countries in alphabetical order
- Total: 195 countries

**Issue:** If new countries need to be added or existing countries renamed, the code must be manually updated.

---

## 4. HOW COUNTRIES ARE USED THROUGHOUT THE SYSTEM

### Frontend Components Using Countries

#### A. Member Address Form (`memberform.jsx`)
**Location:** Address Information Card (Line 350-413)

**Features:**
1. **Country Dropdown:** User selects from hardcoded `allCountries` list
2. **Dynamic Province/State Loading:** Once country selected, province options are filtered from backend provinces
3. **Province Dropdown:** Shows only provinces matching selected country
   ```javascript
   const provinceOptions = (lookups.provinces || [])
     .filter(p => p.countryName === addr.country);
   ```

**Form Workflow:**
1. User selects address country from dropdown (hardcoded list)
2. JavaScript filters provinces table by matching `countryName`
3. User selects province/state from dynamically filtered dropdown
4. Data stored in `MemberAddress` table with:
   - `ProvinceID` (links to Provinces table)
   - `CountryID` field (currently stores country as text, see below)

#### B. Dashboard (`app.py` - Line 1747-1767)
**Purpose:** Display members by province and country statistics

**Query:**
```sql
SELECT p.ProvinceName, p.CountryName, p.CountryCode, COUNT(DISTINCT m.MemberID) as Count
FROM MemberAddress ma
JOIN Members m ON ma.MemberID = m.MemberID
JOIN Provinces p ON ma.ProvinceID = p.ProvinceID
WHERE ma.IsCurrent = 1 AND m.IsActive = 1
GROUP BY p.ProvinceName, p.CountryName, p.CountryCode
ORDER BY Count DESC
```

**Display:** Shows members grouped by province, with country code displayed

#### C. Member Detail View
**Backend Query:** Automatically resolves province name via JOIN with Provinces table

---

## 5. DATA MAPPING & STORAGE

### MemberAddress Table Storage
```sql
CREATE TABLE MemberAddress (
  MemberAddressID INTEGER PRIMARY KEY,
  MemberID INTEGER,
  Street TEXT,
  City TEXT,
  ProvinceID INTEGER,           -- Foreign key to Provinces table
  CountryID TEXT,               -- Stores as TEXT (legacy: country name or numeric ID)
  PostalCode TEXT,
  FiscalYearID INTEGER,
  IsCurrent BOOLEAN,
  FOREIGN KEY (ProvinceID) REFERENCES Provinces(ProvinceID)
);
```

### Country Storage Issue (Legacy Support)
The backend includes a **legacy country mapping** for backward compatibility:
```python
legacy_country_map = {
  '0': 'Canada',
  '1': 'Canada', 
  '2': 'United States',
  '3': 'Ireland',
  '4': 'United Kingdom',
  '5': 'Other'
}
```

**Problem:** Country is stored as text in `CountryID` field instead of having a proper numeric foreign key to a Countries table.

---

## 6. FRONTENDCOMPONENTS USING COUNTRY LIST

### Direct References in JSX Files

#### 1. **memberform.jsx** (Line 350-375)
   - Address information card
   - Country selection dropdown (hardcoded 195 countries)
   - Province selection dropdown (dynamic from backend)

#### 2. **member.jsx**
   - Displays member address information
   - Shows country from MemberAddress record

#### 3. **Other Admin Pages**
   - User management pages may reference countries in member displays
   - Stats/reports showing country distribution

---

## 7. WHERE COUNTRIES ARE DISPLAYED TO USERS

### 1. **Member Edit/Create Form**
   - **Component:** Address section of memberform.jsx
   - **Display:** Dropdown with all 195 hardcoded countries
   - **Interaction:** User selects country → provinces filter

### 2. **Member Directory/Search**
   - **Component:** Database result displays
   - **Display:** Country shown in member profile cards
   - **Source:** MemberAddress.CountryID field

### 3. **Dashboard Statistics**
   - **Component:** Dashboard charts and metrics
   - **Display:** "Members by Province" showing country codes and names
   - **Source:** Provinces table via JOIN with MemberAddress

### 4. **Reports & Exports**
   - **Component:** PDF/CSV export functions
   - **Display:** Country included in exported member records
   - **Source:** MemberAddress and Provinces tables

### 5. **Address Display**
   - **Component:** Profile/detail pages
   - **Display:** Full address including country
   - **Format:** "City, Province, Country, PostalCode"

---

## 8. CONFIGURATION FILES

### No Dedicated Country Configuration Files
The application currently does NOT have:
- A `countries.json` configuration file
- A `provinces.json` configuration file
- Environment variable for country list

**All configuration is:**
1. **Hardcoded in frontend** (countries list)
2. **Database-driven** (provinces list)
3. **Legacy numeric mappings** in backend code

---

## 9. KEY FINDINGS & RECOMMENDATIONS

### Issues Identified

1. **Hardcoded Country List**
   - ❌ Countries are hardcoded in `memberform.jsx`
   - ⚠️ Adding/removing countries requires code changes
   - 🔴 Not synced with database provinces data

2. **Country/Province Storage Mismatch**
   - ❌ CountryID stores TEXT (country name) instead of numeric ID
   - ❌ No dedicated Countries table
   - ⚠️ Legacy numeric mapping (0-5) causes confusion

3. **Missing Countries Table**
   - ❌ Should have `Countries` table with `CountryID`, `CountryCode`, `CountryName`
   - ❌ `Provinces` should have foreign key to Countries, not just country name text

4. **Inconsistent Province Usage**
   - ✓ Provinces table exists with proper structure
   - ⚠️ But frontend still uses hardcoded country list

### Recommended Architecture

**Desired flow:**
```
Frontend User:
  1. Select from API-provided countries list → /api/lookups/countries
  2. Select from API-provided provinces → /api/lookups/provinces?country=CA
  
Backend:
  1. Countries table (CountryID, CountryCode, CountryName)
  2. Provinces table (ProvinceID, ProvinceName, CountryID)
  3. MemberAddress table (ProvinceID, CountryID as foreign keys)
```

---

## 10. DATA INVENTORY

### CSV Exports Available
The `python_csv_export/` folder contains:
- `Members.csv` - Member records with address info
- `IrishCounties.csv` - 32 Irish counties
- `IrishSurnames.csv` - Irish surnames database
- `MemberAddress.csv` - All member addresses
- But NO dedicated Countries.csv or Provinces.csv

### Province File Data
- `Province File.txt`: World provinces dataset with 195+ countries
- Format: CountryCode.ProvinceCode | ProvinceName | Normalized | GeonamesID
- Appears to be NOT fully imported into Provinces table yet

---

## 11. SUMMARY TABLE

| Aspect | Status | Location | Notes |
|--------|--------|----------|-------|
| Countries List | Hardcoded | `memberform.jsx` L352-375 | 195 countries pinned then alphabetical |
| Provinces Data | Database | `Provinces` table | Joined with MemberAddress |
| Country Display | API | `/api/lookups` endpoint | Returns countries with provinces |
| Form Dropdowns | Hybrid | `memberform.jsx` | Hardcoded countries + dynamic provinces |
| Member Profiles | Database | MemberAddress table | Country stored as TEXT |
| Reports | Database | Provinces table JOIN | Used for statistics |
| Exports | Database | CSV generation | Includes country field |

---

## 12. NEXT STEPS FOR MIGRATION

**If countries need to be centralized:**

1. Create `Countries` table in database
2. Migrate Country data from hardcoded list to database
3. Update `memberform.jsx` to fetch countries from `/api/lookups/countries`
4. Refactor `CountryID` storage to use numeric foreign key
5. Populate provinces from `Province File.txt`
6. Update legacy country mapping once migration complete
7. Add country validation in frontend form

---

Generated: April 30, 2026  
Analysis based on: SQLite database, React frontend (memberform.jsx), Flask backend (app.py)
