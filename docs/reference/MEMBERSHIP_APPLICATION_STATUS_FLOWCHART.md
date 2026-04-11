# Membership Application Status Flowchart

Complete status progression for membership applications from submission through activation, based on actual codebase constants and application flow.

**Note:** This documents actual status values from Config.js and application logic. Last verified April 11, 2026.

---

## Application Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                  MEMBERSHIP APPLICATION FLOW                     │
└─────────────────────────────────────────────────────────────────┘

                              START
                                │
                                ▼
                    ┌──────────────────────┐
                    │  AWAITING_DOCS       │
                    │ status=awaiting_docs │
                    │ (Account created,    │
                    │  applicant uploads)  │
                    └──────────────────────┘
                                │
                        (Applicant uploads
                         documents)
                                │
                                ▼
                    ┌──────────────────────┐
                    │ BOARD_INITIAL_REVIEW │
                    │ status=               │
                    │ board_initial_review  │
                    │ (Board scans docs)   │
                    └──────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │  RSO_DOCS_REVIEW     │
                    │ status=               │
                    │ rso_docs_review       │
                    │ (RSO reviews each)   │
                    └──────────────────────┘
                          │          │
             (RSO Reviews Each Doc)  │
                          │          │
                  ┌───────┴──────────┴────────┐
                  │                           │
                  ▼                           ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  Doc Approved    │      │  Doc Rejected    │
        │ submission       │      │ submission       │
        │ status=          │      │ status=          │
        │ gea_pending (ID) │      │ rso_rejected     │
        │ or "approved"    │      │                  │
        │ (photo)          │      │ (RSO can mark    │
        └──────────────────┘      │  allow_resubmit) │
                  │                └──────────────────┘
              (Loop: review                │
               next doc)            (Applicant can
                  │                 resubmit or
        ┌─────────┴─────────┐       blocked)
        │                   │           │
      (All docs approved)   │ ◄─────────┘
        │                   │
        ▼                   │
┌──────────────────────────┐    │
│ RSO_APPLICATION_REVIEW   │    │
│ status=                  │    │
│ rso_application_review   │    │
│ rso_status=""(set below) │    │
│ (Full application)       │    │
└──────────────────────────┘    │
        │                       │
    (RSO Reviews Org,           │
     Job Title, Category, Docs) │
        │                       │
    ┌───┴──────────────┐       │
    │                  │       │
    ▼                  ▼       ▼
┌──────────────┐  ┌────────────────────┐
│  RECOMMEND   │  │ RECOMMEND DENIAL   │
│  APPROVE     │  │                    │
│ rso_status=  │  │ status unchanged:  │
│ "docs_approved"  rso_application_rev │
│ rso_status=  │  │ rso_status=        │
│ "approved"   │  │ "denied_recommendation"
└──────────────┘  └────────────────────┘
       │                  │
       │                  │
       ▼                  ▼
┌──────────────────────────────────┐
│   BOARD_FINAL_REVIEW             │
│ status=board_final_review         │
│ (Shows RSO recommendation in UI)  │
└──────────────────────────────────┘
        │
    ┌───┴──────────────┬──────────────┐
    │                  │              │
    ▼                  ▼              ▼
