# Implementation TODO Checklist - UPDATED

**Purpose:** Comprehensive inventory of all outstanding items (TBDs) from the 9 implementation guides. Board must specify these items before developers can implement the system.

**Last Updated:** March 5, 2026 (Raney review session — Board approval to follow)
**Status:** Phase 1 items resolved; ready for developer implementation

---

## Phase 1: High-Priority TBDs (Blocking Implementation) — NOW RESOLVED ✅

### **CLAUDE_Membership_Implementation.md** (10 items — ALL RESOLVED)

#### Application Form & Data Structure ✅

- [x] **Employment Information Fields** — RESOLVED
  - [x] Job title — YES, capture for all applicants
  - [x] Department — NO, do not capture
  - [x] Posting date — YES, capture for Full/Associate/Diplomatic/Temporary members
    - NOT for Affiliate (locally recruited staff)
    - NOT for Community/Guest (no employment requirement)
  - [x] Employment status (full-time, contract, etc.) — NO (implicit in membership category)
  - [x] Sponsor company name — NO (sponsors are Full members at U.S. Embassy)
  - [x] Anticipated departure date — YES, capture for Full/Associate/Diplomatic/Temporary
    - Used to calculate Temporary member dues: $20/month for actual duration in-country (up to 6 months)

- [x] **Document Requirements by Category** — RESOLVED
  - [x] Photo specifications (not strict, provide suggested specs):
    - Format: JPEG or PNG
    - Dimensions: 600x600 to 1200x1200 pixels (suggested minimum/maximum)
    - File size: 54KB–10MB
    - Quality requirement: Clear, recognizable face photo (white background NOT required)
  
  - [x] Passport requirements by membership category:
    - **Diplomatic applicants:** Diplomatic passport REQUIRED
    - **Full members:** U.S. citizens only (Diplomatic passport preferred; regular U.S. passport acceptable)
    - **Associate members:** U.S. citizens (Diplomatic passport preferred) OR non-U.S. citizens with regular passport or Omang
    - **Temporary members:** U.S. citizens only (Diplomatic passport preferred; regular U.S. passport acceptable)
    - **Affiliate members:** Omang or regular passport acceptable
    - **Community/Guest members:** Omang or regular passport acceptable
  
  - [x] Passport data to capture:
    - Passport type (Diplomatic vs. Regular) — system MUST distinguish between these
    - Passport number
    - Issuance date
    - Expiration date
    - Issuing country
    - Validation rule: If membership category = Diplomatic, then passport_type MUST = "Diplomatic"

- [x] **Household Staff Details** — RESOLVED
  - [x] Personal information:
    - Name
    - Date of birth
  - [x] Omang information:
    - Omang number
    - Omang expiration date (if applicable; field may be nullable)
    - Omang scan/photo
  - [x] Contact information:
    - Phone (REQUIRED)
    - Email (OPTIONAL)
  - [x] Employment tracking:
    - Employment start date
    - Employment end date (for deactivation; old record remains in system for audit trail)
  - [x] NO role field — Staff can perform any role policy allows (nanny, driver, housekeeper, etc. not captured)

- [x] **Family Member Fields** — RESOLVED
  - [x] Age threshold definition: **17 years old** (not 16)
    - Youth members: Under 17 years old (NO voting rights, NO board eligibility)
    - Adult members: 17 years old and above (voting rights, board eligibility)
    - Age transition occurs ON the 17th birthday
  - [x] Fields to capture per family member:
    - Name
    - Relationship (spouse, child, etc.)
    - Date of birth
    - Email (OPTIONAL)
    - Phone (OPTIONAL)
  - [x] Spouse employment info — NO, do not require
  - [x] Children names — First and last name sufficient (full legal name NOT required)

#### Application Process Workflow ✅

