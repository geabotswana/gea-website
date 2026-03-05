# GEA Membership Application Email Templates - REVISED

## Format & Style Guide
- Uses {{PLACEHOLDER}} variables (case-sensitive)
- Conditional blocks: {{IF_CONDITION}}...{{END_IF}}
- Professional, warm tone matching existing GEA emails
- Include actionable next steps
- Use both USD and BWP where relevant

---

## tpl_040: Application Received

**template_name:** Application Received

**subject:** GEA Membership Application Received - {{FULL_NAME}}

**body:**
```
Dear {{FIRST_NAME}},

Thank you for applying for membership with the Gaborone Employee Association! We have received your application and will review it shortly.

APPLICATION SUMMARY:
Name: {{FULL_NAME}}
Membership Type: {{MEMBERSHIP_LEVEL}}
Household Type: {{HOUSEHOLD_TYPE}}
Application ID: {{APPLICATION_ID}}
{{IF_FAMILY}}Family Members: {{FAMILY_MEMBERS_COUNT}} additional household members{{END_IF}}
{{IF_REQUIRES_SPONSOR}}Sponsor: {{SPONSOR_NAME}}{{END_IF}}

NEXT STEPS:
1. You will receive a separate email with login credentials.
2. Log in to the Member Portal and upload required documents (passport, ID, photo).
3. The GEA Board will review your application and documents.
4. You will receive notification of the board decision within 5-7 business days.
5. Upon approval, you will receive payment instructions.
6. Your membership activates upon receipt of payment.

{{IF_REQUIRES_SPONSOR}}
Note: We will also contact your sponsor ({{SPONSOR_NAME}}) to verify your eligibility as part of the review process.
{{END_IF}}

If you have any questions, please contact us at board@geabotswana.org.

Welcome to the GEA community!

Gaborone Employee Association
www.geabotswana.org
board@geabotswana.org
```

---

## tpl_041: Account Credentials

**template_name:** Account Credentials

**subject:** Your GEA Member Portal Login - {{FULL_NAME}}

**body:**
```
Dear {{FIRST_NAME}},

Your account has been created in the GEA Member Portal. Use the credentials below to log in and continue your membership application.

PORTAL LOGIN:
Email: {{EMAIL}}
Temporary Password: {{TEMP_PASSWORD}}
Portal URL: {{PORTAL_URL}}

WHAT TO DO NEXT:
1. Log in to the portal using the credentials above.
2. You will be required to change your password on first login (minimum 12 characters).
3. Upload required documents:
   - Passport or National ID
   - Proof of residency or employment verification
   - Passport-style photo
4. Confirm document submission in the portal.
5. The board will review your application and documents.

PASSWORD REQUIREMENTS:
- Minimum 12 characters
- Should include letters, numbers, and special characters
- Never share your password

NEED HELP?
If you encounter any issues logging in or uploading documents, please contact board@geabotswana.org.

Best regards,
Gaborone Employee Association
www.geabotswana.org
board@geabotswana.org
```

---

## tpl_042: New Application (Board Notification)

**template_name:** New Application (Board)

**subject:** New Membership Application: {{FULL_NAME}}

**body:**
```
A new membership application has been submitted and requires board attention.

APPLICANT INFORMATION:
Name: {{FULL_NAME}}
Email: {{EMAIL}}
Phone: {{PHONE}}
Membership Type: {{MEMBERSHIP_LEVEL}}
Household Type: {{HOUSEHOLD_TYPE}}
Application ID: {{APPLICATION_ID}}
Submitted: {{SUBMITTED_DATE}}

{{IF_REQUIRES_SPONSOR}}
SPONSOR INFORMATION:
Sponsor Name: {{SPONSOR_NAME}}
Sponsor Email: {{SPONSOR_EMAIL}}
[ACTION REQUIRED: Verify sponsor is an active Full member]
{{END_IF}}

NEXT STEP:
The applicant has been sent login credentials and instructions to upload required documents. Once documents are submitted and confirmed in the portal, the board can begin the initial review.

Log in to the Admin Portal to track application status.

GEA System
```

---

## tpl_043: Documents Confirmed

**template_name:** Documents Confirmed

**subject:** Documents Ready for Review - {{FULL_NAME}}