┌─────────────┐  ┌──────────────┐ ┌────────────┐
│  APPROVE    │  │  OVERRIDE    │ │    DENY    │
│             │  │  DENIAL      │ │            │
│ status=     │  │  status=     │ │ status=    │
│approved_    │  │approved_     │ │  denied    │
│pending_     │  │pending_      │ │            │
│payment      │  │payment       │ │(Email sent)│
└─────────────┘  │ (Board can   │ └────────────┘
    │            │  still       │       │
    │            │  approve     │       │
    │            │  despite RSO)│       │
    │            └──────────────┘       │
    │                  │                │
    └──────────┬───────┘                │
              │                        │
              ▼                        ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ APPROVED_PENDING │    │  APPLICATION     │
    │ _PAYMENT         │    │  DENIED          │
    │ status=approved_ │    │  status=denied   │
    │ pending_payment  │    │ (Applicant       │
    │                  │    │  notified)       │
    │ (Applicant can   │    └──────────────────┘
    │  submit payment) │                │
    └──────────────────┘             (END)
              │
        (Applicant submits
         payment proof)
              │
              ▼
    ┌──────────────────┐
    │ PAYMENT_SUBMITTED│
    │ status=          │
    │ payment_submitted│
    │ (Treasurer       │
    │  reviewing)      │
    └──────────────────┘
              │
        (Treasurer verifies)
              │
        ┌─────┴──────┐
        │            │
        ▼            ▼
    ┌────────────┐  ┌──────────────┐
    │  VERIFIED  │  │   REJECTED   │
    │ status=    │  │ status=      │
    │payment_    │  │payment_      │
    │verified    │  │submitted     │
    │            │  │ (Applicant   │
    │            │  │  resubmits)  │
    └────────────┘  └──────────────┘
        │                  │
        │            ┌─────┘
        │            │
        ▼            │
    ┌─────────────────────────────┐
    │     ACTIVATED               │
    │ status=activated            │
    │ (Membership dates set,       │
    │  full portal access)        │
    └─────────────────────────────┘
            │
         (END)
```

---

## Status Legend

### Application States (Main `status` Field)

| Status Constant | Value | Actor | Meaning | Next Actions |
|--------|---------|-------|---------|--------------|
| `APP_STATUS_AWAITING_DOCS` | `awaiting_docs` | Applicant | Account created, applicant uploads documents | Upload passport/omang/photo |
| `APP_STATUS_BOARD_INITIAL_REVIEW` | `board_initial_review` | Board | Board scans documents for completeness | Check document quality, move to RSO review |
| `APP_STATUS_RSO_DOCS_REVIEW` | `rso_docs_review` | RSO | RSO reviews each document individually | Approve/reject each document submission |
| `APP_STATUS_RSO_APPLICATION_REVIEW` | `rso_application_review` | RSO | RSO reviews complete application context | Approve or recommend denial (see `rso_status` field) |
| `APP_STATUS_BOARD_FINAL_REVIEW` | `board_final_review` | Board | Ready for final approval decision | Approve or deny application |
| `APP_STATUS_APPROVED_PENDING_PAYMENT` | `approved_pending_payment` | Applicant | Board approved, applicant submits payment proof | Submit payment verification |
| `APP_STATUS_PAYMENT_SUBMITTED` | `payment_submitted` | Treasurer | Payment proof uploaded, awaiting verification | Verify payment or request clarification |
| `APP_STATUS_PAYMENT_VERIFIED` | `payment_verified` | System | Payment verified, ready for activation | Activate membership (next status) |
| `APP_STATUS_ACTIVATED` | `activated` | Applicant | **Membership active**, full portal access | Member can use all portal features |
| `APP_STATUS_DENIED` | `denied` | Applicant | Application not approved by board | (Cannot reapply without board decision) |
| `APP_STATUS_WITHDRAWN` | `withdrawn` | Applicant | Applicant withdrew application | (Withdrawn status) |

### Application Secondary Field: `rso_status`

Set during `rso_application_review` status to indicate RSO's recommendation:

| Value | Meaning | Board Action |
|--------|---------|--------------|
| `docs_approved` | RSO completed document review | Move to `board_final_review` |
| `approved` | RSO recommends approval | Move to `board_final_review` |
| `denied_recommendation` | RSO recommends denial | Stay at `rso_application_review`; board can override |
| `denied` | RSO confirmed denial | Application moves to `denied` |

### Document/File Submission States (File Submissions Sheet)

| Status | Meaning | RSO Role | Board Role |
|--------|---------|----------|-----------|
| `submitted` | Applicant uploaded document | Review needed | — |
| `gea_pending` | RSO approved (for ID docs) | ✓ Approved | Reviewing |
| `approved` | RSO approved (for photos/employment) | ✓ Approved | — (auto-approved) |
| `rso_rejected` | RSO rejected document | ✗ Rejected | — |
| `gea_rejected` | Board rejected document | — | ✗ Rejected |
| `verified` | Board approved (for ID docs) | ✓ Approved | ✓ Approved |

**Notes:**
- ID documents (passport, omang) flow: `submitted` → `gea_pending` (RSO) → `verified` (Board)
- Photos/employment: `submitted` → `approved` (RSO) → stays `approved` (auto-approved for photos)
- Rejection at RSO: `rso_rejected` (applicant may resubmit if allowed)
- Rejection at Board: `gea_rejected` (applicant may resubmit if allowed)

---

## Decision Trees

### RSO Document-Level Review
```
RSO Reviews Individual Document
(For each submission: passport, omang, photo, employment)
    │
    ├─ APPROVE
    │   └─ submission.status = "gea_pending" (ID docs) or "approved" (photos)
    │       └─ Next: Review next document or all docs done?
    │           ├─ More docs pending? → Loop to next RSO Document Review
    │           └─ All docs reviewed? → Call RSO application-level review
    │
    └─ REJECT
        └─ submission.status = "rso_rejected"
        ├─ allow_resubmit = TRUE
        │   └─ Next: Applicant can resubmit new document
        │       └─ Uploaded? → Loop back to RSO Document Review
        └─ allow_resubmit = FALSE
            └─ Next: Application blocked (requires board intervention)
                └─ Board may override and move forward anyway