- [x] **Complete Application & Approval Workflow** — RESOLVED
  
  **Step 1: Applicant completes application**
  - Membership category selection (filters which fields are required)
  - Personal details (creates Households + primary Individuals entry)
  - Optional: Add family members (additional Individuals entries)
  - Optional: Add household staff (additional Individuals entries)
  - BEFORE submission: Applicant can edit any details
  - Submit application

  **Step 2: System creates applicant account & opens applicant portal**
  - Create member portal account for applicant (accessible immediately)
  - Applicant portal provides interface to upload documents
  - No email links needed; all document uploads handled via applicant portal UI
  - Email sent to applicant with: "Your account is ready. Log in to your applicant portal to upload documents."

  **Step 3: Applicant portal features**
  - Current application status
  - List of family members & staff members (with ability to add more)
  - Ability to add documents for each person directly from portal
  - List of all submitted documents with individual approval statuses
  - Document checklist (shows required docs for their category + status of each)
  - "I have uploaded all documents" button
  - Edit application details (ALLOWED until approval process starts; then LOCKED)
  - Contact link: board@geabotswana.org

  **Step 3b: Admin portal features (Board use) — Community/Guest sponsor verification & Board approval**
  - Admin page: "Record Sponsor Verification & Board Decision"
  - Pre-populated fields: Applicant name, Named sponsor name (from application)
  - Board member fills in: Sponsor name (as appears in directory)
  - **Checkbox 1:** "I verify the stated sponsor's approval" (Board has confirmed sponsor is Full member and willing)
  - **Checkbox 2 (approval path):** "I verify the Board's approval of the application" → Application continues to RSO review
  - **Checkbox 2 (rejection path):** "I verify the Board's rejection of the application" + Reason field → Application rejected, loops back to applicant
  - Approval date, Board member name (who recorded)
  - Optional notes
  - Submit → Application continues to RSO (if approved) or rejected (if rejected)
  - Creates audit trail of sponsor verification and Board approval/rejection decision

  **Step 4: Applicant uploads documents**
  - Applicant uses email links or portal UI to upload document scans
  - For each document, fill in: doc_type, doc_number, full name, issuance date, expiration date, issuing country (as applicable)
  - System pre-populates individual_id and other foreign keys (no manual entry needed)
  - All documents tracked with individual approval status

  **Step 5: Applicant confirms "all documents uploaded"**
  - Applicant reviews list of submitted documents
  - Clicks "I have uploaded all documents" button
  - Confirms on resulting page
  - Application is now LOCKED (no further edits allowed)
  - Triggers approval workflow

  **Step 6: Board initial review & Community/Guest sponsor verification**
  - Any Board member can review application
  - **For Community/Guest applicants ONLY:**
    - Board member verifies sponsor (free-form sponsor name field submitted by applicant)
    - Is named sponsor a Full member?
    - If YES → Board member uses admin portal to record sponsor verification & Board decision:
      - Pre-populated: Applicant name, Named sponsor name
      - Board member confirms: Sponsor name (as appears in directory)
      - Checkboxes:
        - "I verify the stated sponsor's approval" (required)
        - "I verify the Board's approval of the application" → Application continues to RSO review
        - OR "I verify the Board's rejection of the application" + Reason field → Application rejected, loops back to applicant
      - Record: Approval/rejection date, Board member name, Optional notes
      - Submit → Application continues to RSO (if approved) or rejected (if rejected)
    - If NO → Board rejects with public reason: "Named sponsor [Name] is not a GEA Full member. Please reapply with a valid Full member sponsor. (Or, encourage [Name] to join GEA as a Full member!)"
      - Application loops back to applicant to resubmit with different sponsor name
  - **For all other membership categories (non-Community/Guest):**
    - Board member approves application as "ready to proceed" (OR rejects)
    - If APPROVED → goes to RSO review
    - If REJECTED → [Define rejection process]

  **Step 7: RSO document review**
  - RSO reviews and approves/disapproves EACH DOCUMENT INDIVIDUALLY
  - Creates individual approval record for each document
  - If document APPROVED → approval entry created
  - If document DISAPPROVED → RSO provides private rejection reason (not shown to applicant)
  - After reviewing all documents:
    - If ALL DOCUMENTS APPROVED → RSO approves full application → goes to Board final approval
    - If ANY DOCUMENT DISAPPROVED → Send email to applicant + Board with:
      - Public rejection reason (RSO provides private reason; Board converts to diplomatic public reason)
      - Opportunity to resubmit
      - Resubmitted documents go DIRECTLY TO RSO (skip Board re-review)

  **Step 8: RSO application review**
  - RSO approves or disapproves the complete application
  - If APPROVED → goes to Board final approval
  - If DISAPPROVED → Send email to applicant + Board with:
    - Public rejection reason
    - Opportunity to resubmit
    - Resubmitted application starts over at Step 6 (Board initial review)

  **Step 9: Board final approval**
  - Any Board member can review
  - Board member approves application (OR rejects)
  - Board provides public rejection reason (based on RSO's private reason if applicable)
  - If APPROVED → mark application as APPROVED + initiate payment verification process
  - If REJECTED → [Define rejection process]

  **Rejection Handling: Two-Tier Reason System**
  - RSO provides: PRIVATE rejection reason (honest, internal feedback)
  - Board provides: PUBLIC rejection reason (diplomatic version shown to applicant)
  - Applicant receives email with PUBLIC reason only
  - Applicant sees PUBLIC reason on portal
  - Private reason visible only to RSO/Board in system

- [x] **Payment Verification Process** — RESOLVED
  - [x] Payment instructions provided to applicant
  - [x] Payment reference format: `[Last_Name]_[Membership Year YY-YY]`
    - Example: `RANEY_25-26`
    - System generates exact reference from applicant data
    - Display prominently (not as suggestion, but as REQUIRED reference)
  - [x] Applicant submits proof of payment (screenshot or PDF format acceptable)
  - [x] Payment status workflow:
    - Not Started → Submitted → Verified (or Rejected) → Complete
  - [x] "I have made payment" button: Triggers automatic email to Treasurer
  - [x] Payment section on applicant portal:
    - Payment instructions
    - Ability to submit proof of payment
    - "I have made payment" button
    - Payment status display

#### Policies & Timelines — ALL RESOLVED

- [x] **Payment Verification Deadline** — RESOLVED
  - Confirm: 2 business days for Treasurer verification
  - [Note: To be confirmed with Treasurer workflow]

- [x] **Rejection Appeal Process** — NOT APPLICABLE
  - GEA By-Laws do not provide for appeals process
  - Applicant may reapply with corrected/different information, but no formal appeal mechanism exists

- [x] **Temporary Member Renewal** — RESOLVED
  - Temporary members submit new application for renewal
  - Different workflow not needed; same application process

---

## Phase 2: Medium-Priority TBDs — MOSTLY RESOLVED ✅

These are important for completeness but don't block core implementation.

### **CLAUDE_Deployment.md** (1 item) ✅

- [x] **Production Deployment ID** — RESOLVED
  - Deployment ID: `AKfycbw7DG2PpLUK9zrAQt9IVF35eQM7U-C3HUFyZIoQo7ChGB10xK5NuJRdUJpVrBjDwuAQ`

### **CLAUDE_DisasterRecovery.md** (4 items) ✅

- [x] **RTO Target** — RESOLVED
  - Recovery Time Objective: **24 hours** (1 business day acceptable downtime)
  - GEA can afford to be unavailable for up to 1 day

- [x] **RPO Target** — RESOLVED
  - Recovery Point Objective: **24 hours** (1 day of data loss acceptable)
  - Daily automated backups sufficient for GEA's needs

- [x] **Backup Storage Location** — RESOLVED
  - Location: Google Cloud Storage (gea-public-assets bucket or dedicated backup bucket)
  - No physical media needed — use Google Cloud infrastructure
  - Automated daily exports of critical sheets: Member Directory, Reservations, Payments
  - Rolling 30-day retention (delete backups older than 30 days to save storage costs)
  - Access: GEA Cloud Storage project admins

- [x] **Backup Encryption Method** — RESOLVED
  - Method: Google Cloud Storage encryption at rest (automatic, handled by Google)
  - No additional encryption layer needed
  - Passwords/sensitive data already encrypted in Google Workspace
  - Trust Google's infrastructure security (appropriate for GEA's size and risk profile)

