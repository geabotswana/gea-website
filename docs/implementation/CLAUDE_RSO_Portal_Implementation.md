# RSO Portal Implementation Guide

Complete implementation for RSO (Regional Security Officer) portal access, replacing one-time approval links with authenticated portal login.

---

## Overview

### Current State
- RSO approval currently handled via **one-time email links** (handleRsoApprovalLink)
- One-time links are consumed on first use (problematic for group email rso-notify@geabotswana.org)
- Identity captured from email address in link token, not from authenticated session
- Audit trail shows "EMAIL_RSO_APPROVE" as generic placeholder, not individual RSO member

### Target State
- RSO members log in via Admin Portal with **"rso" role** (already exists in Administrators table)
- Dedicated RSO dashboard showing pending approvals categorized by type
- Clear identity capture: rso_reviewed_by = logged-in RSO member's email
- Two workflows supported:
  1. **Document Review** — Membership application documents (2-tier: RSO → GEA Admin)
  2. **Guest List Review** — Reservation guest lists (RSO security check before event)

### Benefits
✅ Clear audit trail (individual RSO member identity)
✅ No link expiration/consumption issues
✅ Consistent with system auth framework
✅ Supports multiple RSO members with shared responsibilities
✅ No custom UX for one-time links (reuses Admin Portal infrastructure)

---

## Implementation Architecture

### Authentication & Authorization

**Existing Infrastructure:**
- Administrators table (System Backend sheet) with "rso" role
- `adminLogin(email, password)` supports all roles: board, mgt, rso
- `requireAuth(token, role)` enforces role-based access control
- Session management: token stored in sessionStorage (browser), validated via _validateSession()

**No changes needed to auth layer** — auth infrastructure already supports RSO role.

### New RSO Action Handlers

All handlers require: `requireAuth(p.token, "rso")` before proceeding.

#### 1. admin_rso_pending_documents
**Purpose:** List documents awaiting RSO review for membership applications

**Input:**
```javascript
{
  token: "...",
  filters: {           // Optional
    application_id: "...",
    individual_id: "...",
    document_type: "passport|omang|photo|employment",
    status: "submitted|rso_pending"  // Default: rso_pending
  }
}
```

**Output:**
```javascript
{
  success: true,
  count: 5,
  documents: [
    {
      submission_id: "SUB-2026-0324-001",
      application_id: "APP-2026-0324-001",
      individual_id: "IND-2026-0324-001",
      applicant_name: "Jane Johnson",
      applicant_email: "jane@example.com",
      document_type: "passport",
      status: "submitted",
      submission_date: "2026-03-24",
      file_name: "passport_jane.pdf",
      can_download: true,
      preview_url: "..."  // Image proxy for document preview
    }
  ]
}
```

**Implementation:**
- Query File Submissions sheet for status="submitted" where document_type in [passport, omang, employment]
- Filter by individual_id → application_id in Membership Applications
- Return document metadata + preview capability

#### 2. admin_rso_approve_documents
**Purpose:** Approve or reject document submission by individual RSO member

**Input:**
```javascript
{
  token: "...",
  submission_id: "SUB-2026-0324-001",
  decision: "approve|reject",
  rejection_reason: "..." // Optional, required if decision="reject"
}
```

**Output:**
```javascript
{
  success: true,
  submission_id: "SUB-2026-0324-001",
  new_status: "rso_approved|rso_rejected",
  message: "Document approved for GEA admin review" or "Document rejected"
}
```

**Implementation:**
- Validate submission exists and status="submitted"
- Update File Submissions sheet:
  - `status` = "rso_approved" or "rso_rejected"
  - `rso_reviewed_by` = **session.email** (authenticated RSO member)
  - `rso_review_date` = NOW
  - `rejection_reason` = reason (if rejected)
- If approved: Update Application status to "rso_review" (waiting for GEA admin final review)
- If rejected: Email applicant with rejection reason, allow resubmission
- Audit log: Record RSO decision with individual's email

#### 3. admin_rso_pending_guest_lists
**Purpose:** List guest lists awaiting RSO security review

**Input:**
```javascript
{
  token: "...",
  filters: {           // Optional
    reservation_id: "...",
    household_id: "...",
    status: "submitted|rso_pending"
  }
}
```

