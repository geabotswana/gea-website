# Membership Dues Reference Audit

**Date:** March 24, 2026
**Scope:** Codebase audit for membership dues calculations and Membership Pricing sheet lookups

---

## Current Status: MIXED - Some code correct, some broken ⚠️

### ✅ CORRECT IMPLEMENTATIONS

#### 1. Code.js - `_handleGetDuesInfo()` (lines 2710-2760)
**Purpose:** API endpoint for member portal to fetch current dues

**What it does right:**
- ✓ Fetches Membership Pricing sheet by `membership_level_id`
- ✓ Looks up `annual_dues_usd` from the pricing row
- ✓ Calculates pro-ration using `QUARTER_PERCENTAGES` (Q1=100%, Q2=75%, Q3=50%, Q4=25%)
- ✓ Retrieves available payment years from sheet (`active_for_payment` column)
- ✓ Gets live exchange rate via `getExchangeRate()`
- ✓ Returns complete dues info object

**Code pattern:**
```javascript
var pricingSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID)
  .getSheetByName(TAB_MEMBERSHIP_PRICING);
for (var i = 1; i < pricingData.length; i++) {
  var row = rowToObject(pricingHeaders, pricingData[i]);
  if (row.membership_level_id === hh.membership_level_id) {
    if (annualDuesUsd === 0) annualDuesUsd = row.annual_dues_usd || 0;
    if (row.active_for_payment === true) availableYears.push(row.membership_year);
  }
}
```

---

#### 2. ApplicationService.js - `getApplicationDetails()` (lines 363-382)
**Purpose:** Return application info including dues for payment display

**What it does right:**
- ✓ Calls `getMembershipLevel(household.membership_level_id)` to get level info
- ✓ Extracts `annual_dues_usd` from level data
- ✓ Uses `_getCurrentQuarterInfo_()` for pro-ration percentage
- ✓ Builds complete `duesInfo` object with USD and BWP
- ✓ Gets live exchange rate via `getExchangeRate()`

**Code pattern:**
```javascript
var level = getMembershipLevel(household.membership_level_id);
if (level && level.annual_dues_usd) {
  var annualDuesUsd = Number(level.annual_dues_usd) || 0;
  var qInfo = _getCurrentQuarterInfo_();
  var proratedUsd = Math.round(annualDuesUsd * (qInfo.percentage / 100) * 100) / 100;
  duesInfo = {
    annual_dues_usd: annualDuesUsd,
    current_quarter: qInfo.name,
    quarter_percentage: qInfo.percentage,
    prorated_usd: proratedUsd,
    prorated_bwp: Math.round(proratedUsd * exchangeRate * 100) / 100
  };
}
```

---

#### 3. PaymentService.js - `calculateProratedDues()` (lines 386-412)
**Purpose:** Calculate pro-rated dues based on current quarter

**What it does right:**
- ✓ Takes `annualDuesUsd` parameter
- ✓ Correctly calculates quarterly pro-ration:
  - Aug-Oct (Q1) = 100%
  - Nov-Jan (Q2) = 75%
  - Feb-Apr (Q3) = 50%
  - May-Jul (Q4) = 25%
- ✓ Returns pro-rated amount in USD
- ✓ Used by other functions that need to calculate prorated amounts

**Code pattern:**
```javascript
function calculateProratedDues(annualDuesUsd) {
  var month = new Date().getMonth();
  var quarterPercentage;

  if (month >= 7 && month <= 9) quarterPercentage = QUARTER_PERCENTAGES["Q1"];      // 100%
  else if (month === 10 || month === 11 || month === 0) quarterPercentage = QUARTER_PERCENTAGES["Q2"];  // 75%
  else if (month >= 1 && month <= 3) quarterPercentage = QUARTER_PERCENTAGES["Q3"];  // 50%
  else quarterPercentage = QUARTER_PERCENTAGES["Q4"];                                 // 25%

  return Math.round(annualDuesUsd * (quarterPercentage / 100) * 100) / 100;
}
```

---

#### 4. PaymentService.js - `_getAcceptablePaymentYears_()` (lines 417-436)
**Purpose:** Get list of membership years where payment is currently accepted

