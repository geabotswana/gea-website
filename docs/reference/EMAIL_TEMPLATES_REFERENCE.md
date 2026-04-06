# GEA Email Templates Reference

**Last Updated:** 2026-04-06
**Total Templates:** 72

All templates share standardized greeting, signature, and footer blocks:
- **Greeting:** `Dear {{FIRST_NAME}},` (member-facing) or role-appropriate salutation
- **Signature:** Gaborone Employee Association / www.geabotswana.org / board@geabotswana.org
- **Footer:** Automated message notice with reply instructions

Template variables are listed in [_MANIFEST.md](../email_templates/_MANIFEST.md). Variables use `{{PLACEHOLDER}}` syntax. Conditional blocks use `{{IF_NAME}}...{{END_IF}}` syntax.

---

## Administrative (17 templates)

Notifications to board, management, and RSO about application workflow and document review actions.

| Semantic Name | Recipient | Subject | Notes |
|---------------|-----------|---------|-------|
| ADM_BOARD_APPROVAL_REQUEST_TO_BOARD | Board | Action Required: `{{BOARD_ITEM_TYPE}}` Approval Needed | Board notification requiring decision on pending item |
| ADM_BOARD_INITIAL_APPROVAL_TO_BOARD | Board | Application Approved — `{{APPLICANT_NAME}}` — Moving to RSO Review | All board members notified when initial approval is granted; application moving to RSO for document verification |
| ADM_BOARD_APPROVED_FOR_RSO_TO_BOARD | Board | Board Approved: `{{APPLICANT_NAME}}` Ready for RSO Processing | Board notified that application has cleared initial review and is moving to RSO stage |
| ADM_BOARD_FINAL_APPROVAL_TO_BOARD | Board | Membership Activated: `{{APPLICANT_NAME}}` (`{{APPLICATION_ID}}`) | Final board approval notification; member is now active |
| ADM_BOARD_FINAL_DENIED_TO_BOARD | Board | Application Denied: `{{APPLICANT_NAME}}` (`{{APPLICATION_ID}}`) | Final rejection from board; appeal process communicated |
| ADM_BOARD_INITIAL_DENIED_TO_BOARD | Board | Application Denied at Initial Review: `{{APPLICANT_NAME}}` | Denial before RSO stage; applicant has not yet submitted documents |
| ADM_DAILY_SUMMARY_TO_RSO_NOTIFY | RSO | GEA Daily RSO Summary - `{{TODAY_DATE}}` | Daily operational report sent to RSO with all events scheduled for today |
| ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE | RSO | Action Required: Document Review for `{{APPLICANT_NAME}}` | RSO notified that applicant documents are ready for review |
| ADM_DOCUMENT_APPROVED_BY_RSO_TO_MEMBER | Member | GEA: Your Document Has Been Approved | Member notified that RSO has approved their document |
| ADM_DOCS_SENT_TO_BOARD_FOR_REVIEW_TO_BOARD | Board | Documents Ready for Your Review: `{{APPLICANT_NAME}}` | Board notification that applicant documents are ready for initial board review (sent when applicant confirms documents) |
| ADM_DOCS_SENT_TO_BOARD_FOR_REVIEW_TO_MEMBER | Member | GEA: Your Documents Are Under Board Review | Member notified that their documents are being reviewed by the board (sent when applicant confirms documents) |
| ADM_DOCS_SENT_TO_RSO_TO_BOARD | Board | Documents Forwarded to RSO: `{{APPLICANT_NAME}}` | Board notification that applicant documents have been sent to RSO for review (sent AFTER board approves) |
| ADM_DOCS_SENT_TO_RSO_TO_MEMBER | Member | GEA: Your Documents Have Been Forwarded for Review | Member notified that their submitted documents have been forwarded to RSO for validation (sent AFTER board approves) |
| ADM_MGT_APPROVAL_REQUEST_TO_MGT | Mgmt Officer | Action Required: `{{BOARD_ITEM_TYPE}}` Needs Management Approval | Management notification for items requiring their sign-off |
| ADM_NEW_APPLICATION_BOARD_TO_BOARD | Board | New Application: `{{APPLICANT_NAME}}` — Review by `{{BOARD_REVIEW_DEADLINE}}` | Board notification when a new membership application is submitted; includes review deadline |
| ADM_READY_FOR_FINAL_APPROVAL_TO_MEMBER | Applicant | Your GEA Application is Ready for Final Approval | Notifies applicant that final approval stage has been reached |
| ADM_RSO_DOCUMENT_ISSUE_TO_BOARD | Board | RSO Document Issue: `{{APPLICANT_NAME}}` (`{{APPLICATION_ID}}`) | Board alerted that RSO has flagged a document problem requiring resolution |

