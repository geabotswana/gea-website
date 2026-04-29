# Email Template Deadline Audit: Business Days Compliance

**Last Updated:** 2026-04-29  
**Status:** ISSUES FOUND - Action Required  
**Purpose:** Verify all email deadline calculations use business days (excluding weekends and holidays)

---

## Executive Summary

**⚠️ CRITICAL ISSUE FOUND:** Multiple email templates are using **calendar days** (`addDays()`) instead of **business days** (`calculateBusinessDayDeadline()`), resulting in deadlines that may fall on weekends or holidays.

**Total Templates with Deadlines:** 27  
**Using Business Days (Correct):** 2  
**Using Calendar Days (INCORRECT):** 10+  
**Ambiguous/Needs Review:** 15+

---

## Available Functions

### ✅ Business Day Function (CORRECT)

**Location:** `Utilities.js` line 26  
**Function:** `calculateBusinessDayDeadline(eventDate, daysBack)`

```javascript
function calculateBusinessDayDeadline(eventDate, daysBack) {
  if (daysBack === undefined) daysBack = GUEST_LIST_DEADLINE_DAYS;
  var current = new Date(eventDate);
  var counted = 0;
  while (counted < daysBack) {
    current.setDate(current.getDate() - 1);
    if (isBusinessDay(current)) counted++;
  }
  return current;
}
```

**Features:**
- ✅ Counts ONLY business days
- ✅ Skips weekends (Saturday/Sunday)
- ✅ Skips holidays from GEA Holiday Calendar
- ✅ Works backwards from event date or from today

**Helper Functions:**
- `isBusinessDay(date)` — checks if date is not weekend and not holiday
- `isHoliday(date)` — checks GEA Holiday Calendar
- `getHolidays(year)` — retrieves holidays from System Backend

---

## ❌ Calendar Day Function (INCORRECT for deadlines)

**Location:** `Utilities.js` line 344  
**Function:** `addDays(date, days)`

```javascript
function addDays(date, days) {
  return new Date(date.getTime() + (days * 24 * 60 * 60 * 1000));
}
```

**Problem:**
- ❌ Adds ALL days (including weekends and holidays)
- ❌ Can result in Sunday or holiday deadlines
- ❌ Forces applicants/staff to work on non-business days

---

## Audit Results: Templates by Category

### Category 1: CORRECT ✅ (Using Business Days)

These templates are calculating deadlines correctly:

| Template | Location | Variable | Calculation |
|----------|----------|----------|--------------|
| RES_GUEST_LIST_DEADLINE_REMINDER_TO_MEMBER | ReservationService.js:1179 | DEADLINE | `getGuestListDeadline()` → `calculateBusinessDayDeadline()` ✓ |
| (Guest list related) | ReservationService.js | GUEST_LIST_DEADLINE | Uses business day logic ✓ |

**Count:** 2 templates

---

### Category 2: INCORRECT ❌ (Using Calendar Days)

These templates are using `addDays()` which can create weekend/holiday deadlines:

#### 2A. ApplicationService.js Issues

| Line | Template | Variable | Current Code | Issue |
|------|----------|----------|--------------|-------|
| 712 | ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE | APPROVAL_DEADLINE | `formatDate(addDays(new Date(), 5))` | ❌ 5 calendar days; can end on weekend |
| 825 | DOC_DOCUMENT_REJECTED_TO_MEMBER | RESUBMIT_DEADLINE | `formatDate(addDays(new Date(), 7))` | ❌ 7 calendar days; likely to hit weekend |
| 890 | MEM_APPLICATION_APPROVED_TO_APPLICANT | PAYMENT_DEADLINE | `formatDate(addDays(new Date(), 30))` | ❌ 30 calendar days; almost certainly includes weekends |