**body:**
```
The applicant has confirmed that all required documents have been uploaded to the Member Portal and are ready for board review.

APPLICANT: {{FULL_NAME}}
APPLICATION ID: {{APPLICATION_ID}}
MEMBERSHIP TYPE: {{MEMBERSHIP_LEVEL}}
DOCUMENTS CONFIRMED: {{CONFIRMED_DATE}}

DOCUMENTS SUBMITTED:
{{DOCUMENTS_LIST}}

NEXT STEP:
Review the application and documents in the Admin Portal. You can:
- Approve for RSO (security) review
- Request additional information
- Deny the application

Log in to the Admin Portal to proceed with initial review.

GEA System
```

---

## tpl_044: Documents Sent to RSO

**template_name:** Docs Sent to RSO

**subject:** Your Application Documents Are Under Security Review

**body:**
```
Dear {{FIRST_NAME}},

Your GEA membership application has passed the initial board review. Your documents have now been forwarded to our security team (RSO - Regional Security Officer) for final verification.

APPLICATION DETAILS:
Name: {{FULL_NAME}}
Membership Type: {{MEMBERSHIP_LEVEL}}
Application ID: {{APPLICATION_ID}}

WHAT HAPPENS NEXT:
The RSO will review your submitted documents for completeness and authenticity. This review typically takes 3-5 business days. You do not need to take any action during this time.

Once the security review is complete, the board will make a final approval decision, and you will receive notification with next steps.

If you have any questions, please contact board@geabotswana.org.

Best regards,
Gaborone Employee Association
www.geabotswana.org
board@geabotswana.org
```

---

## tpl_045: Board Initial Denied

**template_name:** Board Initial Denied

**subject:** Your GEA Membership Application

**body:**
```
Dear {{FIRST_NAME}},

Thank you for your interest in joining the Gaborone Employee Association. We have reviewed your application and supporting documents.

Unfortunately, we are unable to move forward with your application at this time.

REASON:
{{DENIAL_REASON}}

{{IF_CAN_REAPPLY}}
We encourage you to reapply once you have addressed the items above. If you believe this decision was made in error, or if your circumstances have changed, please feel free to contact us at board@geabotswana.org to discuss your application further.
{{END_IF}}

We appreciate your interest in GEA and wish you all the best.

Gaborone Employee Association
www.geabotswana.org
board@geabotswana.org
```

---

## tpl_046: RSO Document Issue

**template_name:** RSO Document Issue

**subject:** Additional Information Needed - {{FULL_NAME}}

**body:**
```
Dear {{FIRST_NAME}},

Our security team has reviewed your submitted documents and has identified issues that must be resolved before we can proceed with your membership application.

APPLICATION ID: {{APPLICATION_ID}}

ISSUES IDENTIFIED:
{{RSO_ISSUES}}

ACTION REQUIRED:
You must resubmit corrected or additional documents. Log in to the Member Portal and:
1. Review the identified issues above
2. Prepare corrected documents
3. Upload the revised documents
4. Confirm resubmission

Please address all issues noted above. Documents must be resubmitted within 10 business days, or your application may be closed.

WHAT HAPPENS NEXT:
Once corrected documents are submitted, the security team will review them again. Upon approval, your application will proceed to final board review.

If you have questions about document requirements or format, please contact board@geabotswana.org.

Best regards,
Gaborone Employee Association
www.geabotswana.org
board@geabotswana.org
```

---

## tpl_047: Ready for Final Approval (Board)

**template_name:** Ready for Final Approval

**subject:** Application Ready for Final Board Approval - {{FULL_NAME}}

**body:**
```
Security review has been completed successfully. The following application is ready for final board approval:

APPLICANT: {{FULL_NAME}}
APPLICATION ID: {{APPLICATION_ID}}
MEMBERSHIP TYPE: {{MEMBERSHIP_LEVEL}}
HOUSEHOLD TYPE: {{HOUSEHOLD_TYPE}}
RSO APPROVAL DATE: {{RSO_APPROVAL_DATE}}

NEXT STEP:
Log in to the Admin Portal to review and make the final approval decision. If approved, the applicant will receive payment instructions and payment terms.

GEA System
```

---

## tpl_048: Application Approved (Payment Due)

**template_name:** Application Approved

**subject:** Congratulations! Your GEA Membership Application Has Been Approved

