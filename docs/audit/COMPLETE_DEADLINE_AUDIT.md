# Complete Deadline Audit: All Deadline Calculations in Codebase

**Scope:** All `.js` files  
**Date:** 2026-04-29  
**Total References Found:** 111 lines  
**Status:** Under Review

---

## Summary by Type

| Category | Count | Status | Action |
|----------|-------|--------|--------|
| **Calendar Days** (addDays, raw getTime) | 15+ | ❌ NEEDS FIX | Apply addBusinessDays |
| **Business Days** (calculateBusinessDayDeadline) | 3 | ✅ OK | No change |
| **Fixed Dates** (document expiration, July 31) | 10+ | ✅ OK | No change |
| **Time-based** (sessions, tokens, non-deadline) | 30+ | ℹ️ N/A | No change |
| **Variables/Config** (deadline constants) | 40+ | ⚠️ AUDIT | Review sources |

---

## Detailed Breakdown by File

### **ApplicationService.js** (4 deadline calculations)

#### ❌ Line 712: RSO Document Approval Deadline
```javascript
APPROVAL_DEADLINE: formatDate(addDays(new Date(), 5))
```
- **Type:** Calendar days (5 days = includes weekends)
- **Email:** ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE
- **Context:** RSO must review documents
- **Status:** NEEDS FIX → Use `addBusinessDays(new Date(), 5)`

#### ❌ Line 818: Document Issue Resolution Deadline
```javascript
DEADLINE_TO_RESOLVE: formatDate(addDays(new Date(), 7))
```
- **Type:** Calendar days (7 days = almost certainly includes weekend)
- **Email:** ADM_RSO_DOCUMENT_ISSUE_TO_BOARD
- **Context:** Board must resolve RSO-flagged document issue
- **Status:** NEEDS FIX → Use `addBusinessDays(new Date(), 7)`

#### ❌ Line 825: Document Resubmission Deadline
```javascript
RESUBMIT_DEADLINE: formatDate(addDays(new Date(), 7))
```
- **Type:** Calendar days (7 calendar days)
- **Email:** DOC_DOCUMENT_REJECTED_TO_MEMBER (and variants)
- **Context:** Applicant must resubmit rejected document
- **Status:** NEEDS FIX → Use `addBusinessDays(new Date(), 7)`

#### ❌ Line 890: Payment Deadline
```javascript
PAYMENT_DEADLINE: formatDate(addDays(new Date(), 30))
```
- **Type:** Calendar days (currently 30 calendar days)
- **Email:** MEM_APPLICATION_APPROVED_TO_APPLICANT
- **Context:** Applicant must submit payment to activate
- **Status:** NEEDS FIX → Use `addBusinessDays(new Date(), 15)`
- **Rationale:** 15 business days (vs. 30 calendar days = 4.3 weeks) is more reasonable for payment deadline

---

### **FileSubmissionService.js** (7 deadline calculations)

#### ❌ Line 179: RSO Link Expiry (TO BE REMOVED)
```javascript
var expiresAt = new Date(new Date().getTime() + (RSO_APPROVAL_LINK_EXPIRY_HOURS * 60 * 60 * 1000));
```
- **Type:** Hours-based expiration (internal token)
- **Context:** RSO approval link validity
- **Status:** ❌ TO REMOVE - Per user: "RSO links have been done away with"
- **Related Code:** Line 198 (APPROVAL_DEADLINE variable that uses expiresAt)
- **Action:** Delete lines 179 and 198 (feature discontinued, no longer used)

#### ❌ Line 599: Photo Resubmission Deadline
```javascript
RESUBMIT_DEADLINE: formatDate(new Date(new Date().getTime() + (10 * 24 * 60 * 60 * 1000)))
```
- **Type:** Raw millisecond calculation (10 calendar days)
- **Email:** DOC_PHOTO_REJECTED_TO_MEMBER
- **Context:** Member must resubmit rejected photo
- **Status:** NEEDS FIX → Use `addBusinessDays(new Date(), 10)`

#### ❌ Line 607: Document Resubmission Deadline
```javascript
RESUBMIT_DEADLINE: formatDate(new Date(new Date().getTime() + (10 * 24 * 60 * 60 * 1000)))
```
- **Type:** Raw millisecond calculation (10 calendar days)
- **Email:** DOC_DOCUMENT_REJECTED_TO_MEMBER
- **Context:** Member must resubmit rejected document
- **Status:** NEEDS FIX → Use `addBusinessDays(new Date(), 10)`

