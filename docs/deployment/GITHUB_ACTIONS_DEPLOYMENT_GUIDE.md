# GitHub Actions Deployment Guide

**Last Updated:** April 25, 2026

Complete guide to automated GAS deployment via GitHub Actions workflows.

---

## Overview

The GEA system uses **two GitHub Actions workflows** that automatically deploy code to Google Apps Script (GAS):

1. **update-deployment-metadata.yml** — Updates version number and timestamps
2. **deploy.yml** — Pushes code to GAS and updates versioned deployment

Both workflows trigger automatically when you push to `main` branch.

---

## How It Works

### The Deployment Pipeline

```
1. Developer commits code and pushes to main
   └─ git push origin main

2. GitHub Actions detects push to main
   └─ Automatically triggers update-deployment-metadata.yml

3. Metadata workflow runs (~2-5 minutes)
   ├─ Increments version (default: patch)
   ├─ Updates timestamps in Code.js header
   ├─ Updates .claspignore with new version
   ├─ Commits changes back to main
   └─ On completion, automatically triggers deploy.yml

4. Deploy workflow runs (~1-2 minutes)
   ├─ Pulls latest code from main
   ├─ Pushes all .js, .html files to GAS
   ├─ Creates/updates versioned deployment
   ├─ Returns deployment status
   └─ Workflow completes

5. New code is live!
   └─ Production URL unchanged
   └─ Users see updated version immediately
```

### Key Benefit

**No manual commands.** Just commit and push. Workflows handle everything automatically.

---

## Monitoring Deployment Status

### Check Workflow Runs

**In GitHub:**
1. Go to repository: https://github.com/geabotswana/gea-website
2. Click **Actions** tab
3. See list of recent workflow runs:
   - Green ✅ = Success
   - Red ❌ = Failed
   - Yellow ⏳ = In progress

**Workflow Details:**
- Click on a workflow run to see detailed logs
- Click on a specific job (e.g., "Deploy to GAS") to see step-by-step output
- Check timestamps to see when deployment started/completed

### Understanding Workflow Names

```
Two main workflows you'll see:

1. "Update Deployment Metadata"
   - Always runs first when you push to main
   - Updates version, timestamps, configuration
   - Usually takes 2-5 minutes

2. "Deploy to Google Apps Script"
   - Runs after metadata update completes
   - Pushes code to GAS production deployment
   - Usually takes 1-2 minutes

Example run list:
  ✅ Deploy to Google Apps Script (Apr 25, 3:45 PM)
  ✅ Update Deployment Metadata (Apr 25, 3:42 PM)
  ✅ Deploy to Google Apps Script (Apr 24, 2:15 PM)
  ✅ Update Deployment Metadata (Apr 24, 2:12 PM)
```

### Workflow Files

Located in `.github/workflows/`:

- **update-deployment-metadata.yml** — Version management
- **deploy.yml** — GAS deployment
- **export-configuration.yml** — Backup workflows
- **deploy-email-templates.yml** — Email template deployment (optional)

---

## Version Management

### How Versions Are Incremented

The metadata workflow automatically increments version numbers:

**Default behavior:** Increment patch version
```
v1.0.0 → v1.0.1 (patch update)
v2.5.3 → v2.5.4
```

**To increment minor version:** Include `[minor]` in commit message
```bash
git commit -m "feat: add new dashboard widget [minor]"
# Results in: v1.1.0
```

**To increment major version:** Include `[major]` in commit message
```bash
git commit -m "refactor: major auth system overhaul [major]"
# Results in: v2.0.0
```

### Version Format

```
MAJOR.MINOR.PATCH (e.g., v2.5.3)

- MAJOR: Breaking changes (API changes, schema migrations)
- MINOR: New features, enhancements (backward compatible)
- PATCH: Bug fixes, minor updates (default increment)
```

### Where Version Appears

**In Code.js header:**
```javascript
// GEA Management System v2.5.3
// Deployed: 2026-04-25 at 15:45 GMT+2
// Deployment ID: AKfycbw7DG2PpLUK9zrAQt9IVF35eQM7U-C3HUFyZIoQo7ChGB10xK5NuJRdUJpVrBjDwuAQ
```

**In .claspignore:**
```
VERSION: 2.5.3
DEPLOY_DATE: 2026-04-25
SCRIPT_ID: 1mkzpnNfUm-ZTW-G6wEdGg4Jt1KiChOXrV5qjBNkm3eqx43Yn-7Z-2Ffv
```

---

## Deployment Checklist

### Before Pushing to Main

- [ ] All code changes tested locally (or in feature branch)
- [ ] No console errors in development
- [ ] Critical flows tested (login, reservation, payment)
- [ ] Code review approved (if required)
- [ ] No secrets committed (.env, credentials, API keys)
- [ ] Commit message is clear and descriptive

### After Pushing to Main

1. **Watch the workflows run**
   - GitHub Actions tab → See both workflows execute
   - Should take 5-10 minutes total

2. **Verify metadata update completes**
   - Green checkmark on metadata workflow
   - Version number incremented

3. **Verify deployment completes**
   - Green checkmark on deploy workflow
   - Code pushed to GAS

4. **Test production portal**
   - Visit https://geabotswana.org/member.html
   - Test login with test account
   - Verify no errors in Cloud Logs

5. **Check Cloud Logs**
   - Google Cloud Console → Cloud Logging
   - Filter for errors from past 10 minutes
   - Verify no critical errors

---

## Troubleshooting Failed Deployments

### Metadata Workflow Failed

**Symptoms:** Red ❌ on "Update Deployment Metadata"

