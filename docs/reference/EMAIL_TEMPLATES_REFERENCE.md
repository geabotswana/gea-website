# GEA Email Templates Reference

**Last Updated:** 2026-04-29
**Total Templates:** 118

All templates share standardized greeting, signature, and footer blocks:
- **Greeting:** `Dear {FIRST_NAME},` (member-facing) or role-appropriate salutation
- **Signature:** Gaborone Employee Association / www.geabotswana.org / board@geabotswana.org
- **Footer:** Automated message notice with reply instructions

Template variables are listed in [_MANIFEST.md](../email_templates/_MANIFEST.md). Variables use `{{PLACEHOLDER}}` syntax. Conditional blocks use `{{IF_NAME}}...{{END_IF}}` syntax.

---

## ADM — Notifications to board, management, and RSO about application workflow, document review, and system actions. (26 templates)

| Semantic Name | Recipient | Subject | Notes |
|---|---|---|---|
| `ADM_BOARD_APPROVAL_REQUEST_TO_BOARD` | Board Approval Request | Action Required: {{BOARD_ITEM_TYPE}} Approval Needed | Board notification requiring decision on pending item |
| `ADM_BOARD_APPROVED_FOR_RSO_TO_BOARD` | Board Approved for RSO | Board Approved: {{APPLICANT_NAME}} Ready for RSO Processing | Board notified that application has cleared initial review and is moving to RSO stage |
| `ADM_BOARD_FINAL_APPROVAL_TO_BOARD` | Board Final Approval | Membership Activated: {{APPLICANT_NAME}} ({{APPLICATION_ID}}) | Final board approval notification; member is now active |
| `ADM_BOARD_FINAL_DENIED_TO_BOARD` | Board Final Denial | Application Denied: {{APPLICANT_NAME}} ({{APPLICATION_ID}}) | Final rejection from board; appeal process communicated |
| `ADM_BOARD_INITIAL_APPROVAL_TO_BOARD` | Board Initial Approval Notification | Application Approved — {{APPLICANT_NAME}} — Moving to RSO Review | Board notified that initial approval was granted and application is moving to RSO for document verification |
| `ADM_BOARD_INITIAL_DENIED_TO_BOARD` | Board Initial Denial | Application Denied at Initial Review: {{APPLICANT_NAME}} | Denial before RSO stage; applicant has not yet submitted documents |
| `ADM_DAILY_SUMMARY_TO_RSO_NOTIFY` | RSO Daily Summary | GEA Daily RSO Summary - {{TODAY_DATE}} | Daily operational report sent to RSO with all events scheduled for today |
| `ADM_DOCS_SENT_TO_BOARD_FOR_REVIEW_TO_BOARD` | Documents Ready for Board Review | Documents Ready for Your Review: {{APPLICANT_NAME}} | Board notification that applicant documents are ready for initial board review |
| `ADM_DOCS_SENT_TO_BOARD_FOR_REVIEW_TO_MEMBER` | Documents Under Board Review | GEA: Your Documents Are Under Board Review | Member notified that their documents are being reviewed by the board |
| `ADM_DOCS_SENT_TO_RSO_TO_BOARD` | Documents Forwarded to RSO | Documents Forwarded to RSO: {{APPLICANT_NAME}} | Board notification that applicant documents have been sent to RSO for review (AFTER board approval) |
| `ADM_DOCS_SENT_TO_RSO_TO_MEMBER` | Documents Forwarded to RSO (Member copy) | GEA: Your Documents Have Been Forwarded for Review | Member notified that their submitted documents have been forwarded to RSO for validation (AFTER board approval) |
| `ADM_DOCUMENTS_APPROVED_BY_RSO_TO_APPLICANT` | Documents Approved by RSO | Your GEA Documents Have Been Verified and Approved | Transparency checkpoint when all application ID documents approved (Step 5.3) |
| `ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE` | RSO Document Approval Request | Action Required: Document Review for {{APPLICANT_NAME}} | RSO notified that applicant documents are ready for review |
| `ADM_DOCUMENT_APPROVED_BY_RSO_TO_BOARD` | RSO Document Approved (Board copy) | Document Approved by RSO: {{APPLICANT_NAME}} | Board notification that RSO has approved an applicant's document; informational only |
| `ADM_DOCUMENT_APPROVED_BY_RSO_TO_MEMBER` | RSO Document Approved (Member copy) | GEA: Your Document Has Been Approved | Member notified that RSO has approved their document |
| `ADM_DOCUMENT_REJECTED_BY_RSO_TO_BOARD` | RSO Document Rejected | RSO Document Rejection: {{APPLICANT_NAME}} | Board notification when RSO rejects a document with allow_resubmit flag for serious issues |
| `ADM_MEMBERSHIP_ACTIVATED_TO_RSO` | Membership Activated for RSO | {{MEMBER_NAME}} Is Now an Active GEA Member | Closure notification for RSO; member now in directory for guards' awareness (Step 9.4) |
| `ADM_MGT_APPROVAL_REQUEST_TO_MGT` | Management Approval Request | Action Required: {{BOARD_ITEM_TYPE}} Needs Management Approval | Management notification for items requiring their sign-off |
| `ADM_NEW_APPLICATION_BOARD_TO_BOARD` | New Application Received | New Application: {{APPLICANT_NAME}} | Board notification when a new membership application is submitted |
| `ADM_PAYMENT_VERIFICATION_REQUEST_TO_TREASURER` | Payment Verification Request | Action Required: Payment Verification for {{MEMBER_NAME}} — {{AMOUNT}} | Explicit action request to Treasurer; sent to board email for coverage (Step 7A.3) |
| `ADM_READY_FOR_FINAL_APPROVAL_TO_MEMBER` | Ready for Final Approval | Your GEA Application is Ready for Final Approval | Notifies applicant that final approval stage has been reached |
| `ADM_RSO_ALL_DOCS_APPROVED_TO_BOARD` | All Docs RSO Approved | All Documents Approved: {{APPLICANT_NAME}} — Ready for RSO Application Approval | Notifies board that all required documents for an application have been RSO-approved; RSO will proceed to finalize application approval |
| `ADM_RSO_APPLICATION_APPROVED_TO_BOARD` | RSO Application Approved | {{APPLICANT_NAME}} — RSO Approval Complete | Notifies board that RSO has approved the application and it is ready for board final approval |
| `ADM_RSO_APPLICATION_DENIED_TO_BOARD` | RSO Application Denied | RSO Denial Recommendation: {{APPLICANT_NAME}} | Board notification when RSO recommends denial of application; board can accept or override recommendation |
| `ADM_RSO_APPLICATION_REVIEW_REQUEST_TO_RSO_APPROVE` | RSO Application Review Request | Action Required: Application Review for {{APPLICANT_NAME}} | Distinguish application eligibility review from document verification (Step 6) |
| `ADM_RSO_DOCUMENT_ISSUE_TO_BOARD` | RSO Document Issue | RSO Document Issue: {{APPLICANT_NAME}} ({{APPLICATION_ID}}) | Board alerted that RSO has flagged a document problem requiring resolution |