---

## Documents (7 templates)

Confirmations and status updates for file uploads, document reviews, and photo submissions.

| Semantic Name | Recipient | Subject | Notes |
|---------------|-----------|---------|-------|
| DOC_DOCUMENTS_CONFIRMED_TO_MEMBER | Member | GEA: Your Documents Have Been Confirmed | Confirmation that all submitted documents have been received and validated |
| DOC_DOCUMENT_REJECTED_TO_MEMBER | Member | Your `{{DOCUMENT_TYPE}}` Submission Was Not Approved — Action Required | Notifies member that a submitted document failed review; resubmission required |
| DOC_EMPLOYMENT_VERIFICATION_REQUESTED_TO_MEMBER | Member | GEA Requires Your Employment Verification | Requests employment documentation from member or applicant |
| DOC_FILE_SUBMISSION_CONFIRMATION_TO_MEMBER | Member | GEA: File Received — `{{FILE_NAME}}` | Acknowledgment of any file upload to the member portal |
| DOC_PHOTO_APPROVED_TO_MEMBER | Member | GEA: Your Member Photo Has Been Approved | Notifies member that their profile photo was approved and transferred to Cloud Storage |
| DOC_PHOTO_REJECTED_TO_MEMBER | Member | GEA: Your Member Photo Needs Resubmission | Notifies member of photo rejection with guidelines for resubmission |
| DOC_PHOTO_SUBMISSION_REMINDER_TO_MEMBER | Member | Reminder: Please Submit Your GEA Member Photo | Sent to members who have been activated but have not yet uploaded a profile photo |

---

## Membership (16 templates)

Account creation, application lifecycle, password management, renewals, and milestone notifications.

| Semantic Name | Recipient | Subject | Notes |
|---------------|-----------|---------|-------|
| MEM_ACCOUNT_CREDENTIALS_TO_APPLICANT | Applicant | Your GEA Member Portal Login Details | Delivers temporary login credentials to new applicants on account creation |
| MEM_APPLICATION_APPROVED_TO_APPLICANT | Applicant | GEA Application Approved — Payment Required to Activate | Application cleared board review; payment required to complete membership activation |
| MEM_APPLICATION_DENIED_TO_APPLICANT | Applicant | Your GEA Application — Update from the Board | Respectful denial notification with contact info for follow-up questions |
| MEM_APPLICATION_RECEIVED_TO_APPLICANT | Applicant | GEA Application Received — Next Steps Inside | Confirms receipt of new membership application and explains next steps |
| MEM_BIRTHDAY_AGE_15_MILESTONE_TO_MEMBER | Minor | Happy 15th Birthday from GEA — `{{FIRST_NAME}}`! | Milestone birthday note; informs that adult membership eligibility approaches at 18 |
| MEM_BIRTHDAY_AGE_16_MILESTONE_TO_MEMBER | Minor | Happy 16th Birthday from GEA — `{{FIRST_NAME}}`! | Milestone birthday note; two years until adult membership eligibility |
| MEM_BIRTHDAY_GREETING_TO_MEMBER | Member | Happy Birthday from GEA — `{{FIRST_NAME}}`! | Annual birthday greeting for all adult members |
| MEM_FIRST_LOGIN_WELCOME_TO_MEMBER | New Member | Welcome to the GEA Member Portal — `{{FIRST_NAME}}` | Triggered on first successful login; provides portal orientation and key links |
| MEM_MEMBERSHIP_ACTIVATED_TO_MEMBER | New Member | Welcome to GEA — Your Membership Is Now Active! | Final welcome email when membership is fully activated after payment verification |
| MEM_MEMBERSHIP_EXPIRED_TO_MEMBER | Member | Your GEA Membership Has Expired — Renew to Restore Access | Sent when membership lapses on July 31; prompts renewal payment |
| MEM_PASSPORT_EXPIRATION_WARNING_TO_MEMBER | Member | Your Passport Expires `{{EXPIRATION_DATE}}` — Please Update GEA Records | 6-month advance warning; member should upload renewed document once received |
| MEM_PASSWORD_RESET_COMPLETE_TO_MEMBER | Member | Your GEA Member Portal Password Has Been Reset | Confirmation that member has successfully reset their password |
| MEM_PASSWORD_RESET_REQUEST_TO_MEMBER | Member | Reset Your GEA Member Portal Password | Self-serve password reset request for member accounts |
| MEM_PASSWORD_SET_TO_MEMBER | Member | Your GEA Portal Password Is Ready | Sent when a temporary password is issued; member should log in and change it immediately |
| MEM_RENEWAL_REMINDER_30_DAYS_TO_MEMBER | Member | GEA Membership Renewal Due in 30 Days — Renew by `{{RENEWAL_DEADLINE}}` | Early renewal nudge sent 30 days before July 31 expiration |
| MEM_RENEWAL_REMINDER_7_DAYS_TO_MEMBER | Member | Urgent: GEA Membership Expires in 7 Days — Renew by `{{RENEWAL_DEADLINE}}` | Final renewal warning 7 days before expiration; stronger urgency and call to action |