### **CLAUDE_Security.md** (3 items) — PARTIALLY RESOLVED

- [x] **Disaster Recovery RTO** — RESOLVED: 24 hours (same as RTO Target above)

- [x] **Disaster Recovery RPO** — RESOLVED: 24 hours (same as RPO Target above)

- [ ] **Disaster Recovery Runbook** — DEFERRED TO IMPLEMENTATION
  - To be created by Claude Code when Phase 2 Disaster Recovery system is implemented
  - Will include: backup restoration procedures, Google Drive version history restoration, GitHub code deployment
  - Will be concrete with real file paths and commands

---

## Phase 3: Lower-Priority TBDs

These are implementation details for Phase 3 guides (60% & 50% ready). Less critical but needed for full implementation.

### **CLAUDE_Google_APIs_Integration.md** (15+ items) — PARTIALLY RESOLVED ✅

#### File Handling ✅

- [x] **File Upload Handler (Google Drive)** — RESOLVED
  - Use Google Drive for member document storage
  - Upload documents (passports, omang, photos, etc.) to Drive
  - Parameters: file blob, household_id, individual_id, document_type
  - Returns: file ID for database storage
  - Error handling: Quota exceeded, permission denied, file too large

- [x] **File Download Handler (Google Drive)** — RESOLVED
  - Download documents from Drive for RSO review
  - Support temporary access links for RSO document review (expires after approval/rejection)
  - Parameters: file ID
  - Returns: file blob
  - Error handling: File not found, access denied, expired link

