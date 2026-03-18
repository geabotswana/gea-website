# Payment Email Templates

Emails covering the full payment verification workflow — from submission through treasurer review to final verification or rejection.

## Payment Workflow

```
Member submits payment proof
  ↓ PAY_PAYMENT_SUBMITTED_TO_MEMBER (to member)
  ↓ PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD (to board)
Treasurer reviews
  ├─ Approved → PAY_PAYMENT_VERIFIED_TO_MEMBER
  │             PAY_PAYMENT_VERIFIED_ACTIVATED_BOARD_FYI_TO_BOARD
  ├─ Rejected → PAY_PAYMENT_REJECTED_TO_MEMBER
  └─ Needs info → PAY_PAYMENT_CLARIFICATION_REQUESTED_TO_MEMBER
```

## Templates (8)

### Member-Facing

**PAY_PAYMENT_SUBMITTED_TO_MEMBER.txt**
Sent immediately when a member submits a payment verification request.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{PAYMENT_ID}}`, `{{AMOUNT}}`, `{{CURRENCY}}`, `{{SUBMISSION_DATE}}`, `{{NEXT_STEP}}`

**PAY_PAYMENT_PROOF_RECEIVED_TO_MEMBER.txt**
Sent when bank proof of payment document is received (distinct from the submission confirmation).
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{PAYMENT_ID}}`, `{{AMOUNT}}`, `{{SUBMISSION_DATE}}`

**PAY_PAYMENT_CONFIRMATION_RECEIVED_TO_MEMBER.txt**
Sent when treasurer acknowledges receipt of the payment documentation.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{PAYMENT_ID}}`, `{{AMOUNT}}`, `{{CURRENCY}}`, `{{REFERENCE_NUMBER}}`, `{{SUBMISSION_DATE}}`

**PAY_PAYMENT_VERIFIED_TO_MEMBER.txt**
Sent when treasurer verifies and approves the payment. Membership is now active.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{PAYMENT_ID}}`, `{{AMOUNT}}`, `{{CURRENCY}}`, `{{VERIFICATION_DATE}}`, `{{MEMBERSHIP_ACTIVATED}}`

**PAY_PAYMENT_REJECTED_TO_MEMBER.txt**
Sent when a payment cannot be verified. Includes the reason and resubmission deadline.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{PAYMENT_ID}}`, `{{REJECTION_REASON}}`, `{{RESUBMIT_DEADLINE}}`, `{{CONTACT_EMAIL}}`

**PAY_PAYMENT_CLARIFICATION_REQUESTED_TO_MEMBER.txt**
Sent when treasurer needs additional information before approving. Member should reply or resubmit.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{PAYMENT_ID}}`, `{{CLARIFICATION_NEEDED}}`, `{{DEADLINE}}`, `{{CONTACT_EMAIL}}`

### Board-Facing (FYI copies)

**PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD.txt**
Internal notification when a member submits a payment. Keeps board informed.
- Recipient: Board
- Variables: `{{FIRST_NAME}}`, `{{MEMBER_NAME}}`, `{{PAYMENT_ID}}`, `{{AMOUNT}}`, `{{CURRENCY}}`, `{{STATUS}}`

**PAY_PAYMENT_VERIFIED_ACTIVATED_BOARD_FYI_TO_BOARD.txt**
Internal notification when a payment is verified and membership activated. Closes the loop for board records.
- Recipient: Board
- Variables: `{{FIRST_NAME}}`, `{{MEMBER_NAME}}`, `{{PAYMENT_ID}}`, `{{AMOUNT}}`, `{{CURRENCY}}`, `{{MEMBERSHIP_ACTIVATED}}`