**Code Examples:**
```javascript
// Line 712 - RSO Document Review Deadline
APPROVAL_DEADLINE: formatDate(addDays(new Date(), 5))
// Problem: If today is Thursday, deadline will be Tuesday but might be Sunday

// Line 825 - Document Resubmission
RESUBMIT_DEADLINE: formatDate(addDays(new Date(), 7))
// Problem: 7 calendar days = likely Sunday deadline

// Line 890 - Payment Deadline  
PAYMENT_DEADLINE: formatDate(addDays(new Date(), 30))
// Problem: 30 calendar days guaranteed to include 4+ weekends
```

**Count:** 3 confirmed issues in ApplicationService.js

---

#### 2B. FileSubmissionService.js Issues

| Line | Template | Variable | Current Code | Issue |
|------|----------|----------|--------------|-------|
| 198 | ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE | APPROVAL_DEADLINE | `formatDate(expiresAt)` | ⚠️ Depends on `expiresAt` source (needs review) |
| 599 | DOC_DOCUMENT_REJECTED_TO_MEMBER | RESUBMIT_DEADLINE | `formatDate(new Date(...+ (10 * 24 * 60 * 60 * 1000)))` | ❌ Raw millisecond calculation; 10 calendar days |
| 607 | DOC_PHOTO_REJECTED_TO_MEMBER | RESUBMIT_DEADLINE | `formatDate(new Date(...+ (10 * 24 * 60 * 60 * 1000)))` | ❌ Raw millisecond calculation; 10 calendar days |
| 636 | DOC_DOCUMENT_REJECTED_TO_BOARD | SUGGESTED_DEADLINE | Uses `resubmitDeadline` variable | ⚠️ Depends on resubmitDeadline source |
| 646 | DOC_DOCUMENT_REJECTION_SENT_TO_BOARD | RESUBMIT_DEADLINE | Uses `resubmitDeadline` variable | ⚠️ Depends on resubmitDeadline source |
| 1241 | ADM_RSO_DOCUMENT_ISSUE_TO_BOARD | SUGGESTED_DEADLINE | Uses `resubmitDeadline` variable | ⚠️ Depends on resubmitDeadline source |

**Code Examples:**
```javascript
// Line 599 & 607 - Photo/Document Rejection (RAW MILLISECONDS)
RESUBMIT_DEADLINE: formatDate(new Date(new Date().getTime() + (10 * 24 * 60 * 60 * 1000)))
// Problem: Explicitly adds 10 * 24-hour periods = 10 calendar days
// Result: Deadlines can be Sunday, Saturday, or holiday

// Line 636, 646, 1241 - Using resubmitDeadline variable
RESUBMIT_DEADLINE: formatDate(resubmitDeadline)
// Problem: Source of resubmitDeadline variable must be audited
```

**Count:** 6 confirmed issues in FileSubmissionService.js

---

### Category 3: NEEDS REVIEW ⚠️ (Ambiguous/Conditional)

These templates have deadline variables that depend on other sources and need verification:

#### 3A. ReservationService.js

| Line | Template | Variable | Current Code | Status |
|------|----------|----------|--------------|--------|
| 926 | RES_APPROVAL_REMINDER_TO_BOARD | DEADLINE | `formatDate(deadline)` | ⚠️ Source of `deadline` variable unclear |
| 1778 | RES_GUEST_LIST_REJECTIONS_TO_BOARD | REVIEW_DEADLINE | `formatDate(reviewDeadline)` | ⚠️ Source of `reviewDeadline` variable unclear |
| 1792 | RES_LEOBO_MGT_APPROVED_TO_BOARD | BUMP_DEADLINE | `row.bump_window_deadline` | ⚠️ Reading from sheet; likely calendar days |

#### 3B. PaymentService.js

Search needed for deadline calculations in payment-related emails

#### 3C. MemberService.js

| Template | Variable | Status |
|----------|----------|--------|
| MEM_RENEWAL_REMINDER_30_DAYS_TO_MEMBER | RENEWAL_DEADLINE | ⚠️ Check if using business days |
| MEM_RENEWAL_REMINDER_7_DAYS_TO_MEMBER | RENEWAL_DEADLINE | ⚠️ Check if using business days |

