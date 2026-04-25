# RSO Portal Guide

**Last Updated:** April 25, 2026

Complete operational guide for RSO (Resident Services Officer) team managing documents, events, and guest lists.

---

## RSO Roles & Access Levels

GEA has two RSO roles with different permission levels:

| Role | Can Do | Cannot Do |
|------|--------|----------|
| **rso_approve** | Review documents, approve/reject, review guest lists, manage guest list approvals | Approve applications, verify payments, manage members |
| **rso_notify** | View event calendar, view approved guest lists (read-only) | Approve documents, approve guest lists, make any changes |

**rso_approve** is the primary operational role. **rso_notify** is for staff who need to see what events are scheduled but can't make approval decisions.

---

## Quick Start: Daily RSO Tasks

### rso_approve Team:
1. **Documents Dashboard** → Review pending document approvals (passports, omangs)
2. **Documents Submitted** → Approve/reject documents from applicants and members
3. **Event Calendar** → Check today's and upcoming events
4. **Guest Lists** → Review guest list submissions; approve if ready

### rso_notify Team:
1. **Event Calendar** → View today's and upcoming events
2. **Approved Guest Lists** → View final guest lists (read-only)

---

## Document Review & Approval (rso_approve only)

**Location:** Admin.html → RSO → RSO Documents

### Understanding Document Approval

Documents go through a **2-stage approval process:**

1. **RSO Review** (You) — Verify document is legible, not expired, matches applicant
2. **GEA Admin Review** (Board) — Final approval after RSO sign-off

Only documents that pass RSO review go to the board. Your job is quality control.

### Document Types You Review

