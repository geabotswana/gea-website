# Payments Implementation Guide

Payment processing, verification, tracking, and membership activation workflow for the GEA system.

---

## Overview

The GEA payment system handles:
- Membership dues collection
- Payment verification by treasurer
- Member activation upon payment confirmation
- Payment history tracking

### Payment Methods

Supported payment methods (from GEA Payment Policy):
- **EFT** — Bank transfer to GEA Absa account (preferred)
- **PayPal** — PayPal.me link (USD or BWP)
- **Federal Credit Union** — Zelle transfer (member-to-member or through FCU)
- **Cash** — Last resort, requires board verification

### Payment Workflow

```
1. Applicant is approved by RSO (documents verified)
   └─ Status: "approved_pending_payment"

2. Applicant views payment instructions in portal
   └─ Displays: Amount due, payment methods, bank details

3. Applicant submits proof of payment (receipt/screenshot)
   └─ File uploaded to Payments sheet
   └─ Status: "submitted"

4. Treasurer verifies payment in admin portal
   └─ Checks: Amount, date, sender, reference number
   └─ Status: "verified" or "rejected"

5. If verified:
   └─ Activate membership
   └─ Unlock portal features
   └─ Transfer photos to Cloud Storage
   └─ Send welcome email

6. If rejected:
   └─ Notify applicant with reason
   └─ Applicant resubmits corrected proof
   └─ Cycle back to step 4
```

---

## Payment Amounts

### Membership Dues (by Category)

```
Individual Membership:
  Full        - $50 USD / month
  Associate   - $50 USD / month
  Affiliate   - $50 USD / month
  Diplomatic  - $75 USD / month
  Community   - $75 USD / month
  Temporary   - $20 USD for period (max 6 months)

Family Membership:
  Full        - $100 USD / month
  Associate   - $100 USD / month
  Affiliate   - $100 USD / month
  Diplomatic  - $150 USD / month
  Community   - $150 USD / month
  Temporary   - N/A (individual only)

Pro-rating (Quarterly):
  Month 1-3 (August-October):   100% = full amount
  Month 4-6 (November-January):  75% = 3/4 amount
  Month 7-9 (February-April):    50% = 1/2 amount
  Month 10-12 (May-July):        25% = 1/4 amount
```

### Exchange Rate Mechanism

**Exchange Rate Source:**
- Source: exchangerate-api.com (free public API)
- Endpoint: `https://api.exchangerate-api.com/v4/latest/USD`
- API Response: JSON with all currency rates (including BWP)
- Free tier: 1,500 requests/month (sufficient for daily updates + testing)

**Exchange Rate Update Schedule:**
- Frequency: Daily automatic update
- Time: 3:00 AM Botswana time (UTC+2)
- Who updates: Automated Apps Script time-based trigger
- Process:
  1. Apps Script trigger fires daily at 3:00 AM Botswana time
  2. Fetch USD/BWP rate from exchangerate-api.com REST endpoint
  3. Parse JSON response to extract BWP rate
  4. Store rate + timestamp in Financial Records sheet (Rates tab)
  5. Log success/failure to Audit_Logs sheet
- Error handling: If API fetch fails, log error and notify Treasurer
- Fallback: Manual update capability (Treasurer can update rate manually if needed)
- Code location: Utilities.gs or Config.gs (updateExchangeRate function)

**Exchange Rate Display for Members:**
- Display: Show both USD amount AND current BWP equivalent
- Rate used: Sunday rate of the current week (not monthly)
- Logic: Each Sunday at start of week, capture the USD/BWP rate; use that rate for all member invoices/payments that week
- Application: When displaying dues to applicant or payment reminder to member, show:
  - "USD $50.00 (approximately BWP [calculated using Sunday rate])"
- Recalculation: New rate applied each Sunday; previous week's rate no longer used

---

## Payment Tracking

### Payments Sheet Schema

**Core Fields:**
```
payment_id              - Unique identifier (PMT-YYYY-MM-DD-###)
household_id            - Link to household
application_id          - Link to membership application (if applicable)
membership_type         - Category (Full, Associate, etc.)
amount_due              - Amount in USD
amount_paid             - Amount (as reported by applicant)
payment_method          - EFT, PayPal, FCU, Cash
payment_date            - Date applicant made payment
proof_of_payment        - File path (screenshot/receipt)
status                  - submitted, verified, rejected, refunded
submitted_by_individual_id - Who submitted payment
submission_timestamp    - When proof was uploaded
verified_by             - Treasurer name (if verified)
verification_timestamp  - When treasurer verified
rejection_reason        - Why payment was rejected (if applicable)
rejection_timestamp     - When rejected
notes                   - Additional details
```

