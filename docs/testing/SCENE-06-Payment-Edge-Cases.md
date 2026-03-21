# Scene 06 — Payment Edge Cases

**Order:** Requires at least one application to reach "approved_pending_payment" status. Run Scene 01 through Step 12 first (or use a dedicated test applicant for each sub-scene).

**What this tests:**
- **Part A:** Payment in BWP (Absa) where amount paid is slightly off the official pro-rated BWP amount — treasurer approves with judgment call (wiggle room)
- **Part B:** Treasurer requests clarification → applicant provides additional info → treasurer approves
- **Part C:** Treasurer rejects payment → applicant resubmits with corrected information → treasurer approves
- **Part D:** Payment via SDFCU Member2Member
- **Spot check:** Pro-rated BWP amount on the page uses live exchange rate, not a hardcoded value

---

## Cast

| Role | Who | Access |
|------|-----|--------|
| **Applicant A** | test email (for Part A) | Non-Member Portal |
| **Applicant B** | test email (for Part B) | Non-Member Portal |
| **Applicant C** | test email (for Part C) | Non-Member Portal |
| **Applicant D** | test email (for Part D) | Non-Member Portal |
| **Treasurer** | board@geabotswana.org | Admin Portal (email + password) |

**Admin Portal login note:** Admin Portal now requires email + password. Treasurer credentials are in the Administrators tab of System Backend.

**Note:** Parts A–D can each use the same applicant at different stages, or four separate applicants. Using separate applicants is cleaner but requires four approved applications. Using one applicant means running Parts in sequence.

---

## Pre-conditions

- Each applicant has reached "approved_pending_payment" status via the standard flow
- Configuration sheet has a live (non-default) exchange rate for exchange_rate_usd_to_bwp (confirm rate ≠ 13.45 after nightly task has run)

---

## Spot Check — Verify Live Exchange Rate on Payment Page

**Who:** Any applicant at "approved_pending_payment" status
**Where:** Non-Member Portal → Payment

**Action:**
1. Open Payment page
2. Note the Exchange Rate displayed

**Check:**
- Rate shown matches exchange_rate_usd_to_bwp in the Configuration sheet (System Backend workbook)
- Rate is NOT 13.45 (the hardcoded default — if nightly fetch has run, it should differ)
- BWP amount = pro-rated USD × displayed rate (verify arithmetic manually)

**Fail if:** Rate shows 13.45 when Configuration sheet has a different value, or BWP amount doesn't match the multiplication

---

## Part A — BWP Payment with Wiggle Room

**Scenario:** The official pro-rated amount is, say, BWP 876.25. The applicant pays BWP 880.00 (rounding up). The treasurer should be able to approve this as "close enough."

---

### Step A1 — Applicant Notes the Official BWP Amount
**Who:** Applicant A
**Where:** Non-Member Portal → Payment

**Action:**
1. Record the displayed pro-rated BWP amount (e.g. BWP 876.25)
2. Intentionally plan to submit a slightly different amount (e.g. BWP 880.00 — within a few pula)

---

### Step A2 — Applicant Submits BWP Payment
**Who:** Applicant A
**Where:** Non-Member Portal → Payment form

**Action:**
1. Select method: **"Absa (BWP)"**
2. Enter today's date
3. In Notes: "Paid BWP 880.00 to Absa account 1005193. Reference: [name]. Note: I rounded up slightly from the stated BWP 876.25."
4. Optionally attach a test proof file
5. Submit

**Check:**
- Submission succeeds
- Payments sheet: method = "Absa (BWP)", notes contain the stated amount, status = "submitted"
- Applicant status card shows "Payment submitted — awaiting verification"
- Treasurer notified: PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD

---

### Step A3 — Treasurer Reviews BWP Payment
**Who:** Treasurer
**Where:** Admin Portal → Payments → Pending Verification

**Action:**
1. Open Applicant A's payment
2. Review notes — sees BWP 880.00 submitted vs BWP 876.25 official amount
3. Confirm the payment details match what a real Absa bank transfer would show
4. Click **"Approve"** — exercising judgment that the small overpayment is acceptable

**Check:**
- Approval succeeds
- Membership activates (all same checks as Scene 01 Step 16)
- No system block on approving a payment that differs from the calculated amount (system does not enforce exact amount — that is intentional, treasurer decides)

**Fail if:** System blocks approval because amount doesn't exactly match, or treasurer cannot approve without entering an exact amount

---

## Part B — Treasurer Requests Clarification

