# Membership Application Workflow Implementation Guide

Complete implementation guide for the membership application system, including 11-step lifecycle, category eligibility, approval workflows, and payment verification.

---

## Overview & Key Principles

### Application Access
- Open to all applicants (not restricted to @geabotswana.org accounts)
- Initiated via web app form (not external email/contact process)
- Submission triggers automatic account creation (new individual + new household)
- New applicant account has **read-only dashboard** (no reservation rights, limited portal features)

### Membership Categories
- 6 total categories: 5 full-year + 1 temporary
- Applicant completes category-filtering questionnaire to determine eligibility
- Category determines document requirements, sponsor requirement, and membership duration
- Each applicant can qualify for exactly ONE category (mutually exclusive)

### Approval Timeline
- Board review: 3 business days
- RSO review: 5 business days (after board approval)
- Total expected: ~8 business days from submission to final approval

### Membership Year
- Runs August 1 – July 31 (annual cycle)
- All memberships, regardless of join date, expire July 31
- Example: Join in December → Active through July 31 of following year

---

## Application Lifecycle (11 Steps)

### STEP 1: Applicant Accesses Application Form

```
Web app (Portal.html) displays "New Member Application" link
  ├─ Form displays membership category questionnaire
  ├─ Applicant answers questions to determine category eligibility
  └─ System suggests category; applicant confirms or selects alternative
     (if eligible for multiple categories)
```

### STEP 2: Applicant Provides Personal Information

```
Individual applicant:
  ├─ First name, last name, email, phone (three-part: country_code_primary, phone_primary, phone_primary_whatsapp)
  ├─ Employment info (captured for all applicants):
  │  ├─ Job title (YES, capture for all applicants)
  │  ├─ Department (NO, do not capture)
  │  ├─ Posting date (YES, capture for Full/Associate/Diplomatic/Temporary only)
  │  ├─ Anticipated departure date (YES, capture for Full/Associate/Diplomatic/Temporary)
  │  └─ Employment status (NO, implicit in membership category)
  └─ Sponsor info (required for Community/Guest/Affiliate/Associate): Name + email of GEA Full-category member

Family applicant:
  ├─ Primary member info (as above; date of birth extracted from ID document during verification)
  ├─ Spouse info: First name, last name, email, phone (optional), employment info (NO spouse employment required; date of birth extracted from ID document)
  ├─ Child(ren) info: First name, last name, date of birth (REQUIRED for each child, age threshold: 17+ = voting eligible)
  └─ Household staff (optional): Name, Omang number, employment start date, phone (required), email (optional; date of birth extracted from Omang)
```

### STEP 3: Applicant Submits Application