- **Passport** (applicants and members renewing)
- **Omang** (applicants and members renewing)
- **NOT photos** (photos go directly to board, you don't review those)

### Daily Document Review Tasks

1. **Review documents pending RSO approval:**
   - Dashboard shows count of pending documents
   - Click "RSO Documents" page → List shows pending submissions
   - Each submission shows:
     - Applicant/member name
     - Document type (passport or omang)
     - Expiration date
     - Submission date

2. **Evaluate a document:**
   - Click document → Detail pane shows full-size image
   - Check:
     - Is document legible? (Can you read all fields clearly?)
     - Is it the right type? (Passport/Omang matches requirement?)
     - Is it expired? (Expiration date passed?)
     - Does name match applicant/member? (No mismatches?)
   - Do NOT re-verify document authenticity (that's not your role)

3. **Approve a document:**
   - [Approve] button → Document marked as RSO-approved
   - Document moves to board for GEA admin review
   - Email sent to applicant/member confirming status
   - **Your work is done** at this point; board handles next step

4. **Reject a document:**
   - [Reject] button → Modal for reason
   - Enter clear, specific reason:
     - "Passport expired (expiration date: 2023-01-15)"
     - "Document image too blurry, can't read signature"
     - "Name on document doesn't match application record"
   - Email sent to applicant/member with rejection reason
   - They can resubmit new document for RSO review

### Quality Control Tips

- Check expiration dates carefully (allow 6+ months to document expiration, not expiring soon)
- Ensure photo matches applicant if visible (basic sanity check, not facial recognition)
- Mark unclear documents as rejected; better to get clear recopy than proceed with doubt
- Document rejections clearly so applicant knows how to fix it

---

## Member Document Resubmissions

**Location:** Admin.html → RSO → RSO Member Documents

Existing members sometimes need to resubmit documents (expired documents, quality issues).

**Same approval process as applicant documents:**
- Review for legibility, expiration, matching identity
- Approve → Board reviews
- Reject → Member resubmits

**Difference from applicants:** Member already has an account; rejection doesn't impact their membership status until the document is needed.

---

## Applications Ready for RSO Review

**Location:** Admin.html → RSO → RSO Applications

Shows applications that have passed board initial review and are ready for RSO document screening.

- **Display:** List of applicants with documents submitted
- **Your task:** Navigate to "RSO Documents" page for actual document review
- **This page:** Just shows which applications are waiting for RSO work (informational)

---

## Guest List Management (rso_approve only)

**Location:** Admin.html → Core Operations → Guest Lists

Guest lists submitted for board-approved facility reservations.

### Understanding Guest List Workflow

Members submit guest lists before their approved event. You review them for completeness and validity before they're finalized.

**Status flow:**
1. **submitted** → Awaiting RSO review (you)
2. **rso_reviewed** → RSO reviewed, sent back for edits (optional)
3. **finalized** → RSO approved; ready for event day

### Daily Guest List Tasks

1. **Review pending guest lists:**
   - List shows: household name, facility, event date, submission date
   - Click guest list → Detail pane shows:
     - Full reservation details (facility, date, time, guest count)
     - Guest list (each guest: name, relationship, age group, ID if vendor)
     - Special notes from household
     - [Approve] button
     - [Reject] button

2. **Evaluate guest list:**
   - Verify count matches (guest count in list = claimed guests)
   - Check relationships make sense (household members and invited guests)
   - Look for special notes (dietary needs, accessibility, etc.)
   - Ensure no security concerns (all guests identifiable)

3. **Approve guest list:**
   - [Approve] button → Guest list finalized
   - Status changes to "finalized"
   - Email confirmation sent to household
   - You're done; this list is ready for your team on event day

4. **Reject / Request Changes:**
   - [Reject] button → Modal for reason
   - Enter reason for rejection:
     - "Guest count (15) exceeds approved limit (10)"
     - "Guest list incomplete; missing names for 2 guests"
     - "Special dietary notes unclear; please clarify"
   - Email sent to household
   - Household makes corrections and resubmits
   - You review again

### Guest List Approval Tips

- **Count accuracy:** Add up guest list — must match approved guest count
- **Completeness:** All guests named (no "Guest 1, Guest 2" without names)
- **Relationships:** Spot-check that relationships make sense
- **Special needs:** Note any dietary, accessibility, or other requirements for event day
- **Timing:** Ideally review 3-5 days before event to allow time for corrections

---

## Event Calendar (All RSO Roles)

**Location:** Admin.html → RSO → RSO Calendar

Month view of all approved facility reservations.

### View Calendar

- **Month selector:** Choose which month to view
- **Facility selector (rso_approve only):** Filter by facility type
- **Color-coded:** Different colors for different facilities
- **Click event:** See full reservation details, guest count, household contact

### Use Cases

- **Plan your day:** See what events are happening today/this week
- **Identify no-shows:** If reservation shows but household didn't use facility
- **Event coordination:** Know who's using facilities and when
- **Quick lookup:** Find reservation details without going to admin pages

**rso_notify note:** Read-only view. You can see events but can't make changes.

---

## Approved Guest Lists (All RSO Roles)

**Location:** Admin.html → RSO → RSO Approved Guests

Final guest lists for events (all finalized and ready).

### View Approved Guest List

- List shows: event date, facility, household name
- Click event → Detail pane shows:
  - Full guest list (names, relationships, age groups)
  - Household contact info (phone, email)
  - Special notes (dietary needs, etc.)
  - (Read-only view)

### Use on Event Day

Print or screenshot this list:
- For security at the facility
- To verify guests match submitted list
- To note no-shows
- To communicate special requirements to facility staff

**Useful fields:**
- Guest names: Verify against photo ID if needed
- Relationships: Know who belongs to the household
- Age groups: For activities requiring age restrictions
- Special notes: Dietary needs, accessibility, other requirements

---

## RSO Daily Summary (rso_notify)

**Location:** Email (triggered daily at 6:00 AM GMT+2)

RSO team receives daily email at 6 AM listing events happening that day:

- Event date/time
- Facility
- Household name
- Guest count
- Special notes

Use this as a heads-up for:
- Setting up facilities
- Coordinating with household
- Preparing for special needs
- Managing facility access

---

## Common RSO Tasks

### Task: A document is expired but applicant needs to proceed

**Solution:**
- You reject the document ("Document expires 2023-01-15; too close to approval date")
- Applicant resubmits newer document
- You approve newer version
- Board gets clean approval chain

### Task: Guest list has too many guests for approved limit

**Solution:**
- Reject guest list ("Guest count 15 exceeds approved 10")
- Household reduces guest list
- You approve corrected list
- Event proceeds with correct approved count

### Task: Member asks to change guests after you approved list

**Solution:**
- That's outside your scope; changes to approved reservations go through board (Admin Reservations page)
- Redirect to board@geabotswana.org
- If guest list changes, household resubmits updated list for your review

### Task: You see a problem but don't know who to contact

**Solution:**
- Email board@geabotswana.org with details
- Subject: "RSO Question: [brief description]"
- Include: document type, applicant/member name, specific issue
- Board will help clarify or handle coordination

---

## Error Messages

If you see an error:

- **AUTH_REQUIRED:** Your session expired. Log out and log back in.
- **FORBIDDEN:** Your role doesn't have permission. Check that you're rso_approve (not rso_notify). Contact board if uncertain.
- **NOT_FOUND:** Document/application was deleted. Navigate back to the list.
- **INVALID_PARAM:** Form validation error. Check all required fields.
- **SERVER_ERROR:** System error. Try refreshing. If persists, contact board@geabotswana.org.

---

## Session Management

- **Login:** Email + password (same as admin login)
- **Session timeout:** 24 hours (sliding window)
- **Auto-logout:** If no activity for 24 hours
- **Logout:** Click logout in top-right corner

---

## Tips & Best Practices

### Document Review
- Check expiration dates carefully (at minimum 6 months remaining)
- Ensure legibility (if you can't read it, reject it and ask for clearer copy)
- Be consistent in your standards (all applicants treated same way)

### Guest List Review
- Verify math: count guests in list, ensure it matches approved guest count
- Look for special notes (dietary, accessibility) and make sure you can help accommodate
- Review 3-5 days before event to allow time for corrections

### Communication
- When rejecting documents, include specific reason and what's needed to fix
- When rejecting guest lists, be clear about what needs changing
- Respond promptly (ideally within 24 hours) so applicants/members aren't left wondering

### Time Management
- Review documents in batches (all pending at once rather than throughout the day)
- Check guest lists as they come in (closer to event date is riskier)
- Use calendar view at start of week to anticipate busy days

---

**Questions?** Email board@geabotswana.org or check [ADMIN_INTERFACE.md](../frontend/ADMIN_INTERFACE.md) for technical details.
