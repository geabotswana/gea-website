# GEA Membership Application Email Templates Reference

## Instructions
These email templates must be added to the **Email Templates** tab in the **GEA System Backend** spreadsheet (SYSTEM_BACKEND_ID).

Each row should have the following columns:
- `template_id`: The ID referenced in code (e.g., tpl_040)
- `template_name`: Human-readable name
- `subject`: Email subject line
- `body_html`: HTML email body with placeholders

Placeholders use the format `{{VARIABLE_NAME}}` and are replaced at runtime.

---

## New Templates (tpl_040 - tpl_052)

### tpl_040: Application Received
**Purpose:** Sent to applicant when application is first submitted

**Subject:** Your GEA Membership Application Has Been Received

**Body:**
```html
<p>Hello {{FIRST_NAME}},</p>

<p>We have received your membership application for the Gaborone Employee Association (GEA).
We're excited to process your application!</p>

<p><strong>Application ID:</strong> {{APPLICATION_ID}}</p>

<p><strong>Next Steps:</strong></p>
<ol>
  <li>Check the email from us with your temporary login credentials</li>
  <li>Log in to the member portal and upload required documents (passport, ID, photo)</li>
  <li>Our board will review your application within 5-7 business days</li>
  <li>Once approved, you'll be asked to submit payment</li>
  <li>Final confirmation of active membership</li>
</ol>

<p>If you have any questions, please contact us at <strong>board@geabotswana.org</strong></p>

<p>Best regards,<br>
The GEA Board</p>
```

---

### tpl_041: Account Credentials
**Purpose:** Sent to applicant with temporary password to access member portal

**Subject:** Your GEA Member Portal Login Credentials

**Body:**
```html
<p>Hello {{FIRST_NAME}},</p>

<p>Your account has been created on the GEA Member Portal. Use the credentials below to log in
and begin your application process.</p>

<p>
<strong>Email Address:</strong> {{EMAIL}}<br>
<strong>Temporary Password:</strong> <code style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">{{TEMP_PASSWORD}}</code>
</p>

<p>
<a href="{{LOGIN_URL}}" style="display: inline-block; background: #0A3161; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
  Log In to Member Portal
</a>
</p>

<p><strong>Important:</strong> Passwords must be at least 12 characters.
You should change your temporary password after first login.</p>

<p>If you encounter any issues, contact <strong>board@geabotswana.org</strong></p>

<p>Best regards,<br>
The GEA Board</p>
```

---

### tpl_042: New Application (Board)
**Purpose:** Sent to board email when applicant submits application

**Subject:** New Membership Application: {{APPLICANT_NAME}}

**Body:**
```html
<p>A new membership application has been submitted.</p>

<p>
<strong>Applicant Name:</strong> {{APPLICANT_NAME}}<br>
<strong>Membership Category:</strong> {{MEMBERSHIP_CATEGORY}}<br>
<strong>Household Type:</strong> {{HOUSEHOLD_TYPE}}<br>
<strong>Application ID:</strong> {{APPLICATION_ID}}<br>
<strong>Submitted:</strong> {{SUBMITTED_DATE}}
</p>

<p>The applicant must upload required documents before the board can begin initial review.</p>

<p>Log in to the <a href="https://geabotswana.org/member.html">GEA Admin Portal</a> to view and manage applications.</p>

<p>Best regards,<br>
GEA System</p>
```

---

### tpl_043: Documents Confirmed
**Purpose:** Sent to board when applicant confirms documents are uploaded

**Subject:** Documents Ready for Review: {{APPLICANT_NAME}}

**Body:**
```html
<p>The applicant has confirmed that all required documents have been uploaded and are ready for board review.</p>

<p>
<strong>Applicant Name:</strong> {{APPLICANT_NAME}}<br>
<strong>Membership Category:</strong> {{MEMBERSHIP_CATEGORY}}<br>
<strong>Application ID:</strong> {{APPLICATION_ID}}
</p>

<p>Log in to the <a href="https://geabotswana.org/member.html">GEA Admin Portal</a> to review documents
and make the initial approval decision (approve for RSO review or deny).</p>

<p>Best regards,<br>
GEA System</p>
```

---

### tpl_044: Documents Sent to RSO
**Purpose:** Sent to RSO and applicant when board approves documents for RSO review

**Subject:** Documents Forwarded for Security Review

**Body:**
```html
<p>Hello {{APPLICANT_NAME}},</p>

<p>Your submitted documents have been reviewed by the board and are now being forwarded to our
security team (RSO) for final verification. This review typically takes 3-5 business days.</p>

<p>We will contact you as soon as the review is complete. You don't need to take any action
during this time.</p>

<p>Thank you for your patience.</p>

<p>Best regards,<br>
The GEA Board</p>
```

