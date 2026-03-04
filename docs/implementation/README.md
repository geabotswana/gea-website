# Implementation Guides & Design Documents

Design specifications, schema analysis, and implementation guides for developers.

## Available Documents

| Document | Purpose | Audience | Status |
|----------|---------|----------|--------|
| [**HOUSEHOLDS_COLUMNS_ANALYSIS.md**](HOUSEHOLDS_COLUMNS_ANALYSIS.md) | Data structure analysis for households table, column definitions, relationships | Developers | ✅ Complete |
| [**MEMBERSHIP_APPLICATIONS_SCHEMA_REDESIGN.md**](MEMBERSHIP_APPLICATIONS_SCHEMA_REDESIGN.md) | Application workflow schema redesign, field definitions, status progression | Developers | ✅ Complete |

## Implementation Guides (Phase 1: High-Readiness)

Extracted from CLAUDE.md with 90–95% content ready; minimal assembly required.

| Document | Purpose | Audience | Status |
|----------|---------|----------|--------|
| [**CLAUDE_Reservations_Implementation.md**](CLAUDE_Reservations_Implementation.md) | Complete reservation workflow, facilities, booking rules, approval routing, bumping logic, guest lists | Developers | ✅ Complete |
| [**CLAUDE_Authentication_RBAC.md**](CLAUDE_Authentication_RBAC.md) | Session management, token handling, role-based access control, password security, authorization | Developers | ✅ Complete |
| [**CLAUDE_Membership_Implementation.md**](CLAUDE_Membership_Implementation.md) | 11-step membership application workflow, categories, eligibility, approval chain, payment integration | Developers | ✅ Complete |

## Implementation Guides (Phase 2: Medium-Readiness)

Extracted from CLAUDE.md with 70–85% content; expanded with architecture details.

| Document | Purpose | Audience | Status |
|----------|---------|----------|--------|
| [**CLAUDE_Deployment.md**](CLAUDE_Deployment.md) | Development workflow, @HEAD vs production, script/deployment IDs, testing, rollback, nightly tasks | Developers | ✅ Complete |
| [**GEA_System_Architecture.md**](GEA_System_Architecture.md) | System overview, request flow, 9 service modules, 4 spreadsheets, design patterns, external integrations | Developers | ✅ Complete |
| [**CLAUDE_Security.md**](CLAUDE_Security.md) | Password hashing, session security, RBAC enforcement, input validation, audit logging, safe data views | Developers | ✅ Complete |

## Implementation Guides (Phase 3: Lower-Readiness)

Extracted from CLAUDE.md with 50–60% content; stubs with TODO sections for TBD details.

| Document | Purpose | Audience | Status | Notes |
|----------|---------|----------|--------|-------|
| [**CLAUDE_Google_APIs_Integration.md**](CLAUDE_Google_APIs_Integration.md) | Sheets, Drive, Calendar, Cloud Storage APIs; caching, rate limiting, error handling | Developers | 📋 60% Ready | TODOs: Rate limiting, file handling, distributed caching |
| [**CLAUDE_DisasterRecovery.md**](CLAUDE_DisasterRecovery.md) | Backup strategy, RTO/RPO targets, incident response, recovery procedures, testing | Developers | 📋 50% Ready | TODOs: RTO/RPO definition, automated backups, monitoring |
| [**CLAUDE_Payments_Implementation.md**](CLAUDE_Payments_Implementation.md) | Payment processing, verification workflow, dues amounts, tracking, membership activation | Developers | 📋 50% Ready | TODOs: Exchange rate mechanism, refund procedures, reporting |

