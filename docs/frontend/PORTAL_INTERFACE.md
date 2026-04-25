# Portal.html - Member Interface

**Last Updated:** April 24, 2026

Complete reference for the member portal interface and functionality.

---

## Overview

**Single-page application** for GEA members to manage memberships, reservations, and documents.

- **URL:** https://geabotswana.org/member.html (via iframe wrapper)
- **Authentication:** Email + password login
- **Session Storage:** Token stored in `sessionStorage` (cleared on browser close)
- **Session Timeout:** 24-hour sliding window
- **API Communication:** google.script.run.handlePortalApi(action, params)
- **Responsive Design:** Mobile-friendly (375px+)

---

## Page Structure

### dashboard
**Purpose:** Household overview and membership status

**Displays:**
- Primary member name and status
- Household members list
- Membership expiration date
- Upcoming reservations (next 7 days)
- Payment status and balance due
- Call-to-action buttons (Book Facility, Update Profile)

**Key Functions:**
- `loadDashboard()` → Fetch household data, members, reservations
- `handleReservationList(reservations)` → Format upcoming bookings

**Data Loaded:**
- handlePortalApi("dashboard", {token})
- Returns: household, members, reservations, payment_status

---

### reservations
**Purpose:** Browse and manage facility bookings

**Displays:**
- Current reservations with status tags [APPROVED], [TENTATIVE], [DENIED]
- Facility, date, time, guest count for each
- Cancel button with refund details
- Book new facility form

**Book Form:**
- Facility dropdown (Tennis, Basketball, Leobo, Gym, Playground)
- Date picker (future dates only)
- Time range (start/end with duration calculation)
- Guest count
- Event name/purpose
- Real-time limit checking (Tennis 3hrs/week, Leobo 1/month)

**Key Functions:**
- `loadReservations()` → Fetch household reservations
- `bookReservation()` → handlePortalApi("book", {facility, date, start_time, end_time, guest_count, event_name, token})
- `cancelReservation(reservation_id)` → handlePortalApi("cancel", {reservation_id, token})
- `checkLimit()` → Real-time validation against household usage

**Data Loaded:**
- handlePortalApi("reservations", {token})
- Returns: current reservations with status, usage limits

---

### profile
**Purpose:** View and edit personal information

**Sections:**

**Personal Information:**
- First name, last name, date of birth (read-only)
- Email address(es)
- Citizenship country, US citizen flag

**Contact Information:**
- Primary phone + country code + WhatsApp flag
- Secondary phone + country code + WhatsApp flag
- Editable; `savePhoneNumbers()` updates via handlePortalApi("updatePhoneNumbers", {...})

**Emergency Contact:**
- Emergency contact name, relationship, email, phone

**Employment (if applicable):**
- Office, job title, employment dates
- Employment verification file status

**Documents & Verification:**
- Passport: status badge, expiration date, upload button
- Omang/ID: status badge, expiration date, upload button
- Photo: status badge, upload button
- Upload form: file picker, document type selector
- handlePortalApi("upload_document", {document_type, file, token})

**Member Actions:**
- Upload document → handlePortalApi("upload_document", {…})
- View verification status → handlePortalApi("get_file_status", {document_type, token})

**Key Functions:**
- `loadProfile()` → Fetch individual record data
- `savePhoneNumbers()` → Update phone fields via handlePortalApi("updatePhoneNumbers", {email, phone_primary, phone_secondary, ...})
- `uploadDocument()` → File upload to handlePortalApi("upload_document", {...})
- `getFileStatus()` → handlePortalApi("get_file_status", {document_type, token})

**Data Loaded:**
- handlePortalApi("profile", {token})
- Returns: individual record, document statuses, verification dates

---

### card
**Purpose:** Digital membership card display

**Displays:**
- Member name and household
- Membership status (Active/Applicant/Lapsed/Pending)
- Membership category (Full/Associate/Affiliate/Diplomatic/Community/Temporary)
- Expiration date
- QR code (encodes household_id + verification code)
- Card approval status indicator

**Purpose:**
- Visual proof of membership
- Can be transferred to Cloud Storage when photo approved
- Printable (via browser print dialog)