**body:**
```
Dear {{FIRST_NAME}},

Congratulations! Your GEA membership application has been approved by our board. We are excited to welcome you to the Gaborone Employee Association!

MEMBERSHIP DETAILS:
Name: {{FULL_NAME}}
Membership Type: {{MEMBERSHIP_LEVEL}}
Household Type: {{HOUSEHOLD_TYPE}}
{{IF_FAMILY}}Family Members: {{FAMILY_MEMBERS_COUNT}}{{END_IF}}
Dues Amount: ${{DUES_USD}} USD / P{{DUES_BWP}} BWP
Approval Date: {{APPROVAL_DATE}}

PAYMENT INSTRUCTIONS:
Your membership dues of ${{DUES_USD}} USD or P{{DUES_BWP}} BWP are now due. Please arrange payment using one of the following methods:

Option 1: USD via SDFCU Bank Transfer
Account Name: Gaborone Employee Association
Account Number: 1010000268360
Routing Number: 256075342
Reference Code: {{PAYMENT_REFERENCE}}
Include your full name in the memo line.

Option 2: PayPal
PayPal: paypal.biz/GEABoard
Include reference code {{PAYMENT_REFERENCE}} in the payment note.

Option 3: Zelle
Zelle: Geaboard@gmail.com
Include reference code {{PAYMENT_REFERENCE}} in the payment note.

Option 4: BWP via ABSA Bank Transfer
Account Name: U.S. Embassy - Gaborone Employee Association
Account Number: 1005193
Branch: 02 (Government Enclave Branch)
Swift Code: BARCBWGX
YOU MUST write {{PAYMENT_REFERENCE}} in the memo field.

Option 5: In-Person Cash Payment
Contact board@geabotswana.org to arrange cash payment.

WHAT HAPPENS NEXT:
1. Submit payment using one of the methods above.
2. Log in to the Member Portal and submit payment confirmation (receipt/screenshot).
3. Our Treasurer will verify receipt of payment (typically 2 business days).
4. Upon verification, your membership is activated.
5. Download your digital membership card from the portal.
6. Enjoy GEA facilities and benefits!

QUESTIONS?
If you have questions about payment methods or need assistance, please contact board@geabotswana.org.

Welcome to GEA!

Gaborone Employee Association
www.geabotswana.org
board@geabotswana.org
```

---

## tpl_049: Board Final Denied

**template_name:** Board Final Denied

**subject:** Your GEA Membership Application - Final Decision

**body:**
```
Dear {{FIRST_NAME}},

Thank you for your patience as we reviewed your GEA membership application. We have completed our review process.

APPLICATION OUTCOME: NOT APPROVED

REASON:
{{DENIAL_REASON}}

We appreciate the time and effort you invested in your application. If you believe this decision was made in error or have questions, please feel free to contact us at board@geabotswana.org.

We wish you all the best.

Gaborone Employee Association
www.geabotswana.org
board@geabotswana.org
```

---

## tpl_050: Payment Proof Received

**template_name:** Payment Proof Received

**subject:** Payment Received - Awaiting Verification

**body:**
```
Dear {{FIRST_NAME}},

Thank you! We have received your payment submission for GEA membership dues.

PAYMENT DETAILS:
Applicant: {{FULL_NAME}}
Payment Method: {{PAYMENT_METHOD}}
Submitted: {{PAYMENT_DATE}}
Payment Reference: {{PAYMENT_REFERENCE}}
Amount: ${{DUES_USD}} USD / P{{DUES_BWP}} BWP

NEXT STEPS:
Our Treasurer will verify the payment within 2 business days. Once verified, your membership will be activated and you will receive a confirmation email with your digital membership card.

You do not need to take any further action at this time.

If you have any questions, please contact board@geabotswana.org.

Best regards,
Gaborone Employee Association
www.geabotswana.org
board@geabotswana.org
```

---

## tpl_051: Membership Activated

**template_name:** Membership Activated

**subject:** Welcome to GEA! Your Membership Is Now Active

**body:**
```
Dear {{FIRST_NAME}},

Your membership payment has been verified. Your GEA membership is now ACTIVE!

MEMBERSHIP DETAILS:
Name: {{FULL_NAME}}
Membership Type: {{MEMBERSHIP_LEVEL}}
Household Type: {{HOUSEHOLD_TYPE}}
Membership Start Date: {{START_DATE}}
Membership Expiration: {{EXPIRATION_DATE}}
{{IF_FAMILY}}Family Members: {{FAMILY_MEMBERS_COUNT}} additional household members{{END_IF}}

YOUR MEMBERSHIP BENEFITS:
✓ Book GEA facilities (Tennis Court, Leobo, Playground, Gym)
✓ Attend GEA social events and activities
✓ Access member-only services and discounts
✓ Receive member communications and updates
✓ Download your digital membership card

NEXT STEPS:
1. Log in to the Member Portal: {{PORTAL_URL}}
2. Complete your profile (photo, contact information)
3. Start booking GEA facilities
4. Download your digital membership card

FACILITY BOOKING RULES:
- Tennis Court: 3 hours per week (Monday-Sunday reset)
- Leobo: 1 reservation per month (resets 1st of month)
- Other facilities: Walk-up access available
- Guest lists required for certain events (submit 2+ business days before)

QUESTIONS OR SUPPORT:
If you need help using the portal or have questions about your membership, contact board@geabotswana.org.

Welcome to the GEA family!

Gaborone Employee Association
www.geabotswana.org
board@geabotswana.org
```

