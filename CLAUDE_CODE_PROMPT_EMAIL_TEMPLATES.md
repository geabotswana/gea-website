# Claude Code Prompt: Email Template System Implementation

**Objective:** Implement new email template storage system using Google Drive HTML files with Board delegation for email sending.

**Reference Documents:**
- EMAIL_TEMPLATE_STORAGE_IMPLEMENTATION.md (full implementation guide)
- DEVELOPMENT_STANDARDS.md (mandatory coding standards)
- EMAIL_TEMPLATE_NAMING_CONVENTION_PROPOSAL.md (semantic naming)

---

## Task Summary

Refactor email template system from Google Sheets cells (current) to Google Drive HTML files (new). This enables Board members to edit templates without code deployment, improves maintainability, and provides clean separation of content from code.

**Scope:** Implement Phase 1 only (initial setup + test)

---

## Phase 1: Initial Setup & Test (This Session)

### Part A: Create Core Functions (Email Service)

**File:** Create or update `EmailService.gs`

**Implement these functions with full JSDoc documentation per DEVELOPMENT_STANDARDS.md:**

#### 1. `getEmailTemplate(templateName)`

**Purpose:** Load email template metadata and HTML body from Google Sheets + Drive

**Parameters:**
- `templateName` (string) — Semantic template name (e.g., `'MEM_APPLICATION_SUBMITTED_TO_APPLICANT'`)

**Returns:** 
- Object with structure: `{subject: string, htmlBody: string, placeholders: array}`
- Returns `null` if template not found or inactive

**Logic:**
1. Query "Email Templates" sheet in GEA System Backend spreadsheet
2. Find row matching `semantic_name` column
3. Check `active` column (must be TRUE)
4. Get `drive_file_id` from row
5. Load HTML body from Drive using `DriveApp.getFileById(drive_file_id)`
6. Parse `placeholders` column (comma-separated) into array
7. Get `subject` column
8. Handle errors gracefully (log to Audit Log, return null)

**Error Handling:**
- If template not found: log to Audit Log with template name
- If Drive file ID invalid: log error, attempt fallback to GitHub (future, not needed for Phase 1)
- If Sheet query fails: log error

**Note:** Include comprehensive JSDoc with all parameters, returns, side effects, errors, and example usage.

---

#### 2. `substituteTemplateVariables(htmlBody, variables)`

**Purpose:** Replace all `{{VARIABLE}}` placeholders in HTML with actual values

**Parameters:**
- `htmlBody` (string) — HTML template with `{{VARIABLE}}` placeholders
- `variables` (object) — Key-value pairs: `{VARIABLE_NAME: 'value', ...}`

**Returns:**
- String with all placeholders substituted

**Logic:**
1. Iterate through each key in variables object
2. Replace all instances of `{{KEY}}` with the corresponding value
3. Use case-sensitive matching
4. Return modified HTML

**Example:**
```javascript
const html = '<p>Dear {{FIRST_NAME}}</p>';
const result = substituteTemplateVariables(html, {FIRST_NAME: 'John'});
// Returns: '<p>Dear John</p>'
```

---

#### 3. `sendEmailFromTemplate(templateName, recipient, variables, options)`

**Purpose:** Load template, substitute variables, and send email via Board delegation

**Parameters:**
- `templateName` (string) — Semantic template name
- `recipient` (string) — Email address of recipient
- `variables` (object) — Template variables to substitute (e.g., `{FIRST_NAME: 'John', APPLICATION_ID: 'APP-123'}`)
- `options` (object, optional) — Additional email options (see below)

**Options object (optional):**
```javascript
{
  cc: ['email1@example.com', 'email2@example.com'],  // optional
  bcc: ['email@example.com'],                         // optional
  replyTo: 'treasurer@geabotswana.org',              // optional, default to TREASURER_EMAIL
  attachments: [blob1, blob2]                        // optional
}
```

**Returns:**
- Boolean: `true` if email sent successfully, `false` otherwise

**Logic:**
1. Load template using `getEmailTemplate(templateName)`
2. If template not found: log to Audit Log, return false
3. Substitute variables in subject line using `substituteTemplateVariables()`
4. Substitute variables in HTML body using `substituteTemplateVariables()`
5. Check for unreplaced placeholders (log warning if any found)
6. Send email using **Board delegation** (see below)
7. Log success to Audit Log
8. Return true

**Email Sending (Board Delegation):**

Use `GmailApp` with Board delegation to send from board@geabotswana.org:

```javascript
GmailApp.sendEmail(recipient, subject, '', {
  htmlBody: htmlBody,
  from: 'board@geabotswana.org',  // Board delegation
  replyTo: options?.replyTo || TREASURER_EMAIL,
  cc: options?.cc,
  bcc: options?.bcc,
  attachments: options?.attachments || []
});
```

