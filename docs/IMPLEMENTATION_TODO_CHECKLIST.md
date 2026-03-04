# Implementation TODO Checklist

**Purpose:** Comprehensive inventory of all outstanding items (TBDs) from the 9 implementation guides. Board must specify these items before developers can implement the system.

**Last Updated:** March 4, 2026
**Status:** Ready for board review and approval

---

## Phase 1: High-Priority TBDs (Blocking Implementation)

These must be completed before any Phase 1 guide can move to development.

### **CLAUDE_Membership_Implementation.md** (10 items)

#### Application Form & Data Structure
- [ ] **Employment Information Fields** — Specify exact fields to capture
  - Job title?
  - Department?
  - Posting date?
  - Employment status (full-time, contract, etc.)?
  - Sponsor company name?
  - Any other employment data?

- [ ] **Document Requirements by Category** — Define requirements per category
  - Photo dimensions/DPI/file size limits
  - Which categories require passport vs omang vs diplomatic passport?
  - Diplomatic passport vs regular passport distinction

- [ ] **Household Staff Details** — Define what information to capture
  - Name, role (nanny, housekeeper, driver, etc.), relationship?
  - Contact info?
  - Employment dates?
  - How many fields total?

- [ ] **Family Member Fields** — Define beyond name/email/phone
  - Age thresholds for `age_category` (Youth, Child)?
  - Need spouse employment info?
  - Spouse employer name?
  - Children: full legal names required or first/last sufficient?

#### Payment & Verification
- [ ] **Payment Amounts Confirmation** — Verify USD dues structure
  - Confirm: Full $50/$100, Associate $50/$100, Affiliate $50/$100, Diplomatic $75/$150, Community $75/$150, Temporary $20?
  - Or different amounts?

- [ ] **BWP Exchange Rate Mechanism** — Define currency handling
  - Fixed rate (set quarterly) OR floating rate (daily update) OR monthly update?
  - Who updates rates? When?
  - Display both USD and current BWP amount to applicants?

- [ ] **Sponsorship Verification Process** — Specify exact method
  - Email confirmation to sponsor?
  - Board manual verification in directory?
  - Automatic lookup by email?
  - Any approval required from sponsor?

#### Policies & Timelines
- [ ] **Rejection Appeal Process** — Define appeals handling
  - Who reviews appeals?
  - Timeline for appeal decision?
  - Can appeals be refused?
  - Can applicant reapply after appeal?

- [ ] **Payment Verification Deadline** — Confirm timing
  - Is 2 business days correct for treasurer verification?
  - Or should it be 1 business day? 3 business days? 5 business days?

- [ ] **Temporary Member Renewal** — Define renewal process
  - Can temporary members renew on same email?
  - Or must they submit new application?
  - Different workflow?

---

## Phase 2: Medium-Priority TBDs

These are important for completeness but don't block core implementation.

### **CLAUDE_Deployment.md** (1 item)

- [ ] **Production Deployment ID** — Record when versioned deployment created
  - Current: [Specific ID TBD]
  - Needed: Actual deployment ID when ready for production

### **CLAUDE_DisasterRecovery.md** (4 items)

- [ ] **RTO Target** — Define Recovery Time Objective
  - What is acceptable service downtime? (e.g., 4 hours, 1 hour, 15 minutes?)

- [ ] **RPO Target** — Define Recovery Point Objective
  - What data loss is acceptable? (e.g., 1 hour, 1 day, 1 week?)

- [ ] **Backup Storage Location** — Specify secure backup location
  - Board member secure location where? (encrypted drive, safe, etc.)
  - Who has access?

- [ ] **Backup Encryption Method** — Specify encryption standard
  - BitLocker (Windows)?
  - FileVault (Mac)?
  - VeraCrypt?
  - Other?

### **CLAUDE_Security.md** (2 items)

- [ ] **Disaster Recovery RTO** — Define service restoration target (hours/minutes)
- [ ] **Disaster Recovery RPO** — Define acceptable data loss window
- [ ] **Disaster Recovery Runbook** — Provide step-by-step restoration procedures

---

## Phase 3: Lower-Priority TBDs

