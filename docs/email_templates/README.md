# GEA Email Templates

Plain-text email templates for all GEA member communications. Board members can edit these files directly in Google Drive — no technical knowledge required. Changes take effect immediately.

## How to Edit a Template

1. Find the template you want to edit in the folder below
2. Open it in Google Drive (double-click → opens in a text editor or Google Docs)
3. Make your changes — keep `{{VARIABLE_NAME}}` tokens exactly as written
4. Save (Google Drive auto-saves)
5. The next email sent using that template will use your updated content

## Variable Syntax

Use `{{VARIABLE_NAME}}` anywhere in the subject or body. The system replaces these automatically before sending.

```
Hello {{FIRST_NAME}},

Your reservation {{RESERVATION_ID}} has been approved.
```

**Rules:**
- Must be ALL CAPS with underscores
- Must match exactly — spelling matters
- Never delete or rename a variable; ask the Treasurer if you're unsure

## Template Organization

All 80 templates are stored in this directory as individual `.txt` files. They are organized by **semantic naming convention** (not subdirectories):

| Prefix | Category | Count | Purpose |
|--------|----------|-------|---------|
| `ADM_*` | Administrative | 17 | Board notifications, RSO communications, internal FYIs |
| `DOC_*` | Documents | 7 | Document submissions, approvals, photo workflow |
| `MEM_*` | Membership | 16 | Applications, renewals, welcome emails, milestones |
| `PAY_*` | Payments | 8 | Payment submissions, verifications, rejections |
| `RES_*` | Reservations | 22 | Facility bookings, approvals, guest list reminders |
| `SYS_*` | System | 2 | Account & password management emails |

**Tip:** Use the prefix to quickly find the template you need (e.g., all payment-related templates start with `PAY_`).

## Formatting Tips

The system automatically applies GEA branding (header, footer, colors). In your template body, you can use:

- **ALL CAPS lines** → Rendered as section headers
- **`Key: Value` lines** → Rendered as styled key-value rows
- **`- item` lines** → Rendered as bullet lists
- **`*** WARNING ...`** → Rendered as a red warning box
- **Blank lines** → Add spacing between sections

Example:
```
Hello {{FIRST_NAME}},

Your reservation has been confirmed.

RESERVATION DETAILS
Facility: {{FACILITY_NAME}}
Date: {{RESERVATION_DATE}}
Time: {{RESERVATION_TIME}}
ID: {{RESERVATION_ID}}

- Arrive 10 minutes early
- Guests must be on the approved list
- Contact board@geabotswana.org with questions
```

## Template Index

See `_MANIFEST.md` for the complete list of all templates with their variables.

## Questions?

Contact the Treasurer: treasurer@geabotswana.org
