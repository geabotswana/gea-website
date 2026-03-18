# Membership Email Templates

Emails covering the full member lifecycle — from application through renewal, plus milestone and birthday communications.

## Templates (14)

### Application

**MEM_APPLICATION_RECEIVED_TO_APPLICANT.txt**
First email sent after a membership application is submitted. Confirms receipt and explains next steps.
- Recipient: Applicant
- Variables: `{{FIRST_NAME}}`, `{{APPLICATION_ID}}`, `{{SUBMITTED_DATE}}`, `{{PORTAL_URL}}`

**MEM_APPLICATION_APPROVED_TO_APPLICANT.txt**
Sent when the board grants final approval. Includes payment amount and deadline to activate membership.
- Recipient: Applicant
- Variables: `{{FIRST_NAME}}`, `{{APPLICATION_ID}}`, `{{PAYMENT_AMOUNT}}`, `{{PAYMENT_DEADLINE}}`, `{{PORTAL_URL}}`

**MEM_APPLICATION_DENIED_TO_APPLICANT.txt**
Sent when an application is not approved. Includes the reason and a contact for questions.
- Recipient: Applicant
- Variables: `{{FIRST_NAME}}`, `{{APPLICATION_ID}}`, `{{DENIAL_REASON}}`, `{{CONTACT_EMAIL}}`

### Onboarding

**MEM_ACCOUNT_CREDENTIALS_TO_APPLICANT.txt**
Sent when a new applicant account is created. Provides temporary login credentials and next steps for document upload.
- Recipient: Applicant
- Variables: `{{FIRST_NAME}}`, `{{EMAIL}}`, `{{TEMP_PASSWORD}}`, `{{LOGIN_URL}}`

**MEM_FIRST_LOGIN_WELCOME_TO_MEMBER.txt**
Sent on a member's first login to the portal after activation. Introduces available features.
- Recipient: New Member
- Variables: `{{FIRST_NAME}}`, `{{HOUSEHOLD_NAME}}`, `{{PASSWORD_RESET_LINK}}`, `{{PORTAL_URL}}`

**MEM_PASSWORD_SET_TO_MEMBER.txt**
Sent when a member successfully sets or resets their password.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{PORTAL_URL}}`

### Renewal

**MEM_RENEWAL_REMINDER_30_DAYS_TO_MEMBER.txt**
30-day renewal warning. Sent by the nightly task on July 1 to members whose membership expires July 31.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{RENEWAL_DEADLINE}}`, `{{MEMBERSHIP_YEAR}}`, `{{PORTAL_URL}}`

**MEM_RENEWAL_REMINDER_7_DAYS_TO_MEMBER.txt**
Urgent 7-day renewal warning. Sent July 24 to members who have not yet renewed.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{RENEWAL_DEADLINE}}`, `{{MEMBERSHIP_YEAR}}`, `{{PORTAL_URL}}`

**MEM_MEMBERSHIP_EXPIRED_TO_MEMBER.txt**
Sent when a membership expires without renewal. Includes reactivation amount and instructions.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{EXPIRED_DATE}}`, `{{REACTIVATION_AMOUNT}}`, `{{PORTAL_URL}}`

**MEM_MEMBERSHIP_ACTIVATED_TO_MEMBER.txt**
Sent when the treasurer verifies payment and activates a new membership. Confirms active status and summarises facility booking rules.
- Recipient: New Member
- Variables: `{{APPLICANT_NAME}}`

### Documents

**MEM_PASSPORT_EXPIRATION_WARNING_TO_MEMBER.txt**
Sent 6 months before a member's passport expires. Reminds them to submit an updated document.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{EXPIRATION_DATE}}`, `{{RENEWAL_URL}}`

### Milestones & Birthdays

**MEM_BIRTHDAY_GREETING_TO_MEMBER.txt**
Annual birthday greeting sent on the member's birthday.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`

**MEM_BIRTHDAY_AGE_15_MILESTONE_TO_MEMBER.txt**
Sent on a dependent's 15th birthday. Previews upcoming adult membership eligibility.
- Recipient: Minor
- Variables: `{{FIRST_NAME}}`, `{{ADULT_MEMBERSHIP_SOON}}`

**MEM_BIRTHDAY_AGE_16_MILESTONE_TO_MEMBER.txt**
Sent on a dependent's 16th birthday. They are now eligible to apply for adult membership.
- Recipient: Minor
- Variables: `{{FIRST_NAME}}`, `{{ADULT_MEMBERSHIP_INFO}}`, `{{PORTAL_URL}}`