These are implementation details for Phase 3 guides (60% & 50% ready). Less critical but needed for full implementation.

### **CLAUDE_Google_APIs_Integration.md** (15+ items)

#### File Handling
- [ ] **File Upload Handler Implementation** — Specify exact implementation
  - Parameters, return values, error handling

- [ ] **File Download Handler Implementation** — Specify exact implementation
  - Parameters, return values, error handling

- [ ] **Image Proxy Authentication** — Define access control
  - Only owner/GEA staff?
  - How to verify?

#### Calendar Integration
- [ ] **Event Creation Handler** — Specify implementation
  - Title format, description content, attendee handling

- [ ] **Event Update Handler** — Specify implementation
  - What fields can be updated?
  - How to handle conflicts?

- [ ] **Event Deletion Handler** — Specify implementation
  - Cleanup procedures?
  - Archive deleted events?

#### Cloud Storage
- [ ] **Photo Upload to Cloud Storage** — Specify implementation
  - Bucket path format confirmation
  - File naming convention
  - Metadata to store

- [ ] **Photo Retrieval for Card Display** — Specify implementation
  - Public URL generation
  - Access controls

#### APIs & Quotas
- [ ] **Cloud Storage Quotas** — Verify bucket quotas
  - Storage limits?
  - Download limits?
  - API rate limits?

- [ ] **Drive API Quotas** — Verify Drive API quotas
  - Read/write limits?
  - File size limits?

- [ ] **Calendar API Quotas** — Verify Calendar API quotas
  - Event creation limits?
  - Batch operation limits?

#### Caching & Performance
- [ ] **Quota Monitoring Strategy** — Define quota tracking
  - Alert thresholds?
  - Monitoring frequency?

- [ ] **Distributed Caching Implementation** — Specify caching strategy
  - Properties Service? Cache Service?
  - Cache invalidation triggers?
  - Warming strategy?

#### Error Handling
- [ ] **Robust Error Handling** — Specify error recovery
  - Exponential backoff parameters?
  - Retry limits?
  - Logging strategy?

#### Holiday Calendar
- [ ] **Holiday Calendar Integration** — Define holiday handling
  - How to load US Federal holidays?
  - How to load Botswana public holidays?
  - Update frequency?

### **CLAUDE_DisasterRecovery.md** (8+ items)

#### Infrastructure
- [ ] **Automated Backup Setup** — Specify automation
  - Frequency? (daily, weekly, hourly?)
  - Destination? (Cloud Storage, external drive, both?)
  - Encryption during backup?

- [ ] **Health Check Monitoring** — Define monitoring approach
  - GET /health endpoint?
  - What constitutes "down"?
  - Alert mechanism?

#### Testing & Validation
- [ ] **Quarterly Restoration Testing** — Define test schedule
  - Who performs tests?
  - What gets tested?
  - Pass/fail criteria?

- [ ] **Annual Full System Test** — Define comprehensive test
  - When to run? (Q4?)
  - Time allocation?
  - Success metrics?

#### Incident Response
- [ ] **Incident Response Procedures** — Define detailed runbook
  - Who to notify first?
  - Escalation procedures?
  - Communication templates?

- [ ] **Postmortem Process** — Define incident review
  - Who conducts postmortem?
  - Timeline?
  - Documentation requirements?

#### Monitoring & Alerts
- [ ] **Monitoring Alerts Setup** — Specify alert triggers
  - Email alerts? Slack?
  - Alert thresholds?
  - Who gets notified?

- [ ] **Incident Log Setup** — Define incident tracking
  - How to log incidents?
  - What information to record?
  - Retention period?

### **CLAUDE_Payments_Implementation.md** (10+ items)

#### Bank & Payment Details
- [ ] **GEA Bank Account Details** — Provide for applicant instructions
  - Bank name (Absa?)
  - Account number
  - Account holder name
  - Branch code
  - Reference number format

- [ ] **PayPal Setup** — Configure for payment collection
  - PayPal.me link
  - Business or Personal account?
  - Currency preference (USD, BWP, both?)