---

## DOC — Document and photo submission confirmations, approvals, rejections, and verification workflows. (34 templates)

| Semantic Name | Recipient | Subject | Notes |
|---|---|---|---|
| `DOC_BOARD_DOCUMENT_REJECTION_CONFIRMATION` | Board Rejection Confirmation | Document Rejection Notification Sent: {{MEMBER_NAME}} | Board confirmation that document rejection has been communicated to member; audit trail |
| `DOC_DOCUMENTS_CONFIRMED_TO_MEMBER` | Documents Confirmed | GEA: Your Documents Have Been Confirmed | Confirmation that all submitted documents have been received and validated |
| `DOC_DOCUMENT_APPROVED_TO_BOARD` | Document Approved — Board | Document Approval Confirmed: {{MEMBER_NAME}} | Board confirmation that a member's submitted identity document has been approved by RSO and GEA |
| `DOC_DOCUMENT_APPROVED_TO_MEMBER` | Document Approved (Post-Activation) | GEA: Your {{DOCUMENT_TYPE}} Has Been Approved | Member notified that their submitted identity document was approved; post-activation workflow |
| `DOC_DOCUMENT_RECEIVED_TO_BOARD` | Submitted — Board Awareness | Member Document Submitted — For Awareness | Board notification that a member has submitted an identity document for verification; RSO review in progress |
| `DOC_DOCUMENT_RECEIVED_TO_RSO` | Submitted — RSO Review | Action Required: Document Review for {{MEMBER_NAME}} | RSO notified that a member has submitted an identity document requiring RSO review and approval |
| `DOC_DOCUMENT_REJECTED_TO_BOARD` | Rejected — Board Action | RSO Document Issue: {{MEMBER_NAME}} | Board notification that RSO has rejected a document; board must compose diplomatic rejection message for member |
| `DOC_DOCUMENT_REJECTED_TO_MEMBER` | Document Rejected | Your {{DOCUMENT_TYPE}} Submission Was Not Approved — Action Required | Notifies member that a submitted document failed review; resubmission required |
| `DOC_DOCUMENT_REJECTED_TO_MEMBER_WITH_BOARD_MESSAGE` | Document Rejected — Member | GEA: Your {{DOCUMENT_TYPE}} Requires Resubmission | Member notified that their submitted identity document was rejected with detailed feedback; includes board's diplomatic message |
| `DOC_DOCUMENT_REJECTION_SENT_TO_BOARD` | Rejection Sent — Board | Document Rejection Notice Sent: {{MEMBER_NAME}} | Board confirmation that document rejection has been communicated to member; shows both RSO feedback and board message documented |
| `DOC_DOCUMENT_REPLACED_APPROVED_TO_BOARD` | Document Replacement Approved — Board | Identity Document Replacement Approved: {{MEMBER_NAME}} | Board confirmation that a member's replacement identity document has been approved |
| `DOC_DOCUMENT_REPLACED_APPROVED_TO_MEMBER` | Document Replacement Approved — Member | GEA: Identity Document Updated | Member notified that their replacement identity document has been approved and is now active |
| `DOC_DOCUMENT_REPLACED_RECEIVED_TO_BOARD` | Document Replacement Received — Board | Member Identity Document Replacement Submitted | Board awareness email when a member submits a replacement identity document |
| `DOC_DOCUMENT_REPLACED_RECEIVED_TO_MEMBER` | Document Replacement Received — Member | GEA: Identity Document Replacement Received | Member notified that their replacement identity document has been received and is under review |
| `DOC_DOCUMENT_REPLACED_RECEIVED_TO_RSO` | Document Replacement Received — RSO | Action Required: Identity Document Review for {{MEMBER_NAME}} | RSO take-action email to review a member's replacement identity document |
| `DOC_DOCUMENT_REPLACED_REJECTED_TO_BOARD` | Document Replacement Rejected — Board | Identity Document Replacement Rejected: {{MEMBER_NAME}} | Board confirmation that a member's replacement identity document has been rejected and member has been notified |
| `DOC_DOCUMENT_REPLACED_REJECTED_TO_MEMBER_WITH_MESSAGE` | Document Replacement Rejected — Member | GEA: Identity Document Resubmission Required | Member notified that their replacement identity document was rejected with board feedback and resubmission instructions |
| `DOC_EMPLOYMENT_VERIFICATION_REQUESTED_TO_MEMBER` | Employment Verification Request | GEA Requires Your Employment Verification | Requests employment documentation from member or applicant |
| `DOC_FILE_SUBMISSION_CONFIRMATION_TO_MEMBER` | File Submission Confirmed | GEA: File Received — {{FILE_NAME}} | Acknowledgment of any file upload to the member portal |
| `DOC_MEMBER_DOCUMENT_REJECTED_BY_BOARD` | Member Document Rejected — Board Response | GEA: Your Document Requires Resubmission | Member notified that RSO rejected their document and board has provided diplomatic feedback |
| `DOC_PHOTO_APPROVED_TO_BOARD` | Photo Approved — Board | Photo Approval Confirmed: {{MEMBER_NAME}} | Board confirmation that a member's profile photo has been approved and activated |
| `DOC_PHOTO_APPROVED_TO_MEMBER` | Photo Approved | GEA: Your Member Photo Has Been Approved | Notifies member that their profile photo was approved and transferred to Cloud Storage |
| `DOC_PHOTO_APPROVED_TO_MEMBER_POST_ACTIVATION` | Photo Approved (Post-Activation) | GEA: Your Member Photo Has Been Approved | Member notified that their profile photo was approved; post-activation workflow (not applicant-related) |
| `DOC_PHOTO_RECEIVED_TO_BOARD` | Photo Received — Board | Action Required: Member Profile Photo Review | Board take-action email when a member submits a profile photo for review |
| `DOC_PHOTO_REJECTED_TO_MEMBER` | Photo Rejected | GEA: Your Member Photo Needs Resubmission | Notifies member of photo rejection with guidelines for resubmission |
| `DOC_PHOTO_REJECTED_TO_MEMBER_WITH_BOARD_MESSAGE` | Photo Rejected — Member | GEA: Your Photo Requires Resubmission | Member notified that their profile photo was rejected with detailed feedback for resubmission; includes board's diplomatic message |
| `DOC_PHOTO_REJECTION_TO_BOARD` | Photo Rejection — Board | Photo Rejection Recorded: {{MEMBER_NAME}} | Board confirmation that a member's photo rejection has been communicated and deadline set |
| `DOC_PHOTO_REPLACED_APPROVED_TO_BOARD` | Photo Replacement Approved — Board | Profile Photo Replacement Approved: {{MEMBER_NAME}} | Board confirmation that a member's replacement profile photo has been approved |
| `DOC_PHOTO_REPLACED_APPROVED_TO_MEMBER` | Photo Replacement Approved — Member | GEA: Profile Photo Updated | Member notified that their replacement profile photo has been approved and is now active |
| `DOC_PHOTO_REPLACED_RECEIVED_TO_BOARD` | Photo Replacement Received — Board | Member Profile Photo Replacement Submitted | Board take-action email for reviewing a member's replacement profile photo |
| `DOC_PHOTO_REPLACED_RECEIVED_TO_MEMBER` | Photo Replacement Received — Member | GEA: Profile Photo Replacement Received | Member notified that their replacement profile photo has been received and is under review |
| `DOC_PHOTO_REPLACED_REJECTED_TO_BOARD` | Photo Replacement Rejected — Board | Profile Photo Replacement Rejected: {{MEMBER_NAME}} | Board confirmation that a member's replacement profile photo has been rejected and member has been notified |
| `DOC_PHOTO_REPLACED_REJECTED_TO_MEMBER_WITH_MESSAGE` | Photo Replacement Rejected — Member | GEA: Profile Photo Resubmission Required | Member notified that their replacement profile photo was rejected with board feedback and resubmission instructions |
| `DOC_PHOTO_SUBMISSION_REMINDER_TO_MEMBER` | Photo Submission Reminder | Reminder: Please Submit Your GEA Member Photo | Sent to members who have been activated but have not yet uploaded a profile photo |

