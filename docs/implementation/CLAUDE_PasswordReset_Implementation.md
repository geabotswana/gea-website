# Password Reset Implementation Guide

**Last Updated:** May 2026

Self-serve password reset for members and admins, plus the GAS-iframe param-passing pattern that makes it possible. Read the iframe pattern section first if you ever need to forward any other parent-page URL parameter to Portal.html.

---

## Overview

The GEA Member Portal supports a self-serve "Forgot Password?" flow that does not require board intervention. A member enters their email, receives a time-limited link, clicks it, and sets a new password — all without leaving the GitHub-Pages-hosted `member.html` wrapper, so the underlying `script.google.com` URL is never exposed.

The same code path serves admins; the only difference is which sheet stores the password hash and which email template is used.

---

## End-to-End Flow

```
1. Member clicks "Forgot Password?" on Portal.html login screen
   └─ showPasswordResetRequest()  ──► request screen visible

2. Member submits email
   └─ google.script.run handlePortalApi('password_reset_request', {email, user_type})
       └─ AuthService.requestPasswordReset(email, userType)
           ├─ Look up user in Individuals (member) or Administrators (admin)
           ├─ Rate-limit check: <3 requests/hour per email
           ├─ Generate 64-char hex token; SHA256-hash it
           ├─ Append row to "Password Reset Tokens" sheet (15-min expiry)
           ├─ Send email via template MEM_PASSWORD_RESET_REQUEST_TO_MEMBER
           │     RESET_LINK = https://geabotswana.org/member.html
           │                   ?action=reset_password&token=<raw-token>
           └─ Return generic success (never reveals whether email exists)

3. Member clicks the link in email
   └─ Browser → geabotswana.org/member.html?action=reset_password&token=…
       └─ member.html JS reads parent URL params, sets iframe src to
          GAS exec URL ?action=serve&portal_action=reset_password&token=…

4. GAS doGet receives the params server-side
   └─ Code.js doGet "serve" branch:
       ├─ Whitelist portal_action ∈ {"reset_password"}
       ├─ Validate token matches /^[a-f0-9]{64}$/
       └─ Inject as template vars GEA_PORTAL_ACTION, GEA_RESET_TOKEN
   └─ Returns Portal.html with the scriptlets resolved

5. Portal.html boot script reads window.GEA_PORTAL_ACTION + GEA_RESET_TOKEN
   ├─ If both present and action === 'reset_password':
   │     show passwordResetConfirmScreen, stash token in window.resetToken
   └─ Otherwise: normal login / session-restore path

6. Member enters new password twice, submits
   └─ google.script.run handlePortalApi('password_reset_confirm', {token, new_password})
       └─ AuthService.completePasswordReset(token, email, newPassword)
           ├─ _validateResetToken: token row exists, not expired, not used,
           │   under PASSWORD_RESET_MAX_ATTEMPTS failed attempts
           ├─ Hash new password, write to Individuals.password_hash (or Administrators)
           ├─ _invalidateSessionsForEmail: forces re-login on every existing device
           ├─ _markResetTokenAsUsed: one-time-use enforcement
           └─ Send confirmation email (MEM_PASSWORD_RESET_COMPLETE_TO_MEMBER)
```

---

## The GAS Iframe Param-Passing Pattern

This is the non-obvious part. The password-reset flow uses it; the public site's **Apply** button (`?action=apply`) also uses it to jump straight to the application form. Read this before adding any new deep-link feature.

### Why naive approaches fail

`Portal.html` is served by Google Apps Script and embedded in an iframe inside `member.html`. The iframe **does not load from the exec URL** you put in `src=` — GAS responds with a redirect to a sandbox URL like `https://script.googleusercontent.com/…/userCodeAppPanel`, and that sandbox URL **does not carry the original query string**.

Consequences:

- `window.location.search` inside Portal.html is effectively always empty when iframed.
- `postMessage` from the parent works, but it races the iframe load and the first render runs before any message arrives.
- The query string *does* arrive server-side in `doGet(e).parameter` — GAS preserves params for its own routing.

### The working pattern

Hop the parameters through the server:

