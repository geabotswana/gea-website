# Membership Application Status Flowchart

Complete status progression for membership applications from submission through activation.

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
                    │ SUBMISSION RECEIVED  │
                    │ status=received      │
                    │ (Account created)    │
                    └──────────────────────┘
                                │
                                ▼
                    ┌──────────────────────┐
                    │  DOCUMENTS REQUIRED  │
                    │ status=pending_docs  │
                    │ (Awaiting upload)    │
                    └──────────────────────┘
                                │
                        (Applicant uploads docs)
                                │
                                ▼
                    ┌──────────────────────┐
                    │  RSO DOCUMENT REVIEW │
                    │ status=rso_review    │
                    │ (Documents pending)  │
                    └──────────────────────┘
                          │          │
             (RSO Reviews Each Doc)  │
                          │          │
                  ┌───────┴──────────┴────────┐
                  │                           │
                  ▼                           ▼
        ┌──────────────────┐      ┌──────────────────┐
        │  Doc Approved    │      │  Doc Rejected    │
        │ status=          │      │ status=          │
        │ rso_approved     │      │ rso_rejected     │
        └──────────────────┘      └──────────────────┘
                  │                           │
              (Loop: review                (Applicant can
               next doc)                   resubmit if
                  │                        allow_resubmit=T)
                  │                           │
        ┌─────────┴─────────┐                │
        │                   │                │
      (All docs approved)   │ ◄──────────────┘
        │                   │
        ▼                   │
┌──────────────────────┐    │
│ RSO APPLICATION LVLV │    │
│ status=rso_review    │    │
│ (Full context)       │    │
└──────────────────────┘    │
        │                   │
    (RSO Reviews Org,        │
     Job Title, Category)    │
        │                   │
    ┌───┴──────────────┐   │
    │                  │   │
    ▼                  ▼   ▼
┌─────────────┐  ┌────────────┐
│  Recommend  │  │ Recommend  │
│  APPROVE    │  │ DENY       │
│ status=     │  │ status=    │
│ rso_ready   │  │ rso_denial │
│ _for_board  │  │ _recommended
└─────────────┘  └────────────┘
    │                  │
    │                  │
    ▼                  ▼
┌──────────────────────────────────┐
│   BOARD FINAL REVIEW             │
│ status=board_review              │
│ (Shows RSO recommendation)        │
└──────────────────────────────────┘
        │
    ┌───┴──────────────┬──────────────┐
    │                  │              │
    ▼                  ▼              ▼
┌─────────┐    ┌─────────────┐  ┌────────────┐
│ APPROVE │    │ OVERRIDE    │  │   DENY     │
│         │    │ DENIAL      │  │            │
│ status= │    │ status=     │  │ status=    │
│ board_  │    │ board_      │  │ board_     │
│ approved│    │ approved    │  │ denied     │
└─────────┘    │ (despite    │  └────────────┘
   │           │  RSO rec)   │       │
   │           └─────────────┘       │
   │                  │              │
   └──────────┬───────┘              │
              │                      │
              ▼                      ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ PAYMENT DUE      │    │ APPLICATION      │
    │ status=payment   │    │ DENIED           │
    │ _due             │    │ status=denied    │
    │                  │    │ (Email sent)     │
    └──────────────────┘    └──────────────────┘
              │                      │
        (Applicant submits               │
         payment proof)             ┌────┴──────────┐
              │                     │               │
              ▼                     │            (END)
    ┌──────────────────┐            │
    │ PAYMENT PENDING  │            │
    │ status=payment   │            │
    │ _submitted       │            │
    └──────────────────┘            │
              │                     │
        (Treasurer verifies)        │
              │                     │
        ┌─────┴──────┐              │
        │            │              │
        ▼            ▼              │
    ┌────────┐  ┌──────────┐      │
    │Verified│  │ Rejected │      │
    │status= │  │status=   │      │
    │payment │  │payment   │      │
    │verified│  │rejected  │      │
    └────────┘  └──────────┘      │
        │            │             │
        │       (Resubmit         │
        │        allowed)          │
        │            │             │
        │      ┌──────┴───────────┐│
        │      │                  ││
        ▼      │                  ││
    ┌──────────────────────────┐  ││
    │  MEMBERSHIP ACTIVATED    │  ││
    │  status=active           │◄─┘│
    │ (Dates set, full access) │   │
    └──────────────────────────┘   │
            │                       │
         (END)              (Loop back to
                           PAYMENT DUE)