- [ ] **Federal Credit Union Zelle Setup** — Configure if using
  - FCU account details
  - Zelle member-to-member instructions
  - How to handle member-to-member transfers?

#### Exchange Rate Mechanism
- [ ] **Exchange Rate Source** — Select rate source
  - Fixed monthly rate from board?
  - Market rate from XE.com?
  - Bank rate?
  - Some other source?

- [ ] **Exchange Rate Update Schedule** — Define frequency
  - Daily, weekly, monthly?
  - Who updates?
  - When to update? (specific day/time?)

- [ ] **Exchange Rate Display** — Define member UI
  - Show USD only?
  - Show both USD and BWP?
  - Update rate in real-time or daily?

#### Payment Verification
- [ ] **Payment Method Verification for EFT** — Define verification process
  - Check bank statement?
  - Automated matching?
  - Manual review?

- [ ] **Payment Method Verification for PayPal** — Define verification process
  - Check PayPal account directly?
  - Require Transaction ID?
  - What if personal transfer?

- [ ] **Payment Method Verification for FCU** — Define verification process
  - Check FCU statement?
  - Zelle transaction verification?

- [ ] **Payment Method Verification for Cash** — Define verification process
  - Physical receipt required?
  - Who accepts cash?
  - Signature requirements?

#### Refunds & Handling
- [ ] **Overpayment Handling Policy** — Define board decision
  - Credit to next year?
  - Refund to member?
  - Donation to GEA?

- [ ] **Underpayment Handling** — Define member notification
  - Auto-calculate difference?
  - Contact member for balance?
  - Accept partial payment?

- [ ] **Refund Process Details** — Specify if refunds allowed
  - Who approves refunds?
  - Processing timeline?
  - Bank details needed from member?

#### Reporting
- [ ] **Monthly Collections Report Format** — Define report structure
  - What fields to include?
  - Who receives report?
  - When due? (5th of month?)

- [ ] **Quarterly Projections Format** — Define projection calculations
  - Collection rate trending?
  - Revenue forecasting?

- [ ] **Annual Reconciliation Procedure** — Define year-end process
  - Audit requirements?
  - Deadlines?

---

## Summary by Priority & Phase

| Phase | Guide | TBD Count | Status |
|-------|-------|-----------|--------|
| **Phase 1** | Membership | 10 | 🔴 Critical (blocks implementation) |
| **Phase 2** | Deployment | 1 | 🟡 Important |
| **Phase 2** | Disaster Recovery | 4 | 🟡 Important |
| **Phase 2** | Security | 3 | 🟡 Important |
| **Phase 3** | Google APIs | 15+ | 🟢 Lower priority |
| **Phase 3** | Payments | 10+ | 🟢 Lower priority |
| **Phase 3** | Disaster Recovery (implementation) | 8+ | 🟢 Lower priority |
| | | **~50 total items** | |

---

## Recommended Action Plan

### 🔴 **Week 1: Phase 1 Critical Items**
1. Board reviews CLAUDE_Membership_Implementation.md
2. Board provides answers to all 10 TBD items
3. Update guide with board decisions
4. Developers can begin Phase 1 implementation

### 🟡 **Week 2-3: Phase 2 Items**
1. Board specifies Deployment, Disaster Recovery, Security TBDs
2. Update guides
3. Developers begin Phase 2 implementation

### 🟢 **Week 4+: Phase 3 Items**
1. Board specifies payment methods, exchange rates
2. Board specifies API quotas and caching strategy
3. Update guides
4. Developers begin Phase 3 implementation

---

## Document References

All TBDs are documented in:
- **docs/implementation/CLAUDE_Membership_Implementation.md** — "Outstanding Items (TBD)" section
- **docs/implementation/CLAUDE_Payments_Implementation.md** — "Outstanding Items (TBD)" section
- **docs/implementation/CLAUDE_Google_APIs_Integration.md** — "Outstanding Items (TBD)" section
- **docs/implementation/CLAUDE_DisasterRecovery.md** — "TODO: Disaster Recovery Infrastructure" section
- Each guide contains specific TODOs in code blocks and implementation sections

---

**For board review and completion. Once all items are addressed, implementation can proceed.**