**Output:**
```javascript
{
  success: true,
  count: 3,
  guest_lists: [
    {
      guest_list_id: "GL-2026-0401-001",
      reservation_id: "RES-2026-0401-001",
      household_id: "HSH-2026-0324-001",
      household_name: "Johnson Family",
      facility: "Leobo",
      event_date: "2026-04-15",
      event_time: "18:00-22:00",
      status: "submitted",
      guest_count: 8,
      guests: [
        {
          index: 0,
          guest_name: "John Smith",
          relationship: "Friend",
          date_of_birth: "1985-06-15",
          status: "pending"  // or "approved|rejected"
        }
      ],
      submission_date: "2026-03-25"
    }
  ]
}
```

**Implementation:**
- Query Guest Lists sheet for status="submitted" or "rso_pending"
- Join to Reservations sheet to get facility, date, time
- Return guest details in array format for review

#### 4. admin_rso_approve_guest_list
**Purpose:** Approve or reject individual guests in a guest list

**Input:**
```javascript
{
  token: "...",
  guest_list_id: "GL-2026-0401-001",
  decisions: [
    {
      index: 0,
      status: "approved|rejected",
      rejection_reason: "..."  // If rejected
    }
  ]
}
```

**Output:**
```javascript
{
  success: true,
  guest_list_id: "GL-2026-0401-001",
  approved_count: 7,
  rejected_count: 1,
  message: "Guest list review completed"
}
```

**Implementation:**
- Save RSO decisions to Guest Lists sheet:
  - `rso_draft_json` = JSON of decisions (temporary save while reviewing)
  - `rso_reviewed_by` = **session.email**
  - `rso_review_date` = NOW
  - `status` = "rso_approved" or "rso_rejected" (based on decision outcomes)
- Email household with RSO decision (approved guests, rejected guests with reasons)
- Update Reservations calendar if guest list rejected (may need resubmission)
- Audit log: Record RSO guest list review

---

## Frontend Updates: Admin.html

### Role Detection on Login

```javascript
// Admin.html login handler
submitAdminLogin() {
  const email = document.getElementById("adminEmail").value;
  const password = document.getElementById("adminPassword").value;

  google.script.run.withSuccessHandler(function(response) {
    if (response.success) {
      sessionStorage.setItem("admin_token", response.token);
      sessionStorage.setItem("admin_role", response.role);  // "board", "mgt", or "rso"
      sessionStorage.setItem("admin_email", response.admin.email);

      // Conditional navigation based on role
      if (response.role === "rso") {
        showPage("rso_documents");  // Default RSO landing page
      } else {
        showPage("dashboard");      // Default board landing page
      }
    }
  }).adminLogin(email, password);
}
```

### Conditional Sidebar Navigation

```html
<!-- In Admin.html sidebar -->
<nav id="sidebarNav" class="sidebar">
  <!-- BOARD-ONLY SECTIONS -->
  <div id="boardSidebar" style="display: none;">
    <a href="#" onclick="showPage('dashboard')">Dashboard</a>
    <a href="#" onclick="showPage('reservations')">Reservations</a>
    <a href="#" onclick="showPage('members')">Members</a>
    <a href="#" onclick="showPage('photos')">Photos</a>
    <a href="#" onclick="showPage('payments')">Payments</a>
    <a href="#" onclick="showPage('applications')">Applications</a>
    <a href="#" onclick="showPage('admin_accounts')">Admin Accounts</a>
  </div>

  <!-- RSO-ONLY SECTIONS -->
  <div id="rsoSidebar" style="display: none;">
    <a href="#" onclick="showPage('rso_documents')">Document Reviews</a>
    <a href="#" onclick="showPage('rso_guest_lists')">Guest List Reviews</a>
  </div>

  <!-- COMMON SECTIONS (both roles) -->
  <hr>
  <a href="#" onclick="adminLogout()">Logout</a>
</nav>

<script>
  // On page load, detect role and show appropriate sidebar
  function setupSidebarForRole() {
    const role = sessionStorage.getItem("admin_role");
    if (role === "rso") {
      document.getElementById("boardSidebar").style.display = "none";
      document.getElementById("rsoSidebar").style.display = "block";
    } else {
      document.getElementById("boardSidebar").style.display = "block";
      document.getElementById("rsoSidebar").style.display = "none";
    }
  }
</script>
```