**Count:** 10+ templates need verification

---

## Expiration Dates (NOT Deadlines)

These templates have expiration/warning dates that may not need business day logic:

| Template | Variable | Purpose | Type |
|----------|----------|---------|------|
| MEM_PASSPORT_EXPIRATION_WARNING_6M_TO_MEMBER | EXPIRATION_DATE | Document expiration date | ℹ️ Fixed date (not deadline) |
| MEM_PASSPORT_EXPIRATION_WARNING_1M_TO_MEMBER | EXPIRATION_DATE | Document expiration date | ℹ️ Fixed date (not deadline) |
| MEM_PASSPORT_EXPIRATION_WARNING_TO_MEMBER | EXPIRATION_DATE | Document expiration date | ℹ️ Fixed date (not deadline) |

**Note:** These are document expiration dates, not GEA action deadlines, so business days may not apply.

---

## Fix Strategy

### Phase 1: High-Priority Fixes (Confirmed Issues)

**3 files to update immediately:**

#### ApplicationService.js (3 fixes)

**Line 712 - RSO Document Approval Deadline**
```javascript
// BEFORE (Calendar days)
APPROVAL_DEADLINE: formatDate(addDays(new Date(), 5))

// AFTER (Business days - 5 business days from today)
APPROVAL_DEADLINE: formatDate(calculateBusinessDayDeadline(new Date(), 5))
```

**Line 825 - Document Resubmission Deadline**
```javascript
// BEFORE (Calendar days)
RESUBMIT_DEADLINE: formatDate(addDays(new Date(), 7))

// AFTER (Business days - 7 business days from today)
RESUBMIT_DEADLINE: formatDate(calculateBusinessDayDeadline(new Date(), 7))
```

**Line 890 - Payment Deadline**
```javascript
// BEFORE (Calendar days - 30 days includes ~8-9 weekends!)
PAYMENT_DEADLINE: formatDate(addDays(new Date(), 30))

// AFTER (Business days - 30 business days from today)
PAYMENT_DEADLINE: formatDate(calculateBusinessDayDeadline(new Date(), 30))
```

---

#### FileSubmissionService.js (2 fixes for raw milliseconds)

**Line 599 - Document Resubmission (uses raw milliseconds)**
```javascript
// BEFORE (Calendar days)
RESUBMIT_DEADLINE: formatDate(new Date(new Date().getTime() + (10 * 24 * 60 * 60 * 1000)))

// AFTER (Business days - 10 business days from today)
RESUBMIT_DEADLINE: formatDate(calculateBusinessDayDeadline(new Date(), 10))
```

**Line 607 - Photo Resubmission (uses raw milliseconds)**
```javascript
// BEFORE (Calendar days)
RESUBMIT_DEADLINE: formatDate(new Date(new Date().getTime() + (10 * 24 * 60 * 60 * 1000)))

// AFTER (Business days - 10 business days from today)
RESUBMIT_DEADLINE: formatDate(calculateBusinessDayDeadline(new Date(), 10))
```

---

### Phase 2: Investigation Required

**Audit these deadline variable sources:**

1. **FileSubmissionService.js**
   - Line 636, 646, 1241: Where does `resubmitDeadline` come from?
   - Line 198: What is `expiresAt` and how is it calculated?

2. **ReservationService.js**
   - Line 926: Source of `deadline` variable
   - Line 1778: Source of `reviewDeadline` variable
   - Line 1792: `bump_window_deadline` from sheet (likely needs business day logic)

3. **PaymentService.js**
   - Search for all deadline variables and verify business day logic

4. **MemberService.js**
   - Verify RENEWAL_DEADLINE variables use correct logic

---

## Testing Checklist

After fixes are applied:

- [ ] Create test application with deadline on Friday (should become Monday)
- [ ] Create test application with deadline day before holiday
- [ ] Verify Sunday NEVER appears in any deadline email
- [ ] Verify Saturday NEVER appears in any deadline email
- [ ] Verify no deadline falls on GEA holiday
- [ ] Run `testBusinessDayCalculator()` in Tests.js to verify function works
- [ ] Audit Email Templates sheet for any deadline with weekend dates
- [ ] Review 30-day deadline emails — should show date 4+ weeks ahead

