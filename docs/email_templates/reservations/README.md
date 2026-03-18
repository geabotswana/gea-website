# Reservation Email Templates

Emails covering the full facility reservation lifecycle — from booking receipt through approval, denial, cancellation, and guest list reminders.

## Reservation Workflow

```
Member submits booking
  ↓ RES_BOOKING_RECEIVED_TO_MEMBER
Board reviews (excess bookings only)
  ├─ Approved → RES_BOOKING_APPROVED_TO_MEMBER
  └─ Denied   → RES_BOOKING_DENIED_TO_MEMBER
               → RES_BOOKING_DENIED_BOARD_COPY_TO_BOARD
Member cancels
  └─ RES_BOOKING_CANCELLED_TO_MEMBER
Guest list deadline approaching
  └─ RES_GUEST_LIST_DEADLINE_REMINDER_TO_MEMBER
```

## Templates (12)

### Booking Lifecycle

**RES_BOOKING_RECEIVED_TO_MEMBER.txt**
Sent immediately when a reservation request is submitted. Auto-approved bookings confirm here; excess bookings note pending review.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{RESERVATION_ID}}`, `{{FACILITY_NAME}}`, `{{RESERVATION_DATE}}`, `{{RESERVATION_TIME}}`, `{{PORTAL_URL}}`

**RES_BOOKING_PENDING_REVIEW_TO_MEMBER.txt**
Sent when a reservation requires board review (excess bookings, Leobo requests).
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{FACILITY_NAME}}`, `{{RESERVATION_ID}}`, `{{RESERVATION_DATE}}`, `{{REVIEW_DEADLINE}}`

**RES_BOOKING_APPROVED_TO_MEMBER.txt**
Sent when board approves a reservation. Includes guest list limit and portal link.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{RESERVATION_ID}}`, `{{FACILITY_NAME}}`, `{{RESERVATION_DATE}}`, `{{RESERVATION_TIME}}`, `{{GUEST_LIMIT}}`, `{{PORTAL_URL}}`

**RES_BOOKING_DENIED_TO_MEMBER.txt**
Sent when board denies a reservation. Includes reason and contact for follow-up.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{FACILITY_NAME}}`, `{{RESERVATION_ID}}`, `{{REQUESTED_DATE}}`, `{{DENIAL_REASON}}`, `{{CONTACT_EMAIL}}`

**RES_BOOKING_DENIED_BOARD_COPY_TO_BOARD.txt**
Internal board copy when a reservation is denied. Provides a record of the denial reason.
- Recipient: Board
- Variables: `{{FIRST_NAME}}`, `{{MEMBER_NAME}}`, `{{RESERVATION_ID}}`, `{{FACILITY_NAME}}`, `{{REQUESTED_DATE}}`, `{{DENIAL_REASON}}`

**RES_BOOKING_CANCELLED_TO_MEMBER.txt**
Sent when a reservation is cancelled (by member or board). Includes original date and reason.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{FACILITY_NAME}}`, `{{RESERVATION_ID}}`, `{{ORIGINAL_DATE}}`, `{{CANCELLATION_REASON}}`

### Guest Lists

**RES_GUEST_LIST_DEADLINE_REMINDER_TO_MEMBER.txt**
Reminder sent when the guest list submission deadline is approaching. Member must submit list or reservation may be cancelled.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{RESERVATION_ID}}`, `{{FACILITY_NAME}}`, `{{RESERVATION_DATE}}`, `{{DEADLINE}}`, `{{PORTAL_URL}}`

### Excess Booking Requests

**RES_EXCESS_TENNIS_APPROVAL_REQUEST_TO_MEMBER.txt**
Sent when a member requests tennis court time beyond the weekly limit (3 hrs/week).
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{REQUESTED_DATE}}`, `{{REASON}}`, `{{APPROVAL_URL}}`

**RES_EXCESS_LEOBO_APPROVAL_REQUEST_TO_MEMBER.txt**
Sent when a member requests a Leobo stay beyond the monthly limit (1/month).
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{REQUESTED_DATE}}`, `{{REASON}}`, `{{APPROVAL_URL}}`

### Limit Notifications

**RES_TENNIS_LIMIT_REACHED_TO_MEMBER.txt**
Sent when a member has reached their weekly tennis court limit.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{CURRENT_RESERVATIONS}}`, `{{LIMIT}}`, `{{WAITLIST_INFO}}`

**RES_LEOBO_LIMIT_REACHED_TO_MEMBER.txt**
Sent when a member has reached their monthly Leobo limit.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{CURRENT_RESERVATIONS}}`, `{{LIMIT}}`, `{{WAITLIST_INFO}}`

### Calendar

**RES_HOLIDAY_CALENDAR_REMINDER_TO_MEMBER.txt**
Sent annually (November 1) to remind board of upcoming holiday closures.
- Recipient: Member
- Variables: `{{FIRST_NAME}}`, `{{HOLIDAY_NAME}}`, `{{DATES}}`, `{{FACILITY_CLOSURES}}`