```
Portal.submitApplication(formData) → handlePortalApi("submit_application", formData)
  └─ ApplicationService.createApplication() validates:
     ├─ Email not already registered as user (fail if exists in Individuals sheet)
     ├─ All required fields present
     ├─ Sponsor email valid (if required for category)
     ├─ Phone number valid (international format)
     └─ For family: spouse info complete, children DOB valid, etc.

Create new Household record:
  ├─ household_id (HHS-YYYY-MM-DD-###)
  ├─ household_name (applicant's last name or family name)
  ├─ membership_type (category selected)
  ├─ membership_expiration_date = next July 31 based on current date
  ├─ active = FALSE (until treasurer verifies payment)
  └─ application_id (link to Membership Applications sheet)

Create primary individual_id for applicant:
  ├─ individual_id (IND-YYYY-MM-DD-###)
  ├─ household_id (from above)
  ├─ first_name, last_name, email, phone
  ├─ password_hash (auto-generated temporary password sent via email)
  ├─ relationship_to_primary = "Primary" (self)
  ├─ can_access_unaccompanied = TRUE (primary can book reservations)
  ├─ voting_eligible = FALSE (until membership active)
  └─ application_id (link to Membership Applications sheet)

Create additional individuals (if family):
  ├─ Spouse: relationship_to_primary = "Spouse", can_access_unaccompanied = TRUE
  ├─ Children: relationship_to_primary = "Child", can_access_unaccompanied = FALSE (until age 18), date_of_birth (REQUIRED at submission)
  └─ Household staff: relationship_to_primary = "[Role]", can_access_unaccompanied = FALSE, arrival_date (employment start date)

Create Application record in Membership Applications sheet (42 columns):
  ├─ application_id, household_id, primary_individual_id
  ├─ primary_applicant_name, primary_applicant_email
  ├─ country_code_primary, phone_primary, phone_primary_whatsapp (three-part phone system)
  ├─ membership_category, household_type (Individual/Family)
  ├─ employment_job_title, employment_posting_date, employment_departure_date (if applicable)
  ├─ dues_amount, membership_start_date, membership_expiration_date (= next July 31)
  ├─ sponsor_name, sponsor_email, sponsor_verified, sponsor_verified_date, sponsor_verified_by (if required)
  ├─ status = "awaiting_docs" (initial status)
  ├─ submitted_date = NOW, documents_confirmed_date = NULL
  ├─ board_initial_status = NULL, board_initial_reviewed_by = NULL, board_initial_review_date = NULL
  ├─ board_initial_notes = NULL, board_initial_denial_reason = NULL (if denied)
  ├─ rso_status = NULL, rso_reviewed_by = NULL, rso_review_date = NULL, rso_private_notes = NULL
  ├─ board_final_status = NULL, board_final_reviewed_by = NULL, board_final_review_date = NULL
  ├─ board_final_denial_reason = NULL (if denied)
  ├─ payment_status = NULL, payment_id = NULL
  ├─ created_date = NOW, last_modified_date = NOW, notes = NULL

Generate temporary password & send welcome email:
  └─ Email template: "Welcome to GEA - Application Submitted"
     ├─ Temp password link
     ├─ Instructions to change password
     ├─ Link to application dashboard
     └─ Next steps: submit documents

Send board notification email:
  └─ Email template: "New Membership Application Submitted"
     ├─ Applicant details, category, sponsor (if applicable)
     ├─ Link to admin portal for review
     └─ Board approval deadline: [DATE]

Return to applicant: "Application Submitted! Please log in to submit required documents."
```

### STEP 4: Applicant Logs In & Views Application Dashboard

```
Portal.loadApplicationDashboard() shows:
  ├─ Application status: "Under Review by Board"
  ├─ Current step: "1. Submit Documents"
  ├─ Documents required (based on category):
  │  ├─ Passport (required for all non-Botswanans; optional for citizens)
  │  ├─ Omang/ID (required for Botswana citizens; optional alternative to passport)
  │  ├─ Diplomatic Passport (required for Diplomatic category only)
  │  ├─ Passport-style photo (required for all)
  │  └─ Employment verification (may be requested, not always required)
  │
  ├─ Upload interface: Drag-and-drop or file select for each document type
  ├─ Instructions: "Please upload your documents to help us process your application quickly"
  └─ Status indicator: "Documents pending" or "All documents submitted"

Applicant uploads documents (see STEP 5)
```

### STEP 5: Applicant Submits Documents

```
Portal.uploadDocument(individual_id, document_type, file)
  → handlePortalApi("upload_document", params)

FileService.submitDocumentForApproval() validates:
  ├─ File type allowed (.pdf, .jpg, .png)
  ├─ Photo specifications:
  │  ├─ Format: JPEG or PNG
  │  ├─ Dimensions: 600x600 to 1200x1200 pixels (suggested minimum/maximum)
  │  ├─ File size: 54KB–10MB
  │  └─ Quality requirement: Clear, recognizable face photo (white background NOT required)
  └─ Document type required for this category

Create File Submission record (File Submissions sheet, Member Directory):
  ├─ submission_id, individual_id, document_type
  ├─ status = "submitted"
  ├─ submission_timestamp = NOW
  ├─ file_name, file_size, file_format
  ├─ cloud_storage_path = NULL (populated on approval)
  ├─ rso_reviewed_by = NULL, rso_review_date = NULL, rso_approval_status = NULL
  ├─ gea_reviewed_by = NULL, gea_review_date = NULL, gea_approval_status = NULL
  ├─ rejection_reason = NULL
  ├─ is_current = FALSE (until approved)
  └─ disabled_date = NULL

Update Application dashboard:
  ├─ Document shown as "Submitted - Awaiting Review"
  └─ Applicant can replace if needed (new submission overrides previous draft)

Do NOT send notifications yet (wait for board review)
```