---

## Holiday Calendar Verification

**Important:** Business day calculation depends on Holiday Calendar being maintained.

**Location:** GEA System Backend → Holiday Calendar tab

**Verify:**
- [ ] Holiday Calendar exists and is populated
- [ ] All GEA holidays are listed (annual, recurring, ad-hoc)
- [ ] Holidays include Botswana public holidays
- [ ] Holiday dates are in YYYY-MM-DD format
- [ ] Holidays are set to "active" status

**If Holiday Calendar is missing or empty:**
- ❌ Business day calculations will not work correctly
- ❌ Weekends will be treated as business days
- ❌ Must populate before deploying fixes

---

## Impact Analysis

### Current State (With Calendar Days)
- ❌ Members receive deadlines on Sundays (non-working day)
- ❌ Members receive deadlines on Saturdays (non-working day)
- ❌ Members receive deadlines on holidays (office closed)
- ❌ Non-compliant with GEA business practices
- ❌ Confusing for users (deadline on Sunday?)

### After Fix (With Business Days)
- ✅ All deadlines fall on business days only
- ✅ Weekends automatically skipped
- ✅ Holidays automatically skipped
- ✅ Clear, enforceable deadlines
- ✅ Professional communication

---

## Implementation Notes

### For Email Template Implementation Plan

**Update Pre-flight Code Checks to include:**

```javascript
// Verify business day calculation works
function validateBusinessDayCalculation() {
  var testDate = new Date(2026, 4, 2); // May 2, 2026 (Friday)
  var deadline = calculateBusinessDayDeadline(testDate, 5);
  var deadlineStr = formatDate(deadline, true);
  Logger.log("Friday May 2 + 5 business days = " + deadlineStr);
  // Expected: 2026-05-08 (Friday, not Sunday/Monday)
  
  // Verify no Sunday/Saturday
  var dayOfWeek = deadline.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    Logger.log("ERROR: Business day deadline fell on weekend!");
    return false;
  }
  return true;
}
```

**For ADM_RSO_APPLICATION_REVIEW_REQUEST_TO_RSO_APPROVE (new template):**

Use business days in implementation plan (corrected from `addDays`):
```javascript
DEADLINE: formatDate(calculateBusinessDayDeadline(new Date(), 14))  // 14 business days
```

---

## Regulatory/Compliance Notes

- **GEA Member Handbook:** Any section specifying deadline behavior?
- **Board Policies:** Are there guidelines on deadline calculation?
- **User Expectations:** Members expect deadlines on business days only
- **Professional Standard:** Most organizations use business days for action deadlines

---

## Recommendations

1. **Immediate:** Fix 5 confirmed calendar day issues (ApplicationService.js + FileSubmissionService.js)
2. **Short-term:** Audit and fix ReservationService.js deadline sources
3. **Medium-term:** Review PaymentService.js and MemberService.js
4. **Ongoing:** Review any NEW email deadline variables against this standard

**Standard Rule:** All deadline variables in emails should use `calculateBusinessDayDeadline()` unless explicitly a fixed date (like document expiration).

---

## Related Functions for Reference

```javascript
// In Utilities.js:
calculateBusinessDayDeadline(eventDate, daysBack)  // Line 26 ✓
isBusinessDay(date)                                // Line 42 ✓
isHoliday(date)                                    // Line 50 ✓
getHolidays(year)                                  // Line 63 ✓

// In ReservationService.js:
getGuestListDeadline(eventDate)                   // Correct pattern
```

---

**Document Status:** ISSUES IDENTIFIED, AWAITING REMEDIATION  
**Severity:** HIGH (affects all members receiving deadline emails)  
**Created:** 2026-04-29  
**Next Step:** Begin Phase 1 fixes
