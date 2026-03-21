# Scene 05 — RSO Document Rejection, Recovery, and Link Edge Cases

**Order:** Requires Scene 01 to have been run first. Can run in parallel with Scenes 02–04.

**What this tests:**
- RSO rejects a document via one-time link (rejection with reason)
- Board is notified of the rejection
- Board relays the rejection reason to the applicant (manual process — by design)
- Applicant re-uploads a replacement document
- New RSO one-time approval link is generated
- RSO approves on second attempt
- Application proceeds normally after successful re-upload
- **Edge case A:** Expired one-time RSO link cannot be used
- **Edge case B:** Already-used RSO link cannot be used a second time
- **Edge case C:** Valid rejection via link (not just approvals)

---

## Cast

| Role | Who | Access |
|------|-----|--------|
| **Applicant** | test email | Portal |
| **Board Member** | board@geabotswana.org | Admin Portal (email + password) |
| **RSO Approver** | rso-approve@geabotswana.org | One-time email links; Admin Portal (rso role) |

**Admin Portal login note:** Admin Portal now requires email + password. Credentials are in the Administrators tab of System Backend. The RSO Approver can log in with their rso-role credentials to view applications and documents directly — but one-time links remain the primary mechanism for document approve/reject decisions in this workflow.

**Suggested test data:**
- Applicant: Priya Mehta, priya.mehta.test@[yourdomain]

---

## Pre-conditions

- No existing application for Priya's email
- Scene 01 confirmed RSO approval happy path works

---

## Main Flow — RSO Rejects, Applicant Resubmits, RSO Approves

---

### Step 1 — Apply and Reach RSO Review Stage
**Who:** Applicant then Board
**Where:** Portal, Admin Portal

**Action:**
1. Priya submits a Full Individual application
2. Uploads passport (deliberately use a placeholder/test file — e.g. a blank PDF)
3. Uploads photo
4. Confirms documents
5. Board reviews and approves for RSO review

**Check:** RSO receives one-time approval link email (rso-approve@geabotswana.org)

---

### Step 2 — RSO Rejects Passport via One-Time Link
**Who:** RSO Approver
**Where:** Email inbox for rso-approve@geabotswana.org

**Action:**
1. Open the email with the one-time approval link for the **Passport** document
2. Click the link
3. Select **"Reject"** (not Approve)
4. Enter rejection reason: "Passport image is unclear and cannot be verified. Please resubmit a higher quality scan."
5. Submit the rejection

**Check:**

**File Submissions sheet (Passport row):**
- status = "rso_rejected"
- rso_reviewed_by = "rso-approve@geabotswana.org"
- rso_review_date = today
- member_facing_rejection_reason = "Passport image is unclear..." (or similar)

**Board receives email:**
- ADM_RSO_DOCUMENT_ISSUE_TO_BOARD
- Contains: applicant name, document type, rejection reason
- Directed to board (not to applicant directly — board relays diplomatically)

**Attempt to use the link again (same link):**
- Should show: "This link has already been used" or equivalent error
- File Submissions row should NOT be changed again

**Fail if:** Rejection doesn't record reason, board not notified, or link can be reused

---

### Step 3 — Board Relays Rejection to Applicant
**Who:** Board Member
**Where:** Board email inbox → applicant email (manual step)

**Action:**
1. Board receives the ADM_RSO_DOCUMENT_ISSUE_TO_BOARD email
2. Board manually sends an email to Priya explaining the passport rejection reason
3. (This is the intentional design — board relays diplomatically)

**Check:**
- Board email contains the RSO reason from the rejection
- This is a manual step — no system automation expected here

**Note:** This is the confirmed intentional design (see memory: guest_list_rso_rejection.md). The system does NOT automatically notify the applicant of RSO rejections.

---

### Step 4 — Applicant Re-uploads Passport
**Who:** Applicant
**Where:** Non-Member Portal → Documents

**Action:**
1. Priya logs in
2. Navigates to Documents page
3. For the Passport document, she sees status = "Rejected" (rso_rejected)
4. Clicks "Replace" or "Re-upload" on the passport
5. Uploads a new, better-quality test file
6. Confirms the new upload

**Check:**