```

### Application-Level RSO Review (After All Docs Reviewed)
```
RSO Reviews Complete Application
(Organization, job title, membership category, all documents)
    │
    ├─ RECOMMEND APPROVE
    │   └─ status = rso_application_review
    │   └─ rso_status = "approved"
    │       └─ Next: Move to BOARD_FINAL_REVIEW
    │           └─ Board makes final decision
    │
    └─ RECOMMEND DENIAL
        └─ status = rso_application_review (NO CHANGE)
        └─ rso_status = "denied_recommendation"
            └─ Next: Board Final Review (can override)
                ├─ BOARD APPROVES (override)
                │   └─ status = approved_pending_payment
                │   └─ Email: "Board approved despite RSO recommendation"
                └─ BOARD DENIES (agrees with RSO)
                    └─ status = denied
                    └─ Email: "Application denied"
```

### Board Final Review
```
Board Reviews Application at BOARD_FINAL_REVIEW status
(Can see RSO recommendation in rso_status field)
    │
    ├─ APPROVE
    │   └─ status = approved_pending_payment
    │   └─ board_final_status = "approved"
    │   └─ Email: Applicant notified to submit payment
    │
    └─ DENY
        └─ status = denied
        └─ board_final_status = "denied"
        └─ Email: Applicant notified of denial
```

**Note:** Board can also override RSO denial directly from `rso_application_review` status, moving application to `board_final_review` or `approved_pending_payment` depending on board decision.

### Payment Verification
```
Applicant Submits Payment Proof
(After status = approved_pending_payment)
    │
    └─ Treasurer Reviews in Admin Portal
        ├─ VERIFIED
        │   └─ status = payment_verified
        │       └─ Trigger: Activate membership
        │           └─ status = activated
        │           └─ membership_start_date, membership_expiration_date set
        │           └─ Email: "Membership activated"
        │           └─ Full member portal access unlocked
        │
        ├─ REJECTED
        │   └─ status = payment_submitted (stays same, reopen for resubmit)
        │   └─ Email: "Payment rejected, please resubmit"
        │       └─ Next: Applicant resubmits
        │           └─ Loop back to Treasurer review
        │
        └─ CLARIFICATION NEEDED
            └─ status = payment_submitted (stays same)
            └─ Email: "Please clarify payment details"
                └─ Next: Applicant provides more info
                    └─ Resubmit or Treasurer accepts original