---

### tpl_045: Board Initial Denied
**Purpose:** Sent to applicant when board denies application at initial stage

**Subject:** Your Membership Application - Board Decision

**Body:**
```html
<p>Hello {{FIRST_NAME}},</p>

<p>Thank you for your interest in joining the Gaborone Employee Association. After careful
review of your application, we are unable to proceed at this time.</p>

<p><strong>Reason:</strong> {{REASON}}</p>

<p>If you believe this decision was made in error, or if your circumstances have changed,
please feel free to contact us at <strong>board@geabotswana.org</strong> to discuss your application further.</p>

<p>We wish you all the best,<br>
The GEA Board</p>
```

---

### tpl_046: RSO Document Issue
**Purpose:** Sent to board and applicant when RSO finds issues with documents

**Subject:** Documents Require Resubmission

**Body:**
```html
<p>Hello {{APPLICANT_NAME}},</p>

<p>Our security team has identified issues with one or more of the documents you submitted.
These documents must be resubmitted before we can proceed with your application.</p>

<p><strong>Issues Identified:</strong></p>
<p>{{REASON}}</p>

<p><strong>Next Steps:</strong></p>
<ol>
  <li>Log in to the <a href="https://geabotswana.org/member.html">Member Portal</a></li>
  <li>Address the issues indicated above</li>
  <li>Upload corrected documents</li>
</ol>

<p>If you have questions about the required document format or content, please contact
<strong>board@geabotswana.org</strong></p>

<p>Best regards,<br>
The GEA Board</p>
```

---

### tpl_047: Ready for Final Approval
**Purpose:** Sent to board when RSO approves documents

**Subject:** Application Ready for Final Board Approval

**Body:**
```html
<p>Security review is complete. The following application is now ready for final board approval:</p>

<p>
<strong>Applicant Name:</strong> {{APPLICANT_NAME}}<br>
<strong>Application ID:</strong> {{APPLICATION_ID}}
</p>

<p>Log in to the <a href="https://geabotswana.org/member.html">GEA Admin Portal</a> to
approve the application (which will request payment) or deny it.</p>

<p>Best regards,<br>
GEA System</p>
```

---

### tpl_048: Application Approved
**Purpose:** Sent to applicant when final approval is granted

**Subject:** Your Membership Application Has Been Approved!

**Body:**
```html
<p>Hello {{APPLICANT_NAME}},</p>

<p>Congratulations! Your membership application for the Gaborone Employee Association has been
approved by our board.</p>

<p><strong>Membership Category:</strong> {{MEMBERSHIP_CATEGORY}}</p>

<p><strong>Next Step: Payment</strong></p>

<p>Please submit your membership dues to complete your application. Here are your payment options:</p>

<p>
<strong>Dues Amount:</strong> {{DUES_AMOUNT}}<br>
<strong>Payment Reference:</strong> {{PAYMENT_REFERENCE}}<br>
</p>

<p><strong>Payment Methods:</strong></p>
<ul>
  <li><strong>Bank Transfer:</strong> {{BANK_ACCOUNT}}</li>
  <li><strong>PayPal:</strong> {{PAYPAL}}</li>
  <li><strong>SDFCU:</strong> {{SDFCU}}</li>
  <li><strong>Zelle:</strong> {{ZELLE}}</li>
  <li><strong>Cash:</strong> Contact board@geabotswana.org</li>
</ul>

<p>Once you've made the payment, log in to the member portal and submit proof of payment.
Your membership will be activated within 2 business days.</p>

<p>If you have any questions, contact <strong>board@geabotswana.org</strong></p>

<p>Welcome to GEA!<br>
The GEA Board</p>
```

---

### tpl_049: Board Final Denied
**Purpose:** Sent to applicant when board denies at final stage

**Subject:** Your Membership Application - Final Board Decision

**Body:**
```html
<p>Hello {{FIRST_NAME}},</p>

<p>Thank you for submitting your membership application to the Gaborone Employee Association.
After final board review, we are unable to approve your application at this time.</p>

<p><strong>Reason:</strong> {{REASON}}</p>

<p>If you have questions about this decision, please contact <strong>board@geabotswana.org</strong></p>

<p>We wish you well,<br>
The GEA Board</p>
```

---

### tpl_050: Payment Proof Received
**Purpose:** Sent to applicant and treasurer when payment proof is submitted

**Subject:** Payment Received - Awaiting Verification