**What it does right:**
- ✓ Looks up Membership Pricing sheet
- ✓ Filters by `membership_level_id` (member's category/type)
- ✓ Filters by `active_for_payment = TRUE`
- ✓ Returns array of valid payment years
- ✓ Used to populate year dropdown in payment portal

**Code pattern:**
```javascript
function _getAcceptablePaymentYears_(membershipLevelId) {
  var pricingSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID)
    .getSheetByName(TAB_MEMBERSHIP_PRICING);
  var years = {};

  for (var i = 1; i < data.length; i++) {
    var rowObj = rowToObject(headers, data[i]);
    if (rowObj.membership_level_id === membershipLevelId && rowObj.active_for_payment === true) {
      years[rowObj.membership_year] = true;
    }
  }
  return Object.keys(years);
}
```

---

### ❌ BROKEN IMPLEMENTATIONS

#### 1. ApplicationService.js - `boardFinalDecision()` (line 722)

**Location:**
```javascript
function boardFinalDecision(applicationId, decision, boardEmail, notes, reason) {
  // ...
  if (decision === "approved") {
    // ...
    var duesAmount = _calculateDuesAmount(application.membership_category, application.household_type);
    // ...email sent with DUES_AMOUNT...
  }
}
```

**The Problem:**
```javascript
❌ var duesAmount = _calculateDuesAmount(application.membership_category, application.household_type);
```

1. **Function is UNDEFINED** — `_calculateDuesAmount()` is never defined anywhere in the codebase
2. **Wrong parameters** — Takes category ("Full", "Associate") and type ("Individual", "Family")
   - Should take membership_level_id ("full_indiv", "associate_family") OR application_id
3. **Will crash at runtime** — ReferenceError: _calculateDuesAmount is not defined
4. **Breaks email sending** — Cannot populate `{{DUES_AMOUNT}}` in tpl_048 email template
5. **Affects user experience** — Applicant doesn't receive payment instructions with amount

**Impact:** When board approves an application, the system crashes and applicant never receives payment instructions.

---

#### 2. ApplicationService.js - `submitPaymentProof()` (line 809)

**Location:**
```javascript
function submitPaymentProof(applicationId, proofFile) {
  // ...
  var payment = {
    // ...
    amount_paid: _calculateDuesAmount(application.membership_category, application.household_type),
    // ...
  };
  // ...append to Payments sheet...
}
```

**The Problem:**
```javascript
❌ amount_paid: _calculateDuesAmount(application.membership_category, application.household_type),
```

1. **Same undefined function call** — Will crash with ReferenceError
2. **Cannot record payment in Payments sheet** — `amount_paid` stays empty/undefined
3. **Treasurer can't verify amount** — Payment record has no recorded amount to match against
4. **Breaks payment tracking** — Downstream reports and reconciliation broken

**Impact:** When applicant submits payment proof, the system crashes and payment is not recorded.

---

### 🔴 DATA STRUCTURE ISSUES

#### 1. Membership Applications Sheet

**Column: `dues_amount` (line 254 in ApplicationService.js)**

```javascript
dues_amount: 0,  // ← Initialized to 0 and NEVER UPDATED
```

**Problems:**
- ✗ Always 0, never calculated
- ✗ Should contain the pro-rated dues amount for the application
- ✗ Would help treasurer reconcile payments
- ✗ Would simplify payment verification

**Suggested fix:**
- Calculate dues during application creation
- Store in `dues_amount` column
- Use that value in emails and payment records

---

#### 2. Membership Pricing Sheet

**Structure (columns):**
```
membership_level_id  |  membership_year  |  annual_dues_usd  |  annual_dues_bwp  |  active_for_payment  | ...
full_indiv           |  2025-26          |  50               |  672.50           |  TRUE                | ...
associate_family     |  2025-26          |  100              |  1345              |  TRUE                | ...
```

**Current state:**
- ✓ Correctly structured
- ✓ Referenced in Code.js for member portal
- ✓ Referenced in PaymentService.js for year filtering
- ✗ NOT referenced in ApplicationService.js at critical failure points

---

### 📊 DEPENDENCY & FAILURE CHAIN

#### Scenario 1: Board Approves Application
```
Admin Portal
  ↓
Code.js: _handleAdminApprove()
  ↓
ApplicationService.boardFinalDecision(appId, "approved", boardEmail)
  ↓
Line 722: var duesAmount = _calculateDuesAmount(...)
  ↓
❌ ReferenceError: _calculateDuesAmount is not defined
  ↓
📧 Email NOT sent to applicant
❌ FAILURE: Applicant never receives payment instructions
```

---

#### Scenario 2: Applicant Submits Payment Proof
```
Member Portal
  ↓
Portal.html: submitPaymentProof(event)
  ↓
Code.js: _handlePaymentProof()
  ↓
ApplicationService.submitPaymentProof(appId, file)
  ↓
Line 809: amount_paid: _calculateDuesAmount(...)
  ↓
❌ ReferenceError: _calculateDuesAmount is not defined
  ↓
Payment record NOT created in Payments sheet
❌ FAILURE: Payment cannot be verified by treasurer
```

---

### 📋 HOW TO FIX

Two implementation options:

#### Option A: Simple Lookup Function (Recommended)
```javascript
/**
 * Calculate pro-rated dues amount for an application
 * Looks up the membership level, annual dues, and applies pro-ration
 */
function _calculateDuesAmount(applicationId) {
  try {
    var app = _getApplicationById(applicationId);
    if (!app || !app.household_id) return 0;

    var household = getHouseholdById(app.household_id);
    if (!household) return 0;

    var level = getMembershipLevel(household.membership_level_id);
    if (!level || !level.annual_dues_usd) return 0;

    var annualDuesUsd = Number(level.annual_dues_usd) || 0;
    return calculateProratedDues(annualDuesUsd);
  } catch (e) {
    Logger.log("ERROR calculating dues: " + e);
    return 0;
  }
}
```

**Advantages:**
- Single function signature: `_calculateDuesAmount(applicationId)`
- Uses existing lookup functions (`_getApplicationById`, `getHouseholdById`, `getMembershipLevel`, `calculateProratedDues`)
- Follows established patterns in codebase
- Handles errors gracefully

**Usage:**
```javascript
var duesAmount = _calculateDuesAmount(applicationId);
// Use duesAmount in emails and payment records
```

---

#### Option B: Use getApplicationDetails()
```javascript
// In boardFinalDecision():
var appDetails = getApplicationDetails(applicationId);
if (appDetails && appDetails.dues_info) {
  var duesAmount = appDetails.dues_info.prorated_usd;
  // Use duesAmount...
}
```

**Advantages:**
- Reuses existing function
- Gets complete dues breakdown (quarterly, exchange rate, BWP, etc.)

**Disadvantages:**
- More overhead (returns full application data)
- Requires null-checking

---

### 📌 SUMMARY TABLE

| Module | Function | Issue | Severity | Status |
|--------|----------|-------|----------|--------|
| Code.js | `_handleGetDuesInfo()` | None | — | ✅ Correct |
| ApplicationService | `getApplicationDetails()` | None | — | ✅ Correct |
| PaymentService | `calculateProratedDues()` | None | — | ✅ Correct |
| PaymentService | `_getAcceptablePaymentYears_()` | None | — | ✅ Correct |
| ApplicationService | `boardFinalDecision()` | Undefined function | 🔴 Critical | ❌ Broken |
| ApplicationService | `submitPaymentProof()` | Undefined function | 🔴 Critical | ❌ Broken |
| ApplicationService | `Membership Applications sheet` | dues_amount always 0 | 🟡 Medium | ⚠️ Workaround |

---

### 📌 RECOMMENDATIONS

**Priority 1 (Critical):**
1. Implement `_calculateDuesAmount(applicationId)` function in ApplicationService.js
2. Test with application approval and payment submission workflows
3. Verify emails are sent with correct DUES_AMOUNT

**Priority 2 (Enhancement):**
1. Calculate and store `dues_amount` when application is created
2. Use stored value in payment records for reconciliation
3. Add treasurer tools to reconcile recorded vs. submitted amounts

**Priority 3 (Documentation):**
1. Document dues lookup flow in developer guide
2. Add comments to Code.js and PaymentService.js showing reference implementations
3. Add test cases for dues calculations across all quarters and membership types

---

**Last Updated:** March 24, 2026
**Audited By:** Code audit
**Next Review:** After fixes are implemented and tested