### RSO Documents Page (admin_rso_documents)

```html
<div id="rso_documents" class="page" style="display: none;">
  <h2>Document Reviews - Membership Applications</h2>

  <div class="filter-section">
    <label>Filter by Document Type:</label>
    <select id="docTypeFilter" onchange="loadRsoPendingDocuments()">
      <option value="">All Types</option>
      <option value="passport">Passport</option>
      <option value="omang">Omang</option>
      <option value="photo">Photo</option>
      <option value="employment">Employment Verification</option>
    </select>
  </div>

  <div id="documentsContainer" class="document-list">
    <!-- Populated by JavaScript -->
  </div>
</div>

<script>
  function loadRsoPendingDocuments() {
    const token = sessionStorage.getItem("admin_token");
    const docType = document.getElementById("docTypeFilter").value;

    google.script.run.withSuccessHandler(function(response) {
      if (response.success) {
        renderDocumentsList(response.documents);
      } else {
        alert("Error loading documents: " + response.message);
      }
    }).handlePortalApi("admin_rso_pending_documents", {
      token: token,
      filters: { document_type: docType, status: "submitted" }
    });
  }

  function renderDocumentsList(documents) {
    const container = document.getElementById("documentsContainer");
    container.innerHTML = "";

    if (documents.length === 0) {
      container.innerHTML = "<p>No documents pending review</p>";
      return;
    }

    documents.forEach(doc => {
      const card = document.createElement("div");
      card.className = "document-card";
      card.innerHTML = `
        <div class="document-header">
          <h3>${doc.applicant_name}</h3>
          <span class="doc-type">${doc.document_type.toUpperCase()}</span>
        </div>
        <div class="document-details">
          <p><strong>Email:</strong> ${doc.applicant_email}</p>
          <p><strong>Application:</strong> ${doc.application_id}</p>
          <p><strong>File:</strong> ${doc.file_name}</p>
          <p><strong>Submitted:</strong> ${doc.submission_date}</p>
        </div>
        <div class="document-preview">
          <img src="${doc.preview_url}" alt="Document preview" style="max-width: 300px;">
        </div>
        <div class="document-actions">
          <button onclick="approveDocument('${doc.submission_id}')">Approve</button>
          <button onclick="showRejectDialog('${doc.submission_id}')">Reject</button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function approveDocument(submissionId) {
    const token = sessionStorage.getItem("admin_token");
    google.script.run.withSuccessHandler(function(response) {
      if (response.success) {
        alert("Document approved for GEA admin review");
        loadRsoPendingDocuments();
      } else {
        alert("Error: " + response.message);
      }
    }).handlePortalApi("admin_rso_approve_documents", {
      token: token,
      submission_id: submissionId,
      decision: "approve"
    });
  }

  function rejectDocument(submissionId, reason) {
    const token = sessionStorage.getItem("admin_token");
    google.script.run.withSuccessHandler(function(response) {
      if (response.success) {
        alert("Document rejected. Applicant will be notified.");
        loadRsoPendingDocuments();
      } else {
        alert("Error: " + response.message);
      }
    }).handlePortalApi("admin_rso_approve_documents", {
      token: token,
      submission_id: submissionId,
      decision: "reject",
      rejection_reason: reason
    });
  }
</script>
```

### RSO Guest Lists Page (admin_rso_guest_lists)

```html
<div id="rso_guest_lists" class="page" style="display: none;">
  <h2>Guest List Reviews - Facility Reservations</h2>

  <div id="guestListsContainer" class="guest-lists">
    <!-- Populated by JavaScript -->
  </div>
</div>