### Payment Method Verification Procedures

**EFT (Absa Bank Transfer) Verification:**
- Method: Treasurer checks Absa online banking
- Verification: Look up payment in online account (search by reference: [LastName]_[YY-YY])
- Confirmation: Match amount + reference to member application
- Update system: Mark payment as verified in Payment_Tracking sheet
- Timeline: Within 2 business days of member submission

**PayPal Verification:**
- Method: Treasurer checks PayPal account online
- Verification: Look up transaction in PayPal account activity
- Confirmation: Match amount + member identifier (email or name) to application
- Update system: Mark payment as verified in Payment_Tracking sheet
- Timeline: Within 2 business days of member submission

**SDFCU & Zelle Verification:**
- Method: Treasurer checks SDFCU online banking
- Note: Zelle payments deposit directly into SDFCU account
- Verification: Look up transaction in SDFCU account activity
- Confirmation: Match amount + reference (or sender ID) to member application
- Update system: Mark payment as verified in Payment_Tracking sheet
- Timeline: Within 2 business days of member submission

**Cash Verification:**
- Method: Physical receipt-based verification
- Process: Treasurer writes TWO physical receipts (one for GEA, one for payer)
- Receipt contents: Member name, amount (BWP), date, reference number, payment method "Cash"
- Signatures: Both receipts signed by Treasurer AND payer (member)
- Distribution: GEA keeps one copy, payer keeps one copy
- Verification: Treasurer retains signed receipt as proof of payment
- Update system: Mark payment as verified in Payment_Tracking sheet with receipt reference
- Timeline: Immediate upon payment
- Storage: File physical receipt in GEA financial records (safe or filing cabinet)

---

## Payment Verification Workflow

### Treasurer Review Process

```
Admin.html > Payments Tab
  ├─ Display: All payments with status="submitted"
  ├─ Sort: By submission_timestamp (newest first)
  ├─ Fields shown:
  │  ├─ Applicant name
  │  ├─ Membership type & dues amount
  │  ├─ Payment method & amount paid
  │  ├─ Payment date (from applicant)
  │  ├─ Proof file (download link)
  │  └─ Submission timestamp
  │
  └─ Actions: [Verify & Activate] [Reject] [Request Clarification]

Treasurer clicks [Verify & Activate]:
  ├─ Confirm: Amount matches
  ├─ Confirm: Payment date is recent (not too old)
  ├─ Confirm: Reference number/receipt looks genuine
  ├─ Update Payment: status="verified", verified_by=[NAME], verification_timestamp=NOW
  ├─ Update Application: payment_status="verified"
  ├─ Activate membership:
  │  ├─ Update Household: active=TRUE, membership_start_date=TODAY
  │  ├─ Update Individuals: active=TRUE, voting_eligible=TRUE
  │  ├─ Transfer photos to Cloud Storage
  │  └─ Update File Submissions: cloud_storage_path=[GCS], is_current=TRUE
  ├─ Send applicant email: "Welcome! Membership Activated"
  ├─ Send board email: "New Member Activated - [NAME]"
  └─ Audit log: Record activation

Treasurer clicks [Reject]:
  ├─ Prompt: Why is payment being rejected?
  ├─ Options:
  │  ├─ "Amount does not match dues"
  │  ├─ "Payment date too old (>30 days)"
  │  ├─ "Missing payment reference/receipt number"
  │  ├─ "Suspicious activity (fraud concern)"
  │  └─ "Other: [Custom reason]"
  ├─ Update Payment: status="rejected", rejection_reason=[REASON], rejection_timestamp=NOW
  ├─ Update Application: payment_status="rejected"
  ├─ Send applicant email:
  │  └─ "Payment Verification Failed - Action Required"
  │     ├─ Specific reason for rejection
  │     ├─ Instructions to resubmit corrected proof
  │     └─ Treasurer contact info for questions
  └─ Audit log: Record rejection

Treasurer clicks [Request Clarification]:
  ├─ Prompt: What clarification is needed?
  ├─ Examples:
  │  ├─ "Please provide transaction reference number"
  │  ├─ "Payment amount appears lower - confirmation needed"
  │  └─ "[Custom message]"
  ├─ Send applicant email:
  │  └─ "Payment Clarification Needed"
  │     ├─ What information is missing
  │     ├─ How to provide clarification
  │     └─ Deadline (e.g., 3 business days)
  ├─ Application status: "payment_clarification_needed"
  └─ Audit log: Record clarification request
```

### TODO: Automated Payment Matching

