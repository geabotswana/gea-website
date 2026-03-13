# GEA Deployment Checklist

**Last Updated:** March 13, 2026
**Audience:** Developers and operators deploying Apps Script changes

## Pre-deployment

- Confirm working tree is clean or intentionally staged
- Pull latest `main` and rebase/merge your branch
- Run local quality checks:
  - `node scripts/validate-doc-links.js`
  - `node scripts/check-xss-patterns.js`
  - `node --check *.js scripts/*.js`
- Verify required script properties/secrets exist in Apps Script project settings
- Review `CHANGELOG.md` for an accurate deployment summary

## Deployment

- Update deployment timestamp:
  - `node scripts/update-deploy-timestamp.js`
- Push changes:
  - `clasp push`
- Create or update deployment in Apps Script UI/CLI
- Verify web app URL and execute-as/access settings are unchanged

## Post-deployment verification

- Smoke test core routes:
  - Member login
  - Membership application submission
  - Reservation creation
  - Payment submission flow
- Validate email dispatch for one non-production test action
- Confirm no new errors in Apps Script execution logs

## Rollback readiness

- Keep prior deployment ID documented before promotion
- If critical regressions occur, roll back to previous known-good deployment
- Record rollback reason and follow-up remediation actions in `CHANGELOG.md`
