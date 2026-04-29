# Email Deadline Calculation: Semantic Clarification & Resolution

**Issue Identified:** 2026-04-29  
**Status:** BLOCKING - Must resolve before implementation  
**Severity:** CRITICAL (affects all deadline calculations)

---

## The Problem: Backward vs. Forward Business Days

### Current Function: `calculateBusinessDayDeadline()` - BACKWARD

**Location:** `Utilities.js` line 26

```javascript
function calculateBusinessDayDeadline(eventDate, daysBack) {
  // Subtracts daysBack business days FROM eventDate (moves backward in time)
  var current = new Date(eventDate);
  var counted = 0;
  while (counted < daysBack) {
    current.setDate(current.getDate() - 1);  // ← SUBTRACT, move backward
    if (isBusinessDay(current)) counted++;
  }
  return current;  // Returns EARLIER date
}
```

**Semantics:** "How many business days BEFORE the event date?"

**Usage Pattern:** Reservation/Event-based deadlines
- Input: Event date (May 20)
- daysBack: 5
- Output: May 13 (5 business days before event)
- Real-world: "Guest list due 5 business days before reservation"

**Code Using This Pattern:**
```javascript
// ReservationService.js - Guest list deadline BEFORE event
var guestListDeadline = calculateBusinessDayDeadline(eventDate, 5);
// Result: 5 business days BEFORE reservation date
```

---

### Needed Function: Forward Business Days - NOT YET IMPLEMENTED ❌

**Semantics:** "How many business days FROM today (or from now)?"

**Usage Pattern:** Action deadlines from today
- Input: Today (April 29)
- daysForward: 14
- Output: May 19 (14 business days from today)
- Real-world: "Payment due in 14 business days"

**Code Needed:**
```javascript
function addBusinessDays(startDate, daysForward) {
  // Add daysForward business days TO startDate (moves forward in time)
  var current = new Date(startDate);
  var counted = 0;
  while (counted < daysForward) {
    current.setDate(current.getDate() + 1);  // ← ADD, move forward
    if (isBusinessDay(current)) counted++;
  }
  return current;  // Returns LATER date
}
```

---

## The Semantic Mismatch in Current Proposals

### Email Template Text (Member Perspective)

```
"Resubmit by {{RESUBMIT_DEADLINE}}"
"Payment Due: {{PAYMENT_DEADLINE}}"
"Action required by: {{APPROVAL_DEADLINE}}"
```

**Implied Semantics:** "X business days FROM NOW" (forward-looking)

### Current Audit Proposal (INCORRECT)

```javascript
// Line 825 - Document Resubmission (AUDIT PROPOSAL - WRONG)
RESUBMIT_DEADLINE: formatDate(calculateBusinessDayDeadline(new Date(), 7))
```

**Problem:** 
- Passes TODAY as eventDate
- Subtracts 7 business days from today
- Result: 7 days AGO (past date!)
- Example: Today April 29 → Deadline would be April 18 (PAST!)

---

## Examples: The Difference

### Scenario: Today is Tuesday, April 29, 2026

#### BACKWARD (Current Function) - Wrong for Deadlines
```javascript
calculateBusinessDayDeadline(new Date(), 7)
// Input: Today (Tuesday, April 29)
// Subtract 7 business days backward
// Result: Tuesday, April 14 (7 days AGO)
// ❌ WRONG: Deadline is in the PAST
```

#### FORWARD (Needed Function) - Correct for Deadlines
```javascript
addBusinessDays(new Date(), 7)  // ← NOT YET CREATED
// Input: Today (Tuesday, April 29)
// Add 7 business days forward
// Result: Thursday, May 8 (7 days IN THE FUTURE)
// ✅ CORRECT: Deadline is actionable (future date)
```

---

## Verification: What the Code Actually Returns

### Test the Current Function

```javascript
// Today: Tuesday, April 29, 2026
var today = new Date(2026, 3, 29);  // Month is 0-indexed

// What does calculateBusinessDayDeadline return?
var deadline = calculateBusinessDayDeadline(today, 7);
Logger.log("Today: " + formatDate(today));
Logger.log("7 business days from calculateBusinessDayDeadline: " + formatDate(deadline));

// Expected output:
// Today: 2026-04-29
// 7 business days from calculateBusinessDayDeadline: 2026-04-14  ← PAST DATE!
```

