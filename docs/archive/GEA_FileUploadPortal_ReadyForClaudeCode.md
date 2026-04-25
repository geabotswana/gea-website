# GEA File Upload Portal — CODEX → GITHUB PR → CLAUDE CODE REVIEW

**Status:** ✅ Google Sheets completed. Ready for code implementation via Codex.  
**Date:** March 11, 2026  
**Workflow:** Codex creates PR → GitHub → Claude Code reviews tonight

---

## COMPLETED: Google Sheets Updates

✅ **Configuration Sheet** — 5 rows added/updated (GEA System Backend)
✅ **Email Templates Sheet** — 4 templates added: tpl_057, tpl_058, tpl_059, tpl_060 (GEA System Backend)
✅ **File Submissions Sheet** — 9 columns added (GEA Member Directory)

No further Google Sheets work needed.

---

## WORKFLOW: CODEX → GITHUB → CLAUDE CODE

### Step 1: Codex (Now)
**Mission:** Create a Git PR on GitHub with all code changes.

**Codex will:**
1. Use Codex's direct access to github.com/RaneyMD/GEA_Portal
2. Implement all 7 code tasks from spec below
3. Create a pull request with:
   - Branch name: `feature/file-upload-portal` (or similar)
   - Commit messages: Clear, descriptive
   - All files modified/created:
     - Config.gs (updated)
     - FileSubmissionService.gs (new)
     - Code.gs (updated with 7 route handlers)
     - NotificationService.gs (updated with 2 nightly triggers)
     - DocumentUploadPortal.html (new)
4. Ensure all specs from GEA_FileUploadPortal_ImplementationPrompt.md are followed
5. Do NOT merge the PR — leave for Claude Code review

### Step 2: Claude Code (Tonight)
**Mission:** Review Codex's PR for correctness, test, and approve/merge.

**Claude Code will:**
1. Fetch the PR from GitHub
2. Review all changes against specification
3. Run local tests (clasp push to versioned deployment)
4. Check functionality:
   - File upload validation
   - RSO approval workflow
   - Cloud Storage integration
   - Email notifications
   - Audit logging
5. Approve and merge PR if all checks pass
6. Update clasp deployment as needed

---

## YOUR FOLDER IDs (For Codex)

```
FOLDER_EMPLOYMENT_VERIFICATION = "1Ee9acuyKpbfEv7NVHCJqfRcaBExJHOEs"
FOLDER_FILE_SUBMISSION_ARCHIVE = "1r-G03qnH-kN_1FBaze5OAtq3WfjyDYuy"
```

---

## CODEX: IMPLEMENTATION TASKS (7 tasks)

### 1. Update Config.gs

**File:** src/Config.gs

Add/update these constants:

**Section 3 (Google Drive Folder IDs):**
```javascript
// File submission folders (add these after existing folder IDs)
var FOLDER_EMPLOYMENT_VERIFICATION = "1Ee9acuyKpbfEv7NVHCJqfRcaBExJHOEs";
var FOLDER_FILE_SUBMISSION_ARCHIVE = "1r-G03qnH-kN_1FBaze5OAtq3WfjyDYuy";
```

**Section 6 (Email Addresses):**
```javascript
// Update/verify this exists (RSO is a Google Group managed by Michael)
var EMAIL_RSO = "rso-notify@geabotswana.org";
```

**Section 12 (Cloud Storage):**
```javascript
// Verify these exist (should already be there)
var CLOUD_STORAGE_MEMBER_DATA_BUCKET = "gea-member-data";
var CLOUD_STORAGE_PUBLIC_BUCKET = "gea-public-assets";
var CLOUD_STORAGE_REGION = "us-central1";
```