### STEP 6: Board Reviews Application & Documents

```
Admin.html showPage('applications') displays pending applications
  └─ Board member clicks application → viewApplicationDetails(application_id)

Admin sees:
  ├─ Applicant info (name, email, phone, category, sponsor)
  ├─ Family members (spouse, children, staff)
  ├─ Employment info (if provided)
  ├─ Submitted documents (with download links & approval status)
  ├─ Application timeline (submitted date, deadlines)
  └─ Actions: [Approve] [Deny] [Request More Info]

Board reviews completeness & eligibility:
  ├─ All required documents submitted?
  ├─ Application info complete?
  ├─ Sponsor verification (if required)?
  └─ Any red flags or concerns?

APPROVE PATH:
  ├─ Admin.approveApplication(application_id)
  ├─ Update Application:
  │  ├─ board_approval_status = "approved"
  │  ├─ board_approved_by = [BOARD_MEMBER]
  │  └─ board_approval_timestamp = NOW
  │
  ├─ Send documents to RSO for review:
  │  ├─ Update File Submissions: status = "rso_pending" (for each document)
  │  └─ Email template: "Documents Submitted for RSO Review"
  │     ├─ Applicant info summary
  │     ├─ Document list with download links
  │     ├─ RSO approval deadline: NOW + 5 business days
  │     └─ Link to RSO approval interface
  │
  └─ Send applicant email:
     └─ Email template: "Application Approved by Board - Awaiting RSO Review"
        ├─ Congratulations message
        ├─ Next step: RSO review of documents
        ├─ Expected timeline
        └─ Link to application dashboard

DENY PATH:
  ├─ Admin.denyApplication(application_id, denial_reason)
  ├─ Update Application:
  │  ├─ board_approval_status = "denied"
  │  ├─ board_denial_reason = [REASON]
  │  └─ board_approval_timestamp = NOW
  │
  ├─ Update Household: active = FALSE
  ├─ Disable individual accounts (set active = FALSE for all household members)
  ├─ Email applicant:
  │  └─ Email template: "Application Not Approved"
  │     ├─ Denial reason
  │     ├─ Instructions: "You cannot reapply on this email without board approval"
  │     └─ Board contact info for questions
  │
  └─ Audit log: Record denial

REQUEST MORE INFO PATH:
  ├─ Admin.requestMoreInfo(application_id, info_needed, deadline)
  ├─ Update Application:
  │  ├─ board_approval_status = "pending_info"
  │  └─ pending_info_description = [DETAILS]
  │
  ├─ Email applicant:
  │  └─ Email template: "More Information Needed for Your Application"
  │     ├─ Specific info or documents requested
  │     ├─ Deadline to submit
  │     └─ Link to dashboard to upload/update info
  │
  └─ Application remains in "Under Review" status until deadline
```

### STEP 7: RSO Reviews & Approves Documents

