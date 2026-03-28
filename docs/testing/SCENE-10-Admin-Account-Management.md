# Scene 10 — Admin Account Management

**Order:** Run after initial system setup (requires at least one board account seeded via `bootstrapAdminAccounts()`). Can run independently of any member application scenes.

**What this tests:**
- Admin Portal login requires email + password (not just email)
- Board role can access the Administrators management page
- Board can add a new admin account (all three roles: board, mgt, rso)
- Board can deactivate and reactivate an admin account
- Board can reset an admin's password
- A deactivated account cannot log in
- After password reset, old session is invalidated (admin must log in again)
- mgt and rso roles cannot access the Administrators page
- Administrators page is not visible in the sidebar for mgt or rso
- Incorrect password shows a generic error (does not reveal whether email exists)

---

## Cast

| Role | Who | Access |
|------|-----|--------|
| **Board Member** | board@geabotswana.org | Admin Portal (board role — full access) |
| **Test MGT Account** | A temporary mgt account created during this scene | Admin Portal (mgt role) |
| **Test RSO Account** | A temporary rso account created during this scene | Admin Portal (rso role) |

**Pre-conditions:**
- At least one board account already exists in the Administrators tab (seeded during setup)
- You have the board account's current password

---

## Part A — Board Login and Access

---

### Step A1 — Board Logs In with Password
**Who:** Board Member
**Where:** Admin Portal login screen

**Action:**
1. Navigate to the Admin Portal URL
2. Confirm the login form has **two fields**: Email Address and Password
3. Enter board@geabotswana.org and the board password
4. Click Sign In

**Check:**
- Login succeeds
- Dashboard loads
- Header shows the board member's name (from Administrators tab, not Individuals)
- Sidebar shows ALL nav items: Dashboard, Pending Reservations, Waitlist, **Reservation Calendar**, Members, Applications, Photo Review, Guest Lists, Payments, Reports, **Administrators**

**Fail if:** Login accepts email only (no password prompt), or Administrators nav item is missing for board role

---

### Step A2 — Board Accesses Administrators Page
**Who:** Board Member
**Where:** Admin Portal → Administrators

**Action:** Click "Administrators" in the sidebar

**Check:**
- Administrators page loads
- Lists existing accounts (at least the bootstrap accounts created during setup)
- Each row shows: Name, Email, Role pill (BOARD / MGT / RSO), Status (Active/Deactivated), Password indicator, action buttons
- "Add Admin Account" button is visible at the top

**Fail if:** Page shows an error, no accounts listed, or Add button missing

---

## Part B — Create New Admin Accounts

---

### Step B1 — Create an MGT Account
**Who:** Board Member
**Where:** Admin Portal → Administrators

**Action:**
1. Click "Add Admin Account"
2. The Add Admin form slides open
3. Fill in:
   - First Name: Test
   - Last Name: MGT
   - Email: testmgt@geabotswana.org (use a real inbox you can receive, or a disposable address)
   - Role: Management Officer (mgt)
   - Initial Password: TestMgt2026!
4. Click Create Account

**Check:**
- Success notification shown ("Admin account created for testmgt@geabotswana.org")
- New row appears in the accounts table
- Row shows: Test MGT, testmgt@geabotswana.org, MGT pill (orange), Active, Password: Set
- Administrators tab in System Backend: new row with role = "mgt", active = TRUE, password_hash populated
- Audit Log: ADMIN_CREATED entry for this account

**Fail if:** Form validation rejects valid data, new row not in sheet, or no audit log entry

---

### Step B2 — Create an RSO Account
**Who:** Board Member
**Where:** Admin Portal → Administrators

**Action:** Repeat Step B1 with:
- First Name: Test
- Last Name: RSO
- Email: rso-approve@geabotswana.org (or a test address if the real inbox is already in use)
- Role: RSO (rso)
- Initial Password: TestRso2026!

**Check:** Same as B1. Row shows RSO pill (green).

---

## Part C — Verify Role-Based Nav (mgt and rso)

---

### Step C1 — MGT Login — Sees Only Reservations Nav
**Who:** Test MGT Account
**Where:** Admin Portal login (use a different browser or incognito window)

**Action:** Log in as testmgt@geabotswana.org with TestMgt2026!

**Check:**
- Login succeeds
- Header shows "Test MGT" (name from Administrators tab)
- Sidebar shows ONLY: Dashboard, Pending Reservations, Waitlist, Reservation Calendar
- The following are NOT visible in the sidebar: Members, Applications, Photo Review, Guest Lists, Payments, Reports, Administrators
- Attempting to access the Administrators page by clicking a link or typing its equivalent shows nothing (page is not in nav)

**Fail if:** mgt user can see Payments, Members, or Administrators

---

### Step C2 — RSO Login — Sees Only RSO-Specific Pages
**Who:** Test RSO Account
**Where:** Admin Portal login (different browser or incognito)

**Action:** Log in as the rso account with TestRso2026!

**Check:**
- Login succeeds
- Portal lands on the Document Review page (rso_approve default)
- Sidebar shows ONLY RSO pages: Guest Lists, Document Review, RSO Event Calendar, RSO Approved Guests
- The following are NOT visible: Dashboard, Pending Reservations, Waitlist, Reservation Calendar, Members, Applications, Photo Review, Payments, Reports, Administrators

