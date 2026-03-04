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

### TODO: BWP Exchange Rate Mechanism

```
Current USD/BWP rates require:
[ ] Board decision: Which rate source to use?
    [ ] Option 1: Fixed rate (set quarterly)
    [ ] Option 2: Current market rate (daily update)
    [ ] Option 3: Floating rate (monthly update)
[ ] Implementation:
    [ ] Create Exchange Rates sheet (System Backend)
    [ ] Store: Date, USD_to_BWP_rate, source
    [ ] Update: [Frequency based on board decision]
    [ ] Calculate: USD amount × current rate = BWP amount
    [ ] Display: Both USD and current BWP in portal
[ ] Board approval: Method and rate update schedule
```

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

### TODO: Payment Method Verification

```
EFT Verification:
[ ] Treasurer checks: GEA bank account statement
[ ] Verify: Transaction exists, amount correct, date reasonable
[ ] Document: Sender name/account, transaction reference

PayPal Verification:
[ ] Treasurer checks: PayPal account or payment email
[ ] Verify: Transaction exists, amount correct, USD vs BWP
[ ] Document: Transaction ID, sender email

FCU Verification:
[ ] Treasurer checks: Federal Credit Union account statement
[ ] Verify: Transaction exists, amount correct, date reasonable
[ ] Document: Transaction reference, sender bank info

Cash Verification:
[ ] Requires: In-person receipt signed by treasurer
[ ] Document: Cash amount, date received, signature
[ ] Store: Physical receipt in GEA records
```

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

## Refunds & Corrections

### TODO: Refund Procedure

```
Scenario 1: Payment Made but Membership Not Activated (Treasurer Error)
[ ] Treasurer discovers error
[ ] Corrects household status: active=FALSE → active=TRUE
[ ] Updates membership_expiration_date
[ ] Resends welcome email
[ ] Logs incident in Audit Log
[ ] No refund needed (application was correct)

Scenario 2: Overpayment (Member Paid More Than Due)
[ ] Calculate overage: amount_paid - amount_due
[ ] Options:
    [ ] A) Credit towards next membership year
    [ ] B) Refund to member
    [ ] C) Member approves donation to GEA
[ ] Update Payment sheet: overage=[AMOUNT], overage_handling=[OPTION]
[ ] Send member email: explain overage, requested action
[ ] If refund, get bank details from member
[ ] Process refund [TBD: process details]
[ ] Update Payment: refund_amount=[AMOUNT], refund_date=[DATE]

Scenario 3: Wrong Amount Submitted (Member Underpaid)
[ ] Treasurer contacts member
[ ] Member agrees to pay difference
[ ] Member submits second payment for overage
[ ] Process second payment normally
[ ] Combine: payment1.amount + payment2.amount = total_due
[ ] Activate when total_paid >= amount_due
```

---

## Payment Tracking & Reporting

### TODO: Board Finance Reporting

```
[ ] Monthly Report (due 5th of month):
    [ ] Total dues collected
    [ ] Breakdown by membership category
    [ ] Outstanding payments (pending verification)
    [ ] Rejected/disputed payments
    [ ] Collections rate (% of active members who paid)
    [ ] Compare to budget

[ ] Quarterly Report (due last day of quarter):
    [ ] Cumulative collections (3-month period)
    [ ] Projections for year-end
    [ ] Trends (increasing/decreasing collections)
    [ ] Problem areas (high rejection rate, late payments)
    [ ] Recommendations

[ ] Annual Report (due August 31, before new membership year):
    [ ] Total FY2024-2025 collections
    [ ] By category breakdown
    [ ] Comparison to previous year
    [ ] Collection efficiency metrics
    [ ] Reserve balance (if applicable)
```

---

## Outstanding Items (TBD)

```
Core Payment Processing:
[ ] Define: Exact bank account details (GEA Absa account)
[ ] Define: PayPal.me link & handling
[ ] Define: Federal Credit Union Zelle instructions
[ ] Define: Cash collection procedures (treasurer signature)

Exchange Rate:
[ ] Board decision: Rate source (fixed vs floating)
[ ] Board decision: Update frequency (daily, weekly, monthly)
[ ] Implementation: Exchange Rates sheet setup
[ ] Implementation: Auto-calculation of BWP equivalent

Refund Procedures:
[ ] Board decision: Overpayment handling policy
[ ] Define: Refund processing (who requests, who approves)
[ ] Define: Refund timeline (how long to process)
[ ] Setup: Bank details capture for refunds

Verification:
[ ] Automated payment matching to bank statements (if possible)
[ ] Bank statement export format & integration
[ ] PayPal export integration
[ ] FCU statement export integration

Reporting:
[ ] Monthly collections report format
[ ] Quarterly projections format
[ ] Annual reconciliation procedure
[ ] Tax reporting integration (if needed)

Audit:
[ ] Define: Audit trail requirements for payments
[ ] Define: Who can view payment details (privacy considerations)
[ ] Define: Record retention period (7 years for tax purposes)
```

---

## Related Documentation

- **GEA Payment Policy** — Policy requirements and member-facing information (docs/policies/)
- **CLAUDE_Membership_Implementation.md** — Application workflow (STEP 8-9)
- **GEA_System_Schema.md** — Payment Tracking sheet definition (docs/reference/)
- **ROLES_PERMISSIONS_MATRIX.md** — Treasurer permissions (docs/reference/)
- **Code.js** — Payment verification handlers (1,503 lines)
- **Admin.html** — Treasurer admin interface (payment section)

---

**Last Updated:** March 4, 2026
**Status:** 50% Ready (workflow structure + TODOs for implementation details)
**Source:** Extracted from CLAUDE.md lines 1004–1089, 138–141 with expanded framework
