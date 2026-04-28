# GEA Website Development Briefing

## Key Development Practice

**All changes should be made directly to the `main` branch.** This ensures:
- Changes are immediately testable in the current environment
- Deployment workflows trigger automatically via GitHub Actions
- No "dead branch" accumulation
- Clear linear history for audit and debugging

## When to commit and push:
1. Make code changes locally
2. Commit with a clear, descriptive message
3. Push to `origin main` immediately
4. Deployment is automatic via GitHub Actions

## Branch policy:
- **main**: All active development and changes
- **No feature branches** unless explicitly requested by the user in the current session
- If user requests a specific branch, confirm the current branch and any switching needed

---

For detailed GEA system documentation, see [CLAUDE.md](../CLAUDE.md)
