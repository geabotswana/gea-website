# GEA File Upload Portal — Complete Implementation Specifications

**Document Version:** Final  
**Last Updated:** March 11, 2026  
**Workflow:** Codex (Git PR) → Claude Code (Review tonight)  
**Status:** Google Sheets ✅ completed. Code specs ready for Codex implementation.

This document contains detailed technical specifications for Codex implementation (GitHub PR) and Claude Code review.

---

## PART A: SPREADSHEET SCHEMA UPDATES — ✅ COMPLETED

Michael has completed all Google Sheets updates:

✅ **Configuration Sheet** (GEA System Backend)
- Updated `photo_max_size_mb` from 2 to 5
- Added `employment_verification_optional_at_application`
- Added `employment_verification_requestable_by_admin`
- Added `file_upload_max_document_mb`
- Added `file_upload_accepted_formats_document`

✅ **Email Templates Sheet** (GEA System Backend)
- Added tpl_057: File Submission Confirmation
- Added tpl_058: RSO Document Approval Request
- Added tpl_059: Document Rejected
- Added tpl_060: Employment Verification Requested

✅ **File Submissions Sheet** (GEA Member Directory)
- Added 9 new columns:
  - upload_device_type
  - file_display_name
  - file_size_bytes
  - member_facing_rejection_reason
  - rso_approval_link_token
  - rso_approval_link_sent_date
  - rso_approval_link_expires_at
  - rso_approval_link_clicked
  - rso_approval_link_clicked_date

No further spreadsheet work needed. Codex implementation proceeds with Part B.

---

## PART B: BACKEND DEVELOPMENT

### B1. New File: FileSubmissionService.gs

This service file contains all file upload logic. Use the commenting standards from gea-apps-script SKILL.md.

#### **uploadFileSubmission(params)**

```javascript
/**
 * FUNCTION: uploadFileSubmission
 * PURPOSE: Primary entry point for file uploads. Validates file metadata,
 *          stores in Google Drive, creates File Submissions row,
 *          and triggers RSO approval workflow for ID documents.
 *
 * CALLED BY: _handleFileUpload() in Code.gs
 *
 * HOW IT WORKS:
 * 1. Validate document_type against membership rules (all members: photo + ID)
 * 2. Validate file size and format
 * 3. Move file to appropriate Google Drive folder
 * 4. Create File Submissions row with status="submitted"
 * 5. If ID document: generate RSO approval link, email RSO
 * 6. Send confirmation email to household member
 * 7. Log audit entry
 * 8. Return submission_id
 *
 * CALLED BY: _handleFileUpload() in Code.gs
 *
 * @param {Object} params
 *   .individual_id (Text) FK to Individuals
 *   .document_type (Text) "photo" | "passport" | "omang" | "employment"
 *   .file_blob (Blob) File contents
 *   .file_name (Text) Original filename
 *   .file_size_bytes (Number) Size in bytes
 *   .upload_device_type (Text) "mobile" or "desktop"
 *   .user_email (Text) Uploader email (for audit)
 *
 * @returns {Object}
 *   Success: { ok: true, submission_id: "FSB-2026-00123", message: "..." }
 *   Error:   { ok: false, error: "reason", code: "ERROR_CODE" }
 *
 * VALIDATION RULES:
 * - document_type must be: photo, passport, omang, employment
 * - file_size_bytes <= PHOTO_MAX_SIZE_MB (5 MB) for photos
 * - file_size_bytes <= 10 MB (from Configuration sheet) for documents
 * - file format must match accepted formats
 * - No two "current" submissions of same type per individual
 *
 * EXAMPLE:
 * uploadFileSubmission({
 *   individual_id: "IND-2026-00001",
 *   document_type: "photo",
 *   file_blob: blobFromUpload,
 *   file_name: "Jane_Photo_2026.jpg",
 *   file_size_bytes: 1245670,
 *   upload_device_type: "mobile",
 *   user_email: "jane@example.com"
 * })
 * Returns: { ok: true, submission_id: "FSB-2026-12345", message: "Photo uploaded successfully" }
 */
```