**Section 16 (Photo Management):**
```javascript
// Update photo size from 2 to 5 MB for 600x600px resolution
var PHOTO_MAX_SIZE_MB = 5;                      // Changed from 2

// Add photo preview dimensions (new)
var PHOTO_PREVIEW_WIDTH_PX = 600;
var PHOTO_PREVIEW_HEIGHT_PX = 600;

// Keep existing (unchanged)
var PHOTO_ACCEPTED_TYPES = ["image/jpeg", "image/png"];
```

---

### 2. Create FileSubmissionService.gs

**New file:** src/FileSubmissionService.gs

Contains 10 functions (see detailed specs in ImplementationPrompt.md Section B1):
- `uploadFileSubmission()` — Main upload handler
- `getFileSubmissionStatus()` — Status dashboard
- `approveFileSubmission()` — Board approval
- `rejectFileSubmission()` — Board rejection
- `generateRsoApprovalLink()` — Create secure one-time link
- `handleRsoApprovalLink()` — Process RSO approval/rejection
- `copyApprovedPhotoToCloudStorage()` — Duplicate photo to Cloud Storage
- `getSubmissionHistory()` — Audit trail
- `requestEmploymentVerification()` — Admin request
- `checkDocumentExpirationWarnings()` — Nightly warnings
- `deleteExpiredRsoLinks()` — Nightly cleanup

All functions must follow gea-apps-script commenting standards (SKILL.md).

**See detailed specs:** GEA_FileUploadPortal_ImplementationPrompt.md (Section B1)

---

### 3. Update Code.gs

Add 7 new route handlers to the `_routeAction()` switch statement:

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

Each handler validates authentication, calls the service function, and returns JSON.

**See detailed specs:** GEA_FileUploadPortal_ImplementationPrompt.md (Section B2)

---

### 4. Update NotificationService.gs

Add 2 nightly trigger functions:

```javascript
/**
 * FUNCTION: nightly_checkDocumentExpirations
 * PURPOSE: Send warnings for documents expiring within 6 months
 * SCHEDULED: 3:00 AM GMT+2 daily
 */
function nightly_checkDocumentExpirations() {
  try {
    var result = checkDocumentExpirationWarnings();
    Logger.log("Document expiration warnings sent: " + result.warnings_sent);
  } catch (e) {
    Logger.log("ERROR nightly_checkDocumentExpirations: " + e);
    logAuditEntry(AUDIT_SYSTEM_ERROR, "system", "nightly_task",
                  "Document expiration check failed: " + e, "system@gea");
  }
}

/**
 * FUNCTION: nightly_cleanupExpiredRsoLinks
 * PURPOSE: Mark RSO approval links as expired
 * SCHEDULED: 3:15 AM GMT+2 daily
 */
function nightly_cleanupExpiredRsoLinks() {
  try {
    var result = deleteExpiredRsoLinks();
    Logger.log("Expired RSO links cleaned up: " + result.expired_count);
  } catch (e) {
    Logger.log("ERROR nightly_cleanupExpiredRsoLinks: " + e);
  }
}
```

Register triggers in your scheduler.

**See detailed specs:** GEA_FileUploadPortal_ImplementationPrompt.md (Section B5)

---

### 5. Create DocumentUploadPortal.html

**New file:** src/DocumentUploadPortal.html

Self-contained HTML portal page (~1500 lines) with:
- Top navigation bar (GEA brand, logout)
- Household member selector (if multiple members)
- Document type tabs:
  - Photo
  - Passport
  - Omang
  - Employment Verification
- Status dashboard (current status for each document type)
- Upload form (drag-and-drop + file picker)
- File preview before confirmation
- Submission history with rejection reasons
- GEA brand styling (colors, fonts, responsive)

**See detailed specs:** GEA_FileUploadPortal_ImplementationPrompt.md (Section C)

---

### 6. Update Code.gs doGet() routing

Add this route to serve the portal:

```javascript
// In doGet() function, add to switch statement:
case 'serve_documents':
  return HtmlService.createHtmlOutputFromFile("DocumentUploadPortal")
    .setTitle("GEA Documents & Photos")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
```

---