```
Email sent to rso-approve@geabotswana.org with notification (no link)
  └─ RSO logs in to Admin Portal with RSO account
     ├─ Navigate to "Document Reviews" section
     └─ Documents for all applications pending RSO review listed

RSO reviews each document via portal interface:
  ├─ Applicant name, application ID, document type
  ├─ Document preview (image or file download)
  ├─ Validation checklist:
  │  ├─ Passport: Valid? Expiration date OK? Matches application?
  │  ├─ Omang: Valid? Current? Matches application?
  │  ├─ Diplomatic Passport: Correct country/org? Valid?
  │  ├─ Photo: Quality acceptable? Dimensions correct? Current?
  │  └─ Employment verification: Complete? Verifiable?
  └─ Actions per document: [Approve] [Reject with reason]

RSO DECISION (ALL DOCUMENTS APPROVED):
  ├─ Click [Approve] on each document
  ├─ Update File Submissions: status = "rso_approved"
  │  ├─ rso_reviewed_by = [LOGGED_IN_RSO_EMAIL] (captured from session)
  │  └─ rso_review_date = NOW
  │
  ├─ Update Application:
  │  ├─ rso_status = "approved"
  │  ├─ rso_reviewed_by = [LOGGED_IN_RSO_EMAIL]
  │  ├─ rso_review_date = NOW
  │  └─ status = "approved_pending_payment"
  │
  ├─ Email applicant:
  │  └─ Email template: "Application Approved! Next: Submit Payment"
  │     ├─ Congratulations
  │     ├─ Membership dues amount (if applicable)
  │     ├─ Payment instructions
  │     ├─ How to submit proof of payment
  │     └─ Link to application dashboard
  │
  ├─ Email treasurer:
  │  └─ Email template: "New Member Ready for Payment Verification"
  │     ├─ Applicant info
  │     ├─ Membership type
  │     ├─ Dues amount due
  │     └─ Link to admin portal to verify payment
  │
  └─ Audit log: Record which RSO member approved documents

RSO DECISION (SOME DOCUMENTS REJECTED):
  ├─ Click [Reject] on document(s), enter reason
  ├─ Update File Submissions: status = "rso_rejected"
  │  ├─ rso_reviewed_by = [LOGGED_IN_RSO_EMAIL]
  │  ├─ rso_review_date = NOW
  │  └─ rejection_reason = [REASON from RSO]
  │
  ├─ Update Application:
  │  ├─ rso_status = "denied"
  │  ├─ rso_reviewed_by = [LOGGED_IN_RSO_EMAIL]
  │  └─ rso_review_date = NOW
  │
  ├─ Email applicant:
  │  └─ Email template: "Documents Rejected - Please Resubmit"
  │     ├─ List of rejected documents with specific reasons from RSO
  │     ├─ Instructions for resubmission
  │     ├─ Deadline to resubmit (e.g., 10 business days)
  │     └─ Link to dashboard to upload replacements
  │
  ├─ Application status: "rejected_documents" (applicant can resubmit)
  └─ Audit log: Record which RSO member rejected documents

Applicant resubmits rejected documents → Return to STEP 5
```

**Important Note:** RSO members must have accounts in the Administrators table (System Backend sheet) with role="rso" and password set. See **CLAUDE_RSO_Portal_Implementation.md** for complete RSO portal implementation details.

### STEP 8: Applicant Submits Payment Proof

```
Portal.submitPaymentProof(application_id, proof_file)
  → handlePortalApi("submit_payment_proof", params)

Payment proof file uploaded to Payments sheet (Payment Tracking spreadsheet)
  └─ Create Payment record:
     ├─ payment_id, household_id, amount_due (based on membership_type)
     ├─ payment_method (selected by applicant)
     ├─ proof_of_payment (file path)
     ├─ status = "submitted"
     ├─ submitted_by_individual_id, submission_timestamp = NOW
     ├─ verified_by = NULL, verification_timestamp = NULL
     └─ notes = "Application payment verification pending"

Update Application: payment_status = "submitted", payment_submission_timestamp = NOW

Email treasurer:
  └─ Email template: "Payment Proof Submitted - Needs Verification"
     ├─ Applicant name, household_id
     ├─ Membership type & dues amount
     ├─ Payment proof download link
     ├─ Link to admin portal to verify & activate
     └─ Verification deadline: NOW + 2 business days

Email applicant:
  └─ Email template: "Payment Received - Verifying"
     ├─ Confirmation of payment proof received
     ├─ Timeline: "Treasurer will verify within 2 business days"
     └─ Link to dashboard to check status
```

### STEP 9: Treasurer Verifies Payment & Activates Membership