#### **getFileSubmissionStatus(individual_id)**

```javascript
/**
 * FUNCTION: getFileSubmissionStatus
 * PURPOSE: Retrieves current submission status for a single individual.
 *          Used by member portal to display status dashboard.
 *
 * CALLED BY: _handleGetFileStatus() in Code.gs (route handler)
 *
 * @param {Text} individual_id  FK to Individuals (e.g., "IND-2026-00001")
 *
 * @returns {Object}
 * {
 *   individual_id: "IND-2026-00001",
 *   full_name: "Jane Johnson",
 *   date_of_birth: "1985-03-15",
 *   photo: {
 *     status: "approved" | "submitted" | "rejected" | "none",
 *     submission_id: "FSB-2026-00001",
 *     submitted_date: "2026-03-11",
 *     rejection_reason: null,
 *     can_resubmit: true
 *   },
 *   passport: {
 *     status: "verified" | "submitted" | "rso_approved" | "rso_rejected" | "gea_pending" | "gea_rejected" | "none",
 *     submission_id: "FSB-2026-00002",
 *     expiration_date: "2032-06-15",
 *     expiration_warning: "Expires in 4 months",
 *     can_resubmit: true
 *   },
 *   omang: {
 *     status: "verified" | "submitted" | ...,
 *     submission_id: "FSB-2026-00003",
 *     expiration_date: "2028-12-20",
 *     can_resubmit: true
 *   },
 *   employment: {
 *     status: "none" | "submitted" | "approved" | "rejected",
 *     submission_id: "FSB-2026-00004",
 *     can_resubmit: true,
 *     requested_by_admin: false,
 *     request_date: null
 *   },
 *   all_required_complete: false,
 *   household_id: "HSH-2026-00001"
 * }
 */
```

#### **approveFileSubmission(submission_id, user_email)**

```javascript
/**
 * FUNCTION: approveFileSubmission
 * PURPOSE: GEA admin approves a file submission after RSO approval (for documents)
 *          or directly (for photos).
 *
 * CALLED BY: _handleApproveFileSubmission() in Code.gs (board/admin only)
 *
 * HOW IT WORKS:
 * 1. Fetch submission row
 * 2. Validate status is "gea_pending" (docs) or "submitted" (photos)
 * 3. Set status = "approved" (photos) or "verified" (docs)
 * 4. Set gea_reviewed_by, gea_review_date
 * 5. If document_type="photo": call copyApprovedPhotoToCloudStorage()
 * 6. Find previous approved submission, set is_current=FALSE, disabled_date=now
 * 7. Set is_current=TRUE for this submission
 * 8. Update Individuals sheet status columns and current_*_submission_id
 * 9. Send approval email to member
 * 10. Log audit entry
 *
 * @param {Text} submission_id  "FSB-2026-XXXXX"
 * @param {Text} user_email     Admin email (for audit)
 *
 * @returns {Object}
 *   Success: { ok: true, individual_id: "IND-2026-001", document_type: "photo" }
 *   Error:   { ok: false, error: "reason" }
 */
```

#### **rejectFileSubmission(submission_id, rejection_reason, user_email)**

```javascript
/**
 * FUNCTION: rejectFileSubmission
 * PURPOSE: Board or RSO rejects a file submission. Member receives
 *          member-friendly reason and can resubmit.
 *
 * CALLED BY: _handleRejectFileSubmission() in Code.gs (board/RSO/admin only)
 *
 * HOW IT WORKS:
 * 1. Fetch submission row
 * 2. Validate authorization (RSO can only reject at "submitted", board at "gea_pending")
 * 3. Set status = "rso_rejected" or "gea_rejected"
 * 4. Populate member_facing_rejection_reason
 * 5. Set is_current = FALSE
 * 6. Do NOT delete file (retain for audit)
 * 7. Send rejection email with reason + resubmit link
 * 8. Log audit entry
 *
 * @param {Text} submission_id        "FSB-2026-XXXXX"
 * @param {Text} rejection_reason     Member-facing explanation (plain language)
 * @param {Text} user_email           Reviewer email (for audit)
 *
 * @returns {Object}
 *   Success: { ok: true, individual_id: "IND-2026-001" }
 *   Error:   { ok: false, error: "reason" }
 */
```