```

---

## Status Legend

### Application States

| Status | Display Name | Actor | Meaning | Next Actions |
|--------|-------------|-------|---------|--------------|
| `received` | Application Received | Applicant | Initial submission complete | Wait for board to start review |
| `pending_docs` | Awaiting Documents | Applicant | Account ready, need to upload docs | Upload passport/omang/photo |
| `rso_review` | RSO Reviewing Documents | RSO | Documents submitted, RSO checking | Approve/reject each document |
| `rso_approved` | Documents RSO Approved | Applicant | All documents passed RSO review | Wait for board final review |
| `rso_rejection_recommended` | RSO Rejection Recommended | Board | RSO recommends not approving | Override (approve anyway) or accept (deny) |
| `board_review` | Board Final Review | Board | Ready for board decision | Approve or deny application |
| `board_approved` | Approved - Payment Due | Applicant | Board approved membership | Submit payment proof |
| `payment_submitted` | Payment Pending | Treasurer | Payment proof uploaded | Verify payment |
| `payment_verified` | Payment Verified | Applicant | Membership activated | Full portal access unlocked |
| `denied` | Application Denied | Applicant | Application not approved | Cannot reapply (pending board policy) |
| `payment_rejected` | Payment Rejected | Applicant | Payment proof invalid | Resubmit new payment proof |

### Document States (File Submissions Sheet)

| Status | Meaning |
|--------|---------|
| `submitted` | Applicant uploaded document |
| `rso_approved` | RSO approved document |
| `rso_rejected` | RSO rejected document (may allow resubmit) |
| `gea_pending` | Board reviewing document |
| `gea_approved` / `verified` | Document final approved |
| `gea_rejected` | Board rejected document |

---

## Decision Trees

### RSO Document Review
```
RSO Reviews Document
    ├─ APPROVE
    │   └─ status="rso_approved"
    │       └─ Next: Review next document or all docs done?
    │           ├─ More docs? → Loop to next RSO Document Review
    │           └─ All done? → Application-Level RSO Approval
    │
    └─ REJECT
        └─ status="rso_rejected"
        ├─ allow_resubmit=TRUE
        │   └─ Next: Applicant can upload new document
        │       └─ Uploaded? → Loop to RSO Document Review
        └─ allow_resubmit=FALSE
            └─ Next: Application fails (no path forward)
```

### Application-Level RSO Approval
```
RSO Reviews Complete Application
(Organization, Job Title, Category, All Docs)
    │
    ├─ RECOMMEND APPROVE
    │   └─ status="rso_ready_for_board"
    │       └─ Next: Board Final Review
    │
    └─ RECOMMEND DENY
        └─ status="rso_denial_recommended"
            └─ Next: Board Decision
                ├─ BOARD APPROVES (override)
                │   └─ status="board_approved" → Payment Due
                └─ BOARD DENIES (accepts RSO)
                    └─ status="denied" → END
```

### Board Final Review
```
Board Reviews Application
(Sees RSO recommendation)
    │
    ├─ APPROVE
    │   ├─ RSO recommendation was "approve"
    │   │   └─ status="board_approved"
    │   └─ RSO recommendation was "deny"
    │       └─ status="board_approved" (OVERRIDE)
    │           └─ Email: "Board approved despite RSO concern"
    │
    └─ DENY
        ├─ RSO recommendation was "deny"
        │   └─ status="denied"
        │       └─ Email: "RSO and Board both recommend denial"
        └─ RSO recommendation was "approve"
            └─ status="denied" (OVERRIDE)
                └─ Email: "Board declined (RSO had no concern)"
```

### Payment Verification
```
Applicant Submits Payment
    │
    └─ Treasurer Reviews
        ├─ VERIFIED
        │   └─ status="payment_verified"
        │       └─ status="active" (Membership activated)
        │           └─ Full member portal access unlocked
        │
        ├─ REJECTED
        │   └─ status="payment_rejected"
        │       └─ Next: Applicant resubmits
        │           └─ Loop back to payment_submitted
        │
        └─ CLARIFICATION NEEDED
            └─ status="payment_clarification_requested"
                └─ Next: Applicant provides more info
                    └─ Resubmit or original accepted