### 7. Testing

Run through the testing checklist in ImplementationPrompt.md (Section D):
- Unit tests (add to Tests.gs)
- Manual testing (upload photos, ID docs, RSO approval workflow)
- Edge cases (file size validation, format validation, Cloud Storage, etc.)

---

## WHERE TO FIND DETAILED SPECIFICATIONS

All technical specifications are in: **GEA_FileUploadPortal_ImplementationPrompt.md**

This document contains:
- **PART A:** Spreadsheet schema updates (already completed ✅)
- **PART B:** Backend specs
  - B1: FileSubmissionService.gs (10 functions with full JSDoc, HOW IT WORKS, parameters, returns)
  - B2: Code.gs handlers (7 route handlers)
  - B3: Config.gs changes
  - B5: NotificationService.gs (2 nightly triggers)
- **PART C:** Frontend specs (DocumentUploadPortal.html)
- **PART D:** Testing checklist (unit, manual, edge cases)

---

## KEY REMINDERS FOR CODEX

✅ **All constants follow gea-apps-script commenting standards**
✅ **All functions have JSDoc blocks + inline comments**
✅ **All error handling uses try/catch + audit logging**
✅ **All email templates auto-fetched from Configuration sheet (no code changes to EmailService)**
✅ **RSO approval link is PUBLIC (no authentication, token-based security)**
✅ **Photos: Google Drive (audit) + Cloud Storage (serving)**
✅ **Documents: Google Drive only**
✅ **Audit log entries for all file submission actions**

---

## SUCCESS CRITERIA

When PR is complete, it should have:
- ✅ Members can upload photos and ID documents
- ✅ RSO receives one-time approval links via email
- ✅ RSO can approve/reject via link (no login needed)
- ✅ Board can approve/reject submissions in admin interface
- ✅ Board can request employment verification on-demand
- ✅ Approved photos in Cloud Storage + Google Drive
- ✅ Documents in Google Drive only
- ✅ Nightly job checks document expiration (6 months before)
- ✅ All actions logged in Audit Log
- ✅ Web app deployment preserves existing functionality
- ✅ All code follows gea-apps-script standards
- ✅ All tests pass

---

## CLAUDE CODE: REVIEW CHECKLIST (Tonight)

When reviewing Codex's PR:

1. **Code Review**
   - [ ] All gea-apps-script commenting standards followed
   - [ ] All functions have JSDoc + inline comments
   - [ ] Error handling with try/catch + audit logging
   - [ ] No hardcoded values (all from Config.gs or Configuration sheet)
   - [ ] Authentication properly enforced (except RSO link endpoint)

2. **Functionality Testing**
   - [ ] File upload validation (size, format, duplicates)
   - [ ] RSO approval workflow (link generation, one-time use, expiry)
   - [ ] Board approval/rejection with reasons
   - [ ] Employment verification request on-demand
   - [ ] Cloud Storage integration for photos
   - [ ] Google Drive integration for all documents
   - [ ] Email notifications sent correctly
   - [ ] Audit log entries created

3. **Edge Cases**
   - [ ] Large files (test 5 MB + 10 MB limits)
   - [ ] Expired RSO links (can't be used twice)
   - [ ] Household members with same photo type submissions
   - [ ] Mobile vs. desktop upload paths
   - [ ] Cloud Storage permissions (test write access)

4. **Deployment**
   - [ ] Clasp push to versioned deployment (test URL)
   - [ ] No errors in Execution Log
   - [ ] Portal loads without errors
   - [ ] All routes respond correctly

5. **Approval**
   - [ ] If all checks pass: Approve and merge PR
   - [ ] If issues found: Request changes from Codex
   - [ ] Update clasp deployment if needed

---

**CODEX: Ready to implement. START WITH TASK 1 (Config.gs). Reference ImplementationPrompt.md for detailed function specs.**

**CLAUDE CODE: Keep this document open tonight for PR review checklist.**
