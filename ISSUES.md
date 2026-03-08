# 📋 ISSUES LOG — BIS Membership System

**Last Updated:** 2026-03-05

This document is a log of all known issues raised against the BIS Membership System, their current status, and any relevant notes. It is intended to be readable by both technical and non-technical team members.

---

## 📊 Summary Table

| # | Issue | Category | Status |
|---|-------|----------|--------|
| 1 | Duplicate member records being created | Bug | ✅ Fixed |
| 2 | Only one phone number supported per member | Enhancement | ✅ Fixed |
| 3 | No field for volunteering interests | Enhancement | ✅ Fixed |
| 4 | No easy way to record inactive members | Enhancement | ✅ Fixed |
| 5 | "Deceased Members" label inappropriate | Bug / UX | ✅ Fixed |
| 6 | Export to PDF and CSV not working | Bug | ✅ Fixed |
| 7 | Support ticket mechanism broken | Bug | ✅ Fixed |
| 8 | Session timeout too aggressive / not configurable | Bug | ✅ Fixed |

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

**Status:** ✅ Fixed

**Description:**  
The member data entry form only allowed for a single phone number. Many members — particularly older members — have both a mobile/cell phone and a home/landline number. The current setup means one of these cannot be recorded on the member profile.

**Fix Applied:**
- Support for two phone number fields has been added to the member record: `Phone 1 (Mobile/Cell)` and `Phone 2 (Home/Landline)`.
- Both fields are available on the member add and edit forms.

---

### Issue 3 — No Field for Volunteering Interests

**Status:** ✅ Fixed

**Description:**  
There was no space on the member record to capture volunteering interests or skills. This information is considered important for organisational planning — for example, being able to search or sort members by a particular skill or interest area.

**Fix Applied:**
- A volunteering interests/skills field has been added to the member profile.
- The field is sortable and searchable by administrators.
- The field is visible only to Private and Admin users — it is not visible to public-facing users.

---

### Issue 4 — No Easy Way to Record Inactive Members

**Status:** ✅ Fixed

**Description:**  
There was no clear mechanism to flag a member as **inactive** within the system. It was noted that this functionality had been demonstrated previously, but the implementation or documentation was unclear to end users.

**Fix Applied:**
- An Active/Inactive status flag has been added to the member record.
- Inactive members can be filtered and reported on separately from active members.

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

## 📝 Notes

- Issues marked ✅ **Fixed** have been implemented and verified.
- This document should be updated whenever a new issue is raised or an existing issue is resolved.
- For testing guidance related to member data, refer to [TESTING_GUIDE.md](./TESTING_GUIDE.md).
