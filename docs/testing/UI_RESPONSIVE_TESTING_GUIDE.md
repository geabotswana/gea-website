# UI Responsive Testing Guide

Quick reference for verifying the membership application portal works correctly at all screen sizes.

---

## Screen Size Breakpoints

Test at these breakpoints (using Chrome DevTools):

| Device | Width | Height | Use Case |
|--------|-------|--------|----------|
| **Mobile** | 390px | 844px | iPhone 12 |
| **Tablet** | 768px | 1024px | iPad |
| **Desktop** | 1200px+ | 800px+ | Standard monitor |

---

## General Responsive Rules

For all screen sizes, verify:

- ✅ **No horizontal scrolling** — Content fits within viewport width
- ✅ **Touch targets ≥44×44px** — Buttons accessible on mobile
- ✅ **Readable text** — Minimum 16px font on mobile
- ✅ **Consistent layout** — No broken elements or overlapping text
- ✅ **Form inputs** — Properly sized and spaced for mobile keyboards

---

## Portal Pages Checklist

Test each Portal page at all three breakpoints.

### Login Page

**Mobile (390px):**
- [ ] Logo visible and centered
- [ ] Login form fields stack vertically
- [ ] Email field ≥44px tall
- [ ] Password field ≥44px tall
- [ ] "Login" button ≥44×44px
- [ ] "Apply for Membership" link visible and tappable
- [ ] "Load Test Data" button visible (if enabled)
- [ ] No horizontal scroll

**Tablet (768px):**
- [ ] Logo larger and prominent
- [ ] Login form in centered column (not full width)
- [ ] All buttons and fields appropriately sized

**Desktop (1200px+):**
- [ ] Logo and heading in navigation bar (optional)
- [ ] Login form in centered card with padding
- [ ] Sufficient whitespace around form

---

### Application Form — Step 1 (Questionnaire)

**Mobile (390px):**
- [ ] Title "Eligibility Questionnaire" visible
- [ ] Question text readable (not truncated)
- [ ] Radio buttons ≥44px touch target
- [ ] "Next" button ≥44×44px, centered
- [ ] No horizontal scroll
- [ ] Progress indicator (if present) visible

**Tablet (768px):**
- [ ] Questions displayed with proper line breaks
- [ ] Radio button options well-spaced
- [ ] Form looks balanced in portrait orientation

**Desktop (1200px+):**
- [ ] Questions and answers side-by-side (optional)
- [ ] Ample padding and whitespace

---

### Application Form — Step 2 (Personal Information)

**Mobile (390px):**
- [ ] Form labels visible above inputs
- [ ] Input fields full-width (with padding)
- [ ] Input fields ≥44px tall
- [ ] "Next" button ≥44×44px
- [ ] Conditional fields (employment, sponsor) show/hide properly
- [ ] Phone input handles international format (+267 71234567)
- [ ] Date inputs show calendar picker on mobile
- [ ] No horizontal scroll
- [ ] Tab order logical (accessibility)

**Tablet (768px):**
- [ ] Form can be 2-column layout (optional)
- [ ] Label and input alignment consistent
- [ ] All fields visible without scrolling (if form height allows)

**Desktop (1200px+):**
- [ ] Multi-column layout optimal (2-3 columns)
- [ ] Labels aligned with inputs
- [ ] Sufficient whitespace

---

### Application Form — Step 4 (Family Members)

**Mobile (390px):**
- [ ] "Add Family Member" button ≥44×44px
- [ ] Each family member card full-width
- [ ] Name inputs (first, last) stack vertically or side-by-side (≥40px each)
- [ ] Relationship radio buttons spaced for tap (≥44px)
- [ ] Citizenship dropdown ≥44px tall
- [ ] "Remove" button ≥44×44px
- [ ] No horizontal scroll

**Tablet (768px):**
- [ ] Family member cards in a single column (or 2 per row if space)
- [ ] All controls easily accessible

**Desktop (1200px+):**
- [ ] Family member cards in 2-column grid (optional)
- [ ] Compact layout without clutter

---

### Application Form — Step 5 (Household Staff)

