# Archived Documentation

**Last Updated:** April 25, 2026

Historical and outdated documentation preserved for reference and development context.

---

## Purpose of This Archive

These documents represent the development history of the GEA management system. They are preserved to:

1. **Document historical context** — Understand decisions made and approaches tried
2. **Reference implementation history** — See how features were originally designed
3. **Track project evolution** — Understand the progression from initial concepts to current implementation
4. **Assist troubleshooting** — Reference old approaches if relevant to current issues

---

## Contents Overview

### Session Summaries (19 files)
**Period:** February 22 – April 11, 2026  
**Content:** Development session notes, decisions made, code changes implemented  
**Use:** Reference specific implementation decisions or troubleshooting approaches used during development

**Notable sessions:**
- SESSION_SUMMARY_2026-03-08_SECURITY_HARDENING.md — Authentication token hashing implementation
- SESSION_SUMMARY_2026-03-22_APPLICANT_PORTAL_AND_RSO_PORTAL.md — Portal implementation
- SESSION_SUMMARY_2026-03-26_MCP_INTEGRATION.md — GitHub integration setup

### Implementation Prompts & Task Lists (9 files)
**Period:** March – April 2026  
**Content:** Original implementation requests, task breakdowns, to-do lists

**Files:**
- GEA_Claude_Code_Task_List.md — Master task list from March 16
- GEA_FileUploadPortal_ImplementationPrompt.md — Original file upload feature request
- GEA_FileUploadPortal_ReadyForClaudeCode.md — Refined specification before coding
- GEA_MASTER_TODO_20260316.md — Large master task list (71 KB)
- IMPLEMENTATION_SUMMARY.md — Summary of Phase 1-3 work

### Metadata & Documentation Files (5 files)
**Period:** March 13 – April 22, 2026  
**Content:** Documentation updates, old versioning approach, configuration notes

**Files:**
- CLAUDE_OLD.md — Original 826-line CLAUDE.md (replaced with 261-line version)
- DOCUMENTATION_UPDATES_2026-03-13.md — Documentation refresh plan from March
- CLAUDE_CODE_PROMPT_EMAIL_TEMPLATES.md — Original email template reference
- TASK_AFTER_ACTION_REPORT_2026-03-06.md — Post-implementation review

---

## When to Reference Archived Docs

### ✅ Use Archive For:

- **Understanding historical decisions:** "Why was the authentication system designed this way?"
- **Troubleshooting old issues:** "We had a similar problem in March, what was the solution?"
- **Implementation reference:** "How was the application workflow originally designed?"
- **Learning project history:** "What was the development timeline and approach?"

### ❌ Don't Use Archive For:

- **Current implementation details** → Use [SERVICE_MODULES.md](../SERVICE_MODULES.md)
- **Database schema** → Use [GEA_System_Schema.md](../reference/GEA_System_Schema.md)
- **User guides** → Use [BOARD_OPERATIONS_GUIDE.md](../guides/BOARD_OPERATIONS_GUIDE.md) or [MEMBER_PORTAL_GUIDE.md](../guides/MEMBER_PORTAL_GUIDE.md)
- **Deployment procedures** → Use [CLAUDE.md](../../CLAUDE.md) or [CLAUDE_Deployment.md](../implementation/CLAUDE_Deployment.md)
- **Policy information** → Use [docs/policies/](../policies/) files

---

## Session Summary Index

Quick reference for finding development history:

| Session | Date | Topic | File |
|---------|------|-------|------|
| Board Email Configuration | Mar 7 | Email forwarding setup | SESSION_SUMMARY_2026-03-07_BOARD_EMAIL.md |
| Form & Email Fixes | Mar 7 | Portal form validation | SESSION_SUMMARY_2026-03-07_FORM_AND_EMAIL_FIXES.md |
| Security Hardening | Mar 8 | Token hashing, auth improvements | SESSION_SUMMARY_2026-03-08_SECURITY_HARDENING.md |
| Payment Email Cleanup | Mar 12 | Payment notification templates | SESSION_SUMMARY_2026-03-12_PAYMENT_EMAIL_CLEANUP.md |
| Phase 2 Payment Features | Mar 13 | Exchange rates, currency handling | SESSION_SUMMARY_2026-03-13_PHASE2_PAYMENT_FEATURES.md |
| Phase 1 Email Templates | Mar 16 | Membership email template system | SESSION_SUMMARY_2026-03-16_PHASE1_EMAIL_TEMPLATES.md |
| PR Review & Security | Mar 16 | Code review and hardening | SESSION_SUMMARY_2026-03-16_PR_REVIEW_SECURITY_HARDENING.md |
| Email Template Migration | Mar 19 | Template system improvements | SESSION_SUMMARY_2026-03-19_EMAIL_TEMPLATE_MIGRATION.md |
| Guest List Redesign | Mar 19 | Guest list workflow refactor | SESSION_SUMMARY_2026-03-19_GUEST_LIST_REDESIGN.md |
| Exchange Rates & Tests | Mar 20 | Exchange rate API, test suite | SESSION_SUMMARY_2026-03-20_EXCHANGE_RATES_TESTS_NMP4.md |
| Admin Account Management | Mar 21 | Board/RSO admin interface | SESSION_SUMMARY_2026-03-21_ADMIN_ACCOUNT_MANAGEMENT.md |
| Applicant & RSO Portals | Mar 22 | Applicant tracking and RSO portal | SESSION_SUMMARY_2026-03-22_APPLICANT_PORTAL_AND_RSO_PORTAL.md |
| Comprehensive Mar 23-26 | Mar 23-26 | Multi-topic summary | SESSION_SUMMARY_2026-03-23_TO_03-26_COMPREHENSIVE.md |
| MCP Integration | Mar 26 | GitHub integration setup | SESSION_SUMMARY_2026-03-26_MCP_INTEGRATION.md |
| Comprehensive Mar 26-Apr 11 | Mar 26-Apr 11 | Later development phases | SESSION_SUMMARY_2026-03-26_TO_04-11.md |

---

## How Archived Docs Are Organized

**By date:** Files are named with dates (SESSION_SUMMARY_2026-MM-DD.md) for easy chronological browsing.

**By type:** Implementation docs, task lists, and session summaries are logically grouped:
- `SESSION_SUMMARY_*` — Development session notes
- `GEA_*` — Task lists and implementation prompts
- `CLAUDE_*`, `DOCUMENTATION_*`, `TASK_*` — Configuration and metadata files

**Retrievable:** All files use consistent naming for easy searching:
```bash
# Find docs from specific date
ls archive/ | grep 2026-03-15

# Find docs about payments
grep -r "payment" archive/ | head -5

# Find docs about a feature
grep -r "reservation" archive/ | head -5
```

---

## Notes for Future Developers

1. **These docs are snapshots** — They document how the system worked at the time of writing. Current implementation may differ significantly.

2. **Rely on current docs first** — Always check current documentation before archived versions:
   - [SERVICE_MODULES.md](../SERVICE_MODULES.md) for code structure
   - [GEA_System_Schema.md](../reference/GEA_System_Schema.md) for database
   - [CLAUDE.md](../../CLAUDE.md) for quick reference

3. **Archives help with "why"** — These docs explain decisions and design choices that aren't in current docs. Useful for understanding design rationale.

4. **Keep history clean** — Don't edit these files. If you find outdated information, update the current docs instead.

---

## Maintaining the Archive

**Adding new archived docs:**
1. Move file to `docs/archive/`
2. Update this README.md with new file entry
3. Commit with message: "Archive [file] - [reason]"

**Removing from archive (rare):**
1. Only if documented as wrong/misleading
2. Note deletion in git history
3. Update this README.md

---

**Archive Created:** April 25, 2026  
**Total Files:** 31 archived documents  
**Archive Size:** ~1.2 MB  
**Purpose:** Development history and reference materials