<script>
  function loadRsoPendingGuestLists() {
    const token = sessionStorage.getItem("admin_token");

    google.script.run.withSuccessHandler(function(response) {
      if (response.success) {
        renderGuestListsList(response.guest_lists);
      } else {
        alert("Error loading guest lists: " + response.message);
      }
    }).handlePortalApi("admin_rso_pending_guest_lists", {
      token: token,
      filters: { status: "submitted" }
    });
  }

  function renderGuestListsList(guestLists) {
    const container = document.getElementById("guestListsContainer");
    container.innerHTML = "";

    guestLists.forEach(gl => {
      const card = document.createElement("div");
      card.className = "guest-list-card";

      // Render each guest with approve/reject buttons
      const guestRows = gl.guests.map((guest, idx) => `
        <tr>
          <td>${guest.guest_name}</td>
          <td>${guest.relationship}</td>
          <td>${guest.date_of_birth || "N/A"}</td>
          <td>
            <button onclick="approveGuest('${gl.guest_list_id}', ${idx})">Approve</button>
            <button onclick="showRejectGuestDialog('${gl.guest_list_id}', ${idx})">Reject</button>
          </td>
        </tr>
      `).join("");

      card.innerHTML = `
        <div class="guest-list-header">
          <h3>${gl.household_name} - ${gl.facility}</h3>
          <p><strong>Event Date:</strong> ${gl.event_date} @ ${gl.event_time}</p>
          <p><strong>Guests:</strong> ${gl.guest_count}</p>
        </div>
        <table class="guests-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Relationship</th>
              <th>Date of Birth</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>${guestRows}</tbody>
        </table>
        <div class="guest-list-actions">
          <button onclick="finalizeGuestListReview('${gl.guest_list_id}')">Submit Review</button>
        </div>
      `;
      container.appendChild(card);
    });
  }

  function finalizeGuestListReview(guestListId) {
    // Collect all decisions and submit
    const token = sessionStorage.getItem("admin_token");
    // [Implementation to gather decisions from UI and submit]
  }
</script>
```

---

## Code.js Updates

### New RSO Handlers (add to _routeAction switch statement)

```javascript
// Around line 218 in Code.js, add:
case "admin_rso_pending_documents":   return _handleAdminRsoPendingDocuments(params);
case "admin_rso_approve_documents":   return _handleAdminRsoApproveDocuments(params);
case "admin_rso_pending_guest_lists": return _handleAdminRsoPendingGuestLists(params);
case "admin_rso_approve_guest_list":  return _handleAdminRsoApproveGuestList(params);
```

### Handler Implementation

```javascript
/**
 * HANDLER: _handleAdminRsoPendingDocuments
 * Lists documents awaiting RSO review
 */