**Mobile (390px):**
- [ ] Checkbox "Has household staff" ≥44px tall
- [ ] Staff name inputs visible when checked
- [ ] Staff citizenship dropdown ≥44px
- [ ] All fields properly spaced
- [ ] No horizontal scroll

---

### Dashboard (After Login)

**Mobile (390px):**
- [ ] Navigation menu accessible (hamburger menu or collapsed)
- [ ] Status card readable (text not too small)
- [ ] Action items listed vertically
- [ ] Quick Links as vertical list or cards
- [ ] No horizontal scroll

**Tablet (768px):**
- [ ] Sidebar navigation visible (optional)
- [ ] Dashboard content properly laid out in single column

**Desktop (1200px+):**
- [ ] 3-column layout: sidebar nav, main content, optional details pane
- [ ] All sections visible without scrolling (if viewport is tall)

---

### Documents Page

**Mobile (390px):**
- [ ] Document upload area full-width
- [ ] "Choose File" button ≥44×44px
- [ ] Drag-and-drop target area ≥100px tall
- [ ] File preview thumbnails stack vertically
- [ ] "Confirm Documents" button ≥44×44px
- [ ] Document status messages clear and readable

**Tablet (768px):**
- [ ] Upload area prominent
- [ ] Document list in single column or 2-column grid

**Desktop (1200px+):**
- [ ] Multiple documents visible in grid
- [ ] Upload area and list side-by-side (optional)

---

### Payment Page

**Mobile (390px):**
- [ ] "Dues Breakdown" card readable
- [ ] Amount fields clearly displayed
- [ ] Exchange rate and pro-ration explanation readable
- [ ] Payment method buttons ≥44×44px
- [ ] Form inputs full-width
- [ ] "Submit Payment" button ≥44×44px, prominent
- [ ] File upload input accessible
- [ ] Notes textarea full-width

**Tablet (768px):**
- [ ] Dues breakdown and payment form side-by-side (optional)
- [ ] Payment methods as buttons or dropdown

**Desktop (1200px+):**
- [ ] 2-column layout: dues breakdown (left), payment form (right)
- [ ] Payment methods as horizontal button group

---

### Profile Page

**Mobile (390px):**
- [ ] Profile sections stack vertically
- [ ] Edit buttons ≥44×44px
- [ ] Input fields full-width
- [ ] "Save" button ≥44×44px

**Tablet (768px):**
- [ ] Two-column layout (profile info, contact)
- [ ] Edit fields properly spaced

**Desktop (1200px+):**
- [ ] Professional multi-section layout
- [ ] Balanced proportions

---

### Membership Card Page

**Mobile (390px):**
- [ ] Card image full-width of screen (with padding)
- [ ] Card should be ~280px wide on small screens
- [ ] Card readable with good contrast
- [ ] Member name clearly visible
- [ ] Membership number legible
- [ ] Card number visible

**Tablet (768px):**
- [ ] Card centered with padding on both sides
- [ ] Card width ~400px

**Desktop (1200px+):**
- [ ] Card displayed at 2x size (optional)
- [ ] Centered in viewport
- [ ] Print-friendly styling (if applicable)

---

## Admin Portal — Responsive Checklist

Test Admin Portal at all breakpoints.

### Admin Login

**Mobile (390px):**
- [ ] Login form visible and usable
- [ ] Email and password inputs ≥44px tall
- [ ] "Login" button ≥44×44px

---

### Applications List

**Mobile (390px):**
- [ ] Table scrollable horizontally (or convert to cards)
- [ ] Application name and status visible
- [ ] Row height ≥44px for easy tap targeting
- [ ] If card layout: each app card full-width

**Desktop (1200px+):**
- [ ] Table visible with all columns (no horizontal scroll)
- [ ] Columns: Application ID, Applicant Name, Category, Status, Actions
- [ ] "View Details" button right-aligned

---

### Application Details

**Mobile (390px):**
- [ ] Applicant info section readable
- [ ] Family member list stacks vertically
- [ ] Document previews stack vertically
- [ ] "Approve" and "Deny" buttons ≥44×44px
- [ ] Action buttons full-width or side-by-side with equal width