---

## MEM — Account creation, application lifecycle, password management, renewals, birthday milestones, and membership status updates. (26 templates)

| Semantic Name | Recipient | Subject | Notes |
|---|---|---|---|
| `MEM_ACCOUNT_CREDENTIALS_TO_APPLICANT` | Account Credentials | Your GEA Member Portal Login Details | Delivers temporary login credentials to new applicants on account creation |
| `MEM_APPLICATION_APPROVED_TO_APPLICANT` | Application Approved | GEA Application Approved — Payment Required to Activate | Application cleared board review; payment required to complete membership activation |
| `MEM_APPLICATION_DENIED_TO_APPLICANT` | Application Denied | Your GEA Application — Update from the Board | Respectful denial notification with contact info for follow-up questions |
| `MEM_APPLICATION_RECEIVED_TO_APPLICANT` | Application Received | GEA Application Received — Next Steps Inside | Confirms receipt of new membership application and explains next steps |
| `MEM_APPLICATION_REJECTED_BY_BOARD_TO_APPLICANT` | Application Rejected (Board Response) | GEA: Your Application Status | Applicant notified that their application was rejected with RSO and board feedback |
| `MEM_APPLICATION_REJECTION_CONFIRMATION_TO_BOARD` | Application Rejection Confirmation | Application Rejection Notification Sent: {{APPLICANT_NAME}} | Board confirmation that application rejection has been communicated to applicant; audit trail |
| `MEM_BIRTHDAY_AGE_14_MILESTONE_TO_MEMBER` | Birthday Age 14 Milestone | {{CHILD_FIRST_NAME}} Has Turned 14 — New Independence at GEA | Milestone birthday to parents; announces age 14 rec center independence |
| `MEM_BIRTHDAY_AGE_15_MILESTONE_TO_MEMBER` | Birthday Age 15 Milestone | {{CHILD_FIRST_NAME}} Has Turned 15 — New Fitness Center Privilege | Milestone birthday to parents; announces age 15 fitness center equipment usage privilege |
| `MEM_BIRTHDAY_AGE_16_MILESTONE_TO_MEMBER` | Birthday Age 16 Milestone | {{CHILD_FIRST_NAME}} Has Turned 16 | Milestone birthday to parents; notes voting/board eligibility is Full members only; age 17 portal account eligibility ahead |
| `MEM_BIRTHDAY_AGE_17_MILESTONE_TO_MEMBER` | Birthday Age 17 Milestone | {{CHILD_FIRST_NAME}} Has Turned 17 — Full Adult Membership Eligibility | Milestone birthday to parents; offers to create member portal account; explains voting/board eligibility (Full members only) |
| `MEM_BIRTHDAY_GREETING_TO_MEMBER` | Birthday Greeting | Happy Birthday from GEA — {{FIRST_NAME}}! | Annual birthday greeting for all adult members |
| `MEM_FIRST_LOGIN_WELCOME_TO_MEMBER` | First Login Welcome | Welcome to the GEA Member Portal — {{FIRST_NAME}} | Triggered on first successful login; provides portal orientation and key links |
| `MEM_HOUSEHOLD_MEMBER_REMOVED_TO_MEMBER` | Household Member Removed | Household Member Removed from Your Profile | Member notified when a household member has been removed from their family profile |
| `MEM_MEMBERSHIP_ACTIVATED_TO_MEMBER` | Membership Activated | Welcome to GEA — Your Membership Is Now Active! | Final welcome email when membership is fully activated after payment verification |
| `MEM_MEMBERSHIP_AUTO_TERMINATED_TO_MEMBER` | Membership Auto-Terminated | Your GEA Membership Account Has Been Terminated | Sent after 24 months of lapsed status; membership account automatically terminated; reapplication required |
| `MEM_MEMBERSHIP_EXPIRED_TO_MEMBER` | Membership Expired | Your GEA Membership Has Expired — Renew to Restore Access | Sent when membership lapses on July 31; prompts renewal payment |
| `MEM_MEMBERSHIP_LAPSED_TO_MEMBER` | Membership Lapsed | URGENT: Your GEA Membership Grace Period Has Ended | Sent when grace period ends 31 days after expiration; membership is now lapsed and functions suspended |
| `MEM_PASSPORT_EXPIRATION_WARNING_1M_TO_MEMBER` | Passport Expiration - 1 Month | Your {{DOCUMENT_TYPE}} Expires {{EXPIRATION_DATE}} — 1 Month Reminder | 1-month urgent warning for document expiration; emphasizes impact on membership status |
| `MEM_PASSPORT_EXPIRATION_WARNING_6M_TO_MEMBER` | Passport Expiration - 6 Months | Your {{DOCUMENT_TYPE}} Expires {{EXPIRATION_DATE}} — 6 Month Reminder | 6-month advance warning for document expiration; member should renew and upload new document |
| `MEM_PASSPORT_EXPIRATION_WARNING_TO_MEMBER` | Passport Expiration Warning | Your Passport Expires {{EXPIRATION_DATE}} — Please Update GEA Records | 6-month advance warning; member should upload renewed document once received |
| `MEM_PASSWORD_RESET_COMPLETE_TO_MEMBER` | Password Reset Complete | Your GEA Member Portal Password Has Been Reset | Confirmation that member has successfully reset their password |
| `MEM_PASSWORD_RESET_REQUEST_TO_MEMBER` | Password Reset Request | Reset Your GEA Member Portal Password | Self-serve password reset request for member accounts |
| `MEM_PASSWORD_SET_TO_MEMBER` | Password Set | Your GEA Portal Password Is Ready | Sent when a temporary password is issued; member should log in and change it immediately |
| `MEM_RENEWAL_PAYMENT_VERIFIED_TO_MEMBER` | Renewal Payment Verified | 🎉 Welcome Back! Your Membership is Renewed | Sent when lapsed member's renewal payment is verified and account reactivated |
| `MEM_RENEWAL_REMINDER_30_DAYS_TO_MEMBER` | Renewal Reminder (30 Days) | GEA Membership Renewal Due in 30 Days — Renew by {{RENEWAL_DEADLINE}} | Early renewal nudge sent 30 days before July 31 expiration |
| `MEM_RENEWAL_REMINDER_7_DAYS_TO_MEMBER` | Renewal Reminder (7 Days) | Urgent: GEA Membership Expires in 7 Days — Renew by {{RENEWAL_DEADLINE}} | Final renewal warning 7 days before expiration; stronger urgency and call to action |