```
parent URL (member.html?foo=bar)
  → member.html JS appends foo=bar to iframe.src
  → GAS doGet(e) reads e.parameter.foo
  → doGet whitelists/sanitizes and assigns to template var
  → <?= TEMPLATE_VAR ?> scriptlet emits it into Portal.html
  → Portal.html JS reads it from window.<NAME> on first render
```

### Implementation checklist (when adding a new forwarded param)

1. **`member.html` ▸ `ALLOWED_PORTAL_ACTIONS`** (top of script block, around line 243): add the new action name to the whitelist. Anything not in the whitelist is silently dropped — never forwarded.
2. **`Code.js` ▸ `doGet` `action === "serve"` branch** (around line 66): add the same action to the local `ALLOWED_PORTAL_ACTIONS` map. **Never** pass raw user input to a template var — the scriptlet `'<?= GEA_FOO ?>'` interpolates into a JS string literal and a single quote or backslash will break out. Either whitelist against a fixed set (like action names) or validate with a strict regex (like the 64-char hex token).
3. **`Portal.html` top scriptlet** (around line 27): if you're forwarding a new template variable (not just adding to `GEA_PORTAL_ACTION`), add `window.GEA_<NAME> = '<?= GEA_<NAME> ?>';`.
4. **`Portal.html` boot logic** (around line 2855): branch on the new `action` value and call the appropriate handler. Read `window.GEA_PORTAL_ACTION` *first*, fall back to `URLSearchParams` only for direct (non-iframe) access during local testing.

### Currently wired actions

| `action=` value on parent URL | Effect |
|---|---|
| `reset_password` (with `token`) | Shows the **Create New Password** screen |
| `apply` | Shows the multi-step **Apply for Membership** form, skipping the login screen |

### Security note on the scriptlet channel

`<?= … ?>` HTML-escapes its output but does **not** JS-string-escape it. Embedding raw user input in `window.X = '<?= X ?>';` is unsafe. Always whitelist server-side. Examples that are safe:

- Action names from a known small set (`{"reset_password": true}`).
- Tokens generated by `_generateToken()`, which are always `/^[a-f0-9]{64}$/`.

If you ever need to pass free-form user input through this channel, sanitize aggressively or switch to `google.script.run` after load.

---

## Database: Password Reset Tokens Sheet

**Spreadsheet:** System Backend (`SYSTEM_BACKEND_ID`)
**Tab name constant:** `TAB_PASSWORD_RESET_TOKENS` (Config.js)

| Column | Purpose |
|---|---|
| `token_id` | Row ID, format `RST-YYYY-XXXXX` |
| `email` | User who requested the reset |
| `token_hash` | SHA256 of the raw token (raw token only ever lives in the email link) |
| `request_timestamp` | When `requestPasswordReset` was called |
| `expiry_timestamp` | `request_timestamp + PASSWORD_RESET_WINDOW_MINUTES` (15 min) |
| `request_ip` | Currently `"unknown"` — GAS doesn't expose client IP |
| `used_timestamp` | Set when `_markResetTokenAsUsed` runs; empty until consumed |
| `used_by_ip` | Currently `"unknown"` |
| `reset_attempt_count` | Incremented on each failed `_validateResetToken`; gate at `PASSWORD_RESET_MAX_ATTEMPTS` |
| `user_type` | `"member"` or `"admin"` — selects which sheet to update on completion |
| `notes` | Free-form, for manual ops |

Rows are pruned nightly by `AuthService.purgeExpiredResetTokens()`, invoked from `NotificationService.runNightlyTasks()`.

---

## Configuration Constants

All in `Config.js`:

| Constant | Value | Effect |
|---|---|---|
| `PASSWORD_RESET_WINDOW_MINUTES` | 15 | Token validity window |
| `PASSWORD_RESET_MAX_REQUESTS_PER_HOUR` | 3 | Per-email rate limit on `requestPasswordReset` |
| `PASSWORD_RESET_MAX_ATTEMPTS` | 3 | Failed validations before token is dead |
| `PASSWORD_MIN_LENGTH` | 12 | Enforced by `completePasswordReset` |
| `TPL_PASSWORD_RESET_REQUEST_MEMBER` | `MEM_PASSWORD_RESET_REQUEST_TO_MEMBER` | Member email |
| `TPL_PASSWORD_RESET_COMPLETE_MEMBER` | `MEM_PASSWORD_RESET_COMPLETE_TO_MEMBER` | Member confirmation |
| `TPL_PASSWORD_RESET_REQUEST_ADMIN` | `SYS_PASSWORD_RESET_REQUEST_TO_ADMIN` | Admin email |
| `TPL_PASSWORD_RESET_COMPLETE_ADMIN` | `SYS_PASSWORD_RESET_COMPLETE_TO_ADMIN` | Admin confirmation |