- [x] **Image Proxy Authentication** — RESOLVED
  - Dual photo strategy:
    - **Drive photos**: Used in member & admin portals (serve via Drive, zero egress cost)
    - **Cloud Storage photos**: Used for guard/app display (serve via Cloud, accept egress costs)
  - Access control: Only GEA staff and photo owner can view via Drive; Cloud photos public for approved members
  - Authentication: Member login for Drive photos; public URL for Cloud photos

#### Calendar Integration ✅

- [x] **Event Creation Handler** — RESOLVED
  - Create calendar event on reservation booking (per Reservations Process Spec Part 1-2)
  - Title format: `[FACILITY_CODE] - [HOUSEHOLD_NAME]`
  - Status tag in description: `[TENTATIVE]`, `[APPROVED]`, `[DENIED]`, `[CANCELLED]`, `[WAITLISTED]`
  - Attendees: Requesting member + selected household members/invitees (optional; don't flood large families)
  - Color: Facility-based (TC/BC, Leobo, Whole Facility each have distinct color)

- [x] **Event Update Handler** — RESOLVED
  - Update event status when approval changes (Pending Board → Approved, etc.)
  - Update attendee list if member adds/removes household members
  - Update event title/description with new status
  - No re-approval needed for attendee-only changes; full re-approval for time/date/facility changes

- [x] **Event Deletion Handler** — RESOLVED
  - Mark event status as `[CANCELLED]` in description (do not delete immediately)
  - Keep event for audit trail visibility
  - Check for waitlisted events to promote if this was blocking booking
  - Notify RSO if guest list was submitted
  - Return calendar event ID to Reservations sheet for historical reference

#### Photo Storage ✅

- [x] **Dual Photo Storage Strategy** — RESOLVED
  - **Drive Photos**: Member & admin portal display (zero egress cost)
    - Path: `gea-member-data/{household_id}/{individual_id}/photo.jpg` (Drive folder)
    - Access: Member login + GEA staff only
    - Purpose: Display in member profile, admin review
  - **Cloud Storage Photos**: Guard/app display & long-term archive (accept Cloud egress)
    - Path: `gs://gea-member-data/{household_id}/{individual_id}/photo.jpg` (Cloud Storage)
    - Access: Public read for approved members (digital card use)
    - Purpose: Guard verification, membership card display, archive
  - Workflow: Approved photo uploaded to Drive; synced to Cloud Storage for card/guard use

- [x] **Photo Expiration & Renewal Policy** — RESOLVED
  - Members 18+: Expire every 3 years
  - Members under 18: Expire annually (on birthday or submission anniversary)
  - Expired photo workflow:
    - Hold expired photo until:
      - New approved photo uploaded & replaces it, OR
      - 2 months after membership expiration (then can be deleted)
    - Admin portal: "Expired Photos" section for review & confirmation of deletion
    - Active membership + expired photo: Admin can delete only if replacement photo approved
    - Expired membership: Admin can delete at will
  - Cloud Storage photos: Delete when Drive photo deleted
  - Audit trail: Log all photo deletions

#### Cloud Storage Access & Sharing ✅

- [x] **Cloud Storage Access Control** — RESOLVED
  - IAM roles: GEA account (owner), service account (read-only)
  - Approved photos: Public readable (for card display)
  - Rejected/pending photos: Private (GEA staff only)
  - Temporary sharing: One-time links for RSO review (auto-expire after approval/rejection)
  - Lifecycle policy: Delete old photos after member deletion or photo expiration
  - Cost optimization: Use Cloud Storage for public/shared photos only; Drive for private

#### APIs & Quotas ✅

- [x] **Cloud Storage Quotas** — RESOLVED
  - Internet Egress Bandwidth: 200 Gb/second per region (GEA will never approach this)
  - Dualregion Egress: 200 Gb/second per region (GEA will never approach this)
  - Storage per bucket: Up to 18 TiB per region (GEA photo storage negligible)
  - Verdict: No quota concerns for GEA use case; no monitoring needed

- [x] **Drive API Quotas** — RESOLVED
  - No practical quotas found for Drive API calls
  - GEA usage (document uploads/downloads): Negligible
  - Verdict: No quota concerns

- [x] **Calendar API Quotas** — RESOLVED
  - No practical quotas found for Calendar API calls
  - GEA usage (reservation events): Negligible
  - Verdict: No quota concerns

#### Caching & Performance ✅

- [x] **Quota Monitoring Strategy** — NOT NEEDED
  - Decision: GEA's API usage is negligible (few uploads, daily exchange rate, calendar events)
  - Will never approach quota limits
  - Not worth implementation complexity

- [x] **Distributed Caching Implementation** — NOT NEEDED
  - Decision: GEA's member count is small; reading from sheets each time is sufficient
  - Caching adds complexity without real performance benefit at this scale
  - Portal response times acceptable without caching

#### Error Handling ✅

- [x] **Robust Error Handling** — RESOLVED
  - When API calls fail (exchange rate fetch, file upload, Drive access):
    - Retry up to 3 times with delays between attempts (1s, 2s, 4s exponential backoff)
    - If still fails after retries, log error to Audit_Logs with full context
    - Send email notification to Treasurer with error details
  - Specific operations needing error handling:
    - Daily exchange rate fetch from exchangerate-api.com
    - File uploads to Google Drive
    - Calendar event creation/updates
    - Google Sheets read/write operations
  - Implementation: Use try-catch blocks, exponential backoff (1s, 2s, 4s), comprehensive logging

#### Holiday Calendar

- [ ] **Holiday Calendar Integration** — TBD
  - Load US Federal holidays?
  - Load Botswana public holidays?
  - Update frequency? (Annually before July 31?)
  - Store in Holiday Calendar sheet?

### **CLAUDE_DisasterRecovery.md** (8 items) ✅

#### Infrastructure ✅

- [x] **Automated Backup Setup** — RESOLVED
  - Target: Google Sheets data only (Member Directory, Reservations, Payments, Guest Lists)
  - Frequency: Daily at 2:00 AM Botswana time (before 3 AM exchange rate update)
  - Method: Apps Script time-based trigger exports sheets to Cloud Storage as .xlsx files
  - File naming: `GEA_MemberDirectory_[YYYY-MM-DD].xlsx`, `GEA_Reservations_[YYYY-MM-DD].xlsx`, etc.
  - Retention: Rolling 30-day retention (older backups auto-deleted)
  - Note: GitHub code is already version-controlled; Cloud Storage images have Google redundancy
  - No need to back up: HTML/code (git), images (Cloud Storage redundancy)

- [x] **Health Check Monitoring** — RESOLVED
  - Method: Automated Apps Script function tests reading from Member Directory sheet
  - Frequency: Daily at 4:00 AM Botswana time (after backup completes)
  - What constitutes "down": Sheet read fails or returns error
  - Alert: If health check fails 3+ times in 1 hour, email Treasurer + board@geabotswana.org
  - Alternative: Monthly manual check (Treasurer clicks through each portal, verifies load)
  - Note: No traditional GET /health endpoint needed (portals are Apps Script web apps, not servers)

#### Testing & Validation ✅

- [x] **Quarterly Restoration Testing** — RESOLVED
  - Schedule: Last week of March, June, September, December
  - Who: Treasurer + one Board member
  - What: Restore one backup file from Cloud Storage to temp test spreadsheet
  - Validation: Verify data integrity (spot-check 10 rows against current production)
  - Pass/fail criteria: Data matches current production exactly
  - Time allocation: 30 minutes
  - Documentation: Brief test report filed in Financial Records folder

- [x] **Annual Full System Test** — RESOLVED
  - Schedule: November (Q4, before year-end)
  - What to test:
    1. Restore all backup sheets from Cloud Storage into test spreadsheet
    2. Test accessing portals (verify Apps Script web app loads and responds)
    3. Verify GitHub repo has all current code committed
    4. Verify Cloud Storage images are accessible
  - Time allocation: 2-3 hours
  - Success metrics: All sheets restore correctly, portals load, GitHub current, images accessible
  - Note: No code redeployment needed (Apps Script live)

#### Incident Response ✅

- [x] **Incident Response Procedures** — RESOLVED
  - Detection: Treasurer or Board member discovers issue
  - Immediate notification: Email Treasurer + board@geabotswana.org with details
  - Troubleshooting by type:
    - **Google Sheets connectivity issue**: Check Google Workspace status page
    - **Apps Script error**: Check Apps Script execution logs for error details
    - **Cloud Storage image access**: Check Cloud Storage folder permissions
    - **GitHub Pages down**: Extremely rare; check GitHub status page
  - Escalation: If issue unresolved within 1 hour, contact Claude Code/developer
  - Communication template: Email to Board with situation + status + ETA for resolution

- [x] **Postmortem Process** — RESOLVED
  - Trigger: After any incident resolved
  - Documentation: Treasurer documents within 24 hours
    - What failed
    - When detected
    - How fixed
    - Duration of downtime
    - Root cause
    - Prevention for future
  - Review: Board reviews at next monthly meeting
  - Improvement: Update runbook if procedures need adjustment
  - Archive: Store postmortem in Financial Records folder

#### Monitoring & Alerts ✅

- [x] **Monitoring Alerts Setup** — RESOLVED
  - Method: Email alerts only (no Slack or complex systems)
  - Alert triggers:
    - Daily health check fails (Apps Script sheet connectivity)
    - Automated backup fails (Cloud Storage write error)
    - Exchange rate fetch fails (exchangerate-api.com API call)
  - Alert thresholds: Trigger immediately on failure (no threshold needed)
  - Recipients: Treasurer + board@geabotswana.org
  - Escalation: If alert repeats within 1 hour, send escalation email

- [x] **Incident Log Setup** — RESOLVED
  - Storage: Simple Google Sheet in Financial Records folder
  - Columns: Date | Time | Description | Impact | Resolution | Duration (minutes) | Lessons Learned
  - Entries: One row per incident (system down, data error, etc.)
  - Retention: Keep for 3 years (matches financial record retention)
  - Review: Treasurer reviews at end of each quarter to identify patterns

### **CLAUDE_Payments_Implementation.md** (10+ items)

#### Bank & Payment Details ✅

- [x] **GEA Bank Account Details (Absa)** — RESOLVED
  - Bank: Absa (formerly Barclays)
  - Account Name: U.S. Embassy – Gaborone Employee Association
  - Account Number: 1005193
  - Branch: 290267 (Government Enclave Branch)
  - Swift Code: BARCBWGX
  - Currency: Pula (BWP)
  - Reference Format: [LastName]_[MembershipYear YY-YY]
  - Display to applicants: Full account details + instruction to use reference format

- [x] **PayPal Setup** — RESOLVED
  - Payment Link: https://www.paypal.com/ncp/payment/F7A4GEURTGA4L
  - Account Type: Business account
  - Currency: USD only (no BWP conversion)
  - Note: PayPal.me link unavailable; use payment link above
  - Display to applicants: Payment link + USD amount required

- [x] **State Department Federal Credit Union (SDFCU) Account** — RESOLVED
  - Account Name: Gaborone Employee Association
  - Account Number: 1010000268360
  - Routing Number: 256075342
  - Bank Address: SDFCU, 1630 King Street, Alexandria, VA 22314
  - Currency: USD
  - Member2Member (M2M) Code: GEA2025 (for SDFCU members to send payments easily)
  - Display to applicants: Account details + M2M code for SDFCU members

- [x] **Zelle Setup** — RESOLVED
  - Payment Method: Zelle (for members with U.S. bank accounts)
  - Zelle Address: geaboard@gmail.com
  - Currency: USD
  - Use case: Members with U.S. banks (not SDFCU) can send payment via Zelle
  - Display to applicants: Zelle email address for sending payment

#### Exchange Rate Mechanism ✅

- [x] **Exchange Rate Source** — RESOLVED
  - Source: exchangerate-api.com (free public API)
  - Endpoint: `https://api.exchangerate-api.com/v4/latest/USD`
  - API Response: JSON with all currency rates (including BWP)
  - Free tier: 1,500 requests/month (sufficient for daily updates + testing)
  - Currency pair: USD to BWP
  - Parse JSON response in Apps Script, extract BWP rate
  - Store in Financial Records Google Sheet (Rates tab or similar)

- [x] **Exchange Rate Update Schedule** — RESOLVED
  - Frequency: Daily automatic update
  - Time: 3:00 AM Botswana time (UTC+2)
  - Who updates: Automated Apps Script time-based trigger
  - Process:
    1. Apps Script trigger fires daily at 3:00 AM Botswana time
    2. Fetch USD/BWP rate from exchangerate-api.com REST endpoint
    3. Parse JSON response to extract BWP rate
    4. Store rate + timestamp in Financial Records sheet (Rates tab)
    5. Log success/failure to Audit_Logs sheet
  - Error handling: If API fetch fails, log error and notify Treasurer
  - Fallback: Manual update capability (Treasurer can update rate manually if needed)
  - Code location: Utilities.gs or Config.gs (updateExchangeRate function)

- [x] **Exchange Rate Display for Members** — RESOLVED
  - Display: Show both USD amount AND current BWP equivalent
  - Rate used: Sunday rate of the current week (not monthly)
  - Logic: Each Sunday at start of week, capture the USD/BWP rate; use that rate for all member invoices/payments that week
  - Application: When displaying dues to applicant or payment reminder to member, show:
    - "USD $50.00 (approximately BWP [calculated using Sunday rate])"
  - Recalculation: New rate applied each Sunday; previous week's rate no longer used

#### Payment Verification (All Methods) ✅

- [x] **Payment Method Verification for EFT (Absa)** — RESOLVED
  - Method: Treasurer checks Absa online banking
  - Verification: Look up payment in online account (search by reference: [LastName]_[YY-YY])
  - Confirmation: Match amount + reference to member application
  - Update system: Mark payment as verified in Payment_Tracking sheet
  - Timeline: Within 2 business days of member submission

- [x] **Payment Method Verification for PayPal** — RESOLVED
  - Method: Treasurer checks PayPal account online
  - Verification: Look up transaction in PayPal account activity
  - Confirmation: Match amount + member identifier (email or name) to application
  - Update system: Mark payment as verified in Payment_Tracking sheet
  - Timeline: Within 2 business days of member submission

- [x] **Payment Method Verification for SDFCU & Zelle** — RESOLVED
  - Method: Treasurer checks SDFCU online banking
  - Note: Zelle payments deposit directly into SDFCU account
  - Verification: Look up transaction in SDFCU account activity
  - Confirmation: Match amount + reference (or sender ID) to member application
  - Update system: Mark payment as verified in Payment_Tracking sheet
  - Timeline: Within 2 business days of member submission

- [x] **Payment Method Verification for Cash** — RESOLVED
  - Method: Physical receipt-based verification
  - Process: Treasurer writes TWO physical receipts (one for GEA, one for payer)
  - Receipt contents: Member name, amount (BWP), date, reference number, payment method "Cash"
  - Signatures: Both receipts signed by Treasurer AND payer (member)
  - Distribution: GEA keeps one copy, payer keeps one copy
  - Verification: Treasurer retains signed receipt as proof of payment
  - Update system: Mark payment as verified in Payment_Tracking sheet with receipt reference
  - Timeline: Immediate upon payment
  - Storage: File physical receipt in GEA financial records (safe or filing cabinet)

#### Refunds & Handling ✅

- [x] **Overpayment Handling Policy** — RESOLVED
  - Process: Treasurer contacts member to determine how to proceed
  - BWP Currency Consideration: If payment is in BWP and is close to expected USD amount (within reasonable variance), account is considered paid in full
  - No quibbling: Do not pursue member for differences of a few Pula
  - Options to offer member: Credit to next membership year, small refund (if member requests), or donation to GEA
  - Documentation: Record resolution in Payment_Tracking sheet
  - Note: Variance tolerance is at Treasurer's discretion (e.g., +/- 5-10 Pula acceptable)

- [x] **Underpayment Handling** — RESOLVED
  - Process: Treasurer registers the payment amount received
  - Currency Consideration: Apply same "quibble tolerance" (a few Pula variance acceptable)
  - After tolerance applied, if still underpaid: Treasurer requests remaining balance from member
  - Payment Plans: Not offered; membership is NOT active until full amount is paid
  - Notification: Email member with amount paid, balance due, and payment instructions
  - Timeline: Request balance within 2 business days of payment submission
  - Documentation: Record partial payment in Payment_Tracking sheet with balance due amount
  - Membership Status: INACTIVE (suspended) until balance is paid

- [x] **Refund Policy** — RESOLVED
  - Policy: Refunds are NOT standard practice
  - Exception: Will consider refunds only if situation warrants (case-by-case, Treasurer discretion)
  - Board Approval: If refund approved, must be authorized by Treasurer + Board decision
  - Website: Do NOT mention refunds on website or member-facing materials
  - Processing: If refund approved, process via reverse payment to original payment method
  - Documentation: Record refund decision, approval, and processing in Payment_Tracking sheet + Audit_Logs

#### Reporting ✅

- [x] **Monthly Collections Report Format** — RESOLVED
  - Purpose: Treasurer summary of membership dues collected during the month
  - Timing: Generated on the last Monday of each month (ready for Board meeting the following Tuesday)
  - Distribution: Email to board@geabotswana.org
  - Format: Simple table in email or Google Sheets attachment
  - Contents:
    - **Report Header**: "GEA Monthly Collections Report - [Month Year]" (e.g., "February 2026")
    - **Summary Section**:
      - Total members at month start
      - Total members at month end
      - New members joined this month (count)
        - **New Members List** (primary member name only):
          - [Member Name]
          - [Member Name]
          - etc.
      - Members with active membership (paid up)
      - Members with inactive membership (balance due)
    - **Collections Table**:
      - Payment method (Absa, PayPal, SDFCU, Zelle, Cash) | Count | Amount (BWP) | Amount (USD equivalent)
      - **Total Collections (BWP)** | | [Total]
      - **Total Collections (USD equivalent)** | | [Total using Sunday rate]
    - **Outstanding Balance Section**:
      - Members with balance due | Count | Total balance due (USD)
      - Members by balance age: <7 days, 7-30 days, 30-90 days, >90 days overdue
    - **Notes Section**: Any anomalies, issues, or items requiring Board attention
  - Storage: Save report in Financial Records folder with filename "GEA_Collections_[YYYY-MM].xlsx"
  - System automation: Most of this can be auto-generated from Payment_Tracking and Membership sheets

- [x] **Quarterly Projections Format** — NOT NEEDED
  - Decision: No quarterly projections required
  - Rationale: Financial statements provided separately (outside this system)

- [x] **Annual Reconciliation Procedure** — RESOLVED
  - Purpose: Year-end verification that all payments are accounted for
  - Timing: Completed by January 31 of following year (covers calendar year Jan-Dec)
  - External audit: NOT required
  - Financial statements: Handled separately in external Google Sheets system (not part of this implementation)
  - Reconciliation steps:
    1. Pull all Payment_Tracking entries for the calendar year
    2. Cross-reference against bank statements (Absa, SDFCU, PayPal)
    3. Verify: All recorded payments match bank records
    4. Verify: All bank deposits match Payment_Tracking records
    5. Document any discrepancies and resolution
    6. Generate reconciliation summary report
  - Report format: Spreadsheet with three columns (Payment_Tracking | Bank Records | Match?) showing all entries verified
  - Owner: Treasurer
  - Archive: Store final reconciliation report in Financial Records folder with filename "GEA_YearEnd_Reconciliation_[YYYY].xlsx"
  - Board review: Present summary (not full details) to Board at annual meeting

---

## Summary by Priority & Phase

| Phase | Guide | TBD Count | Status |
|-------|-------|-----------|--------|
| **Phase 1** | Membership | 10 | ✅ **ALL RESOLVED** |
| **Phase 2** | Deployment | 1 | ✅ **RESOLVED** |
| **Phase 2** | Disaster Recovery | 4 | ✅ **RESOLVED** |
| **Phase 2** | Security | 3 | ✅ **2 RESOLVED, 1 DEFERRED** |
| **Phase 3** | Google APIs | 15+ | ✅ **ALL RESOLVED** |
| **Phase 3** | Payments | 16 | ✅ **ALL RESOLVED** |
| **Phase 3** | Disaster Recovery (implementation) | 8 | ✅ **ALL RESOLVED** |
| | | **~50 total items** | **PHASE 1-2-3 COMPLETE** |

---

## Recommended Action Plan

### ✅ **Week 1: Phase 1 Critical Items — COMPLETE**
- [x] Board reviewed CLAUDE_Membership_Implementation.md
- [x] Board provided answers to all 10 TBD items
- [x] Guides updated with board decisions
- [x] **DEVELOPERS CAN BEGIN PHASE 1 IMPLEMENTATION**

### ✅ **READY FOR IMPLEMENTATION**
All Phase 1, 2, and 3 TBDs are now fully resolved. Claude Code can begin system implementation immediately with complete clarity on all requirements.

---

## Document References

All TBDs are documented in:
- **docs/implementation/CLAUDE_Membership_Implementation.md** — UPDATED with board decisions
- **docs/implementation/CLAUDE_Payments_Implementation.md** — "Outstanding Items (TBD)" section
- **docs/implementation/CLAUDE_Google_APIs_Integration.md** — "Outstanding Items (TBD)" section
- **docs/implementation/CLAUDE_DisasterRecovery.md** — "TODO: Disaster Recovery Infrastructure" section
- Each guide contains specific TODOs in code blocks and implementation sections

---

**Phase 1 READY FOR DEVELOPER IMPLEMENTATION. Awaiting Phase 2 & 3 board decisions.**
