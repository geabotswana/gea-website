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
- Two RSO roles in Admin Portal (both in Administrators table):
  1. **rso_approve** — Document & guest list approval authority
  2. **rso_notify** — Read-only calendar coordination (no approval powers)
- Clear identity capture: rso_reviewed_by = logged-in RSO member's email
- Two approval workflows:
  1. **Document Review** (rso_approve only) — Membership application documents (2-tier: RSO → GEA Admin)
  2. **Guest List Review** (rso_approve only) — Reservation guest lists (RSO security check before event)
- One coordination workflow:
  3. **Calendar & Approved Guest Lists** (rso_notify read-only) — View approved reservations and finalized guest lists
- Proactive notifications: rso_notify members receive email alerts about upcoming events (no portal checking required)

### Benefits
✅ Role-based separation: rso_approve makes decisions, rso_notify coordinates
✅ Clear audit trail (individual RSO member identity)
✅ No link expiration/consumption issues
✅ Consistent with system auth framework
✅ Supports multiple RSO members with shared responsibilities
✅ rso_notify doesn't need to monitor portal (email notifications only)
✅ No custom UX for one-time links (reuses Admin Portal infrastructure)

---

## Implementation Architecture

### Authentication & Authorization

**Existing Infrastructure:**
- Administrators table (System Backend sheet) with role column
- `adminLogin(email, password)` supports all roles: board, mgt, rso_approve, rso_notify
- `requireAuth(token, role)` enforces role-based access control
- Session management: token stored in sessionStorage (browser), validated via _validateSession()

**Role Definitions:**

| Role | Portal Access | Permissions | Email Notifications |
|------|---|---|---|
| **rso_approve** | ✅ Full | Document review/approval, Guest list review/approval, View calendar | ✓ Event notifications (optional) |
| **rso_notify** | ✅ Limited | View approved guest lists, View approved calendar, Read-only | ✓ Upcoming event reminders |
| **board** | ✅ Full | Everything (existing functionality) | — |
| **mgt** | ✅ Limited | Specific Leobo approval (existing) | — |

**Required Changes to Auth Layer:**
- Update Administrators table: Change existing "rso" role entries to either "rso_approve" or "rso_notify"
- Update `requireAuth()` to support granular permission checks:
  - `requireAuth(token, "rso_approve")` — Only rso_approve members
  - `requireAuth(token, ["rso_approve", "rso_notify"])` — Either role (for read-only calendar)
- Keep backward compatibility: If old "rso" role exists, treat as "rso_approve"

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

#### 5. admin_rso_notify_approved_guest_lists
**Purpose:** (rso_notify only) List approved guest lists for calendar coordination

**Input:**
```javascript
{
  token: "...",
  filters: {                  // Optional
    facility: "tennis|leobo",
    date_range: {
      start: "2026-04-01",
      end: "2026-04-30"
    }
  }
}
```

**Output:**
```javascript
{
  success: true,
  count: 5,
  guest_lists: [
    {
      guest_list_id: "GL-2026-0401-001",
      reservation_id: "RES-2026-0401-001",
      household_id: "HSH-2026-0324-001",
      household_name: "Johnson Family",
      facility: "Leobo",
      event_date: "2026-04-15",
      event_time: "18:00-22:00",
      rso_approval_status: "approved",
      rso_approved_by: "rso@example.com",
      rso_approval_date: "2026-03-25",
      guest_count: 8,
      guests: [
        { guest_name: "John Smith", relationship: "Friend" },
        // ...
      ]
    }
  ]
}
```

**Implementation:**
- Query Guest Lists sheet for status="rso_approved" only
- Filter by date range and facility (if provided)
- Return guest list summary with approved guest names (no sensitive contact info beyond names)
- Requires: `requireAuth(p.token, ["rso_approve", "rso_notify"])`

#### 6. admin_rso_notify_approved_calendar
**Purpose:** (rso_notify only) Get approved reservations for calendar view