---

## PAY — Payment submission acknowledgments, treasurer review outcomes, and board FYI notifications. (8 templates)

| Semantic Name | Recipient | Subject | Notes |
|---|---|---|---|
| `PAY_PAYMENT_CLARIFICATION_REQUESTED_TO_MEMBER` | Payment Clarification Requested | GEA: Your Payment Needs Clarification — Action Required | Treasurer requests additional information before payment can be verified |
| `PAY_PAYMENT_CONFIRMATION_RECEIVED_TO_MEMBER` | Payment Confirmation Received | GEA: Payment Confirmation Received ({{PAYMENT_ID}}) | Acknowledges receipt of bank payment confirmation document |
| `PAY_PAYMENT_PROOF_RECEIVED_TO_MEMBER` | Payment Proof Received | GEA: Payment Proof Received — Under Review | Acknowledges proof-of-payment upload; sets expectation for Treasurer review timeline |
| `PAY_PAYMENT_REJECTED_TO_MEMBER` | Payment Rejected | GEA: Your Payment Submission Could Not Be Verified | Notifies member that submitted payment could not be matched; resubmission instructions included |
| `PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD` | Payment Submitted — Board FYI | Payment Submitted: {{MEMBER_NAME}} — {{AMOUNT}} {{CURRENCY}} | Informational alert to board when a member submits payment; no action required |
| `PAY_PAYMENT_SUBMITTED_TO_MEMBER` | Payment Submitted | GEA: Your Payment Has Been Submitted | Confirms member payment submission and sets expectation for Treasurer review |
| `PAY_PAYMENT_VERIFIED_ACTIVATED_BOARD_FYI_TO_BOARD` | Payment Verified & Activated — Board FYI | Payment Verified & Membership Activated: {{MEMBER_NAME}} | Informs board when Treasurer verifies payment and membership is activated |
| `PAY_PAYMENT_VERIFIED_TO_MEMBER` | Payment Verified | GEA: Your Payment Is Verified — Membership Is Now Active! | Final confirmation to member that payment was accepted and membership is fully active |