#### **generateRsoApprovalLink(submission_id)**

```javascript
/**
 * FUNCTION: generateRsoApprovalLink
 * PURPOSE: Creates a secure one-time link for RSO to review and approve/reject
 *          an ID document submission without accessing the full member portal.
 *
 * CALLED BY: uploadFileSubmission() (for passport/omang only)
 *
 * HOW IT WORKS:
 * 1. Fetch submission row
 * 2. Verify document_type is passport or omang (not photos)
 * 3. Generate secure random token (SHA256 hash)
 * 4. Calculate expiry = now + 336 hours (14 days from Config.gs RSO_APPROVAL_LINK_EXPIRY_HOURS)
 * 5. Store: rso_approval_link_token, rso_approval_link_expires_at
 * 6. Build approval link URL: {deployed_web_app_url}?action=rso_approve&token={token}
 * 7. Email link to EMAIL_RSO (rso-notify@geabotswana.org)
 * 8. Update rso_approval_link_sent_date = now
 * 9. Return full link URL
 *
 * @param {Text} submission_id  "FSB-2026-XXXXX"
 *
 * @returns {Object}
 *   Success: { ok: true, link_url: "https://...", expires_at: "2026-03-25" }
 *   Error:   { ok: false, error: "reason" }
 *
 * SECURITY:
 * - Token is SHA256 hash, not reversible
 * - Single-use (becomes invalid after clicked or expired)
 * - Expiry prevents indefinite access
 */
```

#### **handleRsoApprovalLink(token, action, rejection_reason)**

```javascript
/**
 * FUNCTION: handleRsoApprovalLink
 * PURPOSE: Processes RSO's approval or rejection via the one-time link.
 *          Does not require RSO to be logged in to the system.
 *
 * CALLED BY: _handleRsoApprovalLink() route handler
 *            This is a PUBLIC endpoint (no authentication required)
 *
 * HOW IT WORKS:
 * 1. Search File Submissions for matching rso_approval_link_token
 * 2. If not found: return error "Invalid or expired link"
 * 3. If found but expired (now > rso_approval_link_expires_at):
 *    return error "Link has expired. Admin will regenerate."
 * 4. If already clicked (rso_approval_link_clicked = TRUE):
 *    return info "This document was already reviewed on {date}"
 * 5. If action="approve":
 *    - Set status = "rso_approved"
 *    - Set rso_reviewed_by = EMAIL_RSO
 *    - Set rso_review_date = now
 *    - Set rso_approval_link_clicked = TRUE, rso_approval_link_clicked_date = now
 *    - Email GEA admin: "RSO has approved {document} for {household}"
 *    - Log audit entry
 *    - Return success HTML
 * 6. If action="reject":
 *    - Set status = "rso_rejected"
 *    - Set rejection_reason = member_facing text
 *    - Set rso_approval_link_clicked = TRUE
 *    - Email member with rejection reason
 *    - Log audit entry
 *    - Return success HTML
 *
 * @param {Text} token                 Secure token from email link
 * @param {Text} action                "approve" | "reject"
 * @param {Text} rejection_reason      (optional, required if action="reject")
 *
 * @returns {Object}
 *   Success: { ok: true, message: "Document approved/rejected" }
 *   Error:   { ok: false, error: "reason" }
 *
 * NOTES:
 * - This is a one-time-use link; second click returns "already reviewed"
 * - Returns HTML confirmation, not JSON (for browser viewing)
 */
```

#### **copyApprovedPhotoToCloudStorage(submission_id, individual_id)**

