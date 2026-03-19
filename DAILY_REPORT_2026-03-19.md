# BIS Membership App — Daily Report
**Date:** 19 March 2026  
**Session:** Development & UI/UX Fixes

---

## What Was Fixed Today

### 1. Member Directory — Action Button Consistency (Admin View)
**File:** `src/pages/members/member.jsx`

The **View** and **Deactivate** buttons in the member table rows were visually inconsistent. The Deactivate button (a native `<button>` element) appeared noticeably larger than the View button (a `<Link>`) because browser-default button styles were interfering — specifically missing `fontFamily: inherit`, `appearance: none`, and `box-sizing: border-box`.

**Changes made:**
- Both buttons now use exactly the same size: `padding: 10px 18px`, `fontSize: 15px`, `lineHeight: 1.2`, `borderRadius: 8px`
- Both use `display: inline-flex` with `alignItems: center` so emoji and text are always vertically centred
- Added `whiteSpace: nowrap` so buttons never break across lines
- Added `fontFamily: inherit`, `appearance: none`, `WebkitAppearance: none` to fully reset the native button element
- Added consistent `boxShadow` to the Deactivate button to match the View button's depth
- Hover animation uplift added to Deactivate button (matches View behaviour)
- Deactivate icon changed from ❌ to 🚫 to avoid confusion with the ❌ Inactive status badge
- Fixed hover handlers to use `e.currentTarget` instead of `e.target` for reliable behaviour

---

## What Was Fixed in Previous Sessions (This Sprint)

| # | Fix | Status |
|---|-----|--------|
| 1 | Country dropdown priority: Canada → USA → Ireland → alphabetical rest | ✅ Done |
| 2 | Date of Birth defaults to 18 years before today | ✅ Done |
| 3 | Duplicate member record removed (Mckenna Lynne, MemberID 15) | ✅ Done |
| 4 | Volunteering interests now display correctly on member profile page | ✅ Done |
| 5 | "Deceased" renamed to "Historical" throughout the entire app | ✅ Done |
| 6 | Member Directory title updated: "Active Members" → "Member Directory" | ✅ Done |
| 7 | Member Directory subtitle: "Browse active records" → "Browse all membership records" | ✅ Done |

---

## How to Test Today's Fix

### Button Consistency (Admin only)
1. Log in as an **admin** user
2. Navigate to **Member Directory** (sidebar → Member Directory)
3. Look at any row that has an **active** member — you should see **👁️ View** and **🚫 Deactivate** side by side
4. Confirm both buttons are the **same height and visual weight**
5. Hover over each button — both should lift slightly with a shadow
6. Confirm hovering Deactivate turns it solid red, hovering View brightens it
7. Click **👁️ View** — opens the member profile page ✓
8. Click **🚫 Deactivate** — a confirmation dialog should appear before deactivating ✓

### Non-Admin Users
- Log in as a **private** or **public** user
- Navigate to Member Directory — only the **👁️ View** button should appear (no Deactivate) ✓

---

## Known Remaining Issues / Upcoming Work

| # | Issue | Priority |
|---|-------|----------|
| 1 | Browser autocomplete suggests previous values on unique fields (telephone, email, Irish surname, place of birth, last name) | Medium |
| 2 | Full audit of "deceased → historical" rename across all routes and exports | Medium |
| 3 | Edit/Add member form UX coherence review | Medium |
| 4 | Desktop app packaging (run without manually starting frontend + backend) | Future |

---

## Notes for Testers

- The app still runs locally: backend on `http://localhost:5000`, frontend on `http://localhost:5173`
- Test with **admin**, **private**, and **public** role accounts to verify role-specific features
- If anything looks off visually, a hard refresh (`Ctrl+Shift+R`) will clear any cached styles
- Please report any instances where the word "deceased" still appears — it should say "historical" everywhere

---

*Report prepared by GitHub Copilot — BIS Membership App Development*