```

---

## Email Notifications by Status Transition

### Applicant Receives:
| Trigger | Email Template |
|---------|----------------|
| Application submitted (`awaiting_docs`) | MEM_APPLICATION_RECEIVED_TO_APPLICANT |
| Board approves (`approved_pending_payment`) | MEM_APPLICATION_APPROVED_TO_APPLICANT (includes dues amount) |
| Applicant submits payment proof (`payment_submitted`) | PAY_PAYMENT_SUBMITTED_TO_MEMBER |
| Treasurer verifies payment (`activated`) | MEM_MEMBERSHIP_ACTIVATED_TO_MEMBER |
| Board denies (`denied`) | MEM_APPLICATION_DENIED_TO_APPLICANT |
| Treasurer rejects payment (`payment_submitted`, reopen) | PAY_PAYMENT_REJECTED_TO_MEMBER |
| RSO approves individual document | ADM_DOCUMENT_APPROVED_BY_RSO_TO_MEMBER |
| RSO rejects individual document | (Board handles communication) |

### Board Receives:
| Trigger | Email Template |
|---------|----------------|
| New application submitted | ADM_NEW_APPLICATION_BOARD_TO_BOARD |
| RSO completes all document review | ADM_RSO_ALL_DOCS_APPROVED_TO_BOARD |
| RSO recommends denial | ADM_RSO_APPLICATION_DENIED_TO_BOARD (with board override option) |
| RSO rejects document | ADM_RSO_DOCUMENT_ISSUE_TO_BOARD |
| Applicant submits payment proof | PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD |
| Treasurer verifies & activates | PAY_PAYMENT_VERIFIED_ACTIVATED_BOARD_FYI_TO_BOARD |

### RSO Receives:
| Trigger | Delivery Method |
|---------|-----------------|
| Documents ready for review | ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE (email) |
| (Application status updates) | Visible in RSO portal dashboard |

---

## Key Rules & Constraints

### Document Re-submission
- RSO can set `allow_resubmit=TRUE` or `FALSE` on rejection
- If `TRUE`: Applicant can upload new document; loops back to RSO review
- If `FALSE`: Applicant cannot proceed; application stuck (board intervention needed)

### Expiration Tracking
- All ID documents (passport, omang) now capture `expiration_date`
- Used for compliance verification
- RSO can see expiration when reviewing

### Board Override Authority
- Board can **override RSO denial recommendation**
- When overriding, special email sent to board (for audit trail)
- Override recorded in audit log with user who overrode

### Payment Verification States
- `payment_submitted` → Treasurer reviews
- `payment_verified` → Automatically activates membership
- `payment_rejected` → Loop back (applicant resubmits)
- `payment_clarification_requested` → Applicant responds (not in main loop above, but documented in Config)

### Applicant Portal Access by Status

| Status | Applicant Can... |
|--------|-----------------|
| `awaiting_docs` | Upload documents (passport, omang, photo) |
| `board_initial_review` | View application (read-only) |
| `rso_docs_review` | View application (read-only) |
| `rso_application_review` | View application (read-only) |
| `board_final_review` | View application (read-only) |
| `approved_pending_payment` | Submit payment proof with file upload |
| `payment_submitted` | View payment submission status |
| `payment_verified` | (Brief status before activation) |
| `activated` | **FULL ACCESS:** Reservations, profile, card, view payment history |
| `denied` | View decision only (read-only) |
| `withdrawn` | View application (read-only) |

---

## Database Representation

### Membership Applications Sheet Columns

**Core Application Fields:**
```
application_id              (APP-2026-001)
household_id                (HSH-2026-001, auto-created)
individual_id               (IND-2026-001, primary applicant, auto-created)
primary_applicant_name      (First Last)
primary_applicant_email     (email@example.com)
```

**Status Fields:**
```
status                      (awaiting_docs, board_initial_review, rso_docs_review,
                             rso_application_review, board_final_review,
                             approved_pending_payment, payment_submitted,
                             payment_verified, activated, denied, withdrawn)