```
[ ] Implement optional automated matching:
    [ ] Read applicant-reported payment date
    [ ] Query GEA bank account statement
    [ ] Search for matching transactions (amount ± 5%, date ± 3 days)
    [ ] If match found, auto-suggest to treasurer
    [ ] Treasurer reviews + approves auto-matched payments
    [ ] Reduces manual data entry, improves accuracy
[ ] Limitations:
    [ ] Requires bank API access (may not be available)
    [ ] Cannot verify PayPal/FCU/Cash automatically
    [ ] Treasurer review still required for approval
```

---

## Membership Activation

### Complete Activation Procedure

```
When Treasurer verifies payment:

1. Update Payment sheet
   └─ status="verified", verified_by=[TREASURER], verification_timestamp=NOW

2. Update Application sheet
   └─ payment_status="verified", final_approval_timestamp=NOW
   └─ status="activated"

3. Update Household
   └─ active=TRUE
   └─ membership_expiration_date=[NEXT_JULY_31]
   └─ membership_start_date=TODAY

4. Update Individuals (all in household)
   ├─ active=TRUE
   ├─ voting_eligible=TRUE (for primary & spouse if applicable)
   ├─ Unlock features:
   │  ├─ Reservations tab (can now book)
   │  ├─ Profile tab (can edit info, upload photos)
   │  ├─ Membership Card tab (can view digital card)
   │  └─ Dashboard (shows membership status & expiration)
   └─ Reset temp password (user must change on next login)

5. Transfer approved photos to Cloud Storage
   ├─ Query File Submissions where individual_id=this AND status="approved"
   ├─ For each approved photo:
   │  ├─ Copy from Drive to gs://gea-member-data/{household_id}/{individual_id}/photo.jpg
   │  ├─ Make publicly readable (for card display)
   │  └─ Update File Submissions:
   │     ├─ cloud_storage_path=[GCS_PATH]
   │     └─ is_current=TRUE
   └─ Disable old photos: is_current=FALSE, disabled_date=NOW

6. Send emails

   Applicant email:
   └─ Template: "Welcome to GEA! Membership Activated"
      ├─ Congratulations message
      ├─ Membership type, household_id, start date
      ├─ Expiration date: July 31, [YEAR]
      ├─ "Your account is now fully active"
      ├─ Unlock message: "You can now:"
      │  ├─ Book facility reservations
      │  ├─ Edit your profile
      │  ├─ Download membership card
      │  └─ Invite guests to events
      ├─ Next steps: "Update profile, upload photo if needed, book tennis!"
      ├─ Emergency contact: board@geabotswana.org
      └─ Links: "Visit Portal", "Reset Password"

   Board email:
   └─ Template: "New Member Activated"
      ├─ Member name & household_id
      ├─ Membership type (category)
      ├─ Activation timestamp
      ├─ Membership expiration date
      └─ Note: "Welcome email sent to member"

7. Audit log
   └─ Entry: [TREASURER], "activate_membership", [HOUSEHOLD_ID]
      └─ Details: membership_type, payment_id, amount, activation_date

8. Optional: Nightly task
   └─ (No additional action needed)
   └─ Membership renewal alerts will trigger 30 days before expiration
```

---

## Overpayment, Underpayment & Refunds

### Overpayment Handling Policy

**Process:** Treasurer contacts member to determine how to proceed

**BWP Currency Consideration:** If payment is in BWP and is close to expected USD amount (within reasonable variance), account is considered paid in full

**No Quibbling:** Do not pursue member for differences of a few Pula

**Options to Offer Member:**
- Credit to next membership year
- Small refund (if member requests)
- Donation to GEA

**Documentation:** Record resolution in Payment_Tracking sheet

**Variance Tolerance:** At Treasurer's discretion (e.g., +/- 5-10 Pula acceptable)

### Underpayment Handling

**Process:** Treasurer registers the payment amount received

**Currency Consideration:** Apply same "quibble tolerance" (a few Pula variance acceptable)

**After Tolerance Applied:** If still underpaid, Treasurer requests remaining balance from member

**Payment Plans:** Not offered; membership is NOT active until full amount is paid

**Notification:** Email member with amount paid, balance due, and payment instructions

**Timeline:** Request balance within 2 business days of payment submission

**Documentation:** Record partial payment in Payment_Tracking sheet with balance due amount

**Membership Status:** INACTIVE (suspended) until balance is paid

### Refund Policy

**Policy:** Refunds are NOT standard practice

**Exception:** Will consider refunds only if situation warrants (case-by-case, Treasurer discretion)

**Board Approval:** If refund approved, must be authorized by Treasurer + Board decision

**Website:** Do NOT mention refunds on website or member-facing materials

**Processing:** If refund approved, process via reverse payment to original payment method