**Fail if:** rso user can see Payments, Pending Reservations, Members, or Administrators

---

## Part D — Deactivate and Reactivate

---

### Step D1 — Board Deactivates the MGT Account
**Who:** Board Member
**Where:** Admin Portal → Administrators

**Action:**
1. Find the Test MGT row
2. Click "Deactivate"
3. Confirm the prompt: "Deactivate Test MGT? They will immediately lose access."

**Check:**
- Status pill changes from Active (green) to Deactivated (red)
- Administrators tab: active = FALSE, deactivated_by = board email, deactivated_date = today
- Audit Log: ADMIN_DEACTIVATED entry
- If the MGT account was logged in in another window: that session is now invalid (next action shows "Session expired" or redirects to login)

**Fail if:** Status doesn't update, sheet not updated, or deactivated account can still use an existing session

---

### Step D2 — Deactivated Account Cannot Log In
**Who:** Tester (testing the deactivated mgt account)
**Where:** Admin Portal login

**Action:**
1. Attempt to log in as testmgt@geabotswana.org with the correct password

**Check:**
- Login is refused with message: "This account has been deactivated. Contact the board to reinstate access."
- NOT the generic "Invalid email or password" — the deactivation message is specific

**Fail if:** Deactivated account can log in, or error message is wrong

---

### Step D3 — Board Reactivates the MGT Account
**Who:** Board Member
**Where:** Admin Portal → Administrators

**Action:**
1. Find the deactivated Test MGT row
2. Click "Reactivate" (button changes when account is deactivated)

**Check:**
- Status pill returns to Active
- Administrators tab: active = TRUE, deactivated_by and deactivated_date cleared
- Audit Log: ADMIN_REACTIVATED entry
- testmgt@geabotswana.org can now log in successfully again (verify with Step C1 credentials)

**Fail if:** Reactivate button missing, sheet not updated

---

## Part E — Password Reset

---

### Step E1 — Board Resets RSO Account Password
**Who:** Board Member
**Where:** Admin Portal → Administrators

**Action:**
1. Find the Test RSO row
2. Click "Reset Password"
3. A modal appears: "Set a new password for Test RSO. They will need to log in again."
4. Enter new password: TestRsoNew2026!
5. Click Reset Password

**Check:**
- Success notification: "Password reset successfully."
- Administrators tab: password_hash updated (different value from before — verify by resetting twice with different passwords and confirming hash changes)
- Audit Log: ADMIN_PASSWORD_RESET entry

**Fail if:** Reset fails, hash not updated in sheet, no audit entry

---

### Step E2 — Old Password No Longer Works
**Who:** Tester
**Where:** Admin Portal login

**Action:**
1. Attempt to log in as the rso account using the OLD password (TestRso2026!)

**Check:**
- Login fails: "Invalid email or password."

**Action:**
1. Log in with the NEW password (TestRsoNew2026!)

**Check:**
- Login succeeds with the new password

**Fail if:** Old password still works after reset

---

### Step E3 — Active Session Invalidated After Password Reset
**Pre-condition:** RSO account was logged in before the password reset in Step E1 (session active in another window).

**Action:**
1. In the window where the rso account was logged in (with the old password session)...
2. Attempt any action (e.g. click a nav item or reload)

**Check:**
- Session is no longer valid — redirected to login or shown "Session expired"
- The password reset immediately invalidated all active sessions for this account

**Fail if:** Old session remains active after password reset

---

## Part F — Login Security Checks

---

### Step F1 — Wrong Password Shows Generic Error
**Who:** Tester
**Where:** Admin Portal login

**Action:** Enter board@geabotswana.org with an incorrect password

**Check:**
- Error: "Invalid email or password." (generic — does NOT say "password incorrect" vs "email not found")
- Audit Log: ADMIN_LOGIN_FAILED entry for this attempt

**Fail if:** Error message reveals whether the email was found, or no audit log entry for failed attempt

---

### Step F2 — Non-Existent Email Shows Same Generic Error
**Who:** Tester
**Where:** Admin Portal login

**Action:** Enter doesnotexist@geabotswana.org with any password

**Check:**
- Same error message as F1: "Invalid email or password."
- Response time is similar to F1 (no timing difference that would reveal email existence)

**Fail if:** Different error message for unknown email vs wrong password

---

## Completion Criteria

Scene 10 is **PASS** when:
- Admin Portal login requires email + password (both fields present and enforced)
- Board sees all nav items including Reservation Calendar and Administrators page
- mgt sees only Dashboard, Pending Reservations, Waitlist, Reservation Calendar
- rso sees only Guest Lists, Document Review, RSO Event Calendar, RSO Approved Guests
- New accounts can be created for all three roles
- Deactivated accounts cannot log in (specific error message)
- Reactivated accounts can log in again
- Password reset updates the hash and invalidates existing sessions
- Old password does not work after reset
- Failed login attempts produce a generic error message (no email/password distinction)
- All admin account actions create Audit Log entries