**Important:** This requires GCP service account setup for domain-wide delegation (already configured per previous setup). If delegation fails, catch error and log.

**Error Handling:**
- If template load fails: log and return false
- If variable substitution fails: log warning, continue (email still sends with unreplaced variables visible)
- If email send fails: log error to Audit Log, return false
- Always log to Audit Log (success or failure)

---

#### 4. `validateTemplateVariables(templateName, providedVariables)`

**Purpose:** Check that all required variables for a template have been provided

**Parameters:**
- `templateName` (string) — Template name
- `providedVariables` (object) — Variables being passed to `sendEmailFromTemplate()`

**Returns:**
- Object: `{valid: boolean, missing: array, extra: array}`
  - `valid`: true if all required variables provided
  - `missing`: array of required variables not provided
  - `extra`: array of provided variables not in template's placeholder list

**Logic:**
1. Get template metadata
2. Extract placeholder list from template
3. Compare provided variables to placeholder list
4. Return validation result

**Note:** This is optional but useful for debugging. Used in `sendEmailFromTemplate()` to log warnings if variables don't match.

---

### Part B: Update Google Sheets Structure

**Spreadsheet:** GEA System Backend  
**Sheet:** Email Templates

**Verify column headers exist (in this order):**
1. `semantic_name`
2. `display_name`
3. `subject`
4. `drive_file_id`
5. `placeholders`
6. `active`
7. `notes`

**If any columns are missing, add them.**

**Delete any old columns** that are no longer needed (e.g., old "Body" column if it exists).

---

### Part C: Create Test Template in Google Drive

**Location:** GEA Shared Drive → Email Templates folder

**If folder doesn't exist, create it** with this structure:
```
Email Templates/
├── README.md
├── _MANIFEST.md
└── membership/
    └── application-submitted-to-applicant.html
```

**Create file:** `membership/application-submitted-to-applicant.html`

**Content:** Use the complete HTML template provided in EMAIL_TEMPLATE_STORAGE_IMPLEMENTATION.md Part 1.5

**Get the file ID:**
- After creating file, note its Drive file ID (from URL: `https://docs.google.com/document/d/[FILE_ID]/edit`)

---

### Part D: Add Test Template Metadata to Sheet

**In Email Templates sheet, add first row of data:**

| semantic_name | display_name | subject | drive_file_id | placeholders | active | notes |
|---|---|---|---|---|---|---|
| MEM_APPLICATION_SUBMITTED_TO_APPLICANT | Applicant: App Received | GEA Application Received | [FILE_ID from Part C] | FIRST_NAME, APPLICATION_ID, SUBMITTED_DATE, PORTAL_URL | TRUE | Test template for Phase 1 |

Replace `[FILE_ID]` with the actual file ID from the HTML file created in Part C.

---

### Part E: Create Test Function

**File:** `EmailService.gs` (or Code.gs if separate file not needed)

**Function:** `testEmailTemplateSystem()`

**Purpose:** End-to-end test of new template system

**Implementation:**

```javascript
function testEmailTemplateSystem() {
  // Test recipient (should be your test email)
  const testEmail = 'michael.raney@geabotswana.org';
  
  // Test 1: Load template
  Logger.log('Test 1: Loading template...');
  const template = getEmailTemplate('MEM_APPLICATION_SUBMITTED_TO_APPLICANT');
  if (!template) {
    Logger.log('❌ FAILED: Could not load template');
    return;
  }
  Logger.log('✅ PASSED: Template loaded');
  Logger.log('Subject:', template.subject);
  Logger.log('Placeholders:', template.placeholders);
  
  // Test 2: Substitute variables
  Logger.log('\nTest 2: Substituting variables...');
  const variables = {
    FIRST_NAME: 'Test User',
    APPLICATION_ID: 'APP-2026-TEST-001',
    SUBMITTED_DATE: new Date().toLocaleDateString(),
    PORTAL_URL: 'https://geabotswana.org/member.html'
  };
  
  const validationResult = validateTemplateVariables('MEM_APPLICATION_SUBMITTED_TO_APPLICANT', variables);
  if (!validationResult.valid) {
    Logger.log('⚠️ WARNING: Missing variables:', validationResult.missing);
  } else {
    Logger.log('✅ PASSED: All required variables provided');
  }
  
  // Test 3: Send test email
  Logger.log('\nTest 3: Sending test email...');
  const success = sendEmailFromTemplate(
    'MEM_APPLICATION_SUBMITTED_TO_APPLICANT',
    testEmail,
    variables
  );
  
  if (success) {
    Logger.log('✅ PASSED: Test email sent successfully');
    Logger.log('Check your email:', testEmail);
  } else {
    Logger.log('❌ FAILED: Could not send test email');
  }
  
  // Test 4: Check Audit Log
  Logger.log('\nTest 4: Verifying Audit Log entries...');
  Logger.log('(Check Audit Log sheet for EMAIL_SENT or error entries)');
}
```