**Confirmed:** Function moves BACKWARD in time.

---

## Resolution: Create Forward Business Day Function

### Step 1: Create New Function in Utilities.js

**Location:** Add after `calculateBusinessDayDeadline()` (after line 36)

```javascript
/**
 * Adds business days to a start date, skipping weekends and holidays.
 * Used for forward-looking deadlines (e.g., "due in 14 business days").
 *
 * @param {Date} startDate Starting date
 * @param {number} daysForward Number of BUSINESS days to add
 * @returns {Date} Deadline date (guaranteed to be a business day)
 *
 * Example: addBusinessDays(new Date(), 14) → 14 business days from today
 */
function addBusinessDays(startDate, daysForward) {
  var current = new Date(startDate);
  var counted = 0;
  while (counted < daysForward) {
    current.setDate(current.getDate() + 1);
    if (isBusinessDay(current)) counted++;
  }
  return current;
}
```

---

## Policy: Canonical Deadline Rule

### Rule 1: Deadlines FOR ACTIONS (from today)

Use: `addBusinessDays(new Date(), N)`

**Pattern:**
```javascript
// "Member must do X by date Y" (forward from today)
APPROVAL_DEADLINE: formatDate(addBusinessDays(new Date(), 5)),
PAYMENT_DEADLINE: formatDate(addBusinessDays(new Date(), 30)),
RESUBMIT_DEADLINE: formatDate(addBusinessDays(new Date(), 7))
```

**Examples:**
- "Submit payment by May 13 (5 business days from today)"
- "Resubmit document by May 8 (7 business days from today)"
- "RSO review required by May 13 (5 business days from today)"

**Applies to:**
- Member action deadlines
- Board/RSO action deadlines
- Payment deadlines
- Resubmission deadlines
- Approval deadlines

---

### Rule 2: Deadlines BEFORE EVENTS (backward from event date)

Use: `calculateBusinessDayDeadline(eventDate, N)`

**Pattern:**
```javascript
// "Guest list due before event on X" (backward from event date)
GUEST_LIST_DEADLINE: formatDate(calculateBusinessDayDeadline(reservationDate, 5))
BUMP_WINDOW_DEADLINE: formatDate(calculateBusinessDayDeadline(eventDate, 2))
```

**Examples:**
- "Guest list due by May 13 (5 business days before May 20 event)"
- "Can bump by May 18 (2 business days before May 20 event)"

**Applies to:**
- Guest list submissions
- Bump window deadlines
- Reservation modification deadlines

**DO NOT use for member action deadlines!**

---

## Impact Analysis

### Current Audit Recommendations (BROKEN)

```javascript
// ❌ WRONG - Would produce past dates
APPROVAL_DEADLINE: formatDate(calculateBusinessDayDeadline(new Date(), 5))
PAYMENT_DEADLINE: formatDate(calculateBusinessDayDeadline(new Date(), 30))
RESUBMIT_DEADLINE: formatDate(calculateBusinessDayDeadline(new Date(), 7))
```

### Corrected Audit Recommendations (FIXED)

```javascript
// ✅ CORRECT - Would produce future dates
APPROVAL_DEADLINE: formatDate(addBusinessDays(new Date(), 5)),
PAYMENT_DEADLINE: formatDate(addBusinessDays(new Date(), 30)),
RESUBMIT_DEADLINE: formatDate(addBusinessDays(new Date(), 7))
```

---

## Pre-Implementation Steps

### Step 1: Add `addBusinessDays()` to Utilities.js
- [ ] Create function (copy from above)
- [ ] Test with April 29, 2026 examples
- [ ] Verify no past dates are produced

### Step 2: Create Test Function