#### ⚠️ Line 628: Resubmit Deadline (Variable)
```javascript
var resubmitDeadline = new Date(new Date().getTime() + (10 * 24 * 60 * 60 * 1000));
```
- **Type:** Raw millisecond calculation (10 calendar days)
- **Used in:** Lines 636, 646 (multiple emails)
- **Emails:** DOC_DOCUMENT_REJECTED_TO_BOARD, DOC_DOCUMENT_REJECTION_SENT_TO_BOARD
- **Context:** Board rejection message to member
- **Status:** NEEDS FIX → Use `addBusinessDays(new Date(), 10)`

#### ⚠️ Line 1217: Resubmit Deadline (Another variable)
```javascript
var resubmitDeadline = new Date(new Date().getTime() + (10 * 24 * 60 * 60 * 1000));
```
- **Type:** Raw millisecond calculation (10 calendar days)
- **Used in:** Line 1241 (SUGGESTED_DEADLINE)
- **Email:** ADM_RSO_DOCUMENT_ISSUE_TO_BOARD
- **Context:** Board notification of RSO document issue
- **Status:** NEEDS FIX → Use `addBusinessDays(new Date(), 10)`

#### ✅ Lines 481, 501: Passport Expiration Warnings
```javascript
sendEmailFromTemplate("MEM_PASSPORT_EXPIRATION_WARNING_6M_TO_MEMBER", individual.email, {...})
sendEmailFromTemplate("MEM_PASSPORT_EXPIRATION_WARNING_1M_TO_MEMBER", individual.email, {...})
```
- **Type:** Fixed document expiration dates (not member action deadlines)
- **Status:** ✅ OK - These are document expiration dates, not action deadlines

---

### **MemberService.js** (4 deadline calculations)

#### ❌ Line 527: Resubmission Deadline
```javascript
RESUBMIT_DEADLINE: formatDate(addDays(new Date(), 14))
```
- **Type:** Calendar days (14 days)
- **Email:** Unknown (related to member document resubmission)
- **Context:** Member must resubmit document
- **Status:** NEEDS FIX → Use `addBusinessDays(new Date(), 14)`

#### ✅ Line 622: Passport Warning Window (CLARIFIED)
```javascript
var warnBefore = addDays(new Date(), PASSPORT_WARNING_MONTHS * 30);
```
- **Type:** Calendar days comparison (~6 months = ~180 days)
- **Context:** Trigger first passport expiration warning 6 months before expiration
- **Status:** ✅ OK - 6 MONTHS is the correct business requirement (verified by user)
- **Note:** Internal calculation for trigger timing, not member-facing deadline. No change needed.

#### ✅ Lines 636-639: Passport Expiration Warning
```javascript
sendEmailFromTemplate("MEM_PASSPORT_EXPIRATION_WARNING_TO_MEMBER", m.email, {
  EXPIRATION_DATE: formatDate(expDate)
})
```
- **Type:** Fixed document expiration date
- **Status:** ✅ OK - This is actual expiration date, not action deadline

#### ✅ Lines 657-658: Renewal Reminder Dates (CONFIRMED)
```javascript
var in30  = addDays(today, RENEWAL_REMINDER_DAYS_1);  // RENEWAL_REMINDER_DAYS_1 = 30
var in7   = addDays(today, RENEWAL_REMINDER_DAYS_2);  // RENEWAL_REMINDER_DAYS_2 = 7
```
- **Type:** Calendar days (CORRECT - user confirmed requirement)
- **Context:** Send first renewal reminder 30 calendar days before July 31 expiration; second reminder 7 days before
- **Status:** ✅ OK - Per user: "Membership-renewal first-notice should be 30 calendar days before expiration"
- **Note:** These are trigger dates for sending reminders, not action deadlines. No change needed.

#### ✅ Lines 681, 689: Renewal Deadline (Display)
```javascript
RENEWAL_DEADLINE: formatDate(expDate)  // expDate = July 31 (membership expiration)
```
- **Type:** Fixed membership expiration date
- **Status:** ✅ OK - This is actual expiration (July 31), not action deadline

#### ✅ Line 704: Grace Period End Date (CONFIRMED)
```javascript
var graceEndDate = addDays(expDate, RENEWAL_GRACE_PERIOD_DAYS);
```
- **Type:** Calendar days added to July 31
- **Context:** Calculate when membership is fully lapsed (after grace period)
- **Status:** ✅ OK - Per user: "Grace period can be shown to members when they log into the portal"
- **Note:** This is a display value in the portal, not an action deadline. No change needed.

---

