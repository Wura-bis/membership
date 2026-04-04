# 📋 ISSUES LOG — BIS Membership System

**Last Updated:** 2026-04-04

This document is a log of all known issues raised against the BIS Membership System, their current status, and any relevant notes. It is intended to be readable by both technical and non-technical team members.

---

## 📊 Summary Table

| # | Issue | Category | Status |
|---|-------|----------|--------|
| 1 | Duplicate member records being created | Bug | ✅ Fixed |
| 2 | Only one phone number supported per member | Enhancement | 🔧 Outstanding |
| 3 | No field for volunteering interests | Enhancement | 🔧 Outstanding |
| 4 | No easy way to record inactive members | Enhancement | 🔧 Outstanding / Partially Addressed |
| 5 | "Deceased Members" label inappropriate | Bug / UX | ✅ Fixed |
| 6 | Export to PDF and CSV not working | Bug | ✅ Fixed |
| 7 | Support ticket mechanism broken | Bug | ✅ Fixed |
| 8 | Session timeout too aggressive / not configurable | Bug | ✅ Fixed |
| 9 | New occupation (and other lookup values) not saved when adding a member | Bug | ✅ Fixed |

---

## 🐛 Detailed Issue Log

---

### Issue 1 — Duplicate Member Records Being Created

**Status:** ✅ Fixed

**Description:**  
When attempting to add a member, the system displayed an error saying the record was disallowed or not added — but it was actually being added silently, sometimes multiple times. For example, **Helen Clinton** appeared 6 times in the database, and **Henry Callaghan** was added more than once despite the system implying otherwise.

**Root Cause:**  
The system lacked a proper **unique composite index** on the member record. Without this constraint, the database had no mechanism to prevent the same person being added more than once. The index should be based on `FirstName + LastName + DateOfBirth` (or a similarly identifying combination).

**Fix Applied:**
- A unique composite index on `FirstName`, `LastName`, and `DateOfBirth` was added to the Members table to prevent duplicate entries at the database level.
- The "Add Member" form now checks for an existing matching record **before** attempting to insert. If a match is found, the user is clearly informed rather than the system silently adding or erroneously rejecting the record.

**Testing:**  
Refer to [TESTING_GUIDE.md](./TESTING_GUIDE.md) for general member data verification steps. To test this fix specifically, attempt to add a member that already exists and confirm that the system correctly flags the duplicate without creating a new record.

---

### Issue 2 — Only One Phone Number Supported Per Member

**Status:** 🔧 Outstanding — to be implemented

**Description:**  
The member data entry form only allowed for a single phone number. Many members — particularly older members — have both a mobile/cell phone and a home/landline number. The current setup means one of these cannot be recorded on the member profile.

**Requested Fix:**  
Add support for **two phone number fields** on the member record, for example:
- `Phone 1 / Mobile`
- `Phone 2 / Home`

This is similar to how the Ragic system handles multiple contact numbers.

**Notes:**  
This is a schema change and will require updates to both the database (Members table) and the member add/edit forms in the application.

---

### Issue 3 — No Field for Volunteering Interests

**Status:** 🔧 Outstanding — to be implemented

**Description:**  
There is currently no space on the member record to capture volunteering interests or skills. This information is considered important for organisational planning — for example, being able to search or sort members by a particular skill or interest area.

**Requirements:**
- A **volunteering interests / skills** field (ideally multi-value or free-text) on the member profile.
- The field should be **sortable and searchable** so administrators can find members with specific skills.
- This field should be **visible only to Private and Admin users** — it should not be visible to public-facing users.

**Notes:**  
This will require a new field or related table in the database, updates to the member form, and access-control logic to restrict visibility based on user role.

---

### Issue 4 — No Easy Way to Record Inactive Members

**Status:** 🔧 Outstanding / Partially Addressed — to be clarified and documented

**Description:**  
There was no clear mechanism to flag a member as **inactive** within the system. It was noted that this functionality had been demonstrated previously, but the implementation or documentation was unclear to end users.