**File Submissions sheet:**
- OLD passport row: status remains "rso_rejected" (historical record preserved)
- NEW passport row: a fresh row with status = "submitted", new submission_id

**Portal:**
- Passport shows status = "Pending" (submitted)
- No longer shows "Rejected"

**Fail if:** Old row is overwritten (history should be preserved in new row), or re-upload button not available when document is rejected

---

### Step 5 — New RSO Approval Link Generated and Sent
**Who:** Board Member
**Where:** Admin Portal → Applications

**Action:**
1. Board sees Priya's application still in "rso_review" but passport was rejected
2. Board triggers a new RSO approval link for the re-uploaded passport
3. (Mechanism: either automatic on re-upload, or board clicks "Send to RSO" again)

**Check:**
- RSO receives a new email with a fresh one-time approval link for the new passport submission
- The link is for the NEW submission_id (not the old rejected one)
- New link has a fresh expiry (RSO_APPROVAL_LINK_EXPIRY_HOURS from now)

**Fail if:** New link not generated, or link still points to the old (rejected) submission

---

### Step 6 — RSO Approves Replacement Passport
**Who:** RSO Approver
**Where:** Email

**Action:**
1. Open the new approval link email
2. Click the link
3. Select **"Approve"**
4. Submit

**Check:**
- File Submissions sheet (new passport row): status = "gea_pending"
- Board receives: ADM_BOARD_APPROVED_FOR_RSO_TO_BOARD
- Application proceeds to board_final_review

**Fail if:** RSO approval fails, or old rejected row is incorrectly used instead of new row

---

### Step 7 — Application Continues to Activation
**Who:** Board, Applicant, Treasurer
**Where:** Admin Portal, Portal

**Action:** Continue with board final review → approve → payment → treasurer approves (follow Scene 01 Steps 12–16)

**Check:** Priya activates successfully despite the document rejection and resubmission cycle

---

## Edge Case Tests

---

### Edge Case A — Expired RSO Link Cannot Be Used
**Who:** RSO Approver (or tester)
**Where:** Any browser

**Pre-condition:** You need an expired one-time link. The easiest way to create this is:
- In the Configuration sheet, temporarily set RSO_APPROVAL_LINK_EXPIRY_HOURS to a very small number (e.g. 0.001 = ~3.6 seconds)
- Generate a new approval link for any test submission
- Wait for it to expire (a few seconds)
- Restore RSO_APPROVAL_LINK_EXPIRY_HOURS to 336

OR: If you have a link from a real submission that is more than 336 hours (14 days) old — use that.

**Action:**
1. Click an expired one-time approval link

**Check:**
- Page shows: "This link has expired" or equivalent error
- File Submissions sheet is NOT updated (no status change)

**Fail if:** Expired link accepts approval/rejection

---

### Edge Case B — Already-Used Link Cannot Be Used Twice
**Who:** RSO Approver
**Where:** Email (from Step 2 of this scene, or Step 10 of Scene 01)

**Action:**
1. After an RSO approval or rejection has been submitted via a one-time link...
2. Click the same link again (copy from email, open in browser)

**Check:**
- Page shows: "This link has already been used" or equivalent error
- File Submissions sheet is NOT changed again

**Fail if:** Link accepts a second submission and changes document status again

---

### Edge Case C — RSO Rejection Includes Reason vs. Missing Reason
**Who:** RSO Approver
**Where:** One-time link page

**Action:**
1. On an approval link page, select "Reject" but leave the reason field **blank**
2. Attempt to submit

**Check:**
- System either: (a) requires a reason before submission, OR (b) accepts and records "No reason provided" as the reason
- Either behavior is acceptable, but must be consistent

**Action (alternate):**
1. Select "Reject", enter a reason, submit
2. Verify the reason appears in the ADM_RSO_DOCUMENT_ISSUE_TO_BOARD email to the board

**Fail if:** Rejection submits without recording any reason and board email omits the reason

---

## Completion Criteria

This scene is **PASS** when:
- Document rejection is recorded with reason
- Board notified (not applicant directly)
- Applicant can re-upload and get a new RSO link
- RSO approves on second attempt and application continues
- Expired links rejected
- Already-used links rejected
- Rejection reason surfaced in board notification email