**Common causes:**
1. **Invalid commit message format** — Rare, usually auto-corrected
2. **File permissions** — Check branch protection rules
3. **Merge conflict** — Metadata update couldn't merge

**How to fix:**
1. Check workflow logs for error message (click workflow run)
2. If it's a merge conflict:
   - Pull latest main: `git pull origin main`
   - Resolve conflicts manually
   - Commit and push again

### Deploy Workflow Failed

**Symptoms:** Red ❌ on "Deploy to Google Apps Script"

**Common causes:**
1. **Authentication failed** — GAS credentials expired or revoked
2. **Invalid script ID** — Changed in config
3. **Syntax error in code** — GAS can't parse .js file
4. **File too large** — Code exceeds GAS limits

**How to fix:**
1. Check Cloud Logs for error details
2. If syntax error:
   - Review recent code changes
   - Check Code.js for syntax issues
   - Fix and commit to main again
3. If auth failed:
   - Notify admin to check GAS credentials in GitHub Secrets
   - Workflows usually recover automatically

### Both Workflows Failed

**Symptoms:** Red ❌ on both workflows

**What to do:**
1. Check if main branch is accessible
2. Verify GitHub Actions are enabled (.github/workflows/ exists)
3. Check if someone disabled workflows manually
4. Notify team lead if issue persists

---

## Emergency Rollback

If production has a critical issue and you need to deploy old code:

### Option 1: Revert Recent Commit (Fastest)

```bash
# Revert most recent commit
git revert HEAD --no-edit

# Push to main (triggers workflows)
git push origin main

# Workflows run → Code reverted to previous version → Deployed automatically
```

**Time to production:** ~10 minutes

### Option 2: Create Hotfix Branch

```bash
# Create hotfix from main
git checkout -b hotfix/critical-issue

# Make minimal fix
# (edit only what's necessary)

# Commit
git add .
git commit -m "fix: critical issue [patch]"

# Push to main
git push origin main

# Workflows run → Fixed code deployed
```

**Time to production:** ~15 minutes (including fix time)

---

## Workflow Environment Variables

Located in GitHub repository settings → Secrets and variables:

### Required Secrets

| Secret | Purpose | Set by |
|--------|---------|--------|
| `GAS_SCRIPT_ID` | Google Apps Script project ID | Admin |
| `GAS_DEPLOYMENT_ID` | Production deployment ID | Admin |
| `CLASP_TOKEN` | GAS authentication token | Admin |

### GitHub Actions Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `GAS_SCRIPT_ID` | Script ID for deployment | `1mkzpnNfUm-ZTW...` |
| `PROD_DEPLOYMENT_ID` | Production deployment ID | `AKfycbw7DG2P...` |

**Setting variables:**
1. GitHub → Repository Settings
2. Secrets and variables → Actions
3. Create new repository secret (for sensitive data)
4. Create new repository variable (for non-sensitive data)

---

## Deployment History

### View Recent Deployments

**GitHub Actions tab:**
- Shows all recent workflow runs with timestamps
- Click to see deployment details and logs
- Deployments listed newest first

**Typical deployment includes:**
- Commit hash and message
- Version number (auto-incremented)
- Deployment ID
- Timestamps (started, completed)
- Any error messages (if failed)

### Check Current Production Version

**Method 1: Code.js header**
- Open Code.js in Google Apps Script editor
- First few lines show version and deployment date

**Method 2: GitHub Actions**
- Latest successful "Deploy to Google Apps Script" run
- Check metadata in workflow logs

**Method 3: Portal behavior**
- New features work → You're on current version
- Old features missing → You're on older version

---

## Best Practices

### ✅ DO

- **Commit regularly** — Small commits are easier to troubleshoot
- **Write clear commit messages** — Helps understand what changed
- **Use [minor] or [major] tags** when appropriate — Keeps versions meaningful
- **Monitor workflows** — Check Actions tab after push
- **Test in production immediately** — Catch issues early
- **Keep features in feature branches** — Merge only when ready

### ❌ DON'T

- **Push directly to main without testing** — Use feature branches first
- **Ignore failed workflows** — They won't self-fix
- **Force push to main** — Breaks automated deployment
- **Skip pre-commit hook checks** — XSS prevention runs before commit
- **Commit secrets** — Will fail validation
- **Disable workflows** — They're essential for production

---

## Support & Troubleshooting

### Workflow Stuck or Hung

**If workflow hasn't finished after 30 minutes:**
1. Check if GitHub Actions service has issues: https://githubstatus.com
2. Try canceling workflow manually (click Cancel in Actions tab)
3. Push empty commit to retrigger: `git commit --allow-empty -m "trigger deployment"`
4. If still stuck, notify team lead

### Need to Update Deployment Secrets

**If credentials expire (GAS authentication):**
1. Contact GitHub repo admin
2. They update secrets in repository settings
3. Workflows automatically use new credentials on next run

### Questions?

- **Deployment failed:** Check Cloud Logs (link in GitHub Actions output)
- **Version wrong:** Check .claspignore file and Code.js header
- **Code not deployed:** Verify metadata workflow completed first
- **Production broken:** See Emergency Rollback section

---

**Deployment URL:** https://script.google.com/a/macros/geabotswana.org/s/AKfycbw7DG2PpLUK9zrAQt9IVF35eQM7U-C3HUFyZIoQo7ChGB10xK5NuJRdUJpVrBjDwuAQ/exec

**Repository:** https://github.com/geabotswana/gea-website

**Workflows Location:** `.github/workflows/`

**Related Documentation:** [CLAUDE.md](../../CLAUDE.md), [CLAUDE_Deployment.md](../implementation/CLAUDE_Deployment.md)
