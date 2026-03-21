# GEA Membership Application — Test Play

This directory contains a structured test suite for the GEA membership application workflow, written as a series of "scenes" so that real people can act as applicants, board members, RSO approvers, and treasurers.

**Not all scenes must be run in strict order, but Scene 01 must be run first** as it establishes the baseline and produces test accounts referenced by later scenes.

---

## The Cast (Roles Needed)

| Role | Description | Scenes |
|------|-------------|--------|
| **Applicant** | Submits applications, uploads documents, submits payment | All scenes |
| **Board Member** | Reviews applications in Admin Portal, approves/denies | 01–07, 09 |
| **RSO Approver** | Clicks one-time approval links from rso-approve@ inbox | 01, 02, 05, 07 |
| **Treasurer** | Approves/rejects payments in Admin Portal | 01, 02, 06 |
| **Tester** | Performs UI/UX and browser testing | 08 |

Multiple roles can be played by the same person with different browser profiles or incognito windows.

---

## Scene Index

| Scene | Title | Order | Key Focus |
|-------|-------|-------|-----------|
| [SCENE-01](SCENE-01-Full-Individual-Happy-Path.md) | Full Individual — Complete Happy Path | **First** | Baseline end-to-end flow |
| [SCENE-02](SCENE-02-Full-Family-Happy-Path.md) | Full Family — Complete Happy Path | After 01 | Family household, 5 members, activation cascade |
| [SCENE-03](SCENE-03-Category-Routing-All-Types.md) | Category Routing — All Six Types | Parallel with 01/02 | All 6 questionnaire paths, dues rates per category |
| [SCENE-04](SCENE-04-Board-Denial-Scenarios.md) | Board Denial — Initial and Final | After 01 | Denial emails, terminal status, no activation |
| [SCENE-05](SCENE-05-RSO-Document-Rejection-and-Recovery.md) | RSO Rejection and Recovery | After 01 | RSO rejects, applicant resubmits, link edge cases |
| [SCENE-06](SCENE-06-Payment-Edge-Cases.md) | Payment Edge Cases | After any approval | BWP wiggle room, clarification, rejection, SDFCU |
| [SCENE-07](SCENE-07-Household-Management.md) | Household Management | Parallel with 06 | Add/edit/remove spouse, child, staff; voting eligibility |
| [SCENE-08](SCENE-08-Portal-UI-All-Status-States.md) | Portal UI — All Status States | During 01–07 | All 8 statuses, responsive design, accessibility |
| [SCENE-09](SCENE-09-Post-Activation-Verification.md) | Post-Activation Verification | After 01 and 02 | Regular portal access, card, profile, records integrity |

---

## What Is Covered

- All 6 membership categories (Full, Affiliate, Associate, Diplomatic, Community, Temporary)
- Individual and Family household types
- All application statuses (awaiting_docs → activated, denied)
- All payment methods (PayPal, SDFCU, Zelle, Absa)
- RSO approval link (approve, reject, expired, already-used)
- Treasurer payment actions (approve, reject, request clarification)
- BWP payment with exchange rate wiggle room
- Household member add/edit/remove (spouse, child <18, child >18, staff)
- Voting eligibility threshold (17+)
- Soft-delete of removed household members
- Activation cascade to all household members
- Non-member portal at every status state
- Responsive design at 390px, 768px, 1200px
- Record integrity across all four spreadsheets

---

## What Is NOT Covered Here

These are deferred to separate test passes:
- Facility reservations (Tennis, Leobo) — see reservation testing docs
- Guest list workflow
- Admin portal reports
- Nightly task execution (exchange rate fetch, session purge, renewal reminders)