---

## Email Templates

All four templates already exist in the Email Templates sheet and are active.

| Template ID | When sent | Placeholders |
|---|---|---|
| `MEM_PASSWORD_RESET_REQUEST_TO_MEMBER` | On `requestPasswordReset` for members | `FIRST_NAME`, `RESET_LINK`, `RESET_WINDOW_MINUTES` |
| `MEM_PASSWORD_RESET_COMPLETE_TO_MEMBER` | On `completePasswordReset` for members | `FIRST_NAME` |
| `SYS_PASSWORD_RESET_REQUEST_TO_ADMIN` | On `requestPasswordReset` for admins | `FIRST_NAME`, `RESET_LINK`, `RESET_WINDOW_MINUTES` |
| `SYS_PASSWORD_RESET_COMPLETE_TO_ADMIN` | On `completePasswordReset` for admins | `FIRST_NAME` |

`RESET_LINK` is constructed in `AuthService.requestPasswordReset` and always points at `https://geabotswana.org/member.html` — never the script.google.com exec URL. If GitHub Pages ever moves, update the base URL there.

---

## Security Model

- **One-time use** — Tokens are marked consumed by `_markResetTokenAsUsed` on the first successful completion. Subsequent attempts with the same token fail validation.
- **Short window** — 15 minutes. Past that, the token row's `expiry_timestamp` invalidates it (checked in `_validateResetToken`).
- **Hashed at rest** — Only `token_hash` (SHA256 of the raw token) is stored. The raw token exists only in the email and in the URL the user clicks. Compromising the sheet does not enable account takeover.
- **Generic responses** — `requestPasswordReset` always returns the same "if that email is in our system…" message regardless of whether the email exists. This prevents account enumeration.
- **Rate-limited** — `_countRecentResetRequests` caps email→reset attempts at `PASSWORD_RESET_MAX_REQUESTS_PER_HOUR`. Validation failures are capped by `PASSWORD_RESET_MAX_ATTEMPTS`.
- **Session invalidation on reset** — `completePasswordReset` calls `_invalidateSessionsForEmail`, which deactivates every Sessions row for that user. Forces re-login everywhere — if the reset was triggered by an attacker who already had a session, this evicts them.
- **Constant-time comparison** — Token validation uses `constantTimeCompare` (AuthService.js:1373) to avoid timing-attack leakage.
- **Audit trail** — Four event types in the Audit Log: `PASSWORD_RESET_REQUESTED`, `PASSWORD_RESET_COMPLETED`, `PASSWORD_RESET_FAILED`, `PASSWORD_RESET_RATE_LIMITED`.

---

## Key Function Reference

`AuthService.js`:

| Function | Line | Purpose |
|---|---|---|
| `requestPasswordReset(email, userType)` | 651 | Public — entry point for the request step |
| `completePasswordReset(token, email, newPassword)` | 762 | Public — entry point for the completion step |
| `_validateResetToken(token, email)` | 932 | Private — checks existence, expiry, used flag, attempt count |
| `_getEmailFromResetToken(token)` | 882 | Private — used by `password_reset_confirm` route which doesn't take email |
| `_markResetTokenAsUsed(tokenId)` | 1039 | Private — sets `used_timestamp` |
| `_countRecentResetRequests(email)` | 1006 | Private — rate-limit query |
| `_invalidateSessionsForEmail(email)` | (search) | Private — sets `is_active=FALSE` on all sessions for the email |
| `purgeExpiredResetTokens()` | 838 | Nightly cleanup; called from `runNightlyTasks` |

`Code.js` action routes (in `_routeAction` switch):

