# Administrative Email Templates

Internal board communications. These emails are sent TO the board, not to members. They notify board officers of pending actions, RSO updates, and application status changes.

## Templates (12)

### Application Workflow — Board Notifications

**ADM_NEW_APPLICATION_BOARD_TO_BOARD.txt**
Sent when a new membership application is submitted.
- Recipient: Board
- Variables: `{{FIRST_NAME}}`, `{{APPLICANT_NAME}}`, `{{APPLICATION_ID}}`, `{{APPLICATION_DATE}}`, `{{BOARD_REVIEW_DEADLINE}}`

**ADM_BOARD_APPROVAL_REQUEST_TO_BOARD.txt**
Sent when a board member's approval is required on an item.
- Recipient: Board
- Variables: `{{FIRST_NAME}}`, `{{BOARD_ITEM_TYPE}}`, `{{APPLICANT_NAME}}`, `{{APPLICATION_ID}}`, `{{APPROVAL_DEADLINE}}`, `{{REQUEST_SUMMARY}}`

**ADM_BOARD_APPROVED_FOR_RSO_TO_BOARD.txt**
Sent when board approves an application and forwards it to RSO for document review.
- Recipient: Board
- Variables: `{{FIRST_NAME}}`, `{{APPLICANT_NAME}}`, `{{APPLICATION_ID}}`, `{{APPROVAL_DATE}}`, `{{RSO_NEXT_STEPS}}`

**ADM_BOARD_INITIAL_DENIED_TO_BOARD.txt**
Sent when board denies an application at the initial review stage.
- Recipient: Board
- Variables: `{{FIRST_NAME}}`, `{{APPLICANT_NAME}}`, `{{APPLICATION_ID}}`, `{{DENIAL_REASON}}`, `{{DECISION_DATE}}`

**ADM_BOARD_FINAL_APPROVAL_TO_BOARD.txt**
Sent when board grants final membership approval after RSO review.
- Recipient: Board
- Variables: `{{FIRST_NAME}}`, `{{APPLICANT_NAME}}`, `{{APPLICATION_ID}}`, `{{MEMBERSHIP_TYPE}}`, `{{APPROVAL_DATE}}`, `{{ACTIVATION_DATE}}`

**ADM_BOARD_FINAL_DENIED_TO_BOARD.txt**
Sent when an application is denied at the final approval stage.
- Recipient: Board
- Variables: `{{FIRST_NAME}}`, `{{APPLICANT_NAME}}`, `{{APPLICATION_ID}}`, `{{DENIAL_REASON}}`, `{{APPEAL_PROCESS}}`

**ADM_READY_FOR_FINAL_APPROVAL_TO_MEMBER.txt**
Sent to the applicant when their application has cleared RSO and is ready for final board approval.
- Recipient: Applicant
- Variables: `{{FIRST_NAME}}`, `{{APPLICATION_ID}}`, `{{NEXT_STEP}}`, `{{TIMELINE}}`

### RSO Coordination

**ADM_DOCS_SENT_TO_RSO_TO_BOARD.txt**
Sent to board confirming that applicant documents have been forwarded to RSO.
- Recipient: Board
- Variables: `{{FIRST_NAME}}`, `{{APPLICANT_NAME}}`, `{{APPLICATION_ID}}`, `{{DOCUMENT_TYPES}}`, `{{SUBMISSION_DATE}}`, `{{RSO_CONTACT}}`

**ADM_RSO_DOCUMENT_APPROVAL_REQUEST_TO_BOARD.txt**
Sent when RSO requests board approval of specific documents.
- Recipient: Board
- Variables: `{{FIRST_NAME}}`, `{{APPLICANT_NAME}}`, `{{APPLICATION_ID}}`, `{{DOCUMENT_TYPES}}`, `{{APPROVAL_DEADLINE}}`

**ADM_RSO_DOCUMENT_ISSUE_TO_BOARD.txt**
Sent when RSO flags a problem with submitted documents.
- Recipient: Board
- Variables: `{{FIRST_NAME}}`, `{{APPLICANT_NAME}}`, `{{APPLICATION_ID}}`, `{{ISSUE_DESCRIPTION}}`, `{{DEADLINE_TO_RESOLVE}}`

**ADM_RSO_DAILY_SUMMARY_TO_BOARD.txt**
Daily digest sent to board with pending items across applications, payments, and documents.
- Recipient: Board
- Variables: `{{FIRST_NAME}}`, `{{REPORT_DATE}}`, `{{PENDING_APPLICATIONS}}`, `{{PENDING_PAYMENTS}}`, `{{PENDING_DOCUMENTS}}`, `{{PORTAL_LINK}}`

### Management

**ADM_MGT_APPROVAL_REQUEST_TO_BOARD.txt**
Sent when a Management Officer approval is required (e.g. Leobo reservations).
- Recipient: Board
- Variables: `{{FIRST_NAME}}`, `{{BOARD_ITEM_TYPE}}`, `{{MEMBER_NAME}}`, `{{REQUEST_ID}}`, `{{APPROVAL_DEADLINE}}`, `{{REQUEST_SUMMARY}}`