### **ReservationService.js** (6 deadline/date calculations)

#### ✅ Line 151: Guest List Deadline (CORRECT)
```javascript
return calculateBusinessDayDeadline(eventDate, GUEST_LIST_DEADLINE_DAYS);
```
- **Type:** Business days (CORRECT pattern!)
- **Context:** Guest list due 4 business days before event
- **Status:** ✅ OK - Using correct business day function

#### ⚠️ Line 216: Tennis Bump Window (Negative addDays)
```javascript
bumpDeadline = addDays(params.eventDate, -TENNIS_BUMP_WINDOW_DAYS);
```
- **Type:** Calendar days, negative (days BEFORE event)
- **Context:** Tennis bump window deadline
- **Status:** ⚠️ INVESTIGATE - Should this use business days for consistency?

#### ✅ Line 218: Leobo Bump Window (CORRECT)
```javascript
bumpDeadline = calculateBusinessDayDeadline(params.eventDate, LEOBO_BUMP_WINDOW_DAYS);
```
- **Type:** Business days (CORRECT pattern!)
- **Context:** Leobo bump window deadline
- **Status:** ✅ OK - Using correct business day function

#### ℹ️ Lines 28, 43, 694, 816: Range Calculations (Non-deadline)
```javascript
var weekEnd = addDays(weekStart, 7);
var monthEnd = addDays(monthStart, 32);
rangeEnd = addDays(rangeStart, 7);
```
- **Type:** Calendar arithmetic for date ranges
- **Context:** Used for querying/filtering, not displaying deadlines
- **Status:** ℹ️ N/A - Not member-facing deadlines

---

### **Config.js** (Constants)

#### ✅ Line 368: GUEST_LIST_DEADLINE_DAYS = 4
```javascript
var GUEST_LIST_DEADLINE_DAYS = 4;  // Business days before event
```
- **Status:** ✅ OK - Constant used with `calculateBusinessDayDeadline()`

#### ✅ Line 370: RSO_APPROVAL_DEADLINE_DAYS = 5
```javascript
var RSO_APPROVAL_DEADLINE_DAYS = 5;  // Business days
```
- **Status:** ✅ OK - Constant, used with business day logic

#### ⚠️ Lines 570-571: Renewal Reminder Days
```javascript
var RENEWAL_REMINDER_DAYS_1 = 30;    // First reminder: 30 days before expiry
var RENEWAL_REMINDER_DAYS_2 = 7;     // Second reminder: 7 days before expiry
```
- **Status:** ⚠️ INVESTIGATE - Calendar days before July 31 expiration
- **Note:** These are reminder triggers, not displayed deadlines

---

### **AuthService.js** (Time-based, not deadlines)

#### ℹ️ Line 683: Password Reset Window
```javascript
var expiryTime = new Date(now.getTime() + PASSWORD_RESET_WINDOW_MINUTES * 60000);
```
- **Type:** Time-based window (minutes)
- **Status:** ℹ️ N/A - Not a member action deadline (internal system)

#### ℹ️ Line 1330: Session Timeout
```javascript
return new Date(new Date().getTime() + SESSION_TIMEOUT_HOURS * 60 * 60 * 1000);
```
- **Type:** Time-based session (hours)
- **Status:** ℹ️ N/A - Not a member action deadline (technical timeout)

---

### **NotificationService.js**

#### ⚠️ Line 419: Photo Submission Reminder Deadline (PENDING CLARIFICATION)
```javascript
var deadline = new Date();
deadline.setDate(deadline.getDate() + 14);
sendEmailFromTemplate("DOC_PHOTO_SUBMISSION_REMINDER_TO_MEMBER", m.email, {
  SUBMISSION_DEADLINE: formatDate(deadline)
})
```
- **Type:** Calendar days (14 days from today)
- **Email:** DOC_PHOTO_SUBMISSION_REMINDER_TO_MEMBER
- **Context:** Reminder sent to new members to submit profile photo
- **Trigger:** `sendPhotoReminders()` in NotificationService.js
- **Status:** ⚠️ PENDING - User noted "unclear" purpose
- **Question:** Is this a hard deadline (action required) or a courtesy reminder? If hard deadline, should it be business days?
- **Notes:** 
  - This appears to be part of onboarding flow (triggered ~14 days after membership activation)
  - Different from document rejection deadlines (which are clearly action deadlines)
  - Need user clarification on business requirement before fixing

#### ℹ️ Line 504: Date Arithmetic
```javascript
var nextWeek = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
```
- **Type:** Calendar arithmetic (non-deadline)
- **Status:** ℹ️ N/A

