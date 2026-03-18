# Document Email Templates

Emails related to document and photo submissions — confirmations, approvals, rejections, and reminders throughout the two-stage document review workflow (RSO → GEA Admin).

## Templates (7)

### File Submissions

**DOC_FILE_SUBMISSION_CONFIRMATION_TO_MEMBER.txt**
Sent immediately when a member uploads any document or file.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{FILE_NAME}}`, `{{REFERENCE_NUMBER}}`, `{{SUBMISSION_DATE}}`, `{{PORTAL_URL}}`

**DOC_DOCUMENTS_CONFIRMED_TO_MEMBER.txt**
Sent when a member's document submission is accepted and enters the review queue.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{DOCUMENT_TYPES}}`, `{{CONFIRMATION_DATE}}`, `{{NEXT_STEP}}`

**DOC_DOCUMENT_REJECTED_TO_MEMBER.txt**
Sent when a document is rejected at either the RSO or GEA Admin review stage. Includes the reason and resubmission deadline.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{DOCUMENT_TYPE}}`, `{{REJECTION_REASON}}`, `{{RESUBMIT_DEADLINE}}`

**DOC_EMPLOYMENT_VERIFICATION_REQUESTED_TO_MEMBER.txt**
Sent when additional employment verification is required for a membership category.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{DEADLINE}}`, `{{VERIFICATION_PROCESS}}`, `{{CONTACT_EMAIL}}`

### Photos

**DOC_PHOTO_SUBMISSION_REMINDER_TO_MEMBER.txt**
Reminder sent to members who have not yet submitted their photo.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{SUBMISSION_DEADLINE}}`, `{{PHOTO_REQUIREMENTS}}`, `{{PORTAL_URL}}`

**DOC_PHOTO_APPROVED_TO_MEMBER.txt**
Sent when a member's photo is approved by the GEA Admin. Photo is transferred to Cloud Storage and linked to their membership card.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{APPROVED_DATE}}`, `{{PHOTO_COUNT}}`, `{{CARD_ISSUANCE_DATE}}`

**DOC_PHOTO_REJECTED_TO_MEMBER.txt**
Sent when a submitted photo is rejected. Includes the reason and a link to photo guidelines.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{REJECTION_REASON}}`, `{{RESUBMIT_DEADLINE}}`, `{{PHOTO_GUIDELINES_URL}}`
