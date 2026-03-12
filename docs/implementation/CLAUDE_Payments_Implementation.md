# GEA Payment Implementation & Verification Guide

Payment processing, verification, tracking, member portal, and membership activation workflow for the GEA system.

---

## Overview

The GEA payment system handles:
- Membership dues collection via multiple payment methods
- Member-facing portal for payment details and verification submission
- Automatic exchange rate retrieval (daily USD/BWP rates)
- Payment verification by treasurer with approve/reject/clarification workflow
- Member activation upon payment confirmation
- Payment history tracking and reporting

### Payment Methods (USD-Preferred Order)

Supported payment methods:
1. **PayPal (USD)** — PayPal payment link (preferred for USD)
2. **SDFCU Member2Member (USD)** — Zelle transfer for federal credit union members (preferred for USD)
3. **Zelle (USD)** — Direct Zelle transfer for members with U.S. bank accounts (preferred for USD)
4. **EFT/Absa (BWP)** — Bank transfer to GEA Absa account (available, de-emphasized)
5. **Cash (BWP)** — Last resort, requires board verification

### Payment Workflow

```
1. Member is approved by RSO (documents verified)
   └─ Status: "approved_pending_payment"

2. Member logs into portal and views Payment Details page
   └─ Displays: Annual dues (from Membership Levels sheet)
   └─ Pro-rated amount for current quarter
   └─ Payment methods with account details
   └─ Pre-populated household-specific payment references
   └─ Current USD-to-BWP exchange rate (Sunday's rate)

3. Member makes payment via chosen method
   └─ Uses provided payment reference (e.g., "Smith Family - 2025-26")
   └─ Receives receipt or payment confirmation

4. Member submits proof of payment via "Register Payment Made" form
   └─ Selects membership year
   └─ Enters payment method, amount, transaction date
   └─ Optionally uploads screenshot or PDF proof
   └─ Submission status: "submitted"

5. Treasurer receives notification and reviews payment in admin portal
   └─ Checks: Amount matches pro-rated dues
   └─ Checks: Payment date is recent (not too old)
   └─ Checks: Reference number/receipt looks genuine
   └─ Marks as: "verified" or "not_verified" or requests "clarification"

6. If verified (fully paid):
   └─ Activate membership for that membership year
   └─ Unlock portal features (reservations, etc.)
   └─ Transfer approved photos to Cloud Storage
   └─ Send welcome email to member
   └─ Send notification to Board

7. If verified (partial payment):
   └─ Record partial payment
   └─ Set balance due
   └─ Membership remains inactive until fully paid
   └─ Notify member of balance

8. If not verified or needs clarification:
   └─ Notify member with reason
   └─ Member resubmits corrected proof
   └─ Cycle back to step 5
```

---

## PART A: MEMBER PORTAL

### A1. Payment Details Page (Instruction Reference)

**Purpose:** Members view payment instructions for all available payment methods with pre-populated household-specific references and current exchange rate.

**Display - Payment Methods (USD-Preferred Order):**

**1. PayPal (USD)** — Preferred
- Payment Link: https://www.paypal.com/ncp/payment/F7A4GEURTGA4L
- Currency: US Dollars (USD)
- Reference Format: Use one of these pre-populated options:
  - {{HOUSEHOLD_NAME}} - {{MEMBERSHIP_YEAR_1}}
  - {{HOUSEHOLD_NAME}} - {{MEMBERSHIP_YEAR_2}}
  - (Additional years as applicable)
- Instructions:
  ```
  Click the payment link above or send payment to PayPal account
  Include the reference shown above in the payment notes
  Payment is in USD (no conversion needed)
  ```

**2. SDFCU Member2Member (USD)** — Preferred for SDFCU Members
- Credit Union: State Department Federal Credit Union (SDFCU)
- Account Name: Gaborone Employee Association
- Account Number: 1010000268360
- Routing Number: 256075342
- Member2Member Code: GEA2025 (for SDFCU members)
- Currency: US Dollars (USD)
- Reference Format: Use one of these pre-populated options:
  - {{HOUSEHOLD_NAME}} - {{MEMBERSHIP_YEAR_1}}
  - {{HOUSEHOLD_NAME}} - {{MEMBERSHIP_YEAR_2}}
  - (Additional years as applicable)
- Instructions:
  ```
  SDFCU members: Use Member2Member transfer
  Search for: "Gaborone Employee Association"
  Code: GEA2025
  Include the reference shown above
  
  All members: Use standard transfer to account details above
  Include the reference shown above
  ```

**3. Zelle (USD)** — Preferred for U.S. Bank Accounts
- Email: geaboard@gmail.com
- Currency: US Dollars (USD)
- Reference Format: Use one of these pre-populated options:
  - {{HOUSEHOLD_NAME}} - {{MEMBERSHIP_YEAR_1}}
  - {{HOUSEHOLD_NAME}} - {{MEMBERSHIP_YEAR_2}}
  - (Additional years as applicable)
- Instructions:
  ```
  Use Zelle within your U.S. banking app
  Send to: geaboard@gmail.com
  Include the reference shown above in the payment note
  Funds typically arrive within 1-3 business days
  ```

**4. Absa Bank Transfer (BWP)** — Available but De-Emphasized
- Bank: Absa Bank Botswana
- Account Name: U.S. Embassy – Gaborone Employee Association
- Account Number: 1005193
- Branch Code: 290267 (Government Enclave Branch)
- Currency: Pula (BWP)
- Reference Format: Use one of these pre-populated options:
  - {{HOUSEHOLD_NAME}} - {{MEMBERSHIP_YEAR_1}}
  - {{HOUSEHOLD_NAME}} - {{MEMBERSHIP_YEAR_2}}
  - (Additional years as applicable)
- Instructions:
  ```
  Use Absa NetBank or visit your nearest Absa branch
  Include the reference shown above exactly as displayed
  Note: Amount due shown in USD below; exchange rate provided for reference
  ```

**Dues Information:**