rso_status                  (docs_approved, approved, denied_recommendation, denied)
board_initial_status        (reviewed, pending)
board_initial_reviewed_by   (board member email)
board_initial_review_date   (timestamp)
board_final_status          (approved, denied)
board_final_reviewed_by     (board member email)
board_final_review_date     (timestamp)
```

**Review & Audit Fields:**
```
rso_reviewed_by             (RSO email)
rso_review_date             (timestamp)
rso_private_notes           (internal notes, e.g. denial reason)
submission_date             (when applicant submitted form)
rules_agreement_timestamp   (when applicant agreed to rules)
```

**Membership Fields:**
```
membership_category         (determined by eligibility questions)
membership_start_date       (set when payment verified)
membership_expiration_date  (set when payment verified)
```

**Payment Fields:**
```
payment_reference           (LASTNAME_YEAR-YEAR, e.g. SMITH_25-26)
payment_amount_due          (in BWP, calculated by quarter)
```

### File Submissions Sheet (Documents)

**Core Submission Fields:**
```
submission_id               (FSB-2026-001)
individual_id               (IND-2026-001)
document_type               (passport, omang, photo, employment)
file_id                     (Google Drive file ID)
file_name                   (original filename)
file_size_bytes             (document size)
file_content_type           (image/jpeg, etc.)
```

**Status Fields:**
```
status                      (submitted, gea_pending, approved, rso_rejected,
                             gea_rejected, verified)

                             For ID docs: submitted → gea_pending → verified
                             For photos: submitted → approved
                             Rejections: rso_rejected or gea_rejected