**Key Functions:**
- `loadCard()` → handlePortalApi("card", {token})
- `generateQRCode()` → Encode household info
- QR content: "GEA-{household_id}-{verification_code}"

**Data Loaded:**
- handlePortalApi("card", {token})
- Returns: household, member, card_status, verification_code

---

### payment
**Purpose:** Track dues payments and submit payment proof

**Sections:**

**Payment Method Instructions:**
- PayPal: Link and email
- SDFCU Member-to-Member: Account details
- Zelle: Phone number
- Absa: Account details

**Dues Information:**
- Annual dues amount (USD and BWP)
- Dues per quarter (pro-rated: Q1 100%, Q2 75%, Q3 50%, Q4 25%)
- Current balance due
- Membership year

**Submit Payment Proof:**
- File upload (receipt/screenshot)
- Payment method dropdown
- Amount (in USD or BWP)
- Currency selector
- Payment date
- Button: "Submit Payment Verification"
- Confirmation: handlePortalApi("submit_payment_verification", {file, method, amount, currency, date, token})

**Payment Status:**
- List of submitted payments with status badges
- Status: submitted, verified, rejected, clarification_requested
- Verification date (if verified)
- Reason (if rejected or clarification requested)

**Key Functions:**
- `loadPaymentStatus()` → handlePortalApi("get_payment_status", {token})
- `submitPaymentProof()` → handlePortalApi("submit_payment_verification", {file, method, amount, currency, date, token})
- `getDuesInfo()` → handlePortalApi("get_dues_info", {token})

**Data Loaded:**
- handlePortalApi("payment", {token})
- Returns: dues_amount, balance_due, payment_history, payment_status

---

### rules
**Purpose:** Display GEA rules and confirm acceptance

**Displays:**
- Full GEA membership agreement and rules (read-only)
- Membership categories explanation
- Facility usage policies
- Code of conduct

**Signature Section:**
- Full name field (text input)
- Checkbox: "I accept GEA rules and regulations"
- Button: "Submit Acceptance"
- handlePortalApi("submit_rules_agreement", {full_name, accepted, token})

**Key Functions:**
- `loadRules()` → handlePortalApi("get_rules", {token})
- `submitRulesAgreement()` → handlePortalApi("rules", {full_name, accepted, token})

**Data Loaded:**
- handlePortalApi("rules", {token})
- Returns: rules_text, user_acceptance_status

---

### myHousehold
**Purpose:** Manage household members and relationships

**Displays:**
- Primary member name and relationship
- List of household members with:
  - Name, age category, relationship, email, phone

**Actions:**
- Add family member form
  - Name, DOB, relationship dropdown (Spouse/Child/Staff)
  - Email, phone
  - Button: "Add Member"
  - handlePortalApi("add_household_member", {name, dob, relationship, email, phone, token})

- For each member (except primary):
  - Edit button → Modal to update details
  - handlePortalApi("edit_household_member", {individual_id, ...})
  - Remove button → handlePortalApi("remove_household_member", {individual_id, token})

- Update household type (if Family):
  - Dropdown: Individual / Family
  - Button: "Update"
  - handlePortalApi("update_household_type", {type, token})

**Key Functions:**
- `loadHouseholdMembers()` → handlePortalApi("get_household_members", {token})
- `addHouseholdMember()` → handlePortalApi("add_household_member", {...})
- `editHouseholdMember()` → handlePortalApi("edit_household_member", {...})
- `removeHouseholdMember()` → handlePortalApi("remove_household_member", {...})
- `updateHouseholdType()` → handlePortalApi("update_household_type", {type, token})

**Data Loaded:**
- handlePortalApi("myHousehold", {token})
- Returns: household_members with relationships and contact info

---

### applicant
**Purpose:** View application status during approval process (restricted view)

**Displays:**
- 11-step application progress bar
- Current step status with timestamp
- Documents submitted list
- Document verification status for each
- Board review status (if passed initial)
- Payment submission status (if approved for payment)
- Next required action