---

## Payments (8 templates)

Payment submission acknowledgments, treasurer review outcomes, and board FYI notifications.

| Semantic Name | Recipient | Subject | Notes |
|---------------|-----------|---------|-------|
| PAY_PAYMENT_CLARIFICATION_REQUESTED_TO_MEMBER | Member | GEA: Your Payment Needs Clarification — Action Required | Treasurer requests additional information before payment can be verified |
| PAY_PAYMENT_CONFIRMATION_RECEIVED_TO_MEMBER | Member | GEA: Payment Confirmation Received (`{{PAYMENT_ID}}`) | Acknowledges receipt of bank payment confirmation document |
| PAY_PAYMENT_PROOF_RECEIVED_TO_MEMBER | Member | GEA: Payment Proof Received — Under Review | Acknowledges proof-of-payment upload; sets expectation for Treasurer review timeline |
| PAY_PAYMENT_REJECTED_TO_MEMBER | Member | GEA: Your Payment Submission Could Not Be Verified | Notifies member that submitted payment could not be matched; resubmission instructions included |
| PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD | Board | Payment Submitted: `{{MEMBER_NAME}}` — `{{AMOUNT}}` `{{CURRENCY}}` | Informational alert to board when a member submits payment; no action required |
| PAY_PAYMENT_SUBMITTED_TO_MEMBER | Member | GEA: Your Payment Has Been Submitted | Confirms member payment submission and sets expectation for Treasurer review |
| PAY_PAYMENT_VERIFIED_ACTIVATED_BOARD_FYI_TO_BOARD | Board | Payment Verified & Membership Activated: `{{MEMBER_NAME}}` | Informs board when Treasurer verifies payment and membership is activated |
| PAY_PAYMENT_VERIFIED_TO_MEMBER | Member | GEA: Your Payment Is Verified — Membership Is Now Active! | Final confirmation to member that payment was accepted and membership is fully active |

---

## Reservations (22 templates)

Booking lifecycle notifications, excess-usage approvals, guest list workflow, and limit alerts.