**Input:**
```javascript
{
  token: "...",
  month: "2026-04",  // YYYY-MM format, optional
  facility: "all|tennis|leobo"
}
```

**Output:**
```javascript
{
  success: true,
  count: 12,
  events: [
    {
      reservation_id: "RES-2026-0401-001",
      household_id: "HSH-2026-0324-001",
      household_name: "Johnson Family",
      facility: "Leobo",
      event_date: "2026-04-15",
      event_time: "18:00-22:00",
      approval_status: "approved",
      guest_list_status: "approved",
      guest_count: 8,
      primary_contact: "Jane Johnson"
    }
  ]
}
```

**Implementation:**
- Query Reservations sheet for approval_status="approved" only
- Join to Guest Lists to get guest_list_status
- Filter by facility and date range
- Return event summary (no member contact details beyond name)
- Requires: `requireAuth(p.token, ["rso_approve", "rso_notify"])`

---

## Email Notifications for rso_notify

New notification scheduled task: `sendRsoNotifyEventReminders()`

**Timing:** Run daily at 6:00 AM GMT+2 (same as triggerRsoDailySummary)

**Logic:**
```
For each approved event in next 7 days:
  ├─ Get all rso_notify members from Administrators table
  ├─ Send email to each rso_notify member:
  │  ├─ Facility name, date, time
  │  ├─ Household name, primary contact
  │  ├─ Guest count
  │  └─ Link to read-only calendar view (if portal access)
  └─ Email template: "Upcoming Facility Reservation - [FACILITY] [DATE]"

For rso_notify members on vacation/off-duty:
  └─ (Future enhancement: Skip emails if member marked as unavailable)
```

**Email Template:** ADM_RSO_NOTIFY_EVENT_REMINDER (new)
```
Subject: Upcoming Facility Reservation - {{FACILITY}} {{EVENT_DATE}}

Body:
A facility reservation is scheduled for {{EVENT_DATE}} at {{EVENT_TIME}}.

Facility: {{FACILITY}}
Household: {{HOUSEHOLD_NAME}}
Primary Contact: {{PRIMARY_CONTACT}}
Guest Count: {{GUEST_COUNT}}
Guest List Status: Approved by Security Team

Event details are available on the approved calendar (read-only view).

Best regards,
GEA Security Coordination
```

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
      sessionStorage.setItem("admin_role", response.role);  // "board", "mgt", "rso_approve", or "rso_notify"
      sessionStorage.setItem("admin_email", response.admin.email);

      // Conditional navigation based on role
      if (response.role === "rso_approve") {
        showPage("rso_documents");  // Default rso_approve landing page
      } else if (response.role === "rso_notify") {
        showPage("rso_calendar");   // Default rso_notify landing page
      } else {
        showPage("dashboard");      // Default board landing page
      }

      // Update sidebar for role
      setupSidebarForRole(response.role);
    }
  }).adminLogin(email, password);
}
```

### Conditional Sidebar Navigation

```html
<!-- In Admin.html sidebar -->
<nav id="sidebarNav" class="sidebar">
  <!-- BOARD SECTIONS -->
  <div id="boardSidebar" style="display: none;">
    <a href="#" onclick="showPage('dashboard')">Dashboard</a>
    <a href="#" onclick="showPage('reservations')">Reservations</a>
    <a href="#" onclick="showPage('members')">Members</a>
    <a href="#" onclick="showPage('photos')">Photos</a>
    <a href="#" onclick="showPage('payments')">Payments</a>
    <a href="#" onclick="showPage('applications')">Applications</a>
    <a href="#" onclick="showPage('admin_accounts')">Admin Accounts</a>
  </div>

  <!-- RSO_APPROVE SECTIONS -->
  <div id="rsoApproveSidebar" style="display: none;">
    <h4>Document Review</h4>
    <a href="#" onclick="showPage('rso_documents')">Pending Documents</a>
    <hr>
    <h4>Guest List Review</h4>
    <a href="#" onclick="showPage('rso_guest_lists')">Pending Guest Lists</a>
    <hr>
    <h4>Coordination</h4>
    <a href="#" onclick="showPage('rso_calendar')">Approved Calendar</a>
    <a href="#" onclick="showPage('rso_approved_guest_lists')">Approved Guest Lists</a>
  </div>

  <!-- RSO_NOTIFY SECTIONS (READ-ONLY) -->
  <div id="rsoNotifySidebar" style="display: none;">
    <h4>Calendar Coordination</h4>
    <a href="#" onclick="showPage('rso_calendar')">Approved Reservations</a>
    <a href="#" onclick="showPage('rso_approved_guest_lists')">Guest Lists (View Only)</a>
    <p style="font-size: 12px; color: #999; margin-top: 20px;">
      ℹ️ You receive email notifications about upcoming events. No action needed.
    </p>
  </div>

  <!-- COMMON SECTIONS (all roles) -->
  <hr>
  <a href="#" onclick="adminLogout()">Logout</a>
