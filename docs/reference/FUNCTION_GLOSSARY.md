# Comprehensive Function Glossary

**GEA Management System - Complete Function Reference**

This document catalogs **every function** in the codebase, organized by service module/file. For each function, it provides:
- **Line number** where defined
- **File name**
- **Function signature** with parameters
- **Purpose** (what it does)
- **Parameters** (with types)
- **Return type** (what it returns)
- **Called by** (which functions/operations call it)

---

## Quick Navigation

- [Code.js](#codejs-main-web-app-entry-point) - Main entry point (92 functions)
- [AuthService.js](#authservicejs-authentication--authorization) - Authentication (32 functions)
- [MemberService.js](#memberservicejs-member--household-management) - Member operations (20 functions)
- [ApplicationService.js](#applicationservicejs-membership-applications) - Applications (27 functions)
- [ReservationService.js](#reservationservicejs-facility-reservations) - Reservations (40 functions)
- [PaymentService.js](#paymentservicejs-payment-verification) - Payments (19 functions)
- [EmailService.js](#emailservicejs-email-notifications) - Email system (15 functions)
- [FileSubmissionService.js](#filesubmissionservicejs-file--document-management) - File uploads (26 functions)
- [NotificationService.js](#notificationservicejs-notifications--nightly-tasks) - Notifications (12 functions)
- [RulesService.js](#rulesservicejs-business-rules-engine) - Rules (8 functions)
- [Utilities.js](#utilitiesjs-utility-functions) - Utilities (27 functions)
- [Tests.js](#testsjs-test-suite) - Tests (40+ functions)
- [Config.js](#configjs-configuration-constants) - Configuration

**Total: 359 functions across 12 service modules**

---

## Code.js (Main Web App Entry Point)

**92 public + private handler functions**

### Core Entry Points

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 49 | `doGet(e)` | e: event object | ContentService.TextOutput | Web app entry point. Routes all HTTP GET requests. Public endpoint. |
| 135 | `handlePortalApi(action, params)` | action: string, params: object | Object (JSON) | google.script.run handler. Preferred for client-to-server calls (avoids CORS). |
| 160 | `_routeAction(action, params)` | action: string, params: object | string (JSON) | Main router. Dispatches 78+ cases to handler functions. |

### Public Routes (No Authentication)

| Line | Function | Purpose |
|------|----------|---------|
| 402 | `_handleLogin(p)` | Member/applicant login. Creates session token. |
| 431 | `_handleLogout(p)` | Invalidate session. |
| 440 | `_handleAdminLogin(p)` | Admin/board login. |
| 465 | `_handlePasswordResetRequest(p)` | Initiate password reset. Rate-limited. |
| 498 | `_handlePasswordResetComplete(p)` | Complete password reset with token. |
| 528 | `_handleChangePassword(p)` | Change password while logged in. |
| 609 | `_handleDeploymentInfo()` | Return deployment metadata (version, timestamp). |
| 628 | `_handleGetConfigValue(p)` | Retrieve single config value by key. |
| 643 | `_handleGetRules(p)` | Get system rules (membership, reservation, guest list). |

### Member Portal Handlers

| Line | Function | Purpose |
|------|----------|---------|
| 656 | `_handleDashboard(p)` | Get member's home screen data. |
| 693 | `_handleProfile(p)` | View/edit member profile. |
| 721 | `_handleReservations(p)` | List member's reservations. |
| 732 | `_handleBook(p)` | Create new facility reservation. |
| 807 | `_handleUpdatePhoneNumbers(p)` | Update member phone numbers. |
| 873 | `_handleCancel(p)` | Cancel reservation. |
| 891 | `_handleCard(p)` | Get digital membership card data. |

### Board Admin Handlers

| Line | Function | Purpose |
|------|----------|---------|
| 550 | `_handleAdminListAdmins(p)` | List all admin accounts (board only). |
| 558 | `_handleAdminCreateAdmin(p)` | Create new admin account. |
| 574 | `_handleAdminDeactivateAdmin(p)` | Deactivate admin account. |
| 584 | `_handleAdminReactivateAdmin(p)` | Reactivate admin account. |
| 594 | `_handleAdminResetAdminPassword(p)` | Reset admin password. |
| 957 | `_handleAdminPending(p)` | List pending reservations (board approval). |
| 1015 | `_handleAdminApprove(p)` | Board approves pending reservation. |
| 1063 | `_handleAdminDeny(p)` | Board denies reservation. |
| 1102 | `_handleAdminWaitlist(p)` | Manage waitlist reservations. |
| 1132 | `_handleAdminApproveBump(p)` | Promote waitlist to approved. |
| 1156 | `_handleAdminWaitlistList(p)` | List waitlisted reservations. |
| 1220 | `_handleAdminMembers(p)` | Search members for admin view. |
| 1275 | `_handleAdminPhoto(p)` | Board approves/rejects photos. |
| 2417 | `_handleAdminApplications(p)` | List membership applications. |
| 2437 | `_handleAdminApplicationDetail(p)` | Get full application details. |
| 2457 | `_handleAdminApproveApplication(p)` | Board approves application. |
| 2498 | `_handleAdminDenyApplication(p)` | Board denies application. |
| 2547 | `_handleAdminVerifyPayment(p)` | Board verifies payment during application. |
| 2914 | `_handleAdminPendingPayments(p)` | List unverified payments. |
| 2931 | `_handleAdminApprovePayment(p)` | Treasurer approves payment. |
| 2957 | `_handleAdminRejectPayment(p)` | Treasurer rejects payment. |
| 2978 | `_handleAdminClarifyPayment(p)` | Treasurer requests payment clarification. |
| 3004 | `_handleAdminPaymentReport(p)` | Generate payment report. |
| 3305 | `_handleAdminGetRules(p)` | Board retrieves editable rules. |
| 3350 | `_handleAdminSaveRule(p)` | Board saves updated rules. |
| 3462 | `_handleAdminReservationsReport(p)` | Generate reservations report. |

### Applicant Portal Handlers

| Line | Function | Purpose |
|------|----------|---------|
| 1758 | `_handleSubmitApplication(p)` | Create new membership application. |
| 1784 | `_handleApplicationStatus(p)` | Get applicant's application status. |
| 1804 | `_handleConfirmDocuments(p)` | Verify all required documents submitted. |
| 1824 | `_handleRemoveDocument(p)` | Remove submitted document. |
| 1837 | `_handleUploadDocument(p)` | Upload document during application. |
| 1905 | `_handleSubmitPaymentProof(p)` | Applicant submits payment proof. |
| 1946 | `_handleFileUpload(p)` | Handle file upload (documents/photos). |
| 1982 | `_handleGetFileStatus(p)` | Get file submission status. |
| 2000 | `_handleApproveFileSubmission(p)` | Approve file (RSO or admin). |
| 2018 | `_handleRejectFileSubmission(p)` | Reject file with reason. |
| 2038 | `_handleRequestEmploymentVerification(p)` | Request employment verification. |
| 2063 | `_handleGetSubmissionHistory(p)` | Get all file submissions for individual. |
| 2080 | `_handleRsoApprovalLink(p)` | Process RSO document approval from email. |

### Guest List Handlers

| Line | Function | Purpose |
|------|----------|---------|
| 3125 | `_handleSubmitGuestList(p)` | Member submits guest list for event. |
| 3163 | `_handleGetGuestList(p)` | Retrieve guest list for reservation. |
| 3186 | `_handleGetGuestProfiles(p)` | Get saved guest profiles. |
| 3204 | `_handleAdminGuestLists(p)` | Board view pending guest lists. |
| 3228 | `_handleAdminSaveGuestListDraft(p)` | Board saves draft guest list review. |
| 3252 | `_handleAdminFinalizeGuestList(p)` | Board finalizes guest list review. |
| 3280 | `_handleAdminGuestHistories(p)` | Get guest history by ID numbers. |
| 3604 | `_handleAdminRsoApprovedGuestLists(p)` | RSO view approved guest lists. |

### Household Member Management

| Line | Function | Purpose |
|------|----------|---------|
| 2167 | `_handleGetHouseholdMembers(p)` | Get all members in household. |
| 2237 | `_handleAddHouseholdMember(p)` | Add member to household. |
| 2324 | `_handleRemoveHouseholdMember(p)` | Remove member from household. |
| 2366 | `_handleEditHouseholdMember(p)` | Edit household member details. |

### Payment Handlers

| Line | Function | Purpose |
|------|----------|---------|
| 2795 | `_handleSubmitPaymentVerification(p)` | Member submits payment proof. |
| 2829 | `_handleGetPaymentStatus(p)` | Get payment verification status. |
| 2850 | `_handleGetDuesInfo(p)` | Get membership dues information. |

### Utility & Diagnostic Handlers

| Line | Function | Purpose |
|------|----------|---------|
| 1313 | `_getMemberUpcomingReservations(householdId)` | Get member's upcoming reservations only. |
| 1339 | `_getMemberAllReservations(householdId)` | Get all member reservations (past/future). |
| 1376 | `_handleImageDiagnostic(params)` | Serve HTML diagnostic page for images. |
| 1701 | `getImageConstants()` | Return image proxy constants. |
| 1722 | `_safePublicHousehold(hh)` | Return safe household object (excludes sensitive data). |
| 2103 | `_handleSendContactMessage(p)` | Send message from contact form. |
| 2565 | `_objectToSubmissionRow(obj)` | Convert submission object to spreadsheet row. |
| 2581 | `testSendSingleEmailTemplate(templateId)` | Test single email template. |
| 2635 | `testSendAllEmailTemplates()` | Test all email templates. |
| 2721 | `_getDeploymentIdFromUrl_()` | Extract deployment ID from Apps Script URL. |
| 2738 | `_handleDeploymentInfoJsonp(params)` | JSONP endpoint for deployment info. |
| 2766 | `_handleConfigValueJsonp(params)` | JSONP endpoint for config values. |
| 3032 | `addPaymentTemplates()` | Add payment email templates (setup). |
| 3490 | `_handleAdminResendEmail(p)` | Board resends notification email. |
| 3510 | `_handleAdminRsoPendingDocuments(p)` | RSO view documents pending review. |
| 3528 | `_handleAdminRsoApproveDocument(p)` | RSO approves document. |
| 3554 | `_handleAdminRsoApprovedCalendar(p)` | RSO view approved reservations calendar. |
| 3582 | `_handleAdminCalendar(p)` | Board view full reservations calendar. |
| 3616 | `setupEmailTemplates_Instructions()` | Setup email templates (manual). |
| 372 | `_setupTestPasswords()` | Initialize test user passwords (dev only). |

---

## AuthService.js (Authentication & Authorization)

**32 functions for auth, authorization, and session management**

### Core Authentication

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 60 | `login(email, password)` | email: string, password: string | {success, token?, ...memberData} | Authenticate member/applicant. Creates session token. |
| 205 | `hashPassword(plaintext)` | plaintext: string | string (SHA256 hex) | Hash password securely. Never store plaintext. |
| 265 | `setPassword(individualId, plainPassword, boardEmail)` | individualId: string, plainPassword: string, boardEmail: string | {success, message} | Set password for account (board only). |
| 343 | `changePassword(email, currentPassword, newPassword, userType)` | email: string, currentPassword: string, newPassword: string, userType: "member" or "admin" | {success, message} | Change password while logged in. |
| 1529 | `adminLogin(email, password)` | email: string, password: string | {success, token, admin, role, message} | Authenticate admin/board account. |

### Session Management

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 430 | `validateSession(token)` | token: string | {valid: bool, user?, message?} | Check if session token valid/not expired. |
| 477 | `logout(token)` | token: string | {success} | Invalidate session. |
| 506 | `purgeExpiredSessions()` | none | number (deleted) | Delete expired session records (nightly). |
| 1076 | `_createSession(email, role)` | email: string, role: string | {token, expiryTime} | Create new session record. |
| 1133 | `_generateToken()` | none | string (64-char hex) | Generate cryptographically secure token. |
| 1170 | `_generateTokenFallback()` | none | string (64-char hex) | Fallback token generator if UUID fails. |
| 1183 | `_sessionExpiry()` | none | Date | Calculate session expiration (24 hours). |
| 1196 | `constantTimeCompare(str1, str2)` | str1: string, str2: string | boolean | Compare strings without timing leaks. |
| 1218 | `_hashToken(token)` | token: string | string (SHA256 hex) | Hash token for storage (security). |
| 1254 | `invalidateAllSessionsForTokenHashMigration()` | none | Object | Invalidate all sessions (for migration). |

### Authorization

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 1008 | `isBoard(token)` | token: string | boolean | Check if user has board role. |
| 1019 | `isApprover(token)` | token: string | boolean | Check if user is board or approver. |
| 1029 | `isMember(token)` | token: string | boolean | Check if user is member role. |
| 1043 | `requireAuth(token, requiredRole)` | token: string, requiredRole: string | {valid: bool, error?} | Validate session & check role. Core auth check. |

### Password Reset

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 558 | `requestPasswordReset(email, userType)` | email: string, userType: "member" or "admin" | {success, message} | Initiate password reset (rate-limited 3/day). |
| 669 | `completePasswordReset(token, email, newPassword)` | token: string, email: string, newPassword: string | {success, message} | Complete password reset using token. |
| 745 | `purgeExpiredResetTokens()` | none | number (deleted) | Delete expired reset tokens (nightly). |
| 782 | `_validateResetToken(token, email)` | token: string, email: string | {valid, error?} | Check if reset token valid. |
| 856 | `_countRecentResetRequests(email)` | email: string | number | Count password resets in last 24 hours. |
| 889 | `_markResetTokenAsUsed(tokenId)` | tokenId: string | none | Mark reset token as consumed. |

### Admin Account Management

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 1608 | `listAdminAccounts(callerEmail)` | callerEmail: string | Array | List all admin accounts (board only). |
| 1644 | `createAdminAccount(params, callerEmail)` | params: object, callerEmail: string | {success, adminId, message} | Create new admin account. Sets temp password. |
| 1709 | `deactivateAdminAccount(adminId, callerEmail)` | adminId: string, callerEmail: string | {success, message} | Deactivate admin account. Invalidates sessions. |
| 1719 | `reactivateAdminAccount(adminId, callerEmail)` | adminId: string, callerEmail: string | {success, message} | Reactivate deactivated admin. |
| 1730 | `resetAdminPassword(adminId, newPassword, callerEmail)` | adminId: string, newPassword: string, callerEmail: string | {success, message} | Reset admin password (board only). |
| 1764 | `bootstrapAdminAccounts()` | none | {success, accounts} | Initialize admin accounts on first setup (dev only). |

### Admin Account Internals

| Line | Function | Purpose |
|------|----------|---------|
| 918 | `_getAdminByEmail(email)` | Look up admin by email. |
| 949 | `_updateAdminField(adminId, fieldName, value)` | Update single admin field. |
| 980 | `_invalidateSessionsForEmail(email)` | Invalidate all sessions for email. |
| 1279 | `_getRoleForEmail(email)` | Get user's role from email. |
| 1287 | `_sendFirstLoginWelcome(member)` | Send welcome email to new member. |
| 1335 | `validateTokenHashMigration()` | Check token hash migration status. |
| 1429 | `checkSessionFormat(email)` | Check session format/state. |
| 1482 | `getAuthHealthReport()` | Get authentication system health report. |
| 1785 | `_adminColMap(headers)` | Map admin columns to properties. |
| 1800 | `_setAdminActiveFlag(adminId, active, callerEmail)` | Set admin active/inactive flag. |
| 1842 | `_invalidateSessionsForEmail(email)` | Invalidate sessions for email (duplicate). |
| 1866 | `_safePublicMember(member)` | Return safe member object (excludes password_hash). |

---

## MemberService.js (Member & Household Management)

**20 functions for member and household operations**

### Member Lookup & Retrieval

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 59 | `getMemberByEmail(email, includeInactive)` | email: string, includeInactive: bool | Object or null | Retrieve member by email address. |
| 99 | `getMemberById(individualId)` | individualId: string | Object or null | Retrieve member by ID. |
| 173 | `getHouseholdByMemberEmail(email)` | email: string | Object or null | Get household via member email. |
| 666 | `_getPrimaryEmail(householdId)` | householdId: string | string | Get primary member's email. |
| 674 | `_getPrimaryFirstName(householdId)` | householdId: string | string | Get primary member's first name. |
| 682 | `_getPrimaryFullName(householdId)` | householdId: string | string | Get primary member's full name. |

### Household Operations

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 119 | `getHouseholdById(householdId)` | householdId: string | Object or null | Retrieve household record. |
| 140 | `getHouseholdMembers(householdId)` | householdId: string | Array | Get all individuals in household. |
| 183 | `getMembershipLevel(levelId)` | levelId: string | Object | Retrieve membership level configuration. |

### Eligibility & Access Checks

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 214 | `isActiveMember(email)` | email: string | boolean | Check if member active (not expired/deactivated). |
| 241 | `canAccessUnaccompanied(individualId)` | individualId: string | boolean | Check if individual can use facilities alone (age). |
| 252 | `isFitnessEligible(individualId)` | individualId: string | boolean | Check if individual eligible for fitness center. |
| 264 | `isVotingEligible(individualId)` | individualId: string | boolean | Check if individual is voting member. |

### Member Updates & Creation

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 287 | `updateMemberField(individualId, fieldName, value, boardEmail)` | individualId: string, fieldName: string, value: any, boardEmail: string | {success, message} | Update single member field with audit log. |
| 303 | `updateHouseholdField(householdId, fieldName, value, boardEmail)` | householdId: string, fieldName: string, value: any, boardEmail: string | {success, message} | Update single household field with audit log. |
| 314 | `_updateField(spreadsheetId, tabName, lookupColumn, lookupValue, fieldName, newValue, boardEmail)` | (detailed) | {success, message} | Generic field update with audit logging. |
| 355 | `createHouseholdRecord(householdData, createdBy)` | householdData: object, createdBy: string | {success, householdId, message} | Create new household record. |
| 386 | `createMemberRecord(householdId, individualData, createdBy)` | householdId: string, individualData: object, createdBy: string | {success, individualId, message} | Create new individual record. |

### Member Status & Document Checks

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 436 | `deactivateMember(individualId, actingBy)` | individualId: string, actingBy: string | {success, message} | Deactivate member account. |
| 470 | `updatePhotoStatus(individualId, status, timestamp, file_id)` | individualId: string, status: string, timestamp: Date, file_id: string | {success, message} | Update member's photo status. |
| 513 | `checkBirthdays()` | none | Array | Scan for upcoming birthdays. |
| 564 | `checkExpiringDocuments()` | none | Array | Find documents expiring within 6 months. |
| 598 | `checkExpiringMemberships()` | none | Array | Find memberships expiring soon. |

### Test Functions

| Line | Function | Purpose |
|------|----------|---------|
| 17 | `testGetMemberByEmail()` | Test function for getMemberByEmail(). |
| 26 | `testPasswordHash()` | Test password hashing. |
| 38 | `testFullLogin()` | Integration test for full login flow. |

---

## ApplicationService.js (Membership Applications)

**27 functions for 11-step application workflow**

### Application Creation & Retrieval

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 43 | `createApplicationRecord(formData, createdBy)` | formData: object, createdBy: string | {success, applicationId, householdId, email, tempPassword, message} | Create new membership application. Initiates 11-step workflow. |
| 339 | `getApplicationForApplicant(email)` | email: string | Object or null | Retrieve application for logged-in applicant. |
| 506 | `getApplicationDetail(applicationId)` | applicationId: string | Object | Get full application record with related data. |

### Application Listing & Management

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 465 | `listApplicationsForBoard(statusFilter)` | statusFilter: string (optional) | Array | Get all applications for board review (by status). |
| 416 | `confirmDocumentsUploaded(applicationId, email)` | applicationId: string, email: string | {success, message} | Confirm all required documents uploaded; advances application to board_initial_review. Verifies ownership via primary_applicant_email. |

### Application Workflow Steps

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 550 | `boardInitialDecision(applicationId, decision, boardEmail, notes, reason)` | applicationId: string, decision: "approved" or "denied", boardEmail: string, notes: string, reason: string | {success, message} | Board makes initial decision (step 2→3 or 7). |
| 629 | `rsoDecision(applicationId, decision, rsoEmail, privateNotes, publicReason)` | applicationId: string, decision: "approved" or "denied", rsoEmail: string, privateNotes: string, publicReason: string | {success, message} | RSO approves/rejects documents (step 3→4 or 6). |
| 707 | `boardFinalDecision(applicationId, decision, boardEmail, notes, reason)` | applicationId: string, decision: "approved" or "denied", boardEmail: string, notes: string, reason: string | {success, message} | Board final approval after RSO review (step 4→5 or 6). |
| 794 | `submitPaymentProof(applicationId, email, paymentMethod, proofFileId, notes)` | applicationId: string, email: string, paymentMethod: string, proofFileId: string, notes: string | {success, paymentId, message} | Applicant submits payment proof (step 8→9). |
| 884 | `verifyAndActivateMembership(applicationId, treasurerEmail)` | applicationId: string, treasurerEmail: string | {success, message} | Treasurer verifies payment and activates membership (step 10→11). |

### Application Internals

| Line | Function | Purpose |
|------|----------|---------|
| 966 | `_getApplicationById(applicationId)` | Get application by ID. |
| 985 | `_getApplicationByHouseholdId(householdId)` | Get application by household ID. |
| 1004 | `_findApplicationRow(applicationId)` | Find application row in sheet. |
| 1022 | `_findHouseholdRow(householdId)` | Find household row in sheet. |
| 1040 | `_findIndividualRow(individualId)` | Find individual row in sheet. |
| 1058 | `_findPaymentRow(paymentId)` | Find payment row in sheet. |
| 1076 | `_getIndividualsByHouseholdId(householdId)` | Get all individuals in household. |
| 1095 | `_getFileSubmissionsForIndividual(individualId)` | Get file submissions for individual. |
| 1114 | `_generatePaymentReference(lastName)` | Generate payment reference number. |
| 1121 | `_getMembershipLevelId(category, householdType)` | Get membership level ID for category. |
| 1139 | `_getCurrentQuarterInfo_()` | Get current quarter (Q1-Q4) info. |
| 1155 | `_calculateDuesAmount(applicationId)` | Calculate prorated dues for application. |
| 1190 | `_calculateMembershipExpiration()` | Calculate membership expiration date (July 31). |
| 1205 | `_generateTemporaryPassword()` | Generate random temporary password. |
| 1214 | `_getHeaderIndex(headers, columnName)` | Get column index by name. |
| 1223 | `_getColumnIndex(tabName, columnName)` | Get column index in sheet tab. |
| 1247 | `_objectToRow(obj, tabName)` | Convert object to spreadsheet row. |
| 1270 | `_rowToObject(row, headers)` | Convert spreadsheet row to object. |

---

## ReservationService.js (Facility Reservations)

**40 functions for booking, approvals, and guest lists**

### Limit Checking

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 26 | `getTennisHoursThisWeek(householdId, forDate)` | householdId: string, forDate: Date | number (hours) | Calculate tennis hours used this week. |
| 41 | `getLeoboReservationsThisMonth(householdId, forDate)` | householdId: string, forDate: Date | Array | Get leobo reservations for month. |
| 59 | `getLeoboHoursThisMonth(householdId, forDate)` | householdId: string, forDate: Date | number (count) | Count leobo reservations this month. |
| 81 | `checkReservationLimits(householdId, facility, startDate, startTime, endTime)` | householdId: string, facility: string, startDate: Date, startTime: string, endTime: string | {allowed, limitExceeded, currentUsage, limit, reason} | Check if reservation exceeds limits. |

### Reservation Core Operations

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 190 | `createReservation(params)` | params: object | {success, reservationId, status, message} | Create new facility reservation. Checks limits, routes to approval. |
| 413 | `approveReservation(reservationId, approvedBy, notes)` | reservationId: string, approvedBy: string, notes: string | {success, message} | Board approves pending reservation. |
| 491 | `denyReservation(reservationId, deniedBy, reason)` | reservationId: string, deniedBy: string, reason: string | {success, message} | Board denies reservation. |
| 534 | `cancelReservation(reservationId, cancelledBy, reason, skipNotification)` | reservationId: string, cancelledBy: string, reason: string, skipNotification: bool | {success, message} | Cancel approved reservation. |
| 1617 | `getReservationById(reservationId)` | reservationId: string | Object or null | Retrieve reservation record. |

### Calendar Integration

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 298 | `createCalendarEvent(reservation, hh)` | reservation: object, hh: household object | string (event ID) | Create Google Calendar event for reservation. |
| 360 | `updateCalendarEventStatus(eventId, newStatus, facility, date)` | eventId: string, newStatus: string, facility: string, date: Date | boolean | Update calendar event status tag ([TENTATIVE], [APPROVED], etc). |

### Waitlist Management

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 589 | `addToWaitlist(reservationId, placedBy, position)` | reservationId: string, placedBy: string, position: number | {success, message} | Add reservation to waitlist. |
| 635 | `approveBump(reservationId, approvedBy, notes)` | reservationId: string, approvedBy: string, notes: string | {success, message} | Promote waitlisted to approved. |
| 684 | `promoteFromWaitlist(facility, reservationDate)` | facility: string, reservationDate: Date | Object or null | Auto-promote oldest waitlist item. |
| 759 | `expireWaitlistPositions()` | none | Array | Auto-promote after 5 business days (nightly). |
| 811 | `_countWaitlistedForFacility(facility, reservationDate)` | facility: string, reservationDate: Date | number | Count waitlist items for facility/date. |

### Guest List Management

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 150 | `getGuestListDeadline(eventDate)` | eventDate: Date | Date | Calculate guest list deadline (2 days before). |
| 161 | `isGuestListDeadlineMet(eventDate)` | eventDate: Date | boolean | Check if deadline has passed. |
| 1104 | `submitGuestList(reservationId, guests, submittedBy)` | reservationId: string, guests: array, submittedBy: string | {success, guestListId, message} | Member submits guest list for event. |
| 1196 | `getGuestListForReservation(reservationId)` | reservationId: string | Object or null | Retrieve guest list for reservation. |
| 1227 | `getGuestListsByStatus(status)` | status: string | Array | Get guest lists by approval status. |
| 1262 | `saveGuestProfile(householdId, guestData, userName)` | householdId: string, guestData: object, userName: string | {success, guestProfileId, message} | Save guest profile for future reference. |
| 1327 | `getGuestProfiles(householdId)` | householdId: string | Array | Get saved guest profiles for household. |
| 1358 | `getGuestHistoryByIdNumbers(idNumbers)` | idNumbers: array | Array | Get guest history by ID numbers. |
| 1418 | `saveGuestListDraft(guestListId, decisions, userName)` | guestListId: string, decisions: object, userName: string | {success, message} | Board saves draft guest list review. |
| 1465 | `finalizeGuestListReview(guestListId, decisions, userName)` | guestListId: string, decisions: object, userName: string | {success, message} | Board finalizes guest list review. |
| 1529 | `_sendApprovedGuestListToRso(gl, guests, reservation)` | (detailed) | none | Send approved list to RSO. |
| 1573 | `_sendGuestListRejectionsToBoard(gl, guests, reservation)` | (detailed) | none | Send rejections to board. |

### Calendar & Reporting

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 1671 | `_updateReservationField(reservationId, fieldName, value)` | reservationId: string, fieldName: string, value: any | {success, message} | Update single reservation field. |
| 1683 | `_sumReservationHours(householdId, facility, startDate, endDate)` | householdId: string, facility: string, startDate: Date, endDate: Date | number (hours) | Sum reservation hours in date range. |
| 1711 | `_countReservations(householdId, facilities, startDate, endDate)` | householdId: string, facilities: array, startDate: Date, endDate: Date | number (count) | Count reservations in date range. |
| 1737 | `_sendReservationNotifications(params, row, status)` | (detailed) | none | Send notification emails for reservation. |
| 1856 | `resendReservationEmail(reservationId, senderEmail)` | reservationId: string, senderEmail: string | {success, message} | Board resends reservation notification. |
| 1926 | `getApprovedReservationsForCalendar(month, facility)` | month: string "YYYY-MM", facility: string (optional) | Array | Get approved reservations for calendar. |
| 1979 | `getAllReservationsForCalendar(month, facility, includeApprovalStatus)` | month: string, facility: string (optional), includeApprovalStatus: bool | Array | Get all reservations (board view). |
| 2037 | `getApprovedGuestListsForRsoNotify(month, facility)` | month: string, facility: string (optional) | Array | Get approved guest lists for RSO. |

### Nightly Tasks

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 850 | `processBumpWindowExpirations()` | none | Array | Process waitlist bump window expirations (nightly). |
| 896 | `sendGuestListReminders()` | none | number (sent) | Send guest list deadline reminders (nightly). |
| 951 | `sendReservationApprovalReminders()` | none | number (sent) | Send approval reminders (nightly). |
| 1005 | `sendRsoDailySummary()` | none | Object | Send RSO daily summary of events. |

---

## PaymentService.js (Payment Verification)

**19 functions for payment submission, verification, and reporting**

### Core Payment Operations

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 22 | `submitPaymentVerification(params)` | params: object | {success, paymentId, message} | Member submits payment proof. |
| 157 | `getPaymentVerificationStatus(householdId, membershipYear)` | householdId: string, membershipYear: string | {status, verifiedDate, amount, ...} | Get payment verification status for household. |
| 204 | `listPendingPaymentVerifications()` | none | Array | Get all unverified payments. |
| 232 | `approvePaymentVerification(paymentId, treasurerEmail, notes)` | paymentId: string, treasurerEmail: string, notes: string | {success, message} | Treasurer approves payment. |
| 286 | `rejectPaymentVerification(paymentId, treasurerEmail, reason)` | paymentId: string, treasurerEmail: string, reason: string | {success, message} | Treasurer rejects payment. |
| 337 | `requestPaymentClarification(paymentId, treasurerEmail, question)` | paymentId: string, treasurerEmail: string, question: string | {success, message} | Treasurer requests clarification. |

### Dues & Exchange Rates

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 386 | `calculateProratedDues(annualDuesUsd)` | annualDuesUsd: number | {Q1, Q2, Q3, Q4} | Calculate quarterly prorated dues. |
| 513 | `fetchAndUpdateExchangeRate()` | none | {success, rate} | Fetch current USD→BWP rate from API (nightly). |
| 765 | `getExchangeRate()` | none | number | Get current USD→BWP exchange rate. |

### Payment Internals

| Line | Function | Purpose |
|------|----------|---------|
| 417 | `_getAcceptablePaymentYears_(membershipLevelId)` | Get acceptable payment years for level. |
| 441 | `_getPaymentsSheet_()` | Get Payments sheet reference. |
| 448 | `_appendRowByHeaders_(sheet, obj)` | Append object as row to sheet. |
| 458 | `_findPaymentById_(paymentId)` | Find payment row by ID. |
| 474 | `_setPaymentFields_(found, patch)` | Update payment fields. |
| 489 | `_getAllPayments_()` | Get all payment records. |
| 501 | `_getPaymentsForHousehold_(householdId)` | Get payments for household. |
| 567 | `_appendRateRow_(rateDateStr, usdToBwp, source)` | Append exchange rate row. |

### Reporting & API

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 631 | `backfillExchangeRates(startDateStr, endDateStr)` | startDateStr: string, endDateStr: string | Object | Backfill exchange rates from API. |
| 694 | `_fetchFawazRate_(dateStr)` | dateStr: string | Object or null | Fetch rate from fawaz API. |
| 720 | `debugExchangeRateApis()` | none | Object | Debug exchange rate APIs. |
| 785 | `getPaymentReport(filters)` | filters: object | {payments: array, summary: {...}} | Generate payment report with filters. |

---

## EmailService.js (Email Notifications)

**15 functions for email template management and sending**

### Core Email Functions

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 36 | `sendEmail(templateId, recipient, variables, options)` | templateId: string, recipient: string, variables: object, options: object (optional) | {success, message} | Send email from template. Core function. |
| 77 | `sendEmailFromBoard(templateId, recipient, variables, options)` | templateId: string, recipient: string, variables: object, options: object | {success, message} | Send email from board email account (via OAuth). |
| 351 | `sendEmailFromTemplate(templateName, recipient, variables, options)` | templateName: string, recipient: string, variables: object, options: object | {success, message} | Send email using semantic template name. |

### Template Management

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 159 | `getEmailTemplateById(templateId)` | templateId: string | {template_id, subject, html_body, ...} | Retrieve email template by ID. |
| 207 | `getEmailTemplate(templateName)` | templateName: string | Object or null | Retrieve template by semantic name (e.g., "MEM_APPLICATION_RECEIVED_TO_APPLICANT"). |
| 309 | `validateTemplateVariables(templateName, providedVariables)` | templateName: string, providedVariables: object | {valid, missingVariables?: array} | Validate variables for template. |

### Template Rendering

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 283 | `substituteTemplateVariables(htmlBody, variables)` | htmlBody: string, variables: object | string (HTML) | Replace template placeholders with values. Handles conditional blocks. |
| 520 | `replacePlaceholders(text, variables)` | text: string, variables: object | string | Simple placeholder replacement ({{KEY}} → value). |
| 563 | `buildHtmlEmail(subject, plainText)` | subject: string, plainText: string | string (HTML email) | Wrap plain text in HTML email structure. |
| 641 | `plainTextToHtml(plainText)` | plainText: string | string (HTML) | Convert plain text to HTML (newlines → <br>). |
| 722 | `escapeHtml(text)` | text: string | string (escaped) | Escape HTML special characters (XSS prevention). |

### Service Account & OAuth

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 758 | `initializeBoardServiceAccount(serviceAccountJson)` | serviceAccountJson: string | {success, message} | Initialize board service account for OAuth email. |
| 776 | `_getBoardServiceAccount()` | none | Object | Get stored board service account. |
| 808 | `_getServiceAccountAccessToken()` | none | string (JWT token) | Get OAuth access token for board email. |
| 875 | `_createSignedDomainDelegationJwt()` | none | string (JWT) | Create domain delegation JWT for OAuth. |

### Testing

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 443 | `testEmailTemplateSystem()` | none | Object | Test email template system. |

---

## FileSubmissionService.js (File & Document Management)

**26 functions for file uploads, document approval workflow**

### File Upload & Submission

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 18 | `uploadFileSubmission(params)` | params: object | {success, submissionId, message} | Upload file and create submission record. |
| 85 | `getFileSubmissionStatus(individual_id)` | individual_id: string | {passport, omang, photo, employment_verification} | Get file submission status for individual. |
| 226 | `getSubmissionHistory(individual_id)` | individual_id: string | Array | Get all file submissions for individual. |

### Document Approval (2-tier: RSO → Admin)

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 118 | `approveFileSubmission(submission_id, user_email)` | submission_id: string, user_email: string | {success, message} | Approve file submission. |
| 122 | `rejectFileSubmission(submission_id, rejection_reason, user_email)` | submission_id: string, rejection_reason: string, user_email: string | {success, message} | Reject file with reason. |
| 515 | `getDocumentsForRsoReview(documentTypeFilter)` | documentTypeFilter: string (optional) | Array | Get documents pending RSO review. |
| 565 | `approveDocumentByRso(submissionId, decision, rsoEmail, reason)` | submissionId: string, decision: string, rsoEmail: string, reason: string | {success, message} | RSO approves document. |

### RSO Approval Links

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 126 | `generateRsoApprovalLink(submission_id)` | submission_id: string | string (token) | Generate secure token for RSO approval via email link. |
| 172 | `handleRsoApprovalLink(token, action, decision, reason)` | token: string, action: string, decision: string, reason: string | {success, message} | Process RSO approval from email link. |

### Photo & Cloud Storage

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 207 | `copyApprovedPhotoToCloudStorage(submission_id, individual_id)` | submission_id: string, individual_id: string | {success, cloudStoragePath} | Transfer approved photo to Cloud Storage. |

### Verification & Cleanup

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 234 | `requestEmploymentVerification(household_id, individual_ids, requiredBy)` | household_id: string, individual_ids: array, requiredBy: Date | {success, message} | Send employment verification request. |
| 257 | `checkDocumentExpirationWarnings()` | none | Array | Find documents expiring within 6 months. |
| 278 | `deleteExpiredRsoLinks()` | none | number (deleted) | Delete old RSO approval tokens (24-hour expiration). |

### Internals

| Line | Function | Purpose |
|------|----------|---------|
| 302 | `_reviewFileSubmission_(submission_id, decision, user_email, reason)` | Review file submission (approve/reject). |
| 336 | `_getSubmissionFolderId_(documentType)` | Get Drive folder for document type. |
| 342 | `_getFileSubmissionsSheet_()` | Get File Submissions sheet reference. |
| 346 | `_appendRowByHeaders_(sheet, obj)` | Append object as row to sheet. |
| 353 | `_findSubmissionById_(submissionId)` | Find submission row by ID. |
| 366 | `_findSubmissionByToken_(token)` | Find submission by RSO token. |
| 379 | `_setSubmissionFields_(found, patch)` | Update submission fields. |
| 391 | `_getSubmissionsForIndividual_(individualId)` | Get submissions for individual. |
| 400 | `_getAllSubmissions_()` | Get all submission records. |
| 413 | `removeDocumentSubmission(individualId, documentType, submissionId, userName)` | Remove document submission. |
| 442 | `_expireCurrentSubmission_(individualId, documentType)` | Expire current approved submission. |
| 457 | `_buildStatusForType_(submissions, documentType)` | Build status object for document type. |
| 491 | `_allRequiredFilesComplete_(submissions)` | Check if all required files submitted. |

---

## NotificationService.js (Notifications & Nightly Tasks)

**12 functions for scheduled notifications and maintenance**

### Nightly Tasks

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 34 | `runNightlyTasks()` | none | {success, tasksCompleted: array} | Run all nightly maintenance (sessions, reminders, rates, usage). |
| 122 | `nightly_checkDocumentExpirations()` | none | number (warned) | Send warnings for expiring documents. |
| 138 | `nightly_cleanupExpiredRsoLinks()` | none | number (deleted) | Delete expired RSO approval tokens. |

### Daily Tasks

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 95 | `triggerRsoDailySummary()` | none | {success, message} | Send RSO daily summary of events (6:00 AM). |

### Household Sync

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 191 | `syncHouseholdPhonesFromPrimary()` | none | number | Sync all household members' phones from primary. |

### Reminders & Notifications

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 372 | `sendPhotoReminders()` | none | number (sent) | Send reminders to members without required photos. |
| 459 | `testAllTriggers()` | none | Object | Test all trigger functions. |
| 483 | `testRsoSummary()` | none | Object | Test RSO summary email. |

### Reports

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 523 | `sendMonthlyCollectionsReport()` | none | {success, message} | Generate and send monthly payment collections report. |
| 662 | `sendMonthlyReservationsReport()` | none | {success, message} | Generate and send monthly reservations report. |

### Caching & Helpers

| Line | Function | Purpose |
|------|----------|---------|
| 433 | `cacheRulesDocument()` | Cache rules document for fast retrieval. |
| 499 | `_isLastMondayOfMonth_(date)` | Check if date is last Monday of month. |
| 510 | `_getCurrentMembershipYear_(refDate)` | Get membership year (Aug 1 - Jul 31) for date. |
| 721 | `_buildReservationsReportStats_(refDate)` | Build reservations report statistics. |

---

## RulesService.js (Business Rules Engine)

**8 functions for rules management and agreement tracking**

### Rules Retrieval

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 25 | `getRulesText()` | none | string (plain text) | Retrieve rules from Rules Agreement tab. |
| 128 | `getCachedOrDefaultRules()` | none | string | Get rules from cache or load default. |
| 145 | `getDefaultRulesText()` | none | string | Return hard-coded default rules. |
| 243 | `getRulesHTMLDisplay()` | none | string (HTML) | Format rules for HTML display. |
| 288 | `getRulesPlainText()` | none | string (plain text) | Get rules as plain text. |

### Rules Agreement

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 326 | `recordRulesAgreement(individualId, householdId, firstName, lastName, dateSigned)` | individualId: string, householdId: string, firstName: string, lastName: string, dateSigned: Date | {success, message} | Record that member agreed to rules. |
| 368 | `validateRulesAgreement(fullName)` | fullName: string | boolean | Check if member signed rules agreement. |
| 412 | `sanitizeHtmlOutput(text)` | text: string | string (safe HTML) | Sanitize HTML for output (XSS prevention). |

---

## Utilities.js (Utility Functions)

**27 utility functions for dates, formatting, validation, and logging**

### Date & Time Utilities

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 26 | `calculateBusinessDayDeadline(eventDate, daysBack)` | eventDate: Date, daysBack: number | Date | Calculate deadline N business days before event. |
| 42 | `isBusinessDay(date)` | date: Date | boolean | Check if date is business day (not weekend/holiday). |
| 53 | `isHoliday(date)` | date: Date | boolean | Check if date is holiday. |
| 70 | `getHolidays(year)` | year: number | Array | Get all holidays for year. |
| 288 | `formatDate(date, forStorage)` | date: Date, forStorage: bool | string | Format date for display or storage (YYYY-MM-DD). |
| 308 | `formatTime(date)` | date: Date | string (HH:MM) | Format time for display (24-hour). |
| 344 | `addDays(date, days)` | date: Date, days: number | Date | Add days to date. |
| 356 | `getWeekStart(date)` | date: Date | Date | Get Monday of week containing date. |
| 371 | `getMonthStart(date)` | date: Date | Date | Get first day of month. |
| 383 | `calculateAge(dateOfBirth)` | dateOfBirth: Date | number | Calculate age from birthdate. |
| 397 | `isBirthdayToday(dateOfBirth)` | dateOfBirth: Date | boolean | Check if today is birthday (month/day only). |

### Phone Utilities

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 125 | `formatPhoneNumber(countryCode, phoneNumber)` | countryCode: string, phoneNumber: string | string | Format phone number for display. |
| 178 | `isValidPhoneNumber(countryCode, phoneNumber)` | countryCode: string, phoneNumber: string | boolean | Validate phone number format. |
| 220 | `countryCodeToDialCode(countryCode)` | countryCode: string | string | Convert ISO country code to dial code (+1, etc.). |
| 242 | `dialCodeToCountryCode(dialCode)` | dialCode: string | string | Convert dial code to country code. |

### ID & Configuration

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 259 | `generateId(prefix)` | prefix: string | string | Generate unique ID with prefix (e.g., "RES-2026-001234"). |
| 418 | `getConfigValue(key)` | key: string | any | Retrieve configuration value from Config sheet. |
| 443 | `setConfigValue(key, value)` | key: string, value: any | {success} | Update configuration value. |

### Formatting & Currency

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 326 | `formatCurrency(amount, currency)` | amount: number, currency: string "USD" or "BWP" | string | Format amount as currency ($123.45 or P456.78). |

### Validation

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 501 | `isValidEmail(email)` | email: string | boolean | Validate email format (basic regex). |
| 507 | `isValidPhone(phone)` | phone: string | boolean | Validate phone format. |
| 517 | `sanitizeInput(input)` | input: string | string (sanitized) | Clean user input to prevent injection. |
| 534 | `capitalizeName(name)` | name: string | string | Capitalize first letter of each word. |

### Audit & Response

| Line | Function | Parameters | Returns | Purpose |
|------|----------|-----------|---------|---------|
| 476 | `logAuditEntry(userEmail, actionType, targetType, targetId, details, ipAddress)` | (detailed) | none | Log action to audit trail (compliance). |
| 563 | `successResponse(data, message)` | data: any, message: string | string (JSON) | Build standardized success JSON response. |
| 567 | `errorResponse(message, code)` | message: string, code: string | string (JSON) | Build standardized error JSON response. |
| 583 | `rowToObject(headers, row)` | headers: array, row: array | Object | Convert spreadsheet row to object (map by headers). |

---

## Tests.js (Test Suite)

**40+ test functions for system validation and debugging**

The test suite includes:
- **Auth tests** (login, password, sessions, tokens)
- **File upload tests** (submissions, documents, photos)
- **Payment tests** (submission, approval, reporting)
- **Reservation tests** (limits, approval routing, waitlist)
- **Guest list tests** (submission, deadlines)
- **Email tests** (template loading, sending)
- **Member tests** (lookup, creation, eligibility)
- **Config tests** (validation, value access)
- **Utility tests** (dates, formatting, validation)
- **Admin handler tests** (authorization checks)
- **Integration tests** (end-to-end flows)

Key test runner functions:
- `runAllTests()` - Master test runner
- `runAuthRegressionTests()` - Authentication tests
- `runFileUploadTests()` - File upload tests
- `runPaymentTests()` - Payment tests
- `runReservationTests()` - Reservation tests
- `runReportTests()` - Report tests
- `runAdminHandlerTests()` - Admin authorization tests

---

## Config.js (Configuration Constants)

**10 major sections of configuration constants**

| Section | Purpose | Examples |
|---------|---------|----------|
| **Spreadsheet IDs** | Main data sources | MEMBER_DIRECTORY_ID, RESERVATIONS_ID, SYSTEM_BACKEND_ID, PAYMENT_TRACKING_ID |
| **Tab Names** | Sheet tab names | TAB_HOUSEHOLDS, TAB_INDIVIDUALS, TAB_FILE_SUBMISSIONS, TAB_RESERVATIONS |
| **Folder IDs** | Google Drive folders | DOCUMENTS_FOLDER_ID, PHOTOS_FOLDER_ID, CLOUD_STORAGE_FOLDER_ID |
| **Email Config** | Email settings | GEA_EMAIL, BOARD_EMAIL, CALENDAR_ID, REPLY_TO_EMAIL |
| **Business Rules** | System thresholds | PASSWORD_MIN_LENGTH, SESSION_TIMEOUT_HOURS, MAX_FILE_SIZE_MB |
| **Facility Limits** | Reservation limits | TENNIS_HOURS_PER_WEEK (3), LEOBO_BOOKINGS_PER_MONTH (1) |
| **Age Thresholds** | Age-based access | UNACCOMPANIED_ACCESS_AGE, FITNESS_CENTER_MIN_AGE, VOTING_AGE |
| **Membership** | Member categories | MEMBERSHIP_LEVEL_IDs (Full, Associate, Affiliate, Diplomatic, Temporary, Community) |
| **Payment Config** | Payment settings | ANNUAL_DUES_USD, EXCHANGE_RATE_DEFAULT, PAYMENT_METHODS (PayPal, Zelle, Absa, SDFCU) |
| **Versions** | System versions | SYSTEM_VERSION, BUILD_ID, DEPLOYMENT_TIMESTAMP, SYSTEM_BUILD_DATE, SYSTEM_LAST_FEATURE |

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Total Functions** | 359+ |
| **Code.js** | 92 handler functions |
| **AuthService.js** | 32 authentication functions |
| **MemberService.js** | 20 member operations |
| **ApplicationService.js** | 27 application workflow functions |
| **ReservationService.js** | 40 reservation functions |
| **PaymentService.js** | 19 payment functions |
| **EmailService.js** | 15 email functions |
| **FileSubmissionService.js** | 26 file management functions |
| **NotificationService.js** | 12 notification functions |
| **RulesService.js** | 8 rules functions |
| **Utilities.js** | 27 utility functions |
| **Tests.js** | 40+ test functions |

---

## How to Use This Glossary

1. **Find a function**: Use `Ctrl+F` to search by name
2. **Understand flow**: Look at "Called by" to trace dependencies
3. **Trace data**: Follow function calls from handler → service → utility
4. **Check parameters**: Verify input types match function signature
5. **Understand patterns**:
   - Private functions start with `_` (internal use only)
   - Public functions are called from handlers
   - Service modules are cohesive units (AuthService handles all auth)

---

## Additional Useful Information

### Function Naming Conventions
- **Public handler functions**: `_handle<Operation>` (e.g., `_handleLogin`)
- **Internal helper functions**: `_<operation>` (e.g., `_createSession`)
- **Service functions**: `<verb><Noun>` (e.g., `getMemberByEmail`)
- **Test functions**: `test<Feature>` (e.g., `testFileUploadSystem`)

### Return Value Patterns
- **Success responses**: `{success: true, data..., message?}`
- **Error responses**: `{success: false, message, code?}`
- **Data retrievals**: Object or Array (null if not found)
- **Calculations**: Primitive type (number, string, boolean)

### Parameter Patterns
- **Email operations**: Usually include `token` for authorization
- **Updates**: Include `createdBy` or `actingBy` for audit logging
- **Filters**: Often `status`, `facility`, `date` parameters
- **Complex operations**: Use `params: object` to handle multiple parameters

### Error Handling
- Errors thrown as strings (caught by handlers)
- Handlers return JSON with error messages
- Audit logging for security-sensitive operations
- Rate limiting for password resets and sensitive actions

---

**Last Updated**: March 30, 2026
**Total Functions Documented**: 359+
**Modules Covered**: 12 (Code, Auth, Member, Application, Reservation, Payment, Email, FileSubmission, Notification, Rules, Utilities, Tests)

