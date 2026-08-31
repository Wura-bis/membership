# BIS Membership System — Project Context

## Project Structure

| Layer | Path |
|---|---|
| PHP backend | `membership-php/` |
| PHP API entry | `membership-php/api/index.php` |
| PHP handlers | `membership-php/api/handlers/` |
| React frontend | `membership-frontend/membership-frontend/src/` |
| Vite build output | `membership-php/` (index.html + assets/) |
| Database | MySQL (live); `BISMembershipDatabase.db` SQLite (legacy, unused) |

The Flask/SQLite backend in `membership-backend/` is legacy and no longer used. The active stack is PHP + MySQL.

## Architecture

- **Auth**: session-based. Every fetch call must include `credentials: "include"`.
- **API base URL**: imported from `src/utils/api.js` as `API_BASE_URL`.
- **Design system**: tokens and component styles in `src/utils/theme.js` — `T`, `card`, `btn`, `badge`, `avatarStyle`, `pageHeader`, `filterBar`. Always import from there, never hardcode colours.
- **Lookups**: `GET /api/lookups` returns counties, categories, roles, fiscalYears, societies, connections, occupations, volunteeringInterests.
- **Dashboard stats**: 1-hour in-memory cache keyed by hour, cleared on member add/update.
- **React hooks rule**: all hooks must be called before any conditional early returns in a component.

## Key Bugs Fixed (reference — don't re-introduce)

| Bug | Fix location |
|---|---|
| Role key mismatch — frontend sends `role`/`fiscalYear`, backend expected `roleID`/`fiscalYearID` | `members.php` reads both with fallback |
| Phantom address fields (`addressLine2`, `dateInResidence`) don't exist in DB | Removed from `memberform.jsx` |
| Irish connections array — rows keyed by NULL ID, all but last silently dropped | `members.php` — use `[]` append not `[$ic[0]]` |
| Admin stats wrong response keys | `dashboard.php` returns `{total, growth, breakdown, yearly}` |
| `recentActivity` vs `recentActivities` key mismatch | `dashboard.php` fixed to `recentActivities` |
| Approvals showing email for no-email users | `users.php` — `?:` not `??` for null email |
| Signup timestamp always showing 9 PM | `users.php` returns full datetime; `user-approvals.jsx` uses `.replace(' ','T')` to parse as local time |
| Reinstate member triggered full page reload | `profile.jsx` — re-fetches member via API, updates state |
| Support ticket priority filter hardcoded to 'normal' | Removed priority filter entirely |
| Password reset wrong user ID | `forgot-no-email.jsx` key mismatch fixed |

## Import System (bulk CSV import)

- **Library email** `bisofpeilibrary@gmail.com` is a placeholder for members with no personal email — treat as "no email" throughout.
- **Duplicate detection order**: name+email → name+phone → name+DOB → name-only (unique match). All use `TRIM()` on DB name columns.
- **Email always updates** from import if the import provides a real (non-library) email.
- **Phone columns**: `home`/`home phone` → `HomePhone`; `cell`/`cell phone`/`mobile` → `CellPhone`. These go into `MemberPhoneNumbers` (PhoneType='Home'/'Cell'). Generic `phone`/`telephone` → `PhoneNumber` on `Members`.
- **IsActive**: recognises `true`, `yes`, `1`, `active` (case-insensitive).
- **Deactivate route**: uses `<member_id>` as string, not `<int:member_id>`.

## User Management

- **User detail modal**: clicking a row in `/admin/users` opens a modal with full account info, role change, approve/deactivate, and set-password actions.
- **Delete users**: implemented in `user-approvals.jsx` (not usermanagement.jsx). Backend route: `DELETE /api/users/{id}`.
- **Self-protection**: admins cannot modify or delete their own account from the user management panel.
- **Password hashing**: SHA-256 via `hash_password()` in PHP. Passwords cannot be read back — only replaced. Old Flask accounts used werkzeug/PBKDF2; those users need passwords reset via the admin panel.
- **`myId` pattern**: `user?.user_id ?? user?.id` — auth returns `user_id`, users list returns `id`.

## System Settings

- Frontend keys: `systemName`, `adminEmail`, `maxUploadSize`, `autoApproval`, `emailNotifications`, `maintenanceMode`, `publicRegistration`, `defaultRole`, `sessionTimeout`, `backupFrequency`, `contactEmail`, `contactPhone`, `contactHours`.
- Stored in MySQL `Settings` table (key-value: SettingID, SettingKey, SettingValue).
- Booleans stored as `'true'`/`'false'` strings.
- `publicRegistration` and `autoApproval` are read live by `handle_signup()` in `auth.php`.
- **System Settings is hidden from the sidebar nav** until the page is fully wired up. Will be restored in a post-launch update.
- Migration: `membership-php/migrations/create_settings_table.sql`.

## Admin Notification Bell

- DB table: `AdminNotifications` (NotificationID, Type, Title, Body, ReferenceID, IsRead, CreatedAt).
- Handler: `membership-php/api/handlers/notifications.php`.
- Routes: `GET /api/admin/notifications`, `POST /api/admin/notifications/read-all`, `PUT /api/admin/notifications/{id}/read`.
- Triggers: `submit_support_handler()` (type: `support_ticket`), `handle_signup()` (type: `new_signup`) — both silent-fail if table is missing.
- Frontend: `navbar.jsx` — polls every 30s, unread count badge, dropdown with mark-read and navigation.
- Migration: `membership-php/migrations/create_admin_notifications_table.sql`.

## Post-Launch Backlog

These are known issues deferred until after launch. Don't fix without confirming with the user first.

1. **Email / SMTP** — `auth.php` still uses PHP `mail()` (server sendmail). Plan: swap to PHPMailer + Gmail app password. User must provide Gmail address and app password. Until then, admins reset passwords manually via User Management.
2. **System Settings wiring** — save actions on the Settings page currently have no effect. Needs backend endpoints.
3. **Dark mode accessibility** — contrast issues throughout; full audit needed. Large task.
4. **Public member directory** — missing search and filter parity with admin/private views.
5. **CSV/PDF export ignores filters** — exports full unfiltered list regardless of active search/filter state.
6. **Admin cannot edit FAQs** — FAQ list in `support.jsx` is hardcoded. Needs `FAQItems` DB table, CRUD endpoints, and admin edit UI.
7. **Reset System button** — stub only in `settings.jsx`. Use a SQL script directly until wired up.

## Dead Code (harmless, low priority)

- `add.jsx`: `handleRoleChange`, `addRole`, `removeRole` reference `formData.roles` which doesn't exist — orphaned, never called.