**Desktop (1200px+):**
- [ ] Multi-column layout optimal
- [ ] Document previews in grid
- [ ] Buttons right-aligned in header or footer

---

### Pending Payments (Treasurer)

**Mobile (390px):**
- [ ] Payment list as cards (not table)
- [ ] Applicant name, amount, method visible
- [ ] "Approve", "Reject", "Clarify" buttons ≥44×44px
- [ ] Form for clarification message visible when needed

**Desktop (1200px+):**
- [ ] Table with all columns visible
- [ ] Action buttons in last column

---

## Accessibility Testing (WCAG 2.1 AA)

For each page, verify:

### Keyboard Navigation
- [ ] Tab through all form fields in logical order
- [ ] Focus visible (outline or highlight) on every interactive element
- [ ] Can reach all buttons without mouse
- [ ] Can submit forms with Enter key

### Screen Reader (NVDA, JAWS, VoiceOver)
- [ ] Page title announced
- [ ] Form labels associated with inputs (`<label for="...">`)
- [ ] Required fields marked with `aria-required="true"`
- [ ] Error messages announced to screen readers
- [ ] Buttons have descriptive text (not just "OK")

### Color Contrast
- [ ] Text contrast ≥ 4.5:1 for normal text
- [ ] Text contrast ≥ 3:1 for large text (≥18px)
- [ ] Use online tool: https://webaim.org/resources/contrastchecker/

### Form Labels
- [ ] All input fields have associated labels
- [ ] Labels clear and descriptive
- [ ] Required fields clearly marked (e.g., with *)

---

## Performance Checks (Mobile)

Test on actual mobile device (not just DevTools emulation).

### Page Load
- [ ] Page loads within 3 seconds on 4G
- [ ] Images lazy-loaded if many
- [ ] No layout shift after load (CLS < 0.1)

### Interactions
- [ ] Form submission responds within 1 second
- [ ] File upload shows progress feedback
- [ ] No janky animations or frame drops

### Battery & Data
- [ ] Background requests don't drain battery
- [ ] No auto-play media (videos, audio)

---

## Print Testing

For card and payment pages:

**Print Preview (Ctrl+P or Cmd+P):**
- [ ] Card/content visible in print preview
- [ ] Appropriate margins (not cut off)
- [ ] Page break doesn't split critical elements
- [ ] Colors/contrast acceptable in grayscale

---

## Browser Compatibility

Test on:

- ✅ Chrome (desktop & mobile)
- ✅ Safari (desktop & iOS)
- ✅ Firefox (desktop)
- ✅ Edge (desktop)

**Known limitations:**
- File upload may behave differently on older iOS
- CSS Grid fully supported on all modern browsers

---

## Testing Workflow

1. **Start with mobile (390px)** — Most constrained layout
2. **Check tablet (768px)** — Verify breakpoint transition
3. **Check desktop (1200px+)** — Verify optimal layout
4. **Test keyboard navigation** — Essential for accessibility
5. **Test on real device** — Emulation doesn't catch everything

---

## Sign-Off Checklist

After responsive testing, verify:

- [ ] No horizontal scrolling at any breakpoint
- [ ] All touch targets ≥44×44px on mobile
- [ ] Text readable at all sizes (≥16px on mobile)
- [ ] Form inputs work on mobile (calendar picker, keyboard)
- [ ] Buttons properly spaced and easy to tap
- [ ] Layout responds smoothly to orientation changes
- [ ] No overlapping elements at any breakpoint
- [ ] Keyboard navigation works completely
- [ ] Color contrast meets WCAG AA (4.5:1)

---

## Tools

- **Chrome DevTools:** F12 → Device toolbar (Ctrl+Shift+M)
- **Firefox DevTools:** F12 → Responsive Design Mode
- **BrowserStack:** Test on real devices
- **WebAIM Contrast Checker:** https://webaim.org/resources/contrastchecker/
- **WAVE Accessibility Tool:** https://wave.webaim.org/

---

**Last Updated:** March 30, 2026