---

## Summary by Status

### ❌ NEEDS FIX (Apply addBusinessDays)
| File | Line | Type | Item | Business Days |
|------|------|------|------|---|
| ApplicationService.js | 712 | Calendar days | RSO approval deadline | 5 |
| ApplicationService.js | 818 | Calendar days | Document issue resolution | 7 |
| ApplicationService.js | 825 | Calendar days | Document resubmission | 7 |
| ApplicationService.js | 890 | Calendar days → Business days | **Payment deadline** | **15** (was 30 calendar) |
| FileSubmissionService.js | 599 | Raw milliseconds | Photo resubmission | 10 |
| FileSubmissionService.js | 607 | Raw milliseconds | Document resubmission | 10 |
| FileSubmissionService.js | 628, 636, 646 | Raw milliseconds | Document rejection (Board) | 10 |
| FileSubmissionService.js | 1217, 1241 | Raw milliseconds | RSO document issue deadline | 10 |
| MemberService.js | 527 | Calendar days | Document resubmission | 14 |

**Total: 9 high-priority fixes needed**
**Payment deadline change:** User confirmed "Payment deadline is actually just a suggestion. Let's say 15 business days."

---

### ✅ OK (No change needed)
- Line 151: ReservationService - Guest list deadline (uses calculateBusinessDayDeadline) ✓
- Line 218: ReservationService - Leobo bump window (uses calculateBusinessDayDeadline) ✓
- Line 622: MemberService - Passport warning window (6 months trigger, confirmed by user) ✓
- Line 657-658: MemberService - Renewal reminder dates (30 calendar days trigger, confirmed by user) ✓
- Line 704: MemberService - Grace period (display in portal, confirmed by user) ✓
- Lines 481, 501: Passport expiration warnings (fixed document dates) ✓
- All renewal deadlines that reference July 31 (fixed membership year end) ✓

---

### ⚠️ NEEDS INVESTIGATION / CLARIFICATION
| File | Line | Status | Resolution |
|------|------|--------|---|
| FileSubmissionService.js | 179 | ❌ CONFIRMED REMOVE | RSO links discontinued (user verified) - DELETE |
| MemberService.js | 622 | ✅ CONFIRMED OK | 6-month passport warning trigger (user verified) - NO CHANGE |
| MemberService.js | 657-658 | ✅ CONFIRMED OK | 30-day renewal reminder trigger (user verified) - NO CHANGE |
| MemberService.js | 704 | ✅ CONFIRMED OK | Grace period shown in portal (user verified) - NO CHANGE |
| ReservationService.js | 216 | ⚠️ PENDING | Tennis bump window - need clarification on business day requirement |
| NotificationService.js | 419 | ⚠️ PENDING | Photo submission reminder - need clarification on deadline type (hard vs. courtesy) |

---

## Phase 1: User Clarifications & Requirements (COMPLETED)

**User-Verified Decisions:**
1. ✅ Renewal reminder: 30 **calendar days** before July 31 expiration (not business days)
2. ✅ Passport warning: 6 **months** before expiration date (not business days)
3. ✅ Payment deadline: 15 **business days** from approval (changed from 30 calendar days)
4. ✅ Grace period: Can be shown to members in portal
5. ✅ RSO link expiry: DELETE lines 179 and 198 (feature discontinued)

---

## Phase 2: Implementation (READY TO PROCEED)

**Critical Fixes to Implement:**
1. Apply `addBusinessDays()` to all 9 locations listed in "NEEDS FIX" table
2. Delete RSO link expiry code (FileSubmissionService.js lines 179, 198)
3. Change payment deadline from 30 calendar days to 15 business days

**Outstanding Clarifications (non-blocking):**
1. NotificationService.js line 419: Is photo submission reminder a hard deadline (should be business days) or courtesy reminder (stays calendar)?
2. ReservationService.js line 216: Should tennis bump window use business days for consistency with Leobo bump?

**Canonical Rule Going Forward:**
- Member action deadlines → `addBusinessDays(new Date(), N)`
- Event-relative deadlines → `calculateBusinessDayDeadline(eventDate, N)` 
- Fixed dates (expiration, July 31) → Display as-is
- Trigger dates (reminders) → Calendar days acceptable if per business requirement

---

**Status:** Phase 1 clarification complete, ready for Phase 2 implementation
**Next Step:** Apply fixes to all 9 deadline locations using `addBusinessDays()`
**Prerequisite:** Verify `addBusinessDays()` function exists in Utilities.js (added earlier)