**Execution:**
1. In Apps Script editor, run `testEmailTemplateSystem()`
2. Check execution logs
3. Verify email received at test address
4. Check Audit Log sheet for entries

---

## Critical Requirements

### Development Standards Compliance

**Every function must have:**
- Full JSDoc comment block (purpose, parameters, returns, side effects, errors, example)
- Clear error handling (try-catch, input validation)
- Audit logging for all significant operations
- Comments explaining complex logic (not obvious code)

**Per DEVELOPMENT_STANDARDS.md:**
- No hardcoded values (use constants: TREASURER_EMAIL, GEA_SENDER_EMAIL, etc.)
- Input validation on all parameters
- Graceful error handling (never throw uncaught exceptions)
- All operations logged to Audit_Logs sheet

---

### Board Delegation for Email Sending

**Critical:** All emails must be sent via Board delegation (from board@geabotswana.org), not personal email.

**Implementation:**

```javascript
// CORRECT: Use GmailApp with Board delegation
GmailApp.sendEmail(recipient, subject, '', {
  htmlBody: htmlBody,
  from: 'board@geabotswana.org',  // This requires domain-wide delegation setup
  replyTo: TREASURER_EMAIL
});
```

**Prerequisites for delegation:**
- GCP service account must be configured with domain-wide delegation
- Scopes must include `https://www.googleapis.com/auth/gmail.send`
- Service account email must be authorized by workspace admin
- Per CLAUDE_Membership_Implementation.md, this is already configured

**If delegation fails:**
- Log detailed error to Audit Log
- Include GCP error message
- Return false (don't silently fall back to personal email)
- DO NOT send email without proper delegation

---

### Audit Logging

**Log entries required for:**

1. **Template Loading:**
   - Success: `{action: 'TEMPLATE_LOADED', templateName, subject}`
   - Failure: `{action: 'TEMPLATE_NOT_FOUND', templateName, error}`

2. **Email Sending:**
   - Success: `{action: 'EMAIL_SENT', templateName, recipient, subject}`
   - Failure: `{action: 'EMAIL_SEND_FAILED', templateName, recipient, error}`

3. **Variable Validation:**
   - Warning: `{action: 'TEMPLATE_MISSING_VARIABLES', templateName, missing: [...]}`

**Audit Log entries should use existing `logAudit()` function** (verify it exists; if not, create it to write to Audit_Logs sheet with timestamp, action, actor, target, details).

---

## Testing Checklist

Before considering Phase 1 complete, verify:

- [ ] `getEmailTemplate()` loads template from Drive correctly
- [ ] `substituteTemplateVariables()` replaces all {{VARIABLES}} with test values
- [ ] `sendEmailFromTemplate()` sends email with Board delegation (from board@geabotswana.org)
- [ ] Test email received at test address with correct formatting
- [ ] HTML formatting renders correctly in email client
- [ ] Audit Log contains entries for template load, variable substitution, email send
- [ ] Error handling works (tested by providing invalid template name, missing variables, etc.)
- [ ] `validateTemplateVariables()` correctly identifies missing variables

---

## Deliverables

**By end of this session:**

1. ✅ EmailService.gs with 4 core functions + test function
2. ✅ Google Sheets Email Templates table with updated structure
3. ✅ Test template HTML file in Google Drive (membership/ folder)
4. ✅ Test template metadata in Google Sheets
5. ✅ Successful test email sent via Board delegation
6. ✅ All functions documented per DEVELOPMENT_STANDARDS.md

---

## Notes for Claude Code

- **Reference Implementation:** EMAIL_TEMPLATE_STORAGE_IMPLEMENTATION.md has detailed logic for each function
- **Naming:** Use semantic template names (MEM_, RES_, PAY_, etc.) as specified in EMAIL_TEMPLATE_NAMING_CONVENTION_PROPOSAL.md
- **Gradual Migration:** This is Phase 1 only. Phase 2 (migrate all 57 existing templates) comes later.
- **Board Delegation:** This is non-negotiable. All emails from board@geabotswana.org, not personal accounts.
- **Standards:** Follow DEVELOPMENT_STANDARDS.md strictly. Future maintainers (non-technical Board members) must understand every function.

---

## Questions Before Starting?

Confirm with Michael:
- Do the 4 functions cover your needs for Phase 1?
- Is Board delegation correctly understood (send from board@geabotswana.org)?
- Should `validateTemplateVariables()` be optional or required?
- Any other email-sending requirements to include?

Ready to start Phase 1 implementation.