---

## RES — Facility reservation booking lifecycle, excess-usage approvals, guest list workflows, and booking limit alerts. (22 templates)

| Semantic Name | Recipient | Subject | Notes |
|---|---|---|---|
| `RES_APPROVAL_REMINDER_TO_BOARD` | Approval Reminder — Board | Action Required: {{PENDING_COUNT}} Reservation(s) Awaiting Your Approval | Daily nightly digest to board listing all reservations still in pending status |
| `RES_BOOKING_APPROVAL_REQUEST_TO_BOARD` | Booking Approval Request — Board | Action Required: Reservation Approval — {{MEMBER_NAME}} at {{FACILITY}} on {{RESERVATION_DATE}} | Primary board action email for all standard (non-excess) reservation approvals |
| `RES_BOOKING_APPROVED_TO_MEMBER` | Booking Approved | GEA Reservation Approved: {{FACILITY_NAME}} on {{RESERVATION_DATE}} | Approval confirmation sent to member; includes guest list submission instructions |
| `RES_BOOKING_CANCELLED_TO_MEMBER` | Booking Cancelled | GEA Reservation Cancelled: {{FACILITY_NAME}} on {{ORIGINAL_DATE}} | Cancellation confirmation with reason; sent on cancel by member or board |
| `RES_BOOKING_DENIED_BOARD_COPY_TO_BOARD` | Booking Denied — Board Copy | Reservation Denied: {{MEMBER_NAME}} — {{FACILITY_NAME}} on {{REQUESTED_DATE}} | Board record copy when a reservation is denied; for audit trail and board awareness |
| `RES_BOOKING_DENIED_TO_MEMBER` | Booking Denied | GEA Reservation: Your Request for {{FACILITY_NAME}} Was Not Approved | Denial with reason sent to member; contact info included for questions or appeal |
| `RES_BOOKING_PENDING_REVIEW_TO_MEMBER` | Booking Pending Review | GEA Reservation Received — Pending Board Review | Interim notice for reservations requiring board approval; sets expectation for timeline |
| `RES_BOOKING_RECEIVED_TO_MEMBER` | Booking Received | GEA Reservation Received: {{FACILITY_NAME}} on {{RESERVATION_DATE}} | Initial confirmation for auto-approved bookings (tennis within weekly limit) |
| `RES_BOOKING_WAITLISTED_TO_MEMBER` | Booking Waitlisted | GEA: You Are on the Waitlist — {{FACILITY_NAME}} on {{RESERVATION_DATE}} | Sent to member when board places their pending reservation on the waitlist; includes their position number |
| `RES_EXCESS_LEOBO_APPROVAL_REQUEST_TO_MEMBER` | Excess Leobo Approval Request | GEA: Your Leobo Booking Exceeds Monthly Limit — Pending Board Approval | Informs member their Leobo request exceeds the monthly household limit and requires board approval |
| `RES_EXCESS_LEOBO_APPROVAL_REQUEST_TO_MGT` | Excess Leobo Approval Request — MGT | Action Required: Excess Leobo Booking — {{MEMBER_NAME}} on {{RESERVATION_DATE}} | MGT action email for Leobo bookings that exceed the monthly household limit |
| `RES_EXCESS_TENNIS_APPROVAL_REQUEST_TO_BOARD` | Excess Tennis Approval Request — Board | Action Required: Excess Tennis Booking — {{MEMBER_NAME}} on {{RESERVATION_DATE}} | Board action email for tennis bookings that exceed the 3-hour weekly household limit |
| `RES_EXCESS_TENNIS_APPROVAL_REQUEST_TO_MEMBER` | Excess Tennis Approval Request | GEA: Your Tennis Booking Exceeds Weekly Hours — Pending Board Approval | Informs member their tennis request exceeds the 3-hour weekly household limit and requires board approval |
| `RES_GUEST_LIST_DEADLINE_REMINDER_TO_MEMBER` | Guest List Deadline Reminder | Reminder: Guest List Due {{DEADLINE}} — {{FACILITY_NAME}} on {{RESERVATION_DATE}} | Final-call reminder sent one day before the guest list submission deadline |
| `RES_GUEST_LIST_REJECTIONS_TO_BOARD` | Guest List Rejections — Board | RSO Guest Review: {{REJECTED_COUNT}} Guest(s) Flagged — {{HOUSEHOLD_NAME}} on {{RESERVATION_DATE}} | Board notification when RSO flags one or more guests during guest list review |
| `RES_GUEST_LIST_SUBMITTED_TO_MEMBER` | Guest List Submitted | GEA: Guest List Received for {{FACILITY_NAME}} on {{RESERVATION_DATE}} | Confirms to member that their guest list has been received and is pending RSO review |
| `RES_HOLIDAY_CALENDAR_REMINDER_TO_MEMBER` | Holiday Calendar Reminder | GEA: Holiday Calendar Update Required — {{HOLIDAY_NAME}} | Sent to board on Nov 1 annually; reminder to update holiday calendar for the coming year |
| `RES_LEOBO_APPROVAL_REQUEST_TO_MGT` | Leobo Approval Request — MGT | Action Required: Leobo Booking Approval — {{MEMBER_NAME}} on {{RESERVATION_DATE}} | MGT action email for all standard (non-excess) Leobo booking approvals |
| `RES_LEOBO_LIMIT_REACHED_TO_MEMBER` | Leobo Limit Reached | GEA: Monthly Leobo Limit Reached — Request Submitted for Board Review | Sent when member's Leobo request exceeds the monthly limit; board review required |
| `RES_LEOBO_MGT_APPROVED_TO_BOARD` | Leobo MGT Approved — Board Final | Action Required: Final Board Approval — {{MEMBER_NAME}} Leobo on {{RESERVATION_DATE}} | Board notification requesting final approval after management officer approves leobo booking |
| `RES_TENNIS_LIMIT_REACHED_TO_MEMBER` | Tennis Limit Reached | GEA: Weekly Tennis Hours Limit Reached — Request Submitted for Board Review | Sent when member's tennis request exceeds the weekly 3-hour limit; board review required |
| `RES_WAITLIST_SLOT_OPENED_TO_MEMBER` | Waitlist Slot Opened | GEA: {{FACILITY}} Available on {{RESERVATION_DATE}} — Claim Your Spot | Notifies waitlisted member that a slot has opened; slot held for WAITLIST_HOLD_HOURS before moving to next in queue |

---

## SYS — Admin account password management and system notifications. (2 templates)

| Semantic Name | Recipient | Subject | Notes |
|---|---|---|---|
| `SYS_PASSWORD_RESET_COMPLETE_TO_ADMIN` | Password Reset Complete | Your GEA Admin Portal Password Has Been Reset | Confirmation that admin has successfully reset their password |
| `SYS_PASSWORD_RESET_REQUEST_TO_ADMIN` | Password Reset Request | Reset Your GEA Admin Portal Password | Self-serve password reset request for admin accounts |

---