| Semantic Name | Recipient | Subject | Notes |
|---------------|-----------|---------|-------|
| RES_APPROVAL_REMINDER_TO_BOARD | Board | Action Required: `{{PENDING_COUNT}}` Reservation(s) Awaiting Your Approval | Daily nightly digest to board listing all reservations still in pending status |
| RES_BOOKING_APPROVAL_REQUEST_TO_BOARD | Board | Action Required: Reservation Approval — `{{MEMBER_NAME}}` at `{{FACILITY}}` on `{{RESERVATION_DATE}}` | Primary board action email for all standard (non-excess) reservation approvals |
| RES_BOOKING_APPROVED_TO_MEMBER | Member | GEA Reservation Approved: `{{FACILITY_NAME}}` on `{{RESERVATION_DATE}}` | Approval confirmation sent to member; includes guest list submission instructions |
| RES_BOOKING_CANCELLED_TO_MEMBER | Member | GEA Reservation Cancelled: `{{FACILITY_NAME}}` on `{{ORIGINAL_DATE}}` | Cancellation confirmation with reason; sent on cancel by member or board |
| RES_BOOKING_DENIED_BOARD_COPY_TO_BOARD | Board | Reservation Denied: `{{MEMBER_NAME}}` — `{{FACILITY_NAME}}` on `{{REQUESTED_DATE}}` | Board record copy when a reservation is denied; for audit trail and board awareness |
| RES_BOOKING_DENIED_TO_MEMBER | Member | GEA Reservation: Your Request for `{{FACILITY_NAME}}` Was Not Approved | Denial with reason sent to member |
| RES_BOOKING_PENDING_REVIEW_TO_MEMBER | Member | GEA Reservation Received — Pending Board Review | Interim notice for reservations requiring board approval; sets expectation for timeline |
| RES_BOOKING_RECEIVED_TO_MEMBER | Member | GEA Reservation Received: `{{FACILITY_NAME}}` on `{{RESERVATION_DATE}}` | Initial confirmation for auto-approved bookings (tennis within weekly limit) |
| RES_BOOKING_WAITLISTED_TO_MEMBER | Member | GEA: You Are on the Waitlist — `{{FACILITY_NAME}}` on `{{RESERVATION_DATE}}` | Sent to member when board places their pending reservation on the waitlist; includes their position number |
| RES_EXCESS_LEOBO_APPROVAL_REQUEST_TO_MEMBER | Member | GEA: Your Leobo Booking Exceeds Monthly Limit — Pending Board Approval | Informs member their Leobo request exceeds the monthly household limit and requires board approval |
| RES_EXCESS_LEOBO_APPROVAL_REQUEST_TO_MGT | Mgmt Officer | Action Required: Excess Leobo Booking — `{{MEMBER_NAME}}` on `{{RESERVATION_DATE}}` | MGT action email for Leobo bookings that exceed the monthly household limit |
| RES_EXCESS_TENNIS_APPROVAL_REQUEST_TO_BOARD | Board | Action Required: Excess Tennis Booking — `{{MEMBER_NAME}}` on `{{RESERVATION_DATE}}` | Board action email for tennis bookings that exceed the 3-hour weekly household limit |
| RES_EXCESS_TENNIS_APPROVAL_REQUEST_TO_MEMBER | Member | GEA: Your Tennis Booking Exceeds Weekly Hours — Pending Board Approval | Informs member their tennis request exceeds the 3-hour weekly household limit and requires board approval |
| RES_GUEST_LIST_DEADLINE_REMINDER_TO_MEMBER | Member | Reminder: Guest List Due `{{DEADLINE}}` — `{{FACILITY_NAME}}` on `{{RESERVATION_DATE}}` | Final-call reminder sent one day before the guest list submission deadline |
| RES_GUEST_LIST_REJECTIONS_TO_BOARD | Board | RSO Guest Review: `{{REJECTED_COUNT}}` Guest(s) Flagged — `{{HOUSEHOLD_NAME}}` on `{{RESERVATION_DATE}}` | Board notification when RSO flags one or more guests during guest list review |
| RES_GUEST_LIST_SUBMITTED_TO_MEMBER | Member | GEA: Guest List Received for `{{FACILITY_NAME}}` on `{{RESERVATION_DATE}}` | Confirms to member that their guest list has been received and is pending RSO review |
| RES_HOLIDAY_CALENDAR_REMINDER_TO_MEMBER | Member | GEA: Holiday Calendar Update Required — `{{HOLIDAY_NAME}}` | Sent to board on Nov 1 annually; reminder to update holiday calendar for the coming year |
| RES_LEOBO_APPROVAL_REQUEST_TO_MGT | Mgmt Officer | Action Required: Leobo Booking Approval — `{{MEMBER_NAME}}` on `{{RESERVATION_DATE}}` | MGT action email for all standard (non-excess) Leobo booking approvals |
| RES_LEOBO_LIMIT_REACHED_TO_MEMBER | Member | GEA: Monthly Leobo Limit Reached — Request Submitted for Board Review | Sent when member's Leobo request exceeds the monthly limit; board review required |
| RES_LEOBO_MGT_APPROVED_TO_BOARD | Board | Action Required: Final Board Approval — `{{MEMBER_NAME}}` Leobo on `{{RESERVATION_DATE}}` | Board notification requesting final approval after management officer approves Leobo booking |
| RES_TENNIS_LIMIT_REACHED_TO_MEMBER | Member | GEA: Weekly Tennis Hours Limit Reached — Request Submitted for Board Review | Sent when member's tennis request exceeds the weekly 3-hour limit; board review required |
| RES_WAITLIST_SLOT_OPENED_TO_MEMBER | Member | GEA: `{{FACILITY}}` Available on `{{RESERVATION_DATE}}` — Claim Your Spot | Notifies waitlisted member that a slot has opened; slot held for `{{WAITLIST_HOLD_HOURS}}` before moving to next in queue |

---

## System (2 templates)

Admin account password management.

| Semantic Name | Recipient | Subject | Notes |
|---------------|-----------|---------|-------|
| SYS_PASSWORD_RESET_COMPLETE_TO_ADMIN | Admin | Your GEA Admin Portal Password Has Been Reset | Confirmation that admin has successfully reset their password |
| SYS_PASSWORD_RESET_REQUEST_TO_ADMIN | Admin | Reset Your GEA Admin Portal Password | Self-serve password reset request for admin accounts |