Annual membership dues are **pro-rated by quarter** of the membership year (Aug-Jul):
- **Q1** (Aug-Oct): 100% of annual dues
- **Q2** (Nov-Jan): 75% of annual dues
- **Q3** (Feb-Apr): 50% of annual dues
- **Q4** (May-Jul): 25% of annual dues

For your membership type and current date:
- Annual dues (if paying full year): ${{ANNUAL_DUES_USD}} USD [Fetched dynamically from Membership Levels sheet]
- Pro-rated dues for current quarter: ${{PRORATED_AMOUNT_USD}} USD
- Membership year: {{MEMBERSHIP_YEAR}} (Aug - Jul)
- Due date: July 31
- Current exchange rate (Sunday's rate): 1 USD = P{{EXCHANGE_RATE}} (as of {{EXCHANGE_RATE_DATE}})
- Equivalent in BWP: P{{PRORATED_AMOUNT_BWP}} BWP

**Payment Reference Format:**
All payment references must follow the format: **Household Name - Membership Year**
Examples:
- "Smith Family - 2025-26"
- "Johnson - 2026-27"

This reference helps the Treasurer match your payment to your account.

**No interaction required** — Members copy their chosen reference and payment method details, then submit proof via "Register Payment Made" form.

---

### A2. Register Payment Made Form

**Purpose:** Member submits payment verification claim with proof and metadata.

**Form Fields:**

1. **Membership Year Dropdown** (required)
   - Label: "Which membership year are you paying for?"
   - Pre-populated reference shown next to each year:
     - "2025-26 (Smith Family - 2025-26)" [shows actual household name]
     - "2026-27 (Smith Family - 2026-27)" [if applicable]
   - Values: Only membership years where Membership Pricing sheet has `active_for_payment = TRUE` for this household's membership_level_id
   - Dynamic: Query Membership Pricing where:
     - `membership_level_id = household.membership_level_id`
     - `active_for_payment = TRUE`
     - Returns distinct `membership_year` values
   - Selected value determines:
     - Which pro-rated amount is displayed (via Membership Pricing lookup)
     - What reference format to use for payment confirmation
   - Help text: "Select the membership year for which you are submitting payment"

2. **Pro-rated Dues Amount Display** (read-only, updates when year selected)
   - Shows: "Amount due for {{MEMBERSHIP_YEAR}}: ${{PRORATED_AMOUNT_USD}} USD (or P{{PRORATED_AMOUNT_BWP}} BWP at today's Sunday rate)"
   - Calculation:
     - Fetches base annual dues in USD from Membership Pricing sheet using:
       - `household.membership_level_id` (e.g., "full_indiv")
       - Selected `membership_year` (e.g., "2025-26")
     - Calculates current quarter (Aug-Oct=Q1/100%, Nov-Jan=Q2/75%, Feb-Apr=Q3/50%, May-Jul=Q4/25%)
     - Applies pro-ration: `base_dues_usd × quarter_percentage`
     - Retrieves this week's Sunday USD-to-BWP exchange rate (from Rates sheet)
     - Converts to BWP: `prorated_usd × exchange_rate_bwp_per_usd`
     - Shows both amounts for reference (member pays in their chosen currency)
   - Exchange rate note: "Exchange rate as of {{EXCHANGE_RATE_DATE}} (Sunday): 1 USD = P{{EXCHANGE_RATE}}"
   - Example: "Amount due for 2025-26: $50 USD (or P670 BWP at this week's rate)"

3. **Payment Method Dropdown** (required)
   - Values: "PayPal (USD)", "SDFCU Member2Member (USD)", "Zelle (USD)", "Absa (BWP)"
   - Controls which currency field appears below
   - Help text: "Select the payment method you used"

4. **Currency Dropdown** (auto-filled based on method, but editable)
   - Values: "USD", "BWP"
   - Default based on payment method:
     - PayPal → USD
     - SDFCU → USD
     - Zelle → USD
     - Absa → BWP
   - User can override (e.g., pay Absa in USD)
   - Help text: "Currency in which you made the payment"

5. **Amount Paid Field** (required, numeric)
   - Label: "Amount paid (in {{CURRENCY}})"
   - Help text: "Enter the exact amount you paid (e.g., 50 for $50 USD or 670 for P670 BWP)"
   - Validation: > 0, reasonable max (e.g., not > $500 USD or P5000 BWP)
   - Optional: Show "suggested amount" based on pro-ration, but allow override for overpayment or partial

6. **Transaction Date Field** (required, date picker)
   - Label: "Date of transaction"
   - Format: YYYY-MM-DD
   - Default: Today
   - Validation: Not in future, not more than 60 days in past
   - Help text: "When did you send the payment?"

7. **Reference Used Field** (display only, auto-populated)
   - Label: "Reference used in payment"
   - Shows: "{{HOUSEHOLD_NAME}} - {{MEMBERSHIP_YEAR}}"
   - Read-only (informational, helps member verify they used correct reference)
   - Help text: "You should have included this reference in your payment (for Treasurer matching)"

8. **File Upload (optional)**
   - Label: "Attach proof of payment (screenshot or PDF)"
   - Accepted types: .jpg, .jpeg, .png, .pdf
   - Max size: 5 MB
   - Help text: "Optional. Upload a screenshot or PDF showing payment confirmation (transaction number, amount, date, etc.)"

9. **Notes Field (optional)**
   - Text area, max 500 characters
   - Help text: "E.g., transaction reference number, payment delays, issues with reference field, etc."

**Form Validation:**
- All required fields present
- Amount is numeric and > 0
- Transaction date is valid and not future, not >60 days past
- File (if provided) is correct format and size
- At least one of the following:
  - File is attached, OR
  - Transaction date is within past 30 days (metadata alone acceptable for recent payments)

---

### A3. Member Portal Submission Flow

**Step 1: Member Submits**
1. Form submits to backend route: `action=submit_payment_verification`
2. Backend validates all inputs
3. Backend creates row in **Payment Verifications** sheet:
   - `verification_id` (auto-generated: "PV-2026-00001")
   - `household_id`, `household_name`, `member_email`
   - `membership_year` (e.g., "2025-26")
   - `payment_method`, `currency`, `amount_paid`
   - `transaction_date`
   - `file_id` (if uploaded; stored in Google Drive)
   - `notes`
   - `status` = "submitted"
   - `submitted_date` = now
   - `submitted_by_email` = member email

**Step 2: Send Confirmation Email to Member (tpl_061)**
- To: member email
- Subject: "Payment Verification Received — {{HOUSEHOLD_NAME}}"
- Body:
  ```
  Thank you for submitting your payment verification.
  
  Verification ID: {{VERIFICATION_ID}}
  Membership Year: {{MEMBERSHIP_YEAR}}
  Payment Method: {{PAYMENT_METHOD}}
  Amount: {{AMOUNT}} {{CURRENCY}}
  Transaction Date: {{TRANSACTION_DATE}}
  Reference Used: {{HOUSEHOLD_NAME}} - {{MEMBERSHIP_YEAR}}
  Submitted: {{SUBMISSION_DATE}}
  
  Your Treasurer will review and respond within 3-5 business days.
  Questions? Contact board@geabotswana.org
  ```

**Step 3: Send Action Email to Treasurer (tpl_062)**
- To: treasurer email
- Subject: "Payment Verification Pending Review — {{HOUSEHOLD_NAME}}"
- Body:
  ```
  Payment verification submitted for your review.
  
  Household: {{HOUSEHOLD_NAME}} ({{HOUSEHOLD_ID}})
  Member: {{FIRST_NAME}} {{LAST_NAME}} ({{MEMBER_EMAIL}})
  Membership Year: {{MEMBERSHIP_YEAR}}
  Payment Method: {{PAYMENT_METHOD}}
  Amount Claimed: {{AMOUNT}} {{CURRENCY}}
  Transaction Date: {{TRANSACTION_DATE}}
  Reference Used: {{HOUSEHOLD_NAME}} - {{MEMBERSHIP_YEAR}}
  Submitted: {{SUBMISSION_DATE}}
  {{IF_FILE}}Proof Attached: {{FILE_NAME}}{{END_IF}}
  {{IF_NOTES}}Notes: {{NOTES}}{{END_IF}}
  
  Action Required:
  Review in admin portal and mark as verified or not verified.
  Link: {{ADMIN_PORTAL_LINK}}?action=payment_verifications
  
  If verified as fully paid, membership will auto-activate for {{MEMBERSHIP_YEAR}}.
  ```

---

## PART B: AUTOMATIC EXCHANGE RATE RETRIEVAL SYSTEM

**Overview:** Membership dues are charged in USD. To provide members with accurate BWP equivalents for Absa payment, exchange rates are fetched and stored automatically every day, with Sunday's rate used for that week's payment calculations.

**Data Source:** exchangerate-api.com (free tier, 1500 requests/month)

**Automatic Retrieval Schedule:**
- **Time:** Every day at 3:00 AM GMT+2 (Botswana time)
- **Frequency:** Daily (stored for historical reference)
- **Rate Used for Displays:** Sunday's rate (applied Mon-Fri of that week)
- **Fallback:** If Sunday is not available, use most recent previous business day's rate

**Implementation Details:**

**Function:** `daily_updateExchangeRate()` in NotificationService.gs
- Call exchangerate-api.com API: `https://v6.exchangerate-api.com/v6/{{API_KEY}}/latest/USD`
- Parse JSON response for `conversion_rates.BWP`
- Store in **Rates** sheet with:
  - `rate_date` (date of rate)
  - `usd_to_bwp` (fetched rate, rounded to 2 decimals)
  - `is_sunday_rate` (TRUE if date is Sunday)
  - `timestamp` (when retrieved)
- Update Configuration sheet:
  - `config_key` = "exchange_rate_usd_to_bwp_current"
  - `config_value` = latest Sunday's rate (or most recent day if Sunday not yet captured)
  - `config_key` = "exchange_rate_last_updated"
  - `config_value` = today's date
- Log audit entry: "Exchange rate updated: 1 USD = P{{RATE}} ({{RATE_DATE}})
"
- Error handling: If API fails, retain previous rate and log error (do not break system)

**Trigger Registration:**
- Add to scheduler:
  - `ScriptApp.newTrigger("daily_updateExchangeRate")`
    `.timeBased()`
    `.atTime("03:00")`
    `.everyDays(1)`
    `.inTimezone("Africa/Johannesburg")` (GMT+2)
    `.create()`

**Usage in Payment Portal:**
- When form loads or membership year changes:
  - Fetch current Sunday's rate from Rates sheet (or most recent available)
  - Fetch rate date from Configuration
  - Display: "Exchange rate as of {{DATE}} (Sunday): 1 USD = P{{RATE}}"
  - Calculate BWP equivalent: `usd_amount × exchange_rate`

**Configuration Additions:**

| config_key | config_value | description |
|-----------|--------------|-------------|
| `exchange_rate_usd_to_bwp_current` | 13.45 | Most recent Sunday's USD to BWP exchange rate |
| `exchange_rate_last_updated` | 2026-03-08 | Date of last exchange rate update |
| `exchange_rate_last_sunday` | 2026-03-08 | Date of last Sunday for which we have a rate |
| `exchangerate_api_key` | [key] | exchangerate-api.com API key for automatic updates |

**Fallback & Error Handling:**
- If API call fails:
  - Log warning to Audit Log
  - Retain previous week's rate (do not NULL it)
  - Send notification to Treasurer email: "Exchange rate update failed; using previous rate"
  - Portal continues to function with last known good rate

**Testing:**
- [ ] Unit test: API call and JSON parsing
- [ ] Unit test: Rates sheet storage
- [ ] Integration test: Trigger fires daily at 3:00 AM
- [ ] Manual test: Verify rates update and Sunday rate is captured correctly
- [ ] Edge case: API failure handling (verify previous rate retained)
- [ ] Edge case: Sunday rate logic (if Monday is holiday, etc.)

---



Annual dues are pro-rated based on the current quarter of the membership year (Aug-Jul):
### Dynamic Dues from Membership Pricing

**Authoritative Source:** Membership Pricing sheet in GEA Member Directory

**How It Works:**
1. Membership Pricing sheet contains annual dues for each membership level by year
2. Form dynamically fetches annual dues based on:
   - Logged-in household's `membership_level_id` (from Households sheet, e.g., "full_indiv")
   - Selected `membership_year` (e.g., "2025-26")
3. Query Membership Pricing sheet where:
   - `membership_level_id` matches household's level
   - `membership_year` matches selected year
   - `active_for_payment = TRUE` (only show years currently accepting payment)
4. Returns: `annual_dues_usd` for that level in that year
5. System applies pro-ration based on current quarter
6. Shows both USD (base) and BWP equivalent (using Sunday's rate)

**Do NOT hard-code dues amounts** — always fetch from Membership Pricing sheet.

**Acceptable Membership Years:**
- Derive from Membership Pricing sheet where `active_for_payment = TRUE`
- Configuration key removed (determined dynamically from pricing data)

- **Q1** (Aug-Oct): 100% of annual dues
- **Q2** (Nov-Jan): 75% of annual dues
- **Q3** (Feb-Apr): 50% of annual dues
- **Q4** (May-Jul): 25% of annual dues

**Calculation:**
```
// Query Membership Pricing sheet:
//   WHERE membership_level_id = household.membership_level_id
//   AND membership_year = selected_year
//   AND active_for_payment = TRUE
annual_dues_usd = fetch from Membership Pricing sheet
quarter_percentage = determine from current month
prorated_usd = annual_dues_usd × (quarter_percentage / 100)
prorated_bwp = prorated_usd × exchange_rate_sunday
```

**Example (March 2026):**
- Logged-in household membership_level_id: "full_indiv"
- Selected membership year: "2025-26"
- Membership Pricing lookup: 2025-26 + full_indiv → $50 USD annual
- Current quarter: Q3 (Feb-Apr) = 50%
- Pro-rated: $50 × 0.50 = $25 USD
- Sunday exchange rate: 1 USD = P13.45
- Pro-rated in BWP: $25 × 13.45 = P336.25 BWP

---

## PART D: PAYMENT TRACKING & TREASURER VERIFICATION

### Payment Verifications Sheet Schema

Add to **GEA Member Directory** spreadsheet:

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `verification_id` | Text | Yes | Auto: "PV-2026-00001" |
| `household_id` | Text | Yes | FK to Households |
| `household_name` | Text | Yes | Denormalized for audit |
| `member_email` | Text | Yes | Submitter email |
| `membership_year` | Text | Yes | "2025-26", "2026-27", etc. |
| `payment_method` | Text | Yes | "PayPal (USD)" \| "SDFCU Member2Member" \| "Zelle" \| "Absa (BWP)" |
| `currency` | Text | Yes | "BWP" \| "USD" |
| `amount_paid` | Number | Yes | Actual amount paid |
| `transaction_date` | Date | Yes | YYYY-MM-DD |
| `file_id` | Text | No | Google Drive file ID (proof) |
| `file_name` | Text | No | Original filename |
| `notes` | Text | No | Member's additional notes (≤500 chars) |
| `status` | Text | Yes | "submitted" \| "verified" \| "not_verified" |
| `submitted_date` | DateTime | Yes | When member submitted |
| `submitted_by_email` | Text | Yes | Member's email |
| `verified_date` | DateTime | No | When Treasurer acted |
| `verified_by_email` | Text | No | Treasurer's email |
| `paid_in_full` | Boolean | No | Treasurer's decision: is account fully paid? |
| `balance_remaining` | Number | No | Amount still due (if not paid in full) |
| `treasurer_notes` | Text | No | Internal notes from Treasurer (≤500 chars) |

### Membership Pricing Sheet Schema

Add to **GEA Member Directory** spreadsheet (already created):

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `membership_year` | Text | Yes | Membership year (e.g., "2025-26", "2026-27") |
| `membership_level_id` | Text | Yes | FK to Membership Levels.level_id (e.g., "full_indiv", "diplomatic_family") |
| `annual_dues_usd` | Number | Yes | Annual dues in USD for this level in this year |
| `active_for_payment` | Boolean | Yes | TRUE if GEA is accepting payment for this year; FALSE otherwise |
| `notes` | Text | No | Optional notes (e.g., "Increased from $50 to $55", "Reduced for restart") |

**Key Points:**
- Membership Levels sheet is read-only (defines categories: full_indiv, full_family, etc.)
- Membership Pricing sheet is where pricing is managed (connects levels to years and prices)
- Form dynamically queries: WHERE membership_level_id=household.membership_level_id AND membership_year=selected_year AND active_for_payment=TRUE
- Future years can be pre-populated with `active_for_payment=FALSE` to prepare for next fiscal year

---

### Rates Sheet Schema

Add to **Financial Records** spreadsheet (or create new Rates sheet):

| Column | Type | Notes |
|--------|------|-------|
| `rate_date` | Date | Date of exchange rate |
| `usd_to_bwp` | Number | Exchange rate (e.g., 13.45) |
| `is_sunday_rate` | Boolean | TRUE if this date is a Sunday |
| `timestamp` | DateTime | When rate was retrieved/updated |
| `source` | Text | "exchangerate-api.com" or "manual" |

### Treasurer Review Process

```
Admin Portal > Payments Tab
  ├─ Display: All payments with status="submitted"
  ├─ Sort: By submission_timestamp (newest first)
  ├─ Fields shown:
  │  ├─ Applicant name
  │  ├─ Membership year
  │  ├─ Payment method & amount paid
  │  ├─ Payment date (from applicant)
  │  ├─ Proof file (download link)
  │  └─ Submission timestamp
  │
  └─ Actions: [Verify & Activate] [Reject] [Request Clarification]

Treasurer clicks [Verify & Activate]:
  ├─ Confirm: Amount matches (or matches with pro-ration tolerance)
  ├─ Confirm: Payment date is recent (not too old)
  ├─ Confirm: Reference number/receipt looks genuine
  ├─ Check checkbox: "This payment brings the account to paid in full for {{MEMBERSHIP_YEAR}}"
  ├─ Update Payment Verifications: status="verified", verified_by=[NAME], verified_date=NOW, paid_in_full=TRUE
  ├─ Activate membership (see Membership Activation section below)
  └─ Send emails (see templates section)

Treasurer clicks [Reject]:
  ├─ Prompt: Why is payment being rejected?
  ├─ Options:
  │  ├─ "Amount does not match dues"
  │  ├─ "Payment date too old (>30 days)"
  │  ├─ "Missing payment reference/receipt number"
  │  ├─ "Suspicious activity (fraud concern)"
  │  └─ "Other: [Custom reason]"
  ├─ Update Payment Verifications: status="not_verified", treasurer_notes=[REASON], verified_date=NOW
  ├─ Send member email with reason and instructions to resubmit
  └─ Audit log: Record rejection

Treasurer clicks [Request Clarification]:
  ├─ Prompt: What clarification is needed?
  ├─ Examples:
  │  ├─ "Please provide transaction reference number"
  │  ├─ "Payment amount appears lower - confirmation needed"
  │  └─ "[Custom message]"
  ├─ Send member email with clarification request and deadline
  └─ Audit log: Record clarification request
```

### Payment Method Verification Procedures

**PayPal Verification:**
- Method: Treasurer checks PayPal account online
- Verification: Look up transaction in PayPal account activity
- Confirmation: Match amount + member identifier (email or name) to application
- Update system: Mark payment as verified in Payment Verifications sheet
- Timeline: Within 2 business days of member submission

**SDFCU Verification:**
- Method: Treasurer checks SDFCU online banking
- Verification: Look up transaction in SDFCU account activity
- Confirmation: Match amount + reference (or sender ID) to member application
- Update system: Mark payment as verified in Payment Verifications sheet
- Timeline: Within 2 business days of member submission

**Zelle Verification:**
- Method: Treasurer checks SDFCU online banking (Zelle deposits to SDFCU)
- Verification: Look up transaction in SDFCU account activity
- Confirmation: Match amount + reference to member application
- Update system: Mark payment as verified in Payment Verifications sheet
- Timeline: Within 1-3 business days of member submission (Zelle delivery time)

**Absa (EFT) Verification:**
- Method: Treasurer checks Absa online banking
- Verification: Look up payment in online account (search by reference: {{HOUSEHOLD_NAME}}_{{MEMBERSHIP_YEAR}})
- Confirmation: Match amount + reference to member application
- Update system: Mark payment as verified in Payment Verifications sheet
- Timeline: Within 2 business days of member submission

**Cash Verification:**
- Method: Physical receipt-based verification
- Process: Treasurer writes TWO physical receipts (one for GEA, one for payer)
- Receipt contents: Member name, amount (BWP), date, reference number, payment method "Cash"
- Signatures: Both receipts signed by Treasurer AND payer (member)
- Distribution: GEA keeps one copy, payer keeps one copy
- Verification: Treasurer retains signed receipt as proof of payment
- Update system: Mark payment as verified in Payment Verifications sheet with receipt reference
- Timeline: Immediate upon payment
- Storage: File physical receipt in GEA financial records (safe or filing cabinet)

---

## PART D.5: MEMBERSHIP YEAR STATUS TRACKING

### Schema Addition to Households Sheet

To track membership validity across multiple years, add dynamic status columns to Households sheet:

**Format:**
- `membership_year_{{YEAR}}_status` (e.g., `membership_year_2025_26_status`, `membership_year_2026_27_status`)
- Values: "active" | "inactive" | "expired"
- Default (new year): "inactive"

**Example Columns:**
| Column | Type | Example | When Updated |
|--------|------|---------|--------------|
| `current_membership_year` | Text | "2025-26" | Recalculated Aug 1 by trigger |
| `membership_year_2025_26_status` | Text | "active" | When payment verified for that year |
| `membership_year_2026_27_status` | Text | "inactive" | Initialized by admin portal (before Aug 1); set to "active" when payment verified |
| `active` | Boolean | TRUE | Recalculated Aug 1 (= status of current_membership_year) |

### Individuals Sheet

Keep existing `active` column — this reflects current system access status based on current membership year.

When a household's membership year status changes, Individuals `active` flags are updated accordingly.

### Managing Membership Year Activation

**Admin Portal Controls (Manual, not automated):**
1. Treasurer/Admin goes to "Membership Settings" section in admin portal
2. For next fiscal year (e.g., 2026-27):
   - Set dues in Membership Pricing sheet for all level_ids
   - Click "Activate Payment for {{NEXT_YEAR}}" button
   - This:
     - Sets `active_for_payment = TRUE` in Membership Pricing for next year
     - Adds `membership_year_{{NEXT_YEAR}}_status` columns to Households (if not already present)
     - Initializes all households' next year status to "inactive"
3. Once ready to go live (typically Aug 1), admin can activate

**August 1 Annual Rollover (Minimal trigger):**
- Time: 00:01 on August 1
- Function: `nightly_processAnnualMembershipRollover()`
- What it does:
  1. Update all Households: `current_membership_year` = new year (e.g., "2026-27")
  2. Recalculate all Individuals: `active` = (household.membership_year_{{CURRENT_YEAR}}_status == "active")
  3. Log audit entries for all changes
- No creation of new columns needed (already done by admin portal)
- No price initialization (already done by admin portal)

**Code Structure:**
```javascript
function nightly_processAnnualMembershipRollover() {
  // Get current date
  var today = new Date();
  if (today.getMonth() !== 7 || today.getDate() !== 1) return; // Only run Aug 1
  
  // Update current_membership_year in all Households
  // Recalculate active flag based on new current year's status
  // Log audit entries
}
```

---

## PART E: MEMBERSHIP ACTIVATION

### Complete Activation Procedure

```
When Treasurer verifies payment (fully paid):

1. Update Payment Verifications sheet
   └─ status="verified", verified_by=[TREASURER], verified_date=NOW, paid_in_full=TRUE

2. Update Payments sheet (existing sheet)
   └─ Create entry if not already there:
      └─ Record payment details, verified status

3. Update Household
   └─ active=TRUE
   └─ membership_expiration_date=[JULY_31_OF_MEMBERSHIP_YEAR]
   └─ membership_start_date=TODAY

4. Update Individuals (all in household)
   ├─ active=TRUE
   ├─ voting_eligible=TRUE (for primary & spouse if applicable)
   ├─ Update status column for membership year:
   │  └─ `membership_year_{{MEMBERSHIP_YEAR}}_status` = "active"
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

   Member email (tpl_063):
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

   Board email (tpl_064):
   └─ Template: "New Member Activated"
      ├─ Member name & household_id
      ├─ Membership type (category)
      ├─ Activation timestamp
      ├─ Membership expiration date
      └─ Note: "Welcome email sent to member"

7. Audit log
   └─ Entry: [TREASURER], "activate_membership", [HOUSEHOLD_ID]
      └─ Details: membership_year, payment_verification_id, amount, activation_date

8. Optional: Nightly task
   └─ (No additional action needed)
   └─ Membership renewal alerts will trigger 30 days before expiration
```

### Partial Payment Activation

```
When Treasurer verifies payment (NOT fully paid):

1. Update Payment Verifications sheet
   └─ status="verified", verified_by=[TREASURER], verified_date=NOW
   └─ paid_in_full=FALSE
   └─ balance_remaining=[AMOUNT]

2. Update Payments sheet
   └─ Create entry with partial payment recorded

3. Update Household
   └─ active remains FALSE
   └─ membership_year_{{MEMBERSHIP_YEAR}}_status remains "inactive"
   └─ Do NOT set membership_expiration_date

4. Update Individuals
   └─ active remains FALSE
   └─ Do NOT unlock features

5. Send emails

   Member email (tpl_065):
   └─ Template: "Payment Verified — Balance Remaining"
      ├─ "Your payment has been verified!"
      ├─ Amount received, date verified
      ├─ "Account Status: PARTIALLY PAID"
      ├─ Balance remaining: {{BALANCE_REMAINING}}
      ├─ "Your membership will activate once fully paid"
      ├─ "Please submit remaining payment"
      └─ Payment instructions and contact info

   Board email (tpl_066):
   └─ Similar to member email, noting balance due

6. Audit log
   └─ Entry: [TREASURER], "payment_verified_partial", [HOUSEHOLD_ID]
      └─ Details: amount received, balance due, verification_date
```

---

## PART F: OVERPAYMENT, UNDERPAYMENT & REFUNDS

### Overpayment Handling Policy

**Process:** Treasurer contacts member to determine how to proceed

**Currency Consideration:** If payment is in BWP and is close to expected USD amount (within reasonable variance), account is considered paid in full

**No Quibbling:** Do not pursue member for differences of a few Pula

**Options to Offer Member:**
- Credit to next membership year
- Small refund (if member requests)
- Donation to GEA

**Documentation:** Record resolution in Payment Verifications sheet

**Variance Tolerance:** At Treasurer's discretion (e.g., +/- 5-10 Pula acceptable)

### Underpayment Handling

**Process:** Treasurer registers the payment amount received

**Currency Consideration:** Apply same "quibble tolerance" (a few Pula variance acceptable)

**After Tolerance Applied:** If still underpaid, Treasurer requests remaining balance from member

**Payment Plans:** Not offered; membership is NOT active until full amount is paid

**Notification:** Email member with amount paid, balance due, and payment instructions

**Timeline:** Request balance within 2 business days of payment submission

**Documentation:** Record partial payment in Payment Verifications sheet with balance due amount

**Membership Status:** INACTIVE (suspended) until balance is paid

### Refund Policy

**Policy:** Refunds are NOT standard practice

**Exception:** Will consider refunds only if situation warrants (case-by-case, Treasurer discretion)

**Board Approval:** If refund approved, must be authorized by Treasurer + Board decision

**Website:** Do NOT mention refunds on website or member-facing materials

**Processing:** If refund approved, process via reverse payment to original payment method

**Documentation:** Record refund decision, approval, and processing in Payment Verifications sheet + Audit Log

---

## PART G: PAYMENT TRACKING & REPORTING

### Existing Payments Sheet (from repo)

**Core Fields (existing):**
```
payment_id              - Unique identifier (PMT-YYYY-MM-DD-###)
household_id            - Link to household
application_id          - Link to membership application (if applicable)
membership_type         - Category (Full, Associate, etc.)
amount_due              - Amount in USD
amount_paid             - Amount (as reported)
payment_method          - PayPal, SDFCU, Zelle, Absa, Cash
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
  - Payment method (PayPal, SDFCU, Zelle, Absa, Cash) | Count | Amount (USD) | Amount (BWP equivalent)
  - **Total Collections (USD)** | [Total]
  - **Total Collections (BWP equivalent)** | [Total using week's Sunday rate]
- **Outstanding Balance Section:**
  - Members with balance due | Count | Total balance due (USD)
  - Members by balance age: <7 days, 7-30 days, 30-90 days, >90 days overdue
- **Notes Section:** Any anomalies, issues, or items requiring Board attention

**Storage:** Save report in Financial Records folder with filename "GEA_Collections_[YYYY-MM].xlsx"

**System Automation:** Most of this can be auto-generated from Payment Verifications and Membership sheets

### Annual Reconciliation Procedure

**Purpose:** Year-end verification that all payments are accounted for

**Timing:** Completed by January 31 of following year (covers calendar year Jan-Dec)

**External Audit:** NOT required

**Reconciliation Steps:**
1. Pull all Payment Verifications entries for the calendar year
2. Cross-reference against bank statements (PayPal, SDFCU, Zelle, Absa)
3. Verify: All recorded payments match bank records
4. Verify: All bank deposits match Payment Verifications records
5. Document any discrepancies and resolution
6. Generate reconciliation summary report

**Report Format:** Spreadsheet with columns (Payment Verifications | Bank Records | Match?) showing all entries verified

**Owner:** Treasurer

**Archive:** Store final reconciliation report in Financial Records folder with filename "GEA_YearEnd_Reconciliation_[YYYY].xlsx"

**Board Review:** Present summary (not full details) to Board at annual meeting

---

## PART H: EMAIL TEMPLATES

Add to **Email Templates Sheet** (GEA System Backend):

| tpl_id | Name | Recipient | When |
|--------|------|-----------|------|
| tpl_061 | Payment Verification Received | Member | Member submits form |
| tpl_062 | Payment Verification Pending Review | Treasurer | Member submits form |
| tpl_063 | Payment Verified (Fully Paid) | Member | Treasurer verifies, fully paid |
| tpl_064 | Payment Verified (Fully Paid) | Board | Treasurer verifies, fully paid |
| tpl_065 | Payment Verified (Partial) | Member | Treasurer verifies, partial |
| tpl_066 | Payment Verified (Partial) | Board | Treasurer verifies, partial |
| tpl_067 | Payment Not Verified | Member | Treasurer rejects |
| tpl_068 | Payment Not Verified | Board | Treasurer rejects |

**Total active templates after:** 60 + 8 = 68

---

## PART I: BACKEND ROUTES & FUNCTIONS

### Code.gs Routes

Add to `_routeAction()` switch:

```javascript
case 'submit_payment_verification':
  return _handleSubmitPaymentVerification(p);
case 'get_payment_details':
  return _handleGetPaymentDetails(p);
case 'get_payment_verifications':  // For Treasurer admin
  return _handleGetPaymentVerifications(p);
case 'verify_payment':  // For Treasurer admin
  return _handleVerifyPayment(p);
case 'reject_payment':  // For Treasurer admin
  return _handleRejectPayment(p);
```

### PaymentVerificationService.gs Functions

**8+ functions to implement:**

1. `submitPaymentVerification(params)` — Main submission handler
2. `getPaymentDetails(household_id)` — Current account status & dues
3. `getPaymentVerifications(filters)` — List for Treasurer
4. `verifyPayment(verification_id, params)` — Mark verified (fully or partial)
5. `rejectPayment(verification_id, rejection_reason)` — Mark rejected
6. `activateMembership(household_id, membership_year)` — Auto-activate
7. `createPaymentEntry(verification_id)` — Add to Payments sheet
8. `generateVerificationId()` — Auto-ID generator

### NotificationService.gs Updates

Add time-based triggers:

**Daily Exchange Rate Update (3:00 AM GMT+2):**

```javascript
function daily_updateExchangeRate() {
  try {
    var result = updateExchangeRate();
    Logger.log("Exchange rate updated: " + result.rate);
  } catch (e) {
    Logger.log("ERROR daily_updateExchangeRate: " + e);
    logAuditEntry(AUDIT_SYSTEM_ERROR, "system", "daily_task",
                  "Exchange rate update failed: " + e, "system@gea");
  }
}

function updateExchangeRate() {
  // Call exchangerate-api.com
  // Parse response
  // Store in Rates sheet
  // Update Configuration
  // Return result
}
```

**Annual Membership Rollover (00:01 on August 1):**

```javascript
function nightly_processAnnualMembershipRollover() {
  try {
    // Only run on August 1
    var today = new Date();
    if (today.getMonth() !== 7 || today.getDate() !== 1) return;
    
    // Calculate new membership year
    var year = today.getFullYear();
    var newMembershipYear = year + "-" + (year + 1);
    
    // Update all Households
    var householdsSheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName("Households");
    var data = householdsSheet.getDataRange().getValues();
    
    for (var i = 1; i < data.length; i++) {
      // Update current_membership_year
      // Recalculate active flag based on new year's status
      // Log audit entry
    }
    
    Logger.log("Annual membership rollover completed: " + newMembershipYear);
  } catch (e) {
    Logger.log("ERROR nightly_processAnnualMembershipRollover: " + e);
    logAuditEntry(AUDIT_SYSTEM_ERROR, "system", "annual_task",
                  "Membership rollover failed: " + e, "system@gea");
  }
}
```

**Trigger Registration:**

```javascript
// Daily exchange rate update (3:00 AM GMT+2)
ScriptApp.newTrigger("daily_updateExchangeRate")
  .timeBased()
  .atTime("03:00")
  .everyDays(1)
  .inTimezone("Africa/Johannesburg")
  .create();

// Annual membership rollover (00:01 on August 1)
ScriptApp.newTrigger("nightly_processAnnualMembershipRollover")
  .timeBased()
  .atTime("00:01")
  .onWeeksMonday()  // Register once per week; function checks date internally
  .inTimezone("Africa/Johannesburg")
  .create();
```

---

## PART J: FRONTEND: PAYMENT PORTAL HTML

**New HTML file:** PaymentPortal.html (~1500-2000 lines)

**Sections:**
1. Top nav (GEA brand, logout)
2. "Payment Details" tab:
   - Payment method instructions (USD-first order)
   - Pre-populated household references
   - Pro-rated dues display
   - Current exchange rate info
3. "Register Payment Made" tab:
   - Form (as designed in Part A.2)
   - Submit button
   - Form validation messages
4. "Payment History" tab (optional, future):
   - List of past submissions (status, amount, date)

---

## PART K: CONFIGURATION ADDITIONS

Add to **Configuration Sheet** (GEA System Backend):

| config_key | config_value | description |
|-----------|--------------|-------------|
| `payment_verification_max_file_size_mb` | 5 | Maximum file size for payment proof upload |
| `payment_verification_accepted_formats` | pdf,jpg,jpeg,png | Accepted file formats for proof |
| `payment_verification_allowed_days_past` | 60 | Max days in past for transaction date |
| `membership_year_start_month` | 8 | Month when fiscal year starts (1-12) |
| `membership_year_default_due_date` | 07-31 | Default due date (MM-DD format) |
| `exchange_rate_usd_to_bwp_current` | 13.45 | Most recent Sunday's USD to BWP exchange rate |
| `exchange_rate_last_updated` | 2026-03-08 | Date of last exchange rate update |
| `exchange_rate_last_sunday` | 2026-03-08 | Date of last Sunday for which we have a rate |
| `exchangerate_api_key` | [key] | exchangerate-api.com API key |

---

## IMPLEMENTATION CHECKLIST

### Spreadsheet Setup
- [ ] ~~Create "Membership Pricing" sheet~~ ✅ Already created in GEA Member Directory
- [ ] Verify Membership Pricing is populated for current year (2025-26) with all membership_level_ids and annual_dues_usd
- [ ] Pre-populate Membership Pricing for next year (2026-27) with `active_for_payment = FALSE` (update on Aug 1)
- [ ] Create "Rates" sheet in Financial Records (exchange rate history)
- [ ] Update Configuration sheet with 9 new config keys (removed acceptable_membership_years_for_payment)
- [ ] Add 8 new email templates (tpl_061 through tpl_068)

### Code Implementation
- [ ] Create PaymentVerificationService.gs (8+ functions)
- [ ] Update Code.gs with 5 new routes
- [ ] Update NotificationService.gs with:
  - [ ] daily_updateExchangeRate() and updateExchangeRate()
  - [ ] nightly_processAnnualMembershipRollover() (Aug 1 trigger)
  - [ ] Register both triggers
- [ ] Update Config.gs with API key and new constants
- [ ] Implement pro-ration calculation logic (by quarter)
- [ ] Implement reference pre-population logic
- [ ] Implement exchange rate retrieval and storage
- [ ] Implement membership year status tracking in Households sheet

### Admin Portal (Future)
- [ ] "Membership Settings" section for next fiscal year setup:
  - [ ] Set dues in Membership Pricing sheet
  - [ ] "Activate Payment for {{NEXT_YEAR}}" button (sets active_for_payment, initializes status columns)

### Frontend Implementation
- [ ] Create PaymentPortal.html (~1500-2000 lines)
  - Payment Details section (4 payment methods, USD-first)
  - Register Payment form
  - Pro-ration display and calculation
  - Exchange rate display (Sunday rate)
  - Payment history (optional future)
- [ ] Integrate into member portal navigation
- [ ] Test form validation
- [ ] Test file upload
- [ ] Test reference pre-population

### Testing
- [ ] Unit tests: Pro-ration calculation, date validation, currency conversion
- [ ] Unit tests: Exchange rate API call and parsing
- [ ] Unit tests: Exchange rate storage and Sunday rate logic
- [ ] Manual testing: Submit payment via form
- [ ] Manual testing: Treasurer verification workflow
- [ ] Manual testing: Email notifications
- [ ] Manual testing: Membership activation
- [ ] Manual testing: Exchange rate daily update
- [ ] Edge cases: Partial payments, late payments, file upload, pro-ration boundaries

---

## SUCCESS CRITERIA

When complete:
- ✅ Members can view payment instructions with pre-populated household-specific references
- ✅ Members can view pro-rated dues based on current quarter (fetched dynamically from Membership Pricing sheet)
- ✅ Dues lookups use household.membership_level_id + selected membership_year (join logic correct)
- ✅ Members can view both USD and BWP amounts using current Sunday's exchange rate
- ✅ Members can submit payment verification with proof and metadata
- ✅ Member receives confirmation email immediately
- ✅ Treasurer receives action email and can review in admin portal
- ✅ Treasurer can mark verified (fully paid or partial) or not verified with reason
- ✅ Member receives result email + notification to Board
- ✅ Fully paid memberships auto-activate for the year (unlocking reservations, etc.)
- ✅ Partially paid memberships remain inactive until fully paid
- ✅ Membership year status tracked in Households sheet (membership_year_{{YEAR}}_status columns)
- ✅ `active` flag recalculated on Aug 1 based on current membership year status
- ✅ Aug 1 trigger correctly handles annual membership year rollover
- ✅ Audit trail of all submissions and decisions
- ✅ Payment entry created in Payments sheet upon verification
- ✅ Pro-ration correctly calculated by quarter (Q1 100%, Q2 75%, Q3 50%, Q4 25%)
- ✅ Exchange rate automatically retrieved daily from exchangerate-api.com at 3 AM GMT+2
- ✅ Portal displays most recent Sunday's exchange rate (or previous business day if Sunday unavailable)
- ✅ All dates, currencies, amounts, and references tracked accurately
- ✅ Payment methods displayed in USD-preferred order (PayPal, SDFCU, Zelle, Absa)

---

## NEXT STEPS

1. **Approval:** Michael reviews synthesized document and confirms approach
2. **Spreadsheet Setup:** Create Payment Verifications sheet + Rates sheet + add config keys and templates
3. **Backend Implementation:** 
   - Code PaymentVerificationService.gs and integrate into Code.gs
   - Implement daily_updateExchangeRate() and updateExchangeRate() in NotificationService.gs
   - Configure exchangerate-api.com API key in Config.gs
   - Register daily trigger for exchange rate updates
4. **Frontend Implementation:** Build PaymentPortal.html with pro-ration display and exchange rate info
5. **Testing & Deployment:** Full workflow testing including exchange rate retrieval before Board presentation

---

**Status:** Synthesized document complete, incorporating repo's implementation policy with new member portal verification feature, dynamic dues from Membership Levels, daily exchange rate retrieval with Sunday rate display, and USD-preferred payment methods.

**Last Updated:** March 12, 2026
**Based On:** CLAUDE_Payments_Implementation.md (repo) + GEA_PaymentVerification_PlanningDocument.md