```

**Review & Audit:**
```
submitted_date              (timestamp)
rso_reviewed_by             (RSO email if rejected at RSO level)
rso_review_date             (timestamp)
gea_reviewed_by             (Board email)
gea_review_date             (timestamp)
member_facing_rejection_reason (text shown to applicant)
allow_resubmit              (TRUE/FALSE, set by RSO on rejection)
```

**Metadata:**
```
expiration_date             (for ID documents - passport/omang)
is_current                  (TRUE if active, FALSE if superseded)
disabled_date               (when superseded by newer approval)
cloud_storage_path          (gs://... for photos after approval)
upload_device_type          (browser, mobile, etc.)
user_email                  (who uploaded)
```

---

## Status Transitions Summary

```
PRIMARY APPLICATION STATUS FLOW:

Approval Path:
  awaiting_docs
    → board_initial_review
    → rso_docs_review
    → rso_application_review [rso_status="approved"]
    → board_final_review
    → approved_pending_payment
    → payment_submitted
    → payment_verified
    → activated (END - SUCCESS)

Denial Path (RSO Recommends, Board Agrees):
  awaiting_docs
    → board_initial_review
    → rso_docs_review
    → rso_application_review [rso_status="denied_recommendation"]
    → board_final_review
    → denied (END - DENIED)

Override Path (RSO Recommends Denial, Board Overrides):
  awaiting_docs
    → board_initial_review
    → rso_docs_review
    → rso_application_review [rso_status="denied_recommendation"]
    → board_final_review
    → approved_pending_payment
    → payment_submitted
    → payment_verified
    → activated (END - SUCCESS, despite RSO concern)

Payment Rejection Path:
  approved_pending_payment
    → payment_submitted
    → payment_submitted (reopened, if rejected)
    → [applicant resubmits]
    → payment_submitted
    → payment_verified
    → activated

Withdrawal:
  [any status]
    → withdrawn (END - WITHDRAWN)
```

**Secondary Status Field:** `rso_status`
- Set during `rso_application_review` status
- Values: `docs_approved`, `approved`, `denied_recommendation`, `denied`
- Used by board to see RSO recommendation

---

## Visual: Status Graph (Mermaid Style)

```
graph TD
    A["awaiting_docs"] --> B["board_initial_review"]
    B --> C["rso_docs_review"]
    C -->|doc approved| C
    C -->|doc rejected, allow_resubmit=TRUE| A
    C -->|all docs approved| D["rso_application_review"]
    D -->|recommend approve<br/>rso_status=approved| E["board_final_review"]
    D -->|recommend deny<br/>rso_status=denied_recommendation| E
    E -->|approve| F["approved_pending_payment"]
    E -->|deny| G["denied"]
    F --> H["payment_submitted"]
    H -->|verified| I["payment_verified"]
    I --> J["activated"]
    H -->|rejected| H
    G --> K["(END - DENIED)"]
    J --> L["(END - ACTIVE)"]
    A -.->|withdraw| M["withdrawn"]
    D -.->|withdraw| M

    style A fill:#e1f5ff
    style J fill:#c8e6c9
    style L fill:#c8e6c9
    style G fill:#ffcdd2
    style K fill:#ffcdd2
    style M fill:#fff9c4
```

---

## Notes for Developers

### Status Constants (from Config.js)
All status values should use constants from Config.js, NOT hardcoded strings:
```javascript
// Correct:
if (status === APP_STATUS_AWAITING_DOCS) { ... }

// Wrong:
if (status === "awaiting_docs") { ... }  // Don't hardcode
```

**Constants Defined:**
- `APP_STATUS_AWAITING_DOCS` = "awaiting_docs"
- `APP_STATUS_BOARD_INITIAL_REVIEW` = "board_initial_review"
- `APP_STATUS_RSO_DOCS_REVIEW` = "rso_docs_review"
- `APP_STATUS_RSO_APPLICATION_REVIEW` = "rso_application_review"
- `APP_STATUS_BOARD_FINAL_REVIEW` = "board_final_review"
- `APP_STATUS_APPROVED_PENDING_PAYMENT` = "approved_pending_payment"
- `APP_STATUS_PAYMENT_SUBMITTED` = "payment_submitted"
- `APP_STATUS_PAYMENT_VERIFIED` = "payment_verified"
- `APP_STATUS_ACTIVATED` = "activated"
- `APP_STATUS_DENIED` = "denied"
- `APP_STATUS_WITHDRAWN` = "withdrawn"

### Secondary Status Field
The `rso_status` field is a separate column in Membership Applications sheet:
- Only set during `rso_application_review` status
- Values: "docs_approved", "approved", "denied_recommendation", "denied"
- Board reads this field to see RSO recommendation
- NOT a primary status — main status field determines workflow

### Timestamps & Timezone
- **Stored:** All timestamps in UTC in spreadsheet
- **Displayed:** Show in Africa/Johannesburg timezone (GMT+2)
- Use `Utilities.formatDate()` for display, store raw Date objects

### Document Statuses (File Submissions Sheet)
- NOT the same as application statuses
- Values: "submitted", "gea_pending", "approved", "rso_rejected", "gea_rejected", "verified"
- Photo flow: `submitted` → `approved` (auto-approved by GEA)
- ID doc flow: `submitted` → `gea_pending` (RSO) → `verified` (Board)
- Rejection: `rso_rejected` (RSO) or `gea_rejected` (Board)

### Email Templates
All email sending uses semantic names (NOT numeric IDs):
```javascript
// Correct:
sendEmailFromTemplate("ADM_RSO_APPLICATION_DENIED_TO_BOARD", boardEmail, vars);

// Wrong:
sendEmailFromTemplate("tpl_050", boardEmail, vars);  // Don't use old numeric IDs
```

### Audit Logging
Every status change must log to Audit Log:
```javascript
logAuditEntry(userEmail, "APPLICATION_STATUS_CHANGED", "Application", appId,
  "Status changed from " + oldStatus + " to " + newStatus);
```

### Role-Based Access
- **Applicant:** Can view own application status
- **RSO:** Can review documents and provide recommendation (rso_status field)
- **Board:** Can see entire application including RSO recommendation
- **Treasurer:** Can verify/reject payments only

### Key Business Rules
1. **RSO Denial is Recommendation, Not Final:** Board can override (see board override flow above)
2. **Document Re-submission:** RSO can allow or block resubmission via `allow_resubmit` field
3. **Payment is One-Way:** No auto-correction; treasurer must manually verify or reject
4. **No Partial Status:** Application must move through all review stages (no skipping)
5. **Activation is Automatic:** Once `payment_verified`, automatically set to `activated`