| Action | Handler | Used by |
|---|---|---|
| `password_reset_request` | `_handlePasswordResetRequest` | Request screen submit |
| `password_reset_confirm` | `_handlePasswordResetConfirm` | Confirm screen submit (token-only; looks up email from token) |
| `password_reset_complete` | `_handlePasswordResetComplete` | Alternate completion path that takes email explicitly |
| `verify_reset_token` | `_handleVerifyResetToken` | Pre-flight from `verifyResetTokenAndRender` on the confirm screen mount. Read-only — does **not** increment the failed-attempt counter or write audit entries. Returns `{ success: true, data: { valid: boolean } }`. |

`Portal.html`:

| Function | Line | Purpose |
|---|---|---|
| `showPasswordResetRequest()` | ~5872 | Shows the email-entry screen |
| `submitPasswordResetRequest(event)` | (search) | Calls `password_reset_request` |
| `submitPasswordReset(event)` | (search) | Calls `password_reset_confirm` |
| `showLoginScreen()` | 3437 | Single source of truth — hides all auth screens, shows login. **Do not redefine elsewhere in this file.** |

---

## Common Pitfalls

| Symptom | Likely cause |
|---|---|
| Reset link lands on the regular login screen, not the new-password screen | The `portal_action`/`token` params aren't reaching the client. Check that `Code.js doGet` is forwarding them (see the iframe pattern section) and that `Portal.html` reads `window.GEA_PORTAL_ACTION` first, not just `window.location.search`. |
| "Back to Login" button does nothing | A duplicate `function showLoginScreen()` is shadowing the comprehensive one. There must be only one definition in Portal.html. Grep: `grep -n "function showLoginScreen" Portal.html` — should return one line. |
| Submitting the new password returns "Token and new password are required" even though both fields are filled | `apiCall()` in Portal.html historically overwrote any caller-supplied `params.token` with the (empty) session token. The current implementation only injects the session token when the caller didn't already provide one — preserving the one-time reset token the password-reset flow puts there. If you refactor `apiCall`, keep that guard. |
| Token rejected immediately | Either past 15-min window, already used, or already failed 3 validation attempts. Check the row in Password Reset Tokens. Members can simply request a new one. |
| Email never arrives | Check `MEM_PASSWORD_RESET_REQUEST_TO_MEMBER` is active in Email Templates, check audit log for `PASSWORD_RESET_RATE_LIMITED` (3/hour cap), and check spam. The response is intentionally generic and won't say if the email was wrong. |
| Admin reset email goes to a member's address (or vice versa) | `user_type` is determined by which sheet the email is found in. If an email exists in both Individuals and Administrators, member takes precedence. |
| New token format breaks the iframe-param fix | `Code.js doGet` validates tokens against `/^[a-f0-9]{64}$/` (matches `_generateToken`'s SHA256 hex output). If you change the token format, update both this regex and `_generateTokenFallback`. |

---

## Testing the Flow

There is no automated test for this end-to-end path (it spans a browser, GitHub Pages, GAS, and Gmail). Manual test:

1. From the public site, click **Member Login** → **Forgot Password?**.
2. Enter a known test member's email. Confirm the green "Check your email" screen.
3. Confirm the reset email arrives within ~30 seconds.
4. Click the link. URL should be `https://geabotswana.org/member.html?action=reset_password&token=<64 hex chars>`. You should land on the "Create New Password" screen embedded in the same wrapper — **not** the login screen.
5. Enter a 12+ character password twice, submit. Should see success and redirect to login.
6. Log in with the new password.
7. Verify the confirmation email arrived.
8. Verify the token row in Password Reset Tokens has `used_timestamp` populated.
9. Click the link in the original email again — the reset-confirm screen should immediately switch to its dead-link state ("Reset Link No Longer Valid", with a "Request New Reset Link" button) rather than letting the user type a password first. This is driven by the `verify_reset_token` pre-flight; if the pre-flight call fails (network), submit-time validation still catches it and shows the same UI.

If step 4 lands on the login screen instead of the new-password screen, the iframe-param-passing chain is broken — see the iframe pattern section above and the pitfalls table.

---

## References

- **CLAUDE_Authentication_RBAC.md** — Session management, `requireAuth`, role model
- **CLAUDE_Security.md** — Cross-cutting security patterns (hashing, constant-time compare, XSS)
- **EMAIL_TEMPLATES_REFERENCE.md** — Template catalog and placeholder conventions
- **Config.js** — All reset-related constants (lines ~843–859)