function _handleAdminRsoPendingDocuments(p) {
  var auth = requireAuth(p.token, "rso");
  if (!auth.ok) return auth.response;

  try {
    var filters = p.filters || {};
    var documents = getDocumentsForRsoReview(filters);
    return successResponse({ count: documents.length, documents: documents });
  } catch (e) {
    Logger.log("ERROR _handleAdminRsoPendingDocuments: " + e);
    return errorResponse("Error loading documents", "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminRsoApproveDocuments
 * RSO approves or rejects a document submission
 */
function _handleAdminRsoApproveDocuments(p) {
  var auth = requireAuth(p.token, "rso");
  if (!auth.ok) return auth.response;

  try {
    if (!p.submission_id) return errorResponse("submission_id required", "INVALID_PARAM");
    if (!p.decision || !["approve", "reject"].includes(p.decision)) {
      return errorResponse("decision must be approve or reject", "INVALID_PARAM");
    }

    var result = approveDocumentForRso(p.submission_id, p.decision, p.rejection_reason || "", auth.session.email);
    if (!result.ok) return errorResponse(result.error, "OPERATION_FAILED");

    return successResponse({
      submission_id: p.submission_id,
      new_status: result.new_status,
      message: p.decision === "approve" ? "Document approved for GEA admin review" : "Document rejected"
    });
  } catch (e) {
    Logger.log("ERROR _handleAdminRsoApproveDocuments: " + e);
    return errorResponse("Error processing decision", "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminRsoPendingGuestLists
 * Lists guest lists awaiting RSO review
 */
function _handleAdminRsoPendingGuestLists(p) {
  var auth = requireAuth(p.token, "rso");
  if (!auth.ok) return auth.response;

  try {
    var filters = p.filters || {};
    var guestLists = getGuestListsForRsoReview(filters);
    return successResponse({ count: guestLists.length, guest_lists: guestLists });
  } catch (e) {
    Logger.log("ERROR _handleAdminRsoPendingGuestLists: " + e);
    return errorResponse("Error loading guest lists", "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminRsoApproveGuestList
 * RSO approves/rejects individual guests in a guest list
 */
function _handleAdminRsoApproveGuestList(p) {
  var auth = requireAuth(p.token, "rso");
  if (!auth.ok) return auth.response;

  try {
    if (!p.guest_list_id) return errorResponse("guest_list_id required", "INVALID_PARAM");
    if (!p.decisions || !Array.isArray(p.decisions)) {
      return errorResponse("decisions must be an array", "INVALID_PARAM");
    }

    var result = processRsoGuestListDecisions(p.guest_list_id, p.decisions, auth.session.email);
    if (!result.ok) return errorResponse(result.error, "OPERATION_FAILED");

    return successResponse({
      guest_list_id: p.guest_list_id,
      approved_count: result.approved_count,
      rejected_count: result.rejected_count,
      message: "Guest list review completed"
    });
  } catch (e) {
    Logger.log("ERROR _handleAdminRsoApproveGuestList: " + e);
    return errorResponse("Error processing guest list", "SERVER_ERROR");
  }
}
```

---

## FileSubmissionService.js Updates

### Disable One-Time Link Generation

**Remove:** The `handleRsoApprovalLink()` function (optional — keep for backward compatibility but stop generating links)

### Update Document Submission Flow

```javascript
/**
 * When application approved by board, mark documents as rso_pending
 * (instead of generating one-time links)
 */
function markDocumentsForRsoReview(applicationId) {
  var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_FILE_SUBMISSIONS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var app = getApplicationById(applicationId);
  if (!app) return { ok: false, error: "Application not found" };

  for (var i = 1; i < data.length; i++) {
    if (data[i][_getColumnIndex(TAB_FILE_SUBMISSIONS, "application_id")] === applicationId) {
      // Update status to rso_pending (no more one-time links)
      var statusCol = _getColumnIndex(TAB_FILE_SUBMISSIONS, "status") + 1;
      sheet.getRange(i + 1, statusCol).setValue("rso_pending");

      // REMOVE these lines (no more one-time links):
      // rso_approval_link_token, rso_approval_link_expires_at, rso_approval_link_sent_date
    }
  }

  return { ok: true };
}
```

### New Helper: getDocumentsForRsoReview()

```javascript
/**
 * Query documents awaiting RSO review (for admin_rso_pending_documents)
 */
function getDocumentsForRsoReview(filters) {
  var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_FILE_SUBMISSIONS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var documents = [];
  var statusCol = _getColumnIndex(TAB_FILE_SUBMISSIONS, "status");
  var docTypeCol = _getColumnIndex(TAB_FILE_SUBMISSIONS, "document_type");
  var applicationIdCol = _getColumnIndex(TAB_FILE_SUBMISSIONS, "application_id");

  for (var i = 1; i < data.length; i++) {
    var status = data[i][statusCol];
    var docType = data[i][docTypeCol];

    // Only include if status="submitted" (or rso_pending if filter allows)
    if (status !== "submitted") continue;

    // Apply filters
    if (filters.document_type && docType !== filters.document_type) continue;

    var submissionId = data[i][_getColumnIndex(TAB_FILE_SUBMISSIONS, "submission_id")];
    var individualId = data[i][_getColumnIndex(TAB_FILE_SUBMISSIONS, "individual_id")];
    var applicationId = data[i][applicationIdCol];

    var individual = getMemberById(individualId);
    var app = getApplicationById(applicationId);

    documents.push({
      submission_id: submissionId,
      application_id: applicationId,
      individual_id: individualId,
      applicant_name: individual ? (individual.first_name + " " + individual.last_name) : "Unknown",
      applicant_email: individual ? individual.email : "unknown@example.com",
      document_type: docType,
      status: status,
      submission_date: formatDate(data[i][_getColumnIndex(TAB_FILE_SUBMISSIONS, "submission_timestamp")], true),
      file_name: data[i][_getColumnIndex(TAB_FILE_SUBMISSIONS, "file_name")] || "document",
      can_download: true,
      preview_url: "/image_proxy?file_id=..."  // TODO: Get actual file ID
    });
  }

  return documents;
}

/**
 * Process RSO approval/rejection of a document
 */
function approveDocumentForRso(submissionId, decision, rejectionReason, rsoEmail) {
  var sheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_FILE_SUBMISSIONS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var submissionCol = _getColumnIndex(TAB_FILE_SUBMISSIONS, "submission_id");

  var submissionIdx = -1;
  for (var i = 1; i < data.length; i++) {
    if (data[i][submissionCol] === submissionId) {
      submissionIdx = i;
      break;
    }
  }

  if (submissionIdx === -1) {
    return { ok: false, error: "Submission not found" };
  }

  var newStatus = decision === "approve" ? "rso_approved" : "rso_rejected";
  var statusCol = _getColumnIndex(TAB_FILE_SUBMISSIONS, "status") + 1;
  var rsoReviewByCol = _getColumnIndex(TAB_FILE_SUBMISSIONS, "rso_reviewed_by") + 1;
  var rsoReviewDateCol = _getColumnIndex(TAB_FILE_SUBMISSIONS, "rso_review_date") + 1;
  var rejectionReasonCol = _getColumnIndex(TAB_FILE_SUBMISSIONS, "rejection_reason") + 1;

  sheet.getRange(submissionIdx + 1, statusCol).setValue(newStatus);
  sheet.getRange(submissionIdx + 1, rsoReviewByCol).setValue(rsoEmail);
  sheet.getRange(submissionIdx + 1, rsoReviewDateCol).setValue(new Date());

  if (decision === "reject") {
    sheet.getRange(submissionIdx + 1, rejectionReasonCol).setValue(rejectionReason);
  }

  // Send notifications
  var individual = getMemberById(data[submissionIdx][_getColumnIndex(TAB_FILE_SUBMISSIONS, "individual_id")]);
  if (individual) {
    if (decision === "approve") {
      sendEmailFromTemplate("ADM_DOCUMENT_APPROVED_BY_RSO", individual.email, {
        FIRST_NAME: individual.first_name,
        DOCUMENT_TYPE: data[submissionIdx][_getColumnIndex(TAB_FILE_SUBMISSIONS, "document_type")]
      });
    } else {
      sendEmailFromTemplate("ADM_DOCUMENT_REJECTED_BY_RSO", individual.email, {
        FIRST_NAME: individual.first_name,
        DOCUMENT_TYPE: data[submissionIdx][_getColumnIndex(TAB_FILE_SUBMISSIONS, "document_type")],
        REJECTION_REASON: rejectionReason
      });
    }
  }

  // Audit log
  logAuditEntry(rsoEmail, "AUDIT_RSO_DOCUMENT_REVIEWED", "FileSubmission", submissionId,
                decision === "approve" ? "RSO approved document" : "RSO rejected document: " + rejectionReason);

  return { ok: true, new_status: newStatus };
}
```

---

## ReservationService.js Updates

### Update Guest List Review Workflow

**Replace:** One-time links in STEP 6 of guest list submission

**Change:**
```javascript
// OLD: Generate one-time RSO approval link
// NEW: Mark guest list as rso_pending, send notification to rso-approve@geabotswana.org
//      RSO accesses via admin portal

function finalizeGuestListReview(guestListId, decisions, rsoEmail) {
  // rsoEmail now comes from authenticated session (not from email header)
  // Same update logic as before, but rso_reviewed_by is clearly the logged-in RSO member
  // ...
}
```

### New Helper: getGuestListsForRsoReview()

```javascript
/**
 * Query guest lists awaiting RSO review
 */
function getGuestListsForRsoReview(filters) {
  var sheet = SpreadsheetApp.openById(RESERVATIONS_ID).getSheetByName(TAB_GUEST_LISTS);
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  var guestLists = [];
  var statusCol = _getColumnIndex(TAB_GUEST_LISTS, "status");

  for (var i = 1; i < data.length; i++) {
    var status = data[i][statusCol];
    if (status !== "submitted" && status !== "rso_pending") continue;

    var guestListId = data[i][_getColumnIndex(TAB_GUEST_LISTS, "guest_list_id")];
    var reservationId = data[i][_getColumnIndex(TAB_GUEST_LISTS, "reservation_id")];
    var reservation = getReservationById(reservationId);

    if (!reservation) continue;

    // Parse guest entries from JSON
    var guestsJson = data[i][_getColumnIndex(TAB_GUEST_LISTS, "guests_json")] || "[]";
    var guests = JSON.parse(guestsJson);

    guestLists.push({
      guest_list_id: guestListId,
      reservation_id: reservationId,
      household_id: reservation.household_id,
      household_name: reservation.household_name,
      facility: reservation.facility,
      event_date: formatDate(reservation.date, true),
      event_time: reservation.start_time + "-" + reservation.end_time,
      status: status,
      guest_count: guests.length,
      guests: guests,
      submission_date: formatDate(data[i][_getColumnIndex(TAB_GUEST_LISTS, "submission_timestamp")], true)
    });
  }

  return guestLists;
}
```

---

## ApplicationService.js Updates

### Update Workflow to Use RSO Portal

**STEP 6B:** When board approves application:

```javascript
// OLD: Generate one-time RSO approval link
// NEW: Mark documents as rso_pending, send email to rso-approve@geabotswana.org

function approveApplicationByBoard(applicationId, boardEmail) {
  // ...existing approval logic...

  // Update File Submissions for all documents to rso_pending
  markDocumentsForRsoReview(applicationId);

  // Email to rso-approve@geabotswana.org (no link, just notification)
  sendEmailFromTemplate("ADM_DOCUMENTS_SUBMITTED_FOR_RSO_REVIEW", EMAIL_RSO_APPROVE, {
    APPLICANT_NAME: app.primary_applicant_name,
    APPLICATION_ID: applicationId,
    DEADLINE: calculateRsoDeadline(),
    DOCUMENTS_LINK: "Log in to Admin Portal > Document Reviews"
  });
}
```

---

## Email Template Updates

### New Templates (Add to Email Templates sheet)

**ADM_DOCUMENT_APPROVED_BY_RSO** (tpl_XYZ)
```
Subject: Document Approved - {{DOCUMENT_TYPE}}
Body:
Good news! Your {{DOCUMENT_TYPE}} has been approved by our Regional Security Officer and is now being reviewed by our administration team. We'll notify you of the final outcome shortly.

Best regards,
Gaborone Employee Association
```

**ADM_DOCUMENT_REJECTED_BY_RSO** (tpl_XYZ)
Subject: Document Rejected - Please Resubmit {{DOCUMENT_TYPE}}
Body:
Unfortunately, your {{DOCUMENT_TYPE}} has been rejected by our Regional Security Officer. Reason: {{REJECTION_REASON}}

Please resubmit a new document as soon as possible. You can upload it directly from your application dashboard.

Best regards,
Gaborone Employee Association
```

**ADM_DOCUMENTS_SUBMITTED_FOR_RSO_REVIEW** (tpl_XYZ)
```
Subject: New Application {{APPLICATION_ID}} - Documents Ready for Review
Body:
A new membership application ({{APPLICATION_ID}}) has been approved by the board and is ready for security document review.

Applicant: {{APPLICANT_NAME}}
Deadline: {{DEADLINE}}

Log in to the Admin Portal > Document Reviews to review the submitted documents.

Best regards,
Board
```

### Updated Template

**ADM_BOARD_APPROVED_AWAITING_RSO**
(Update existing template to remove one-time link reference)
```
Body:
...
RSO will review your submitted documents through the secure admin portal.
Next deadline: {{DEADLINE}}
...
```

---

## Implementation Checklist

### Phase 1: Backend Infrastructure
- [ ] Add 4 new handlers to Code.js (_handleAdminRsoPendingDocuments, etc.)
- [ ] Add helper functions to FileSubmissionService.js (getDocumentsForRsoReview, approveDocumentForRso)
- [ ] Add helper functions to ReservationService.js (getGuestListsForRsoReview, processRsoGuestListDecisions)
- [ ] Update ApplicationService.js workflow to mark documents as rso_pending instead of generating links
- [ ] Add 3 new email templates (ADM_DOCUMENT_APPROVED_BY_RSO, ADM_DOCUMENT_REJECTED_BY_RSO, ADM_DOCUMENTS_SUBMITTED_FOR_RSO_REVIEW)
- [ ] Update existing email template (ADM_BOARD_APPROVED_AWAITING_RSO) to remove link reference
- [ ] Test all handlers with curl/Postman before UI implementation

### Phase 2: Frontend (Admin.html)
- [ ] Update login handler to detect RSO role and store in sessionStorage
- [ ] Add conditional sidebar showing RSO-only sections
- [ ] Create RSO Documents page (admin_rso_documents)
  - [ ] Filter by document type
  - [ ] Display document list with applicant info
  - [ ] Approve/Reject buttons with reason dialog
  - [ ] Audit trail display
- [ ] Create RSO Guest Lists page (admin_rso_guest_lists)
  - [ ] Display pending guest lists by reservation
  - [ ] Table view of guests with individual approve/reject buttons
  - [ ] Finalize review button
  - [ ] Reason text input for rejections
- [ ] Add CSS styling for new pages
- [ ] Test RSO login flow and dashboard navigation

### Phase 3: Documentation Updates
- [ ] Update CLAUDE_Membership_Implementation.md - STEP 7 (RSO portal login instead of links)
- [ ] Update CLAUDE_Reservations_Implementation.md - STEP 6 (RSO portal login instead of links)
- [ ] Add new section to CLAUDE.md explaining RSO portal access
- [ ] Update architecture diagram in GEA_System_Architecture.md

### Phase 4: Testing & Deployment
- [ ] Create test RSO account in Administrators table
- [ ] Test complete document review workflow (application → board → RSO → GEA admin)
- [ ] Test complete guest list review workflow (reservation → member submits → RSO → event)
- [ ] Verify audit log captures RSO email correctly
- [ ] Test email notifications for applicants (rejections, approvals)
- [ ] Test rolebasedAccess (RSO cannot see board sections, vice versa)
- [ ] Deploy to @HEAD and test in production
- [ ] Disable/remove one-time link generation in production

### Phase 5: Deprecation
- [ ] Keep handleRsoApprovalLink() function for backward compatibility (existing links still work)
- [ ] Add deprecation notice in code comments
- [ ] Monitor for one-time link usage in logs
- [ ] Remove function in v2.0

---

## Rollback Plan

If RSO portal has critical issues:

1. **Immediate:** Keep one-time links functional (handleRsoApprovalLink still works)
2. **Short-term:** Disable RSO portal section in Admin.html, revert to email links
3. **Communication:** Notify RSO members to use email link process temporarily
4. **Fix:** Debug and redeploy
5. **Verification:** Test thoroughly before re-enabling portal

---

## Security Considerations

✅ **Authentication:** RSO must log in with Administrators table credentials (same auth layer as board)
✅ **Authorization:** Each action checks `requireAuth(p.token, "rso")` before proceeding
✅ **Audit Trail:** rso_reviewed_by captures individual RSO member email (not generic EMAIL_RSO_APPROVE)
✅ **Session Management:** Token expires after 24 hours; nightly purge of expired sessions
✅ **Input Validation:** All params validated before processing
⚠️ **Data Leakage:** RSO can only see documents/guest lists pending their review (no cross-filtering)

---

## FAQ

**Q: Can RSO members approve documents for applications they didn't originate?**
A: Yes. Any RSO member can log in and approve/reject any pending document. This is by design (shared responsibility, coverage).

**Q: What if an RSO member leaves and has pending documents?**
A: Another RSO member can complete the review. The documents remain in rso_pending status until reviewed (no owner field).

**Q: Can RSO members see board-only sections?**
A: No. The Admin.html sidebar conditionally hides board sections when role="rso". Navigation routing also checks role before displaying pages.

**Q: What happens to old one-time links?**
A: They remain functional but deprecated. Recommend disabling in runNightlyTasks() or removing token cleanup.

---

**Last Updated:** March 24, 2026
**Status:** 🔄 PLANNED (Not yet implemented)
**Branch:** claude/rso-document-approval-bIjgi
**Expected Implementation Time:** ~3–4 hours (backend + frontend + testing)