**Actions:**
- Confirm documents uploaded → handlePortalApi("confirm_documents", {token})
- Upload missing documents → handlePortalApi("upload_document", {document_type, file, token})
- Request employment verification → handlePortalApi("request_employment", {token})
- Submit payment proof → handlePortalApi("submit_payment_proof", {file, method, amount, currency, token})
- Withdraw application → handlePortalApi("withdraw_application", {token})

**Restrictions:**
- Read-only dashboard and profile
- No reservation booking
- No payment submission (until Board Final stage)

**Key Functions:**
- `loadApplicationStatus()` → handlePortalApi("application_status", {token})
- `confirmDocuments()` → handlePortalApi("confirm_documents", {token})
- `submitPaymentProof()` → handlePortalApi("submit_payment_proof", {...})
- `withdrawApplication()` → handlePortalApi("withdraw_application", {token})

---

### renewal
**Purpose:** Membership renewal for lapsed members

**Displays:**
- Current lapsed status
- Original membership dates
- Last payment date
- Option to renew for upcoming membership year
- Renewal form with payment submission

**Actions:**
- Submit renewal payment proof → handlePortalApi("submit_payment_verification", {file, method, amount, currency, token})
- Confirmation message upon successful submission

**Key Functions:**
- `loadRenewal()` → handlePortalApi("renewal", {token})
- `submitRenewalPayment()` → handlePortalApi("submit_payment_verification", {...})

---

## Navigation & Session Management

### Main Navigation
- Header with logo and member name
- Sticky top navigation bar with page links
- Mobile hamburger menu (collapses to sidebar)
- Logout button with token clearing

### Session Management
- Token stored in sessionStorage (cleared on browser close)
- Every API call includes token: handlePortalApi("action", {..., token})
- 24-hour timeout (sliding window)
- Auto-logout if session expires
- Prompt if unauthorized (401)

### Page Navigation
```javascript
function showPage(pageName) {
  switch(pageName) {
    case 'dashboard': loadDashboard(); break;
    case 'reservations': loadReservations(); break;
    case 'profile': loadProfile(); break;
    case 'card': loadCard(); break;
    case 'payment': loadPaymentStatus(); break;
    case 'rules': loadRules(); break;
    case 'myHousehold': loadHouseholdMembers(); break;
    case 'applicant': loadApplicationStatus(); break;
    case 'renewal': loadRenewal(); break;
  }
}
```

---

## Critical Client Functions

### Authentication
- `submitLogin(event)` → handlePortalApi("login", {email, password})
  - On success: Store token in sessionStorage, show dashboard
  - On failure: Display error message, clear form

### Data Loading
- `loadDashboard()` → Fetch household overview
- `loadProfile()` → Fetch individual record
- `loadReservations()` → Fetch reservation list
- `loadPaymentStatus()` → Fetch payment status
- `loadCard()` → Fetch card data
- `loadRules()` → Fetch rules text
- `loadHouseholdMembers()` → Fetch household members
- `loadApplicationStatus()` → Fetch application progress
- `loadRenewal()` → Fetch renewal info

### User Actions
- `savePhoneNumbers()` → Update contact information
- `bookReservation()` → Submit new reservation
- `cancelReservation(id)` → Cancel existing reservation
- `uploadDocument()` → Upload document/photo
- `submitPaymentProof()` → Submit payment verification
- `submitRulesAgreement()` → Accept rules
- `addHouseholdMember()` → Add family member
- `editHouseholdMember()` → Update family member
- `removeHouseholdMember()` → Remove family member
- `updateHouseholdType()` → Change household type

---

## Error Handling

All API calls check for:
- AUTH_REQUIRED: No token provided
- AUTH_FAILED: Token invalid/expired
- FORBIDDEN: User doesn't have required role
- NOT_FOUND: Resource not found
- INVALID_PARAM: Parameter validation failed
- SERVER_ERROR: Backend exception

---

## Responsive Design

- **Mobile (< 768px):** Single column, collapsed sidebar, full-width forms
- **Tablet (768px-1024px):** Two-column layout, expandable sidebar
- **Desktop (> 1024px):** Three-column layout with detailed sidebar

---

**For implementation details, see:** [CLAUDE_Membership_Implementation.md](../implementation/CLAUDE_Membership_Implementation.md)