**Scenario:** Applicant submits payment but notes are unclear (e.g. doesn't specify the amount or reference number). Treasurer requests clarification.

---

### Step B1 — Applicant Submits Incomplete Payment Info
**Who:** Applicant B
**Where:** Non-Member Portal → Payment form

**Action:**
1. Select any method (e.g. "Zelle (USD)")
2. Enter today's date
3. Notes: "I made the payment." (intentionally vague — no amount, no reference)
4. No proof file attached
5. Submit

**Check:** Submission accepted (system doesn't validate note content), status = "submitted"

---

### Step B2 — Treasurer Requests Clarification
**Who:** Treasurer
**Where:** Admin Portal → Payments → Pending Verification

**Action:**
1. Open Applicant B's payment
2. Click **"Request Clarification"**
3. Enter message: "Please provide the transaction amount, the Zelle reference number, and attach a screenshot of the payment confirmation."
4. Submit

**Check:**

**Payments sheet:**
- status = "clarification_requested"
- clarification_message or notes updated with treasurer's request

**Applicant email:**
- Receives: PAY_PAYMENT_CLARIFICATION_REQUESTED_TO_MEMBER
- Email contains the treasurer's clarification message

**Applicant portal:**
- Payment status card shows "Clarification requested" state
- Re-submission form is visible again (applicant can submit new info)

**Fail if:** Clarification email not received, status doesn't update, or applicant cannot re-submit

---

### Step B3 — Applicant Resubmits with Clarification
**Who:** Applicant B
**Where:** Non-Member Portal → Payment

**Action:**
1. Applicant sees clarification request on payment page
2. Re-submits with complete info:
   - Method: Zelle (USD)
   - Date: today
   - Notes: "Paid $50.00 via Zelle to geaboard@gmail.com. Transaction ID: ZELLE-TEST-B2. Screenshot attached."
   - Attach test proof file
3. Submit

**Check:**
- New payment row created (or existing row updated — check which behavior occurs)
- Status returns to "submitted"
- Treasurer re-notified: PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD (or similar)
- Old clarification request is recorded (not deleted)

---

### Step B4 — Treasurer Approves Resubmission
**Who:** Treasurer
**Where:** Admin Portal

**Action:** Approve Applicant B's resubmitted payment

**Check:** Membership activates (all standard checks apply)

---

## Part C — Treasurer Rejects Payment → Applicant Resubmits

**Scenario:** Applicant submits payment to wrong account or for wrong amount. Treasurer rejects with a reason.

---

### Step C1 — Applicant Submits Wrong Payment
**Who:** Applicant C
**Where:** Non-Member Portal → Payment form

**Action:**
1. Select method: "PayPal (USD)"
2. Notes: "Sent $25 to geaboard@gmail.com" (wrong amount — should be the full pro-rated amount)
3. Submit

---

### Step C2 — Treasurer Rejects Payment
**Who:** Treasurer
**Where:** Admin Portal → Payments

**Action:**
1. Open Applicant C's payment
2. Click **"Reject"**
3. Enter reason: "Payment amount of $25 does not match the required pro-rated dues of $[amount]. Please resubmit with the correct amount."
4. Submit

**Check:**

**Payments sheet:**
- status = "rejected"
- rejection_reason recorded

**Applicant email:**
- Receives: PAY_PAYMENT_REJECTED_TO_MEMBER
- Email contains rejection reason and instructions to resubmit

**Applicant portal:**
- Status shows "Payment Rejected" with reason displayed
- Re-submission form is visible

**Fail if:** Rejection reason not in email, applicant cannot see reason in portal, or re-submission form is hidden after rejection

---

### Step C3 — Applicant Resubmits Correct Payment
**Who:** Applicant C
**Where:** Non-Member Portal → Payment

**Action:**
1. View rejection reason on payment page
2. Re-submit with correct full amount
3. Notes: "Resubmitting with correct amount of $[correct amount]. Previous submission was for wrong amount. New Transaction ID: PAYPAL-TEST-C3."

**Check:**
- New submission accepted
- Status = "submitted"
- Treasurer notified again

---

### Step C4 — Treasurer Approves Correct Submission
**Who:** Treasurer
**Action:** Approve

**Check:** Membership activates

---

## Part D — SDFCU Member2Member Payment

**Scenario:** Happy path using SDFCU as payment method.

---

### Step D1 — Applicant Submits via SDFCU
**Who:** Applicant D
**Where:** Non-Member Portal → Payment form

**Action:**
1. Note the displayed SDFCU details (account GEA2026, routing 256075342)
2. Select method: **"SDFCU Member2Member (USD)"**
3. Date: today
4. Notes: "Transferred via SDFCU Member2Member using code GEA2026. Amount: $[pro-rated amount]. Confirmation number: SDFCU-TEST-001."
5. Submit

**Check:**
- method in Payments sheet = "SDFCU Member2Member (USD)"
- Submission succeeds

---

### Step D2 — Treasurer Approves
**Who:** Treasurer
**Action:** Approve

**Check:** Membership activates. Same checks as Scene 01 Step 16.

---

## Completion Criteria

Scene 06 is **PASS** when:
- BWP payment with slight variance was approved without system block (Part A)
- Clarification cycle completed: request → resubmit → approve (Part B)
- Rejection cycle completed: reject with reason → resubmit → approve (Part C)
- SDFCU payment processed successfully (Part D)
- Live exchange rate confirmed on payment page (Spot Check)
- System never blocks treasurer from approving based on amount (amount validation is human judgment only)