```
Admin.html showPage('payments') displays pending payment verifications
  └─ Treasurer clicks payment → viewPaymentDetails(payment_id)

Treasurer sees:
  ├─ Applicant info (name, email, household_id)
  ├─ Membership type & dues amount
  ├─ Payment proof (file download, amount visible if receipt)
  └─ Actions: [Verify & Activate] [Reject] [Request Clarification]

VERIFY & ACTIVATE:
  ├─ Admin.verifyPaymentAndActivate(payment_id)
  ├─ Update Payment:
  │  ├─ status = "verified"
  │  ├─ verified_by = [TREASURER_NAME]
  │  └─ verification_timestamp = NOW
  │
  ├─ Update Application:
  │  ├─ payment_status = "verified"
  │  ├─ payment_verified_timestamp = NOW
  │  ├─ status = "activated"
  │  └─ final_approval_timestamp = NOW
  │
  ├─ Update Household:
  │  ├─ active = TRUE
  │  ├─ membership_expiration_date = next July 31
  │  └─ membership_start_date = TODAY
  │
  ├─ Update all Individuals in household:
  │  ├─ active = TRUE
  │  ├─ voting_eligible = TRUE (for primary & spouse if applicable)
  │  └─ Unlock portal features (reservations, card, etc.)
  │
  ├─ Transfer approved photos to Cloud Storage:
  │  ├─ gs://gea-member-data/{household_id}/{individual_id}/photo.jpg
  │  └─ Update File Submissions:
  │     ├─ cloud_storage_path = [GCS_PATH]
  │     └─ is_current = TRUE
  │
  ├─ Email applicant:
  │  └─ Email template: "Welcome to GEA! Membership Activated"
  │     ├─ Congratulations
  │     ├─ Membership type, household_id, expiration date
  │     ├─ Unlock message: "You can now book facilities, access all portal features"
  │     ├─ Next steps: Update profile, book tennis court, etc.
  │     └─ Links to portal sections
  │
  ├─ Email board:
  │  └─ Email template: "New Member Activated"
  │     ├─ Applicant name, household_id, membership_type
  │     ├─ Activation timestamp
  │     └─ Welcome message sent to applicant
  │
  └─ Audit log: Record activation

REJECT PAYMENT:
  ├─ Admin.rejectPayment(payment_id, rejection_reason)
  ├─ Update Payment:
  │  ├─ status = "rejected"
  │  ├─ rejection_reason = [REASON]
  │  └─ rejection_timestamp = NOW
  │
  ├─ Email applicant:
  │  └─ Email template: "Payment Not Verified - Action Required"
  │     ├─ Rejection reason
  │     ├─ Instructions to resubmit corrected payment proof
  │     └─ Treasurer contact info
  │
  └─ Application remains in "approved_pending_payment" state

REQUEST CLARIFICATION:
  ├─ Admin.requestPaymentClarification(payment_id, clarification_needed)
  ├─ Email applicant with specific details needed
  └─ Application status: "payment_clarification_needed"
```

### STEP 10: Applicant Portal Reflects Membership Status

```
If membership ACTIVE:
  ├─ Dashboard shows: "Welcome! Your membership is active through July 31, 2025"
  ├─ Unlock all portal features:
  │  ├─ Reservations tab (book facilities)
  │  ├─ Profile tab (edit info, upload photos)
  │  ├─ Membership Card tab (digital card with photo)
  │  └─ Full household member list
  │
  └─ Application dashboard archived (hidden, but available in history)

If membership PENDING:
  ├─ Dashboard shows: "Your application is [current stage]"
  ├─ Highlight next steps: "Documents needed", "Awaiting board approval", etc.
  └─ Restrict features: No reservations, limited profile access

If membership DENIED:
  ├─ Account remains active (read-only)
  ├─ Message: "Your application was not approved. Please contact the board."
  └─ No portal access to reservations or other member features
```

### STEP 11: Membership Renewal (Nightly Task)

```
NotificationService.runNightlyTasks() runs daily at 2:00 AM GMT+2
  ├─ Check: Current date is within 30 days before membership_expiration_date?
  │  ├─ 30-day warning: Send email "Your membership expires in 30 days"
  │  ├─ 7-day warning: Send email "Your membership expires in 7 days"
  │  └─ After July 31: Set household active = FALSE, individual active = FALSE
  │
  └─ Renewal process: [TBD - Out of scope for initial application, but noted for future]
```

