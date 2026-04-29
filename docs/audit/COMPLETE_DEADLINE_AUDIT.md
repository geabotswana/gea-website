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
- **Type:** Calendar days (30 days = guaranteed 8-9 weekends!)
- **Email:** MEM_APPLICATION_APPROVED_TO_APPLICANT
- **Context:** Applicant must submit payment to activate
- **Status:** NEEDS FIX → Use `addBusinessDays(new Date(), 30)`
- **CRITICAL:** 30 calendar days is ~6 weeks including ~8 weekends

---

### **FileSubmissionService.js** (7 deadline calculations)

#### ⚠️ Line 179: RSO Link Expiry (Raw milliseconds)
```javascript
var expiresAt = new Date(new Date().getTime() + (RSO_APPROVAL_LINK_EXPIRY_HOURS * 60 * 60 * 1000));
```
- **Type:** Raw millisecond calculation (hours-based, not days)
- **Uses:** Line 198 `APPROVAL_DEADLINE: formatDate(expiresAt)`
- **Email:** ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE
- **Context:** Link expiry for RSO approval
- **Status:** ⚠️ INVESTIGATE - Is this intentionally hours-based? (not days)

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

#### ⚠️ Line 622: Passport Warning Window
```javascript
var warnBefore = addDays(new Date(), PASSPORT_WARNING_MONTHS * 30);
```
- **Type:** Calendar days (but used for comparison, not deadline display)
- **Context:** Calculate warning window for passport expiration
- **Status:** ⚠️ INVESTIGATE - Is this used as deadline or just calculation?

#### ✅ Lines 636-639: Passport Expiration Warning
```javascript
sendEmailFromTemplate("MEM_PASSPORT_EXPIRATION_WARNING_TO_MEMBER", m.email, {
  EXPIRATION_DATE: formatDate(expDate)
})
```
- **Type:** Fixed document expiration date
- **Status:** ✅ OK - This is actual expiration date, not action deadline

#### ⚠️ Lines 657-658: Renewal Reminder Dates
```javascript
var in30  = addDays(today, RENEWAL_REMINDER_DAYS_1);  // RENEWAL_REMINDER_DAYS_1 = 30
var in7   = addDays(today, RENEWAL_REMINDER_DAYS_2);  // RENEWAL_REMINDER_DAYS_2 = 7
```
- **Type:** Calendar days (but used for comparison with expiration date)
- **Context:** Send 30-day and 7-day renewal reminders BEFORE July 31 expiration
- **Status:** ⚠️ INVESTIGATE - These are reminder triggers, not displayed deadlines
- **Note:** These are relative to July 31 expiration, not "X days from now"

#### ✅ Lines 681, 689: Renewal Deadline (Display)
```javascript
RENEWAL_DEADLINE: formatDate(expDate)  // expDate = July 31 (membership expiration)
```
- **Type:** Fixed membership expiration date
- **Status:** ✅ OK - This is actual expiration (July 31), not action deadline

#### ⚠️ Line 704: Grace Period End Date
```javascript
var graceEndDate = addDays(expDate, RENEWAL_GRACE_PERIOD_DAYS);
```
- **Type:** Calendar days added to July 31
- **Context:** Calculate when membership is fully lapsed (after grace period)
- **Status:** ⚠️ INVESTIGATE - Internal calculation, not email deadline

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
- **Status:** ⚠️ INVESTIGATE - Correct pattern (before event), but calendar days

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

#### ⚠️ Line 419: Submission Deadline
```javascript
SUBMISSION_DEADLINE: formatDate(deadline)
```
- **Type:** Depends on `deadline` variable source
- **Status:** ⚠️ INVESTIGATE - Source unclear from this line

#### ℹ️ Line 504: Date Arithmetic
```javascript
var nextWeek = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
```
- **Type:** Calendar arithmetic (non-deadline)
- **Status:** ℹ️ N/A

---

## Summary by Status

### ❌ NEEDS FIX (Apply addBusinessDays)
| File | Line | Type | Item |
|------|------|------|------|
| ApplicationService.js | 712 | Calendar days | RSO approval deadline (5 days) |
| ApplicationService.js | 818 | Calendar days | Document issue resolution (7 days) |
| ApplicationService.js | 825 | Calendar days | Document resubmission (7 days) |
| ApplicationService.js | 890 | Calendar days | Payment deadline (30 days) |
| FileSubmissionService.js | 599 | Raw milliseconds | Photo resubmission (10 days) |
| FileSubmissionService.js | 607 | Raw milliseconds | Document resubmission (10 days) |
| FileSubmissionService.js | 628, 636, 646 | Raw milliseconds | Document rejection (10 days) |
| FileSubmissionService.js | 1217, 1241 | Raw milliseconds | RSO issue deadline (10 days) |
| MemberService.js | 527 | Calendar days | Document resubmission (14 days) |

**Total: 9 high-priority fixes needed**

---

### ✅ OK (No change needed)
- Line 151: ReservationService - Guest list deadline (uses calculateBusinessDayDeadline) ✓
- Line 218: ReservationService - Leobo bump window (uses calculateBusinessDayDeadline) ✓
- All passport expiration warnings (fixed document dates) ✓
- All renewal deadlines that reference July 31 (fixed membership year end) ✓

---

### ⚠️ NEEDS INVESTIGATION
| File | Line | Issue |
|------|------|-------|
| FileSubmissionService.js | 179 | RSO link expiry - Is this intentionally hours-based? |
| MemberService.js | 622 | Passport warning window - Used for comparison only? |
| MemberService.js | 657-658 | Renewal reminder dates - Are these action deadlines or trigger dates? |
| MemberService.js | 704 | Grace period calculation - Is this displayed to users? |
| ReservationService.js | 216 | Tennis bump window - Should this use business days? |
| NotificationService.js | 419 | Submission deadline - What is source of `deadline` variable? |

---

## Recommendations for Review

**Immediate (Critical):**
1. Review and approve the 9 fixes listed in "NEEDS FIX"
2. Verify that 30-day payment deadline is intentionally that long (vs. 20-30 business days)

**Short-term (Phase 2):**
1. Investigate the 6 items in "NEEDS INVESTIGATION"
2. Clarify whether reminder dates vs. action deadlines need different treatment
3. Decide on Leobo bump window (calendar vs. business days)

**Ongoing:**
1. Ensure any NEW deadline variables follow the canonical rule:
   - Member action deadlines → `addBusinessDays()`
   - Event-relative deadlines → `calculateBusinessDayDeadline()`
   - Fixed dates (expiration) → Display as-is

---

**Status:** Ready for user review and direction  
**Next Step:** Approval to proceed with 9 high-priority fixes