```javascript
function testAddBusinessDays() {
  var today = new Date(2026, 3, 29);  // Tuesday, April 29, 2026
  
  var deadline5 = addBusinessDays(today, 5);
  var deadline7 = addBusinessDays(today, 7);
  var deadline30 = addBusinessDays(today, 30);
  
  Logger.log("Today: " + formatDate(today));
  Logger.log("5 business days from today: " + formatDate(deadline5) + " (expected: Thu May 7 or later)");
  Logger.log("7 business days from today: " + formatDate(deadline7) + " (expected: Thu May 9 or later)");
  Logger.log("30 business days from today: " + formatDate(deadline30) + " (expected: late May)");
  
  // Verify all are in future
  if (deadline5 <= today) Logger.log("ERROR: deadline5 is not in future!");
  if (deadline7 <= today) Logger.log("ERROR: deadline7 is not in future!");
  if (deadline30 <= today) Logger.log("ERROR: deadline30 is not in future!");
  
  // Verify none are weekends
  for (var d = deadline5; d <= deadline30; d.setDate(d.getDate() + 1)) {
    var dow = d.getDay();
    if (dow === 0 || dow === 6) {
      Logger.log("ERROR: Found weekend in deadline: " + formatDate(d));
    }
  }
  
  Logger.log("✓ All tests passed");
}
```

### Step 3: Update EMAIL_DEADLINE_BUSINESS_DAYS_AUDIT.md
- [ ] Correct all 5 fixes to use `addBusinessDays()` instead of `calculateBusinessDayDeadline()`
- [ ] Add canonical rule section
- [ ] Add examples showing forward vs. backward

### Step 4: Update EMAIL_TEMPLATES_IMPLEMENTATION_PLAN.md
- [ ] Add "Deadline Calculation Policy" section
- [ ] Update all deadline variables to use `addBusinessDays()`
- [ ] Update pre-flight checklist to verify `addBusinessDays()` exists
- [ ] Add test examples

---

## Updated Fixes

### ApplicationService.js - CORRECTED

**Line 712 - RSO Document Approval**
```javascript
// NEW CORRECT CODE
APPROVAL_DEADLINE: formatDate(addBusinessDays(new Date(), 5))
```

**Line 825 - Document Resubmission**
```javascript
// NEW CORRECT CODE
RESUBMIT_DEADLINE: formatDate(addBusinessDays(new Date(), 7))
```

**Line 890 - Payment Deadline**
```javascript
// NEW CORRECT CODE
PAYMENT_DEADLINE: formatDate(addBusinessDays(new Date(), 30))
```

---

### FileSubmissionService.js - CORRECTED

**Line 599 - Photo Resubmission**
```javascript
// OLD (Calendar days)
RESUBMIT_DEADLINE: formatDate(new Date(new Date().getTime() + (10 * 24 * 60 * 60 * 1000)))

// NEW CORRECT CODE
RESUBMIT_DEADLINE: formatDate(addBusinessDays(new Date(), 10))
```

**Line 607 - Document Resubmission**
```javascript
// OLD (Calendar days)
RESUBMIT_DEADLINE: formatDate(new Date(new Date().getTime() + (10 * 24 * 60 * 60 * 1000)))

// NEW CORRECT CODE
RESUBMIT_DEADLINE: formatDate(addBusinessDays(new Date(), 10))
```

---

## Documentation Updates Required

| Document | Section | Change |
|-----------|---------|--------|
| EMAIL_DEADLINE_BUSINESS_DAYS_AUDIT.md | Fix Strategy | Replace `calculateBusinessDayDeadline()` with `addBusinessDays()` |
| EMAIL_DEADLINE_BUSINESS_DAYS_AUDIT.md | Add | New "Semantic Clarification" section |
| EMAIL_TEMPLATES_IMPLEMENTATION_PLAN.md | Pre-flight | Add verification of `addBusinessDays()` function |
| EMAIL_TEMPLATES_IMPLEMENTATION_PLAN.md | Add | New "Deadline Calculation Policy" section |

---

## Next Steps

1. **Review this resolution** - Confirm semantic distinction is correct
2. **Approve function creation** - Agree on `addBusinessDays()` implementation
3. **Update Utilities.js** - Add new function
4. **Run test function** - Verify produces future dates only
5. **Update both audit documents** - Apply corrected function
6. **Implement fixes** - Use `addBusinessDays()` for all member deadlines
7. **Verify Holiday Calendar** - Ensure it's populated before deployment

---

**Status:** AWAITING APPROVAL TO PROCEED  
**Blocker:** Must resolve semantic distinction before implementing fixes  
**Created:** 2026-04-29