---

## Membership Categories & Filtering

### Six Categories (Mutually Exclusive)

| Category | Level Type | Individual Fee | Family Fee | Sponsor Required | Full Year | Temp Only |
|----------|-----------|-----------------|------------|------------------|-----------|-----------|
| **Full** | Full | $50 USD | $100 USD | ✗ No | ✓ Yes | ✓ Can use |
| **Associate** | Full | $50 USD | $100 USD | ✓ Yes (Full member) | ✓ Yes | ✗ No |
| **Affiliate** | Full | $50 USD | $100 USD | ✓ Yes (Full member) | ✓ Yes | ✗ No |
| **Diplomatic** | Full | $75 USD | $150 USD | ✓ Yes (Full member) | ✓ Yes | ✗ No |
| **Community** | Full | $75 USD | $150 USD | ✓ Yes (Full member) | ✓ Yes | ✗ No |
| **Temporary** | Temporary | $20 USD | N/A | ✗ No | ✗ No | ✓ Only (max 6mo) |

### Category Eligibility Questionnaire (Sequential)

Each applicant answers a series of yes/no questions and is assigned exactly one category. See [MEMBERSHIP_ELIGIBILITY_FLOW.md](../reference/MEMBERSHIP_ELIGIBILITY_FLOW.md) for complete flowchart.

**Question 1:** Are you a U.S. Direct-Hire employee of the United States Government?
- YES → Continue to Question 1b
- NO → Continue to Question 2

**Question 1b** (if Q1=YES): Are you in Botswana on temporary duty or as an official visitor?
- YES → **TEMPORARY MEMBERSHIP** ✓ (6-month maximum)
- NO → **FULL MEMBERSHIP** ✓

**Question 2** (if Q1=NO): Are you a direct employee of the U.S. Embassy (recruited from OUTSIDE Botswana) OR a U.S. citizen employed by a USG-funded contractor?
- YES → **ASSOCIATE MEMBERSHIP** ✓
- NO → Continue to Question 3

**Question 3** (if Q2=NO): Are you a direct employee of the U.S. Embassy (recruited IN Botswana, i.e., local hire)?
- YES → **AFFILIATE MEMBERSHIP** ✓
- NO → Continue to Question 4

**Question 4** (if Q3=NO): Are you a registered diplomat of another diplomatic or international-organization mission in Botswana?
- YES → **DIPLOMATIC MEMBERSHIP** ✓
- NO → **COMMUNITY MEMBERSHIP** ✓

### Sponsorship Verification

```
Sponsor must be active, paid Full member (full_indiv or full_family)
Sponsor verified by board via email confirmation or member directory lookup
Non-Full categories cannot sponsor:
  └─ Associate/Affiliate/Diplomatic/Community can ONLY be sponsored by Full
Temporary members do NOT require sponsor
```

---

## Rejection Reasons & Handling

### Valid Rejection Reasons (Board Level)

- "No (willing) sponsor" — Sponsor not found, declined, or ineligible
- "Incomplete application" — Missing required information
- "Invalid sponsor" — Sponsor not verified as Full member or not active
- "Background concern" — Specific concern flagged during review
- "Ineligible category" — Applicant doesn't meet category eligibility criteria
- "Duplicate application" — Applicant already member or application pending
- [Additional reasons as needed]

### Post-Rejection

```
Applicant notified via email with specific reason
Account remains disabled (active = FALSE)
Email indicates: "You cannot reapply on this email address without board approval"
Applicant can contact board to discuss or appeal [appeal process TBD]
If applicant wants to reapply: Must contact board directly
Board reviews appeal request and can approve reapplication if conditions change
```

---

## Phase 1 Implementation Status — ✅ ALL RESOLVED

### 10 TBD Items (Phase 1) — Resolved