**Body:**
```html
<p>Hello {{APPLICANT_NAME}},</p>

<p>We have received your payment submission for GEA membership dues.</p>

<p>
<strong>Payment Method:</strong> {{PAYMENT_METHOD}}<br>
<strong>Submitted:</strong> {{PAYMENT_DATE}}<br>
<strong>Next Step:</strong> {{NEXT_STEP}}
</p>

<p>Our Treasurer will verify the payment within 2 business days. You'll receive confirmation
by email once verification is complete.</p>

<p>Best regards,<br>
The GEA Board</p>
```

---

### tpl_051: Membership Activated
**Purpose:** Sent to new member when membership is officially activated

**Subject:** Welcome to GEA! Your Membership is Now Active

**Body:**
```html
<p>Hello {{APPLICANT_NAME}},</p>

<p>Your membership payment has been verified. <strong>Welcome to the Gaborone Employee Association!</strong></p>

<p>
<strong>Membership Category:</strong> {{MEMBERSHIP_CATEGORY}}<br>
<strong>Membership Expiration:</strong> {{EXPIRATION_DATE}}<br>
</p>

<p><strong>What You Can Now Do:</strong></p>
<ul>
  <li>Book GEA facilities (tennis court, leobo, playground, gym)</li>
  <li>View your membership card in the member portal</li>
  <li>Participate in GEA events and activities</li>
  <li>Access member-only services</li>
</ul>

<p>
<a href="{{PORTAL_URL}}" style="display: inline-block; background: #0A3161; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
  Go to Member Portal
</a>
</p>

<p>If you have any questions, please contact <strong>board@geabotswana.org</strong></p>

<p>We're delighted to have you as part of our community!<br>
The GEA Board</p>
```

---

### tpl_052: New Member (Board)
**Purpose:** Sent to board when a new member is activated

**Subject:** New Member Activated

**Body:**
```html
<p>A new member has been officially activated:</p>

<p>
<strong>Member Name:</strong> {{APPLICANT_NAME}}<br>
<strong>Membership Category:</strong> {{MEMBERSHIP_CATEGORY}}<br>
<strong>Household Type:</strong> {{HOUSEHOLD_TYPE}}<br>
<strong>Activated:</strong> Today
</p>

<p>Please note this in your records and update the member directory accordingly.</p>

<p>Best regards,<br>
GEA System</p>
```

---

## Template Variable Reference

| Variable | Used In | Description |
|----------|---------|-------------|
| `{{FIRST_NAME}}` | tpl_040, tpl_041, tpl_045, tpl_049 | Applicant's first name |
| `{{APPLICANT_NAME}}` | tpl_042, tpl_043, tpl_046, tpl_047, tpl_050, tpl_051, tpl_052 | Full name of applicant |
| `{{EMAIL}}` | tpl_041 | Applicant's email address |
| `{{APPLICATION_ID}}` | tpl_040, tpl_042, tpl_043, tpl_047 | Generated application ID |
| `{{MEMBERSHIP_CATEGORY}}` | tpl_042, tpl_043, tpl_048, tpl_051, tpl_052 | e.g., Full, Associate, Affiliate, etc. |
| `{{HOUSEHOLD_TYPE}}` | tpl_042, tpl_052 | Individual or Family |
| `{{SUBMITTED_DATE}}` | tpl_042 | Date application was submitted |
| `{{TEMP_PASSWORD}}` | tpl_041 | Temporary password for login |
| `{{LOGIN_URL}}` | tpl_041 | Link to member portal |
| `{{REASON}}` | tpl_045, tpl_046, tpl_049 | Reason for denial/resubmission |
| `{{DUES_AMOUNT}}` | tpl_048 | Dollar amount of membership dues |
| `{{PAYMENT_REFERENCE}}` | tpl_048, tpl_050 | Payment reference code |
| `{{BANK_ACCOUNT}}` | tpl_048 | Bank transfer details |
| `{{PAYPAL}}` | tpl_048 | PayPal email/link |
| `{{SDFCU}}` | tpl_048 | SDFCU payment details |
| `{{ZELLE}}` | tpl_048 | Zelle payment details |
| `{{PAYMENT_METHOD}}` | tpl_050 | Payment method used |
| `{{PAYMENT_DATE}}` | tpl_050 | Date payment was submitted |
| `{{NEXT_STEP}}` | tpl_050 | Description of verification process |
| `{{EXPIRATION_DATE}}` | tpl_051 | Membership expiration date |
| `{{PORTAL_URL}}` | tpl_051 | Link to member portal |

---

## How to Add Templates to Spreadsheet

1. Open **GEA System Backend** spreadsheet
2. Go to the **Email Templates** tab
3. Find the last row (should end with tpl_032 or similar)
4. Add new rows starting with tpl_040, using the information above
5. Fill in: `template_id`, `template_name`, `subject`, `body_html`

**Important:** Make sure to preserve the exact HTML formatting and placeholder names (case-sensitive).