---

## tpl_052: New Member (Board Notification)

**template_name:** New Member Activated

**subject:** New Member Activated - {{FULL_NAME}}

**body:**
```
A new member has been officially activated and is now ready to use GEA services.

NEW MEMBER:
Name: {{FULL_NAME}}
Email: {{EMAIL}}
Membership Type: {{MEMBERSHIP_LEVEL}}
Household Type: {{HOUSEHOLD_TYPE}}
Activation Date: {{ACTIVATION_DATE}}
{{IF_FAMILY}}Family Members: {{FAMILY_MEMBERS_COUNT}}{{END_IF}}

NEXT STEPS FOR BOARD:
- Add new member to member directory (if manual tracking needed)
- Prepare welcome package or materials (if applicable)
- Update membership records
- Note activation in GEA records

This member is now active and can book facilities immediately.

GEA System
```

---

## Variable Reference

| Variable | Used In | Description |
|----------|---------|-------------|
| {{FULL_NAME}} | All | Applicant's full name |
| {{FIRST_NAME}} | All | Applicant's first name |
| {{EMAIL}} | All | Applicant's email address |
| {{PHONE}} | tpl_042 | Formatted phone number |
| {{MEMBERSHIP_LEVEL}} | All | Category (Full, Associate, Affiliate, Diplomatic, Community, Temporary) |
| {{HOUSEHOLD_TYPE}} | All | Individual or Family |
| {{APPLICATION_ID}} | tpl_040, tpl_042, tpl_043, tpl_044, tpl_046, tpl_047 | Generated application ID |
| {{SPONSOR_NAME}} | tpl_040, tpl_042 | Sponsor's name |
| {{SPONSOR_EMAIL}} | tpl_042 | Sponsor's email |
| {{TEMP_PASSWORD}} | tpl_041 | Temporary login password |
| {{PORTAL_URL}} | tpl_041, tpl_051 | Link to member portal |
| {{SUBMITTED_DATE}} | tpl_042 | Application submission date |
| {{CONFIRMED_DATE}} | tpl_043 | Documents confirmed date |
| {{DOCUMENTS_LIST}} | tpl_043 | List of uploaded documents |
| {{DENIAL_REASON}} | tpl_045, tpl_049 | Reason for denial (public-facing) |
| {{RSO_ISSUES}} | tpl_046 | Issues identified by security team |
| {{RSO_APPROVAL_DATE}} | tpl_047 | Date RSO approved documents |
| {{APPROVAL_DATE}} | tpl_048 | Final board approval date |
| {{DUES_USD}} | tpl_048, tpl_050, tpl_051 | Dues amount in USD |
| {{DUES_BWP}} | tpl_048, tpl_050, tpl_051 | Dues amount in BWP |
| {{PAYMENT_REFERENCE}} | tpl_048, tpl_050 | Reference code for payment (LASTNAME_YY-YY) |
| {{PAYMENT_METHOD}} | tpl_050 | Payment method used |
| {{PAYMENT_DATE}} | tpl_050 | Date payment was submitted |
| {{START_DATE}} | tpl_051 | Membership start date |
| {{EXPIRATION_DATE}} | tpl_051 | Membership expiration date |
| {{FAMILY_MEMBERS_COUNT}} | tpl_040, tpl_048, tpl_051, tpl_052 | Number of additional household members |
| {{ACTIVATION_DATE}} | tpl_052 | Date membership was activated |

---

## Conditional Blocks Reference

| Condition | Used In | When TRUE |
|-----------|---------|-----------|
| {{IF_FAMILY}}...{{END_IF}} | tpl_040, tpl_048, tpl_051, tpl_052 | Household type is Family |
| {{IF_REQUIRES_SPONSOR}}...{{END_IF}} | tpl_040, tpl_042 | Membership category requires sponsor |
| {{IF_CAN_REAPPLY}}...{{END_IF}} | tpl_045 | Applicant may reapply |