**Requested Fix:**
- An `Active / Inactive` status flag on the member record.
- The ability to filter or report on inactive members separately from active members.
- Clear instructions for end users explaining how to mark a member as inactive and how to view or export inactive member lists.

**Notes:**  
If partial implementation already exists, this issue requires clear user-facing documentation and testing to confirm the feature works as expected. If not fully implemented, the status flag and associated filtering logic still need to be built.

---

### Issue 5 — "Deceased Members" Label

**Status:** ✅ Fixed

**Description:**  
The label **"Deceased Members"** used in the application was considered inappropriate or unclear for general use.

**Fix Applied:**  
Renamed to **"Historical Members"** throughout the application. All navigation items, page headings, and any related references have been updated accordingly.

---

### Issue 6 — Export to PDF and CSV Not Working

**Status:** ✅ Fixed

**Description:**  
Exporting member data to PDF and CSV formats was broken. Users were unable to generate downloadable reports of member data in either format.

**Fix Applied:**  
Export to PDF and CSV functionality has been restored and is working correctly. Both formats can now be generated and downloaded as expected.

---

### Issue 7 — Support Ticket Mechanism Broken

**Status:** ✅ Fixed

**Description:**  
The in-app support ticket mechanism was not functioning correctly. Users were unable to raise or submit support tickets through the application.

**Fix Applied:**  
The support ticket mechanism has been fixed and is now fully operational.

---

### Issue 8 — Session Timeout Too Aggressive / Not Configurable

**Status:** ✅ Fixed

**Description:**  
The application was timing out sessions too quickly, logging users out before they had finished their work. There was also no way for administrators to configure the timeout duration to suit their needs.

**Fix Applied:**  
The session timeout behaviour has been fixed and is now configurable. It can be set to remain active for an extended period as required by the organisation.

---

### Issue 9 — New Occupation (and Other Lookup Values) Not Saved When Adding a Member

**Status:** ✅ Fixed

**Description:**  
When adding a new member, typing a new occupation (or other lookup value such as role, category, or surname) and clicking "+ Add" appeared to do nothing — the field remained blank and the value was not linked to the member on save.

**Root Cause:**  
Two separate bugs combined to cause this:

1. **Backend — incorrect SQL syntax for SQLite:** All endpoints that create new lookup records (occupation, category, role, society, surname) and the main member creation endpoint used `SELECT @@IDENTITY` to retrieve the auto-generated database ID after an INSERT. `@@IDENTITY` is a Microsoft SQL Server / MS Access syntax that is **not recognised by SQLite**, causing an `OperationalError`. Because the `INSERT` had already been committed before this line ran, the record was saved to the database, but the API returned a `500 Internal Server Error` to the frontend — making it appear as though nothing had happened.

2. **Frontend — new option not selected after creation:** The `CreatableSelect` component's "create" handler called the `onCreate` callback but neither awaited it nor used the returned item to set the selected value in the form. Even if the backend had responded correctly, the form field would still have been left blank.

**Fix Applied:**
- All occurrences of `cursor.execute("SELECT @@IDENTITY")` in the backend have been replaced with `cursor.lastrowid`, which is the correct Python SQLite idiom for retrieving the last inserted row ID.
- The `handleCreate` function in the `CreatableSelect` component has been made `async`. It now awaits the `onCreate` result and calls `handleSelect` with the new item's ID, so the form field is correctly populated after a new value is created.
- The `newItem.value` property in the add/edit member pages is now set to the integer ID returned by the server (consistent with the format used by the `/api/lookups` endpoint), rather than the raw text string.

---

## 📝 Notes

- Issues marked ✅ **Fixed** have been implemented and verified.
- Issues marked 🔧 **Outstanding** are confirmed requirements that have not yet been implemented.
- This document should be updated whenever a new issue is raised or an existing issue is resolved.
- For testing guidance related to member data, refer to [TESTING_GUIDE.md](./TESTING_GUIDE.md).