```javascript
/**
 * FUNCTION: copyApprovedPhotoToCloudStorage
 * PURPOSE: After photo approval, duplicate from Google Drive to
 *          gea-member-data Cloud Storage bucket for fast portal serving.
 *
 * CALLED BY: approveFileSubmission() when document_type="photo"
 *
 * HOW IT WORKS:
 * 1. Fetch submission row to get file_id (Google Drive ID)
 * 2. Fetch file from Drive using DriveApp.getFileById(file_id)
 * 3. Get household_id from Individuals row
 * 4. Build Cloud Storage path:
 *    gs://gea-member-data/{household_id}/{individual_id}/photo_{submission_id}.jpg
 * 5. Upload blob to Cloud Storage bucket
 *    - Bucket: CLOUD_STORAGE_MEMBER_DATA_BUCKET (from Config.gs)
 *    - Use signed URLs if needed
 * 6. Store cloud_storage_path in File Submissions row
 * 7. Keep original Google Drive file (do not delete)
 * 8. Log upload success with path
 * 9. Return cloud_storage_path
 *
 * @param {Text} submission_id   "FSB-2026-XXXXX"
 * @param {Text} individual_id   "IND-2026-XXXXX"
 *
 * @returns {Object}
 *   Success: { ok: true, cloud_storage_path: "gs://gea-member-data/..." }
 *   Error:   { ok: false, error: "reason" }
 *
 * STORAGE STRATEGY:
 * - Photos: Google Drive (audit) + Cloud Storage (serving)
 * - Documents: Google Drive only (no Cloud Storage egress)
 */
```

#### **getSubmissionHistory(individual_id)**

```javascript
/**
 * FUNCTION: getSubmissionHistory
 * PURPOSE: Returns audit trail of all file submissions for a household member,
 *          including rejected submissions (so member can see what didn't work).
 *
 * CALLED BY: Member portal "Document History" tab (future enhancement)
 *
 * @param {Text} individual_id  "IND-2026-XXXXX"
 *
 * @returns {Array of Objects}
 * [
 *   {
 *     submission_id: "FSB-2026-00001",
 *     document_type: "photo",
 *     status: "approved",
 *     submitted_date: "2026-03-10",
 *     approved_date: "2026-03-11",
 *     file_name: "Jane_Johnson_Photo_2026.jpg",
 *     file_size_mb: 1.2,
 *     rejection_reason: null,
 *     is_current: true
 *   }
 * ]
 *
 * NOTES:
 * - Sorted by submitted_date descending (most recent first)
 * - Includes rejected submissions
 * - is_current indicates which is the active approved version
 */
```

#### **requestEmploymentVerification(household_id, individual_ids, request_reason)**

```javascript
/**
 * FUNCTION: requestEmploymentVerification
 * PURPOSE: Board can manually request employment verification for Associate members
 *          or any member if eligibility cannot be otherwise confirmed.
 *
 * CALLED BY: _handleRequestEmploymentVerification() in Code.gs (board/admin only)
 *
 * HOW IT WORKS:
 * 1. For each individual_id:
 * 2. Check if they already have approved employment submission
 *    If yes, skip
 * 3. Mark employment_verification_requested = TRUE
 * 4. Set employment_verification_request_date = now
 * 5. Send email: "Board has requested employment verification"
 * 6. Log audit entries
 * 7. Return count of members who received request
 *
 * @param {Text} household_id           "HSH-2026-XXXXX"
 * @param {Array of Text} individual_ids ["IND-2026-001", "IND-2026-002"]
 * @param {Text} request_reason         "Cannot verify USG employment" (for member feedback)
 *
 * @returns {Object}
 *   Success: { ok: true, count: 2, message: "Request sent to 2 household members" }
 *   Error:   { ok: false, error: "reason" }
 */
```

#### **checkDocumentExpirationWarnings()**