1. ✅ **Employment Information Fields** — Job title (all), Posting date (Full/Associate/Diplomatic/Temporary), Departure date (same categories), NOT department or employment status
2. ✅ **Document Requirements by Category** — Photo: 600x600–1200x1200px, 54KB–10MB; Passport/Omang: Diplomatic for Diplomatic members; Pro-rated docs per category in spec
3. ✅ **Household Staff Details** — Name, DOB, Omang number + expiry, phone (required), email (optional), employment start/end dates
4. ✅ **Family Member Fields** — Age threshold: 17 years old (not 16); at/above 17 = adult with voting rights
5. ✅ **Payment Amounts Confirmation** — Individual: $50 USD; Family: $100 USD (Full/Associate/Affiliate); +$25 for Diplomatic/Community; Temporary $20/month capped 6 months
6. ✅ **Exchange Rate Mechanism** — Daily update from exchangerate-api.com; Sunday rate applied weekly; both USD and BWP displayed
7. ✅ **Sponsorship Verification** — Board manually verifies sponsor in directory, checks Full member status, records verification in application record
8. ✅ **Rejection Appeal Process** — NOT APPLICABLE per GEA by-laws; no formal appeal mechanism exists; applicant may reapply with corrected info
9. ✅ **Payment Verification Deadline** — 2 business days confirmed
10. ✅ **Temporary Member Renewal** — Same application process; new submission with different email IF previous application expired or rejected

### Implementation Complete

- Application creates new household + individuals (confirmed)
- Two-stage approval: Board → RSO (documents only) — confirmed
- 8-step lifecycle implemented with actual code
- 13 email templates created (tpl_040-tpl_052)
- ApplicationService.js module created (~1,200 lines)
- Portal.html application form + applicant dashboard implemented
- Admin.html application management page implemented
- All code deployed and tested

---

## Future Features / Pending Implementation

### Post-Membership Family & Staff Member Addition

**Requirement:** Currently, family members and household staff may only be added during the initial membership application. Once membership is active, there is no approval process for adding additional family members or staff members.

**TODO:** Create an approval workflow that allows:
1. **Member Request:** Active member requests to add a family member or household staff
2. **Board Approval:** Board reviews and approves/denies addition request
3. **Document Submission:** If approved, member uploads required documents for new individual(s)
4. **RSO Review:** Security review of new documents (if applicable)
5. **Activation:** New individuals activated in member's household
6. **Notification:** Member notified of approval/denial status

**Scope:** This feature requires:
- New database table: "Family Member/Staff Addition Requests" (in Member Directory)
- New request form: In Portal.html member section
- New approval workflow: In Admin.html with similar two-stage process (Board → RSO)
- New email templates: Request confirmation, approval/denial notifications
- Updates to existing document upload workflow to support post-membership submissions

**Priority:** Phase 2 (after core membership activation is stable)

---

## Related Documentation

- **GEA Membership Policy** — Policy requirements and eligibility overview
- **MEMBERSHIP_ELIGIBILITY_FLOW.md** — Complete decision tree questionnaire (docs/reference/)
- **MEMBERSHIP_CATEGORIES_MATRIX.md** — Category reference table (docs/reference/)
- **GEA_System_Schema.md** — Complete database schema
- **File Submission Workflow** — Document approval (2-tier: RSO → GEA Admin)
- **Email Templates** — All application email templates
- **Code.js** — Application submission handler
- **Portal.html** — Application form & dashboard
- **Admin.html** — Board application review

---

**Last Updated:** March 6, 2026
**Status:** ✅ Complete (Phase 1 all 10 TBD items resolved; full end-to-end implementation deployed)
**Implementation Artifacts:**
- ApplicationService.js (~1,200 lines) — Complete workflow service
- Config.js (+55 lines) — Status + audit constants
- AuthService.js (+35 lines) — Applicant login support
- Code.js (+250 lines) — 9 new API routes
- Portal.html (+700 lines) — 6-step application form + applicant portal
- Admin.html (+400 lines) — Application management page
- EMAIL_TEMPLATES_REVISED.md — 13 templates (tpl_040-tpl_052)
- IMPLEMENTATION_COMPLETION_REPORT_MARCH_2026.md — Comprehensive report
**Source:** IMPLEMENTATION_TODO_CHECKLIST.md Phase 1 resolutions + March 2026 implementation session