**Documentation:** Record refund decision, approval, and processing in Payment_Tracking sheet + Audit_Logs

---

## Payment Tracking & Reporting

### Monthly Collections Report

**Purpose:** Treasurer summary of membership dues collected during the month

**Timing:** Generated on the last Monday of each month (ready for Board meeting the following Tuesday)

**Distribution:** Email to board@geabotswana.org

**Format:** Simple table in email or Google Sheets attachment

**Contents:**

- **Report Header:** "GEA Monthly Collections Report - [Month Year]" (e.g., "February 2026")
- **Summary Section:**
  - Total members at month start
  - Total members at month end
  - New members joined this month (count)
    - **New Members List** (primary member name only): [Member names]
  - Members with active membership (paid up)
  - Members with inactive membership (balance due)
- **Collections Table:**
  - Payment method (Absa, PayPal, SDFCU, Zelle, Cash) | Count | Amount (BWP) | Amount (USD equivalent)
  - **Total Collections (BWP)** | [Total]
  - **Total Collections (USD equivalent)** | [Total using Sunday rate]
- **Outstanding Balance Section:**
  - Members with balance due | Count | Total balance due (USD)
  - Members by balance age: <7 days, 7-30 days, 30-90 days, >90 days overdue
- **Notes Section:** Any anomalies, issues, or items requiring Board attention

**Storage:** Save report in Financial Records folder with filename "GEA_Collections_[YYYY-MM].xlsx"

**System Automation:** Most of this can be auto-generated from Payment_Tracking and Membership sheets

### Annual Reconciliation Procedure

**Purpose:** Year-end verification that all payments are accounted for

**Timing:** Completed by January 31 of following year (covers calendar year Jan-Dec)

**External Audit:** NOT required

**Financial Statements:** Handled separately in external Google Sheets system (not part of this implementation)

**Reconciliation Steps:**
1. Pull all Payment_Tracking entries for the calendar year
2. Cross-reference against bank statements (Absa, SDFCU, PayPal)
3. Verify: All recorded payments match bank records
4. Verify: All bank deposits match Payment_Tracking records
5. Document any discrepancies and resolution
6. Generate reconciliation summary report

**Report Format:** Spreadsheet with three columns (Payment_Tracking | Bank Records | Match?) showing all entries verified

**Owner:** Treasurer

**Archive:** Store final reconciliation report in Financial Records folder with filename "GEA_YearEnd_Reconciliation_[YYYY].xlsx"

**Board Review:** Present summary (not full details) to Board at annual meeting

---

## Bank Account & Payment Method Details

### GEA Bank Account (Absa)
- Bank: Absa (formerly Barclays)
- Account Name: U.S. Embassy – Gaborone Employee Association
- Account Number: 1005193
- Branch: 290267 (Government Enclave Branch)
- Swift Code: BARCBWGX
- Currency: Pula (BWP)
- Reference Format: [LastName]_[MembershipYear YY-YY]
- Display to applicants: Full account details + instruction to use reference format

### PayPal Setup
- Payment Link: https://www.paypal.com/ncp/payment/F7A4GEURTGA4L
- Account Type: Business account
- Currency: USD only (no BWP conversion)
- Note: PayPal.me link unavailable; use payment link above
- Display to applicants: Payment link + USD amount required

### State Department Federal Credit Union (SDFCU) Account
- Account Name: Gaborone Employee Association
- Account Number: 1010000268360
- Routing Number: 256075342
- Bank Address: SDFCU, 1630 King Street, Alexandria, VA 22314
- Currency: USD
- Member2Member (M2M) Code: GEA2025 (for SDFCU members to send payments easily)
- Display to applicants: Account details + M2M code for SDFCU members

### Zelle Setup
- Payment Method: Zelle (for members with U.S. bank accounts)
- Zelle Address: geaboard@gmail.com
- Currency: USD
- Use case: Members with U.S. banks (not SDFCU) can send payment via Zelle
- Display to applicants: Zelle email address for sending payment

---

## Related Documentation

- **GEA Payment Policy** — Policy requirements and member-facing information (docs/policies/)
- **CLAUDE_Membership_Implementation.md** — Application workflow (STEP 8-9)
- **GEA_System_Schema.md** — Payment Tracking sheet definition (docs/reference/)
- **ROLES_PERMISSIONS_MATRIX.md** — Treasurer permissions (docs/reference/)
- **Code.js** — Payment verification handlers (1,503 lines)
- **Admin.html** — Treasurer admin interface (payment section)

---

**Last Updated:** March 6, 2026
**Status:** ✅ Complete (All 16+ payment implementation items resolved)
**Source:** IMPLEMENTATION_TODO_CHECKLIST.md Phase 3 resolutions