</nav>

<script>
  // On page load, detect role and show appropriate sidebar
  function setupSidebarForRole(role) {
    document.getElementById("boardSidebar").style.display = "none";
    document.getElementById("rsoApproveSidebar").style.display = "none";
    document.getElementById("rsoNotifySidebar").style.display = "none";

    if (role === "board" || role === "mgt") {
      document.getElementById("boardSidebar").style.display = "block";
    } else if (role === "rso_approve") {
      document.getElementById("rsoApproveSidebar").style.display = "block";
    } else if (role === "rso_notify") {
      document.getElementById("rsoNotifySidebar").style.display = "block";
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

### RSO Calendar Page (admin_rso_calendar) — rso_approve & rso_notify

```html
<div id="rso_calendar" class="page" style="display: none;">
  <h2>Approved Facility Reservations Calendar</h2>

  <div class="filter-section">
    <label>Facility:</label>
    <select id="calendarFacilityFilter" onchange="loadRsoCalendar()">
      <option value="all">All Facilities</option>
      <option value="tennis">Tennis Court / Basketball</option>
      <option value="leobo">Leobo</option>
    </select>

    <label>Month:</label>
    <input type="month" id="calendarMonthFilter" onchange="loadRsoCalendar()">
  </div>

  <div id="calendarContainer" class="calendar-view">
    <!-- Calendar will be rendered here -->
  </div>
</div>

<script>
  function loadRsoCalendar() {
    const token = sessionStorage.getItem("admin_token");
    const facility = document.getElementById("calendarFacilityFilter").value;
    const month = document.getElementById("calendarMonthFilter").value || new Date().toISOString().slice(0, 7);

    google.script.run.withSuccessHandler(function(response) {
      if (response.success) {
        renderCalendar(response.events);
      } else {
        alert("Error loading calendar: " + response.message);
      }
    }).handlePortalApi("admin_rso_notify_approved_calendar", {
      token: token,
      facility: facility,
      month: month
    });
  }

  function renderCalendar(events) {
    const container = document.getElementById("calendarContainer");
    container.innerHTML = "";

    if (events.length === 0) {
      container.innerHTML = "<p>No approved reservations for this period</p>";
      return;
    }

    // Group events by date
    const eventsByDate = {};
    events.forEach(event => {
      if (!eventsByDate[event.event_date]) {
        eventsByDate[event.event_date] = [];
      }
      eventsByDate[event.event_date].push(event);
    });

    // Render events by date
    Object.keys(eventsByDate).sort().forEach(date => {
      const dateDiv = document.createElement("div");
      dateDiv.className = "calendar-date";
      dateDiv.innerHTML = `<h4>${date}</h4>`;

      eventsByDate[date].forEach(event => {
        const eventDiv = document.createElement("div");
        eventDiv.className = "calendar-event";
        eventDiv.innerHTML = `
          <div class="event-time">${event.event_time}</div>
          <div class="event-details">
            <strong>${event.facility}</strong> - ${event.household_name}
            <br><small>Contact: ${event.primary_contact}</small>
            <br><small>Guests: ${event.guest_count}</small>
          </div>
        `;
        dateDiv.appendChild(eventDiv);
      });

      container.appendChild(dateDiv);
    });
  }

  // Load calendar on page view
  document.addEventListener("pageshow", function() {
    if (sessionStorage.getItem("current_page") === "rso_calendar") {
      loadRsoCalendar();
    }
  });
</script>
```

### RSO Approved Guest Lists Page (admin_rso_approved_guest_lists) — rso_approve & rso_notify

```html
<div id="rso_approved_guest_lists" class="page" style="display: none;">
  <h2>Approved Guest Lists (Reference)</h2>

  <div class="filter-section">
    <label>Facility:</label>
    <select id="guestListFacilityFilter" onchange="loadRsoApprovedGuestLists()">
      <option value="all">All Facilities</option>
      <option value="tennis">Tennis Court / Basketball</option>
      <option value="leobo">Leobo</option>
    </select>

    <label>Month:</label>
    <input type="month" id="guestListMonthFilter" onchange="loadRsoApprovedGuestLists()">
  </div>

  <div id="guestListsContainer" class="guest-lists-view">
    <!-- Populated by JavaScript -->
  </div>
</div>

<script>
  function loadRsoApprovedGuestLists() {
    const token = sessionStorage.getItem("admin_token");
    const facility = document.getElementById("guestListFacilityFilter").value;
    const month = document.getElementById("guestListMonthFilter").value;

    const filters = {
      facility: facility !== "all" ? facility : undefined,
      date_range: month ? {
        start: month + "-01",
        end: new Date(month + "-01").addMonths(1).toISOString().slice(0, 10)
      } : undefined
    };

    google.script.run.withSuccessHandler(function(response) {
      if (response.success) {
        renderApprovedGuestLists(response.guest_lists);
      } else {
        alert("Error loading guest lists: " + response.message);
      }
    }).handlePortalApi("admin_rso_notify_approved_guest_lists", {
      token: token,
      filters: filters
    });
  }

  function renderApprovedGuestLists(guestLists) {
    const container = document.getElementById("guestListsContainer");
    container.innerHTML = "";

    if (guestLists.length === 0) {
      container.innerHTML = "<p>No approved guest lists for this period</p>";
      return;
    }

    guestLists.forEach(gl => {
      const card = document.createElement("div");
      card.className = "guest-list-card";

      const guestRows = gl.guests.map(guest => `
        <li>${guest.guest_name} <span class="relationship">(${guest.relationship})</span></li>
      `).join("");

      card.innerHTML = `
        <div class="guest-list-header">
          <h3>${gl.household_name} - ${gl.facility}</h3>
          <p><strong>Event:</strong> ${gl.event_date} @ ${gl.event_time}</p>
          <p><strong>Guest Count:</strong> ${gl.guest_count}</p>
          <p><strong>Approved:</strong> ${gl.rso_approval_date} by ${gl.rso_approved_by}</p>
        </div>
        <div class="guest-list-details">
          <h4>Approved Guests:</h4>
          <ul class="guest-list">
            ${guestRows}
          </ul>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // Load on page view
  document.addEventListener("pageshow", function() {
    if (sessionStorage.getItem("current_page") === "rso_approved_guest_lists") {
      loadRsoApprovedGuestLists();
    }
  });
</script>
```

---

## Code.js Updates

### New RSO Handlers (add to _routeAction switch statement)

```javascript
// Around line 218 in Code.js, add:
case "admin_rso_pending_documents":       return _handleAdminRsoPendingDocuments(params);
case "admin_rso_approve_documents":       return _handleAdminRsoApproveDocuments(params);
case "admin_rso_pending_guest_lists":     return _handleAdminRsoPendingGuestLists(params);
case "admin_rso_approve_guest_list":      return _handleAdminRsoApproveGuestList(params);
case "admin_rso_notify_approved_calendar": return _handleAdminRsoNotifyCalendar(params);
case "admin_rso_notify_approved_guest_lists": return _handleAdminRsoNotifyGuestLists(params);
```

### Handler Implementation

```javascript
/**
 * HANDLER: _handleAdminRsoPendingDocuments (rso_approve only)
 * Lists documents awaiting RSO review
 */
function _handleAdminRsoPendingDocuments(p) {
  var auth = requireAuth(p.token, "rso_approve");
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
 * HANDLER: _handleAdminRsoApproveDocuments (rso_approve only)
 * RSO approves or rejects a document submission
 */
function _handleAdminRsoApproveDocuments(p) {
  var auth = requireAuth(p.token, "rso_approve");
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
 * HANDLER: _handleAdminRsoPendingGuestLists (rso_approve only)
 * Lists guest lists awaiting RSO review
 */
function _handleAdminRsoPendingGuestLists(p) {
  var auth = requireAuth(p.token, "rso_approve");
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
 * HANDLER: _handleAdminRsoApproveGuestList (rso_approve only)
 * RSO approves/rejects individual guests in a guest list
 */
function _handleAdminRsoApproveGuestList(p) {
  var auth = requireAuth(p.token, "rso_approve");
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

/**
 * HANDLER: _handleAdminRsoNotifyCalendar (rso_approve & rso_notify)
 * Get approved reservations for calendar view
 */
function _handleAdminRsoNotifyCalendar(p) {
  var auth = requireAuth(p.token, ["rso_approve", "rso_notify"]);
  if (!auth.ok) return auth.response;

  try {
    var month = p.month;  // "2026-04"
    var facility = p.facility || "all";

    var events = getApprovedCalendarEvents(month, facility);
    return successResponse({ count: events.length, events: events });
  } catch (e) {
    Logger.log("ERROR _handleAdminRsoNotifyCalendar: " + e);
    return errorResponse("Error loading calendar", "SERVER_ERROR");
  }
}

/**
 * HANDLER: _handleAdminRsoNotifyGuestLists (rso_approve & rso_notify)
 * Get approved guest lists for reference/coordination
 */
function _handleAdminRsoNotifyGuestLists(p) {
  var auth = requireAuth(p.token, ["rso_approve", "rso_notify"]);
  if (!auth.ok) return auth.response;

  try {
    var filters = p.filters || {};
    var guestLists = getApprovedGuestListsForRsoNotify(filters);
    return successResponse({ count: guestLists.length, guest_lists: guestLists });
  } catch (e) {
    Logger.log("ERROR _handleAdminRsoNotifyGuestLists: " + e);
    return errorResponse("Error loading guest lists", "SERVER_ERROR");
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
- [ ] **CRITICAL:** Update Administrators table: Change existing "rso" role entries to either "rso_approve" or "rso_notify"
- [ ] Update AuthService.js: Enhance `requireAuth()` to support role arrays (e.g., `["rso_approve", "rso_notify"]`)
- [ ] Add 6 new handlers to Code.js:
  - [ ] _handleAdminRsoPendingDocuments (rso_approve only)
  - [ ] _handleAdminRsoApproveDocuments (rso_approve only)
  - [ ] _handleAdminRsoPendingGuestLists (rso_approve only)
  - [ ] _handleAdminRsoApproveGuestList (rso_approve only)
  - [ ] _handleAdminRsoNotifyCalendar (rso_approve & rso_notify read-only)
  - [ ] _handleAdminRsoNotifyGuestLists (rso_approve & rso_notify read-only)
- [ ] Add helper functions to FileSubmissionService.js (getDocumentsForRsoReview, approveDocumentForRso)
- [ ] Add helper functions to ReservationService.js (getGuestListsForRsoReview, processRsoGuestListDecisions, getApprovedCalendarEvents)
- [ ] Update ApplicationService.js workflow to mark documents as rso_pending instead of generating links
- [ ] Add 4 new email templates:
  - [ ] ADM_DOCUMENT_APPROVED_BY_RSO
  - [ ] ADM_DOCUMENT_REJECTED_BY_RSO
  - [ ] ADM_DOCUMENTS_SUBMITTED_FOR_RSO_REVIEW
  - [ ] ADM_RSO_NOTIFY_EVENT_REMINDER (for rso_notify members)
- [ ] Update existing email template (ADM_BOARD_APPROVED_AWAITING_RSO) to remove link reference
- [ ] Add nightly task: sendRsoNotifyEventReminders() to NotificationService.js (sends daily event reminders to rso_notify members)
- [ ] Test all handlers with curl/Postman before UI implementation

### Phase 2: Frontend (Admin.html)
- [ ] Update login handler to detect RSO role (rso_approve or rso_notify) and store in sessionStorage
- [ ] Update conditional sidebar to show role-appropriate sections
  - [ ] rso_approve: Document Reviews, Guest List Reviews, Coordination (calendar + approved lists)
  - [ ] rso_notify: Calendar Coordination only (calendar + approved lists read-only)
  - [ ] Hide board-only sections from RSO roles
- [ ] Create RSO Documents page (admin_rso_documents) — **rso_approve only**
  - [ ] Filter by document type
  - [ ] Display document list with applicant info
  - [ ] Approve/Reject buttons with reason dialog
  - [ ] Audit trail display
- [ ] Create RSO Guest Lists page (admin_rso_guest_lists) — **rso_approve only**
  - [ ] Display pending guest lists by reservation
  - [ ] Table view of guests with individual approve/reject buttons
  - [ ] Finalize review button
  - [ ] Reason text input for rejections
- [ ] Create RSO Calendar page (admin_rso_calendar) — **rso_approve & rso_notify read-only**
  - [ ] Filter by facility and month
  - [ ] Display approved reservations grouped by date
  - [ ] Show household, contact, guest count, facility info
  - [ ] Read-only view for rso_notify
- [ ] Create RSO Approved Guest Lists page (admin_rso_approved_guest_lists) — **rso_approve & rso_notify read-only**
  - [ ] Filter by facility and month
  - [ ] Display approved guest lists with guest names
  - [ ] Show approval date and RSO reviewer name
  - [ ] Read-only reference for coordination
- [ ] Add CSS styling for new pages (calendar grid, guest list cards, etc.)
- [ ] Test RSO login flow and dashboard navigation (both roles)
- [ ] Test role-based access control (rso_notify cannot access approval pages)

### Phase 3: Documentation Updates
- [ ] Update CLAUDE_Membership_Implementation.md - STEP 7 (RSO portal login instead of links)
- [ ] Update CLAUDE_Reservations_Implementation.md - STEP 6 (RSO portal login instead of links)
- [ ] Add new section to CLAUDE.md explaining RSO portal access
- [ ] Update architecture diagram in GEA_System_Architecture.md

### Phase 4: Testing & Deployment
- [ ] Create test accounts in Administrators table:
  - [ ] test_rso_approve@example.com (role=rso_approve)
  - [ ] test_rso_notify@example.com (role=rso_notify)
- [ ] Test rso_approve role:
  - [ ] Can login and see approval sections
  - [ ] Can review and approve documents (documents disappear after approval)
  - [ ] Can review and approve guest lists (guests can be individually rejected)
  - [ ] Can view calendar and approved guest lists (read-only)
  - [ ] Audit log captures rso_approve email in all operations
- [ ] Test rso_notify role:
  - [ ] Can login and see calendar only
  - [ ] Cannot access document review page
  - [ ] Cannot access guest list review page
  - [ ] Can view approved calendar (read-only)
  - [ ] Can view approved guest lists (read-only)
  - [ ] Receives email notifications about upcoming events
- [ ] Test complete document review workflow (application → board → rso_approve → GEA admin)
- [ ] Test complete guest list review workflow (reservation → member submits → rso_approve → event)
- [ ] Verify email notifications:
  - [ ] Applicants receive rejection notices with RSO feedback
  - [ ] Households receive guest list rejection notices
  - [ ] rso_notify members receive daily event reminders
- [ ] Test role-based access control:
  - [ ] rso_notify cannot see board sections
  - [ ] board cannot see rso_approve sections
  - [ ] Conditional sidebar updates correctly on login
- [ ] Deploy to @HEAD and test in production
- [ ] Verify Administrators table has been updated (no old "rso" entries)
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

✅ **Authentication:** RSO members must log in with Administrators table credentials (same auth layer as board)
✅ **Authorization:** Enforced at handler level:
  - `requireAuth(p.token, "rso_approve")` — Approval handlers (documents, guest lists)
  - `requireAuth(p.token, ["rso_approve", "rso_notify"])` — Read-only handlers (calendar, approved lists)
  - rso_notify members cannot access approval workflows at code level
✅ **Audit Trail:** rso_reviewed_by captures individual RSO member email (not generic EMAIL_RSO_APPROVE)
✅ **Session Management:** Token expires after 24 hours; nightly purge of expired sessions
✅ **Input Validation:** All params validated before processing
✅ **Role Separation:**
  - rso_approve: Full approval authority (binding decisions)
  - rso_notify: Read-only coordination (no approval capability)
⚠️ **Data Leakage:**
  - rso_approve can see documents/guest lists pending their review
  - rso_notify can see approved items and calendar (no sensitive applicant data leaked)

---

## FAQ

**Q: What's the difference between rso_approve and rso_notify roles?**
A: rso_approve members review and make binding decisions on documents and guest lists. rso_notify members view the approved calendar and guest lists for coordination purposes only, and receive email notifications about upcoming events (proactive, no portal checking needed).

**Q: Can rso_approve members approve documents for applications they didn't originate?**
A: Yes. Any rso_approve member can log in and approve/reject any pending document. This is by design (shared responsibility, coverage).

**Q: What if an rso_approve member leaves and has pending documents?**
A: Another rso_approve member can complete the review. The documents remain in rso_pending status until reviewed (no owner field).

**Q: Can rso_notify members approve documents or guest lists?**
A: No. rso_notify members have read-only portal access. They cannot see approval sections and cannot make decisions. Authorization is enforced at the code level.

**Q: Can rso_notify members see board-only sections?**
A: No. The Admin.html sidebar conditionally shows only calendar and approved guest list sections for rso_notify. Navigation routing checks role before displaying pages.

**Q: Why doesn't rso_notify need to check the portal?**
A: rso_notify members receive daily email notifications about upcoming events (sendRsoNotifyEventReminders runs at 6:00 AM GMT+2). They don't need to log in unless they want to see the full calendar view for planning.

**Q: How many rso_approve members should we have?**
A: At least 2 for redundancy (if one is unavailable). All rso_approve members have full approval authority; no escalation or approval thresholds.

**Q: What happens to old one-time links?**
A: They remain functional but deprecated. Recommend disabling in runNightlyTasks() or removing token cleanup post-deployment.

---

**Last Updated:** March 24, 2026
**Status:** 🔄 PLANNED (Not yet implemented)
**Branch:** claude/rso-document-approval-bIjgi
**Architecture:** Dual-role RSO system (rso_approve for approvals, rso_notify for coordination/proactive notifications)
**Expected Implementation Time:** ~4–5 hours (backend + dual-role frontend + testing)

---

## Key Design Decisions

1. **Two RSO Roles:** Separating approval authority (rso_approve) from coordination (rso_notify) reduces risk and allows focused workflows
2. **No Portal Requirement for rso_notify:** Email-first notifications mean rso_notify members don't need to remember to check the portal
3. **Shared Responsibility for rso_approve:** Any rso_approve member can approve any document or guest list (no bottleneck if one member unavailable)
4. **Read-Only Calendar:** Both roles can view approved calendar for planning, but only rso_approve can approve
5. **Backward Compatibility:** Keep one-time links functional during transition period (Phase 5: Deprecation)