```javascript
/**
 * FUNCTION: checkDocumentExpirationWarnings
 * PURPOSE: Nightly trigger to identify documents expiring within 6 months
 *          and send member warnings.
 *
 * CALLED BY: nightly_checkDocumentExpirations() in NotificationService.gs
 *            Scheduled: 3:00 AM GMT+2 daily
 *
 * HOW IT WORKS:
 * 1. Query File Submissions where status="verified" and is_current=TRUE
 * 2. For passport/omang with expiration_date:
 *    Calculate days until expiration
 * 3. If days < 180 (6 months) and passport_expiration_warning_sent=FALSE:
 *    - Build expiration warning email
 *    - Send to member
 *    - Set passport_expiration_warning_sent = TRUE
 *    - Set passport_expiration_warning_date = now
 *    - Log audit entry
 * 4. Return count of warnings sent
 *
 * @returns {Object}
 *   { ok: true, warnings_sent: 42 }
 *
 * CONFIGURATION:
 * - Grace period: passport_warning_months from Config.gs (typically 6)
 * - Only send one warning per document (check warning_sent flag)
 */
```

#### **deleteExpiredRsoLinks()**

```javascript
/**
 * FUNCTION: deleteExpiredRsoLinks
 * PURPOSE: Nightly cleanup to mark RSO approval links as expired.
 *          (Expired links become invalid but are retained in audit trail.)
 *
 * CALLED BY: nightly_cleanupExpiredRsoLinks() in NotificationService.gs
 *            Scheduled: 3:15 AM GMT+2 daily
 *
 * HOW IT WORKS:
 * 1. Query File Submissions where rso_approval_link_token is not empty
 * 2. For each: if now > rso_approval_link_expires_at:
 *    - Mark rso_approval_link_token = null (so can't be reused)
 *    - Do not delete record (retain for audit)
 * 3. Return count of links cleared
 *
 * @returns {Object}
 *   { ok: true, expired_count: 3 }
 *
 * NOTES:
 * - This is a cleanup task; expired links already stop working
 * - Admin can regenerate new links if needed
 */
```

---

### B2. Update Code.gs

Add these 7 route handlers to the `_routeAction()` switch statement:

```javascript
case 'upload_file':
  return _handleFileUpload(p);
case 'get_file_status':
  return _handleGetFileStatus(p);
case 'approve_file':
  return _handleApproveFileSubmission(p);
case 'reject_file':
  return _handleRejectFileSubmission(p);
case 'request_employment':
  return _handleRequestEmploymentVerification(p);
case 'rso_approve':  // Public endpoint for RSO one-time link
  return _handleRsoApprovalLink(p);
```

Each handler validates authentication, calls the service function, and returns JSON. See GEA_FileUploadPortal_ReadyForClaudeCode.md for exact handler signatures.

---

### B3. Update Config.gs

Add/update these constants (folder IDs, RSO email, Cloud Storage, photo size):

**See detailed values in:** GEA_FileUploadPortal_ReadyForClaudeCode.md (Section 1)

---

### B4. Update NotificationService.gs

Add 2 nightly trigger functions for document expiration warnings and RSO link cleanup.

**See detailed specs in:** GEA_FileUploadPortal_ReadyForClaudeCode.md (Section 4)

---

## PART C: FRONTEND DEVELOPMENT

### C1. New HTML Page: DocumentUploadPortal.html

Single self-contained HTML file served by Code.gs.

**Key Sections:**
1. **Page Structure** — Top nav, household member selector, document tabs, status dashboard, upload form, submission history
2. **Styling** — GEA brand colors/fonts, responsive mobile+desktop
3. **JavaScript** — API calls, file validation, session management
4. **Features** — Member selector, document tabs, status indicators, drag-and-drop upload, mobile camera capture, rejection reasons

**See detailed specs in:** GEA_FileUploadPortal_ReadyForClaudeCode.md (Section 5)

---

### C2. Integration Points

Add route to Code.gs doGet() to serve the portal.

**See details in:** GEA_FileUploadPortal_ReadyForClaudeCode.md (Section 6)

---

## PART D: TESTING CHECKLIST

Unit tests, manual testing, and edge cases.

**See comprehensive checklist in:** GEA_FileUploadPortal_ReadyForClaudeCode.md (Section 7)

---

**Status:** ✅ Ready. All specs available. Codex can proceed with GitHub PR implementation.