```

---

## Email Notifications by Status

### Applicant Receives:
| Status Change | Email Template |
|----------------|----------------|
| `received` → `pending_docs` | MEM_APPLICATION_RECEIVED_TO_APPLICANT |
| `board_approved` | MEM_APPLICATION_APPROVED_TO_APPLICANT (includes payment amount) |
| `payment_submitted` | PAY_PAYMENT_SUBMITTED_TO_MEMBER |
| `payment_verified` | MEM_MEMBERSHIP_ACTIVATED_TO_MEMBER |
| `denied` | MEM_APPLICATION_DENIED_TO_APPLICANT |
| `payment_rejected` | PAY_PAYMENT_REJECTED_TO_MEMBER |
| `rso_document_approved` | ADM_DOCUMENT_APPROVED_BY_RSO_TO_MEMBER |
| `rso_document_rejected` | ADM_RSO_DOCUMENT_ISSUE_TO_BOARD (board relays) |

### Board Receives:
| Status Change | Email Template |
|----------------|----------------|
| `pending_docs` (new app) | ADM_NEW_APPLICATION_BOARD_TO_BOARD |
| `rso_all_docs_approved` | ADM_RSO_ALL_DOCS_APPROVED_TO_BOARD |
| `rso_denial_recommended` | ADM_RSO_APPLICATION_DENIED_TO_BOARD (with override option) |
| `rso_document_rejected` | ADM_RSO_DOCUMENT_ISSUE_TO_BOARD |
| `payment_submitted` | PAY_PAYMENT_SUBMITTED_BOARD_FYI_TO_BOARD |
| `payment_verified` (activates) | PAY_PAYMENT_VERIFIED_ACTIVATED_BOARD_FYI_TO_BOARD |

### RSO Receives:
| Status Change | Email Template |
|----------------|----------------|
| Documents uploaded | ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE |
| (Dashboard view) | (No email; check portal) |

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

### Applicant Portal Access
- `received` through `board_approved`: Read-only restricted view
- `board_approved` through `payment_verified`: Can upload payment proof only
- `active`: Full member portal access (reservations, profile, etc.)
- `denied`: Account stays but read-only (for applicant to see decision)

---

## Database Representation

### Membership Applications Sheet Columns
```
application_id          (APP-2026-001)
household_id            (HSH-2026-001)
individual_id           (IND-2026-001, primary applicant)
status                  (received, pending_docs, rso_review, board_approved, active, denied, etc.)
submission_date         (timestamp)
rules_agreement_timestamp (timestamp when applicant agreed to rules)
membership_category     (determined during application)
membership_start_date   (set after board approval)
membership_expiration_date (set after payment verified)
notes                   (board decision notes)
```

### File Submissions Sheet (Documents)
```
submission_id           (SUB-2026-001)
individual_id           (IND-2026-001)
document_type           (passport, omang, photo, employment)
status                  (submitted, rso_approved, rso_rejected, gea_approved, verified, etc.)
rso_reviewed_by         (RSO user email)
rso_review_date         (timestamp)
gea_reviewed_by         (Board user email)
gea_review_date         (timestamp)
rejection_reason        (text if rejected)
allow_resubmit          (TRUE/FALSE)
expiration_date         (for ID documents)
is_current              (TRUE if active, FALSE if superseded)
cloud_storage_path      (gs://... for photos after approval)
```

---

## Status Transitions Summary

```
Application Lifecycle:
  received
    → pending_docs
    → rso_review
    → rso_ready_for_board (or rso_denial_recommended)
    → board_review (or denied if RSO denial + board accepts)
    → board_approved (or denied if board rejects)
    → payment_due
    → payment_submitted
    → payment_verified (or payment_rejected → loop back)
    → active

Denial Path:
  [any status before board approval]
    → denied (END)
    → Read-only applicant portal view

Rejection Paths:
  rso_rejected with allow_resubmit=TRUE
    → Applicant can re-upload document
    → Loop back to rso_review

  payment_rejected
    → Applicant can resubmit payment proof
    → Loop back to payment_submitted
```

---

## Visual: Status Graph (Mermaid Style)

```
graph TD
    A["received"] --> B["pending_docs"]
    B --> C["rso_review"]
    C -->|doc approved| C
    C -->|doc rejected + allow_resubmit| B
    C -->|all docs approved| D["rso_app_review"]
    D -->|recommend approve| E["rso_ready_for_board"]
    D -->|recommend deny| F["rso_denial_recommended"]
    E --> G["board_review"]
    F --> G
    G -->|approve| H["board_approved"]
    G -->|deny| I["denied"]
    H --> J["payment_due"]
    J --> K["payment_submitted"]
    K -->|verified| L["active"]
    K -->|rejected| J
    I --> M["(END - DENIED)"]
    L --> N["(END - ACTIVE)"]

    style A fill:#e1f5ff
    style L fill:#c8e6c9
    style I fill:#ffcdd2
    style M fill:#ffcdd2
    style N fill:#c8e6c9
```

---

## Notes for Developers

1. **Status values are case-sensitive** in database queries
2. **Timestamps always stored in UTC**, displayed in Africa/Johannesburg timezone
3. **Email templates use semantic names** (ADM_, MEM_, PAY_, etc.)
4. **All status changes logged to Audit Log** with user email and timestamp
5. **RSO can only view applicants** in `rso_review` or `rso_denial_recommended` states
6. **Board sees all applicants** in `board_review` and later states
7. **Payment reconciliation requires treasurer verification** (no auto-approve)
