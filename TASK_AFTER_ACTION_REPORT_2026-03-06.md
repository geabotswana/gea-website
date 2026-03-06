# Task After-Action Report — 2026-03-06 (Follow-up Fix)

## Task
Resolve the broken new-member application entry path where users were still landing on login (or a blank screen) instead of the application form.

## Problem Observed
- `/new-member.html` loaded, but users still saw the login-first experience.
- The login-screen "Apply for Membership" path could render a blank page in the browser environment used for testing.

## Root Cause
- `new-member.html` was embedding a previously deployed Apps Script web app URL in an iframe.
- That deployed URL did not reliably produce the intended `mode=apply` startup behavior during live testing, so applicants were not guaranteed to land directly on the form.
- Because the issue happened inside the remote embedded portal, browser behavior could appear inconsistent (login-first vs blank render).

## Corrective Actions
1. **Removed dependency on the embedded remote portal for new applicants.**
   - Replaced `new-member.html` iframe implementation with a direct redirect to `/Portal.html?mode=apply`.
2. **Updated public-site apply links to use the direct application route.**
   - Updated top-nav Apply button, hero Apply CTA, and membership "How to Apply" link in `index.html`.
3. **Kept backward compatibility for existing links.**
   - `new-member.html` remains available as a stable URL and now forwards applicants to the correct path.

## Validation Performed
- Confirmed all public apply links now target `/Portal.html?mode=apply`.
- Confirmed `new-member.html` performs an immediate redirect to `/Portal.html?mode=apply` and includes a fallback manual link.
- Performed whitespace and diff sanity checks.

## Outcome
- Applicants can now enter directly into the membership application form without requiring pre-existing login credentials.
- The previous iframe-related behavior is removed from the public new-member flow.

## Follow-up Recommendation
- Keep `/new-member.html` as the published marketing URL, but continue redirecting internally to `/Portal.html?mode=apply` to avoid drift between static site links and the active portal behavior.
