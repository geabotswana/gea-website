# GEA System Troubleshooting Guide

**Last Updated:** April 25, 2026

Comprehensive troubleshooting guide for common issues, error messages, and solutions.

---

## Quick Diagnosis

**Can't log in?** → [Authentication Issues](#authentication-issues)  
**Portal won't load?** → [Access & Loading Issues](#access--loading-issues)  
**Can't book a facility?** → [Reservation Issues](#reservation-issues)  
**Payment won't submit?** → [Payment Issues](#payment-issues)  
**Documents rejected?** → [Document & Upload Issues](#document--upload-issues)  
**Not receiving emails?** → [Email Issues](#email-issues)  
**Member data wrong?** → [Data Issues](#data--membership-issues)  

---

## Authentication Issues

### "Invalid email or password"
**Cause:** Email or password incorrect, or account doesn't exist  
**Solution:**
1. Verify email is spelled correctly
2. Check password (case-sensitive)
3. If member: Ensure you're using member portal login (not admin)
4. If board: Ensure you're using board credentials
5. Reset password: Contact board@geabotswana.org with your email

### "Session expired. Please log in again."
**Cause:** 24-hour session timeout or browser cookie cleared  
**Solution:**
1. Click login button
2. Re-enter credentials
3. If persistent: Clear browser cache and try again

### "AUTH_REQUIRED - No token provided"
**Cause:** Session cookie missing or corrupted  
**Solution:**
1. Close browser completely (all tabs/windows)
2. Reopen and visit portal fresh
3. Log in again
4. Try the action again

### "AUTH_FAILED - Token invalid or expired"
**Cause:** Session token invalid or expired  
**Solution:**
1. Log out explicitly (click Logout button)
2. Log in again
3. If happens immediately: Contact support

### "FORBIDDEN - You don't have permission"
**Cause:** Your role doesn't allow this action  
**Solution:**
1. Verify you have the right role (board vs member vs RSO)
2. Contact board@geabotswana.org if you need different access
3. May need to log in with different account if you have multiple roles

---

## Access & Loading Issues

### Portal loads but shows blank page
**Cause:** JavaScript error, incompatible browser, or network issue  
**Solution:**
1. Try different browser (Chrome, Firefox, Safari)
2. Press F12 → Console tab → Look for red error messages
3. Screenshot error and send to board@geabotswana.org
4. Try incognito/private window
5. Clear browser cache completely

### "Uh oh. A server error occurred."
**Cause:** Backend error in Google Apps Script  
**Solution:**
1. Try again (may be temporary)
2. Wait 5 minutes and try again
3. If persistent: Notify board@geabotswana.org with error time
4. Check Google Apps Script status: https://status.cloud.google.com

### Portal extremely slow / takes 30+ seconds to load
**Cause:** Network issue, GAS service slow, or large data load  
**Solution:**
1. Check internet connection speed
2. Try different network (wifi vs mobile)
3. Wait and try again (may be temporary service issue)
4. Contact board if consistently slow

### "Page not found" (404 error)
**Cause:** URL incorrect or page removed  
**Solution:**
1. Verify URL: https://geabotswana.org/member.html
2. Use navigation links instead of typing URL
3. Contact board if page should exist

### Login page appears instead of portal (stuck in login loop)
**Cause:** Session not properly stored or cookies disabled  
**Solution:**
1. Check browser privacy settings: Cookies should be ENABLED
2. Clear all cookies for geabotswana.org site
3. Log in again
4. Check if running in private/incognito window (disable it)

---

## Reservation Issues

### "You've exceeded your facility limit"
**Cause:** Booking would exceed Tennis (3 hrs/week) or Leobo (1/month) limit  
**Solution:**
1. Check existing reservations (Dashboard → Upcoming)
2. Cancel an existing booking if needed
3. Book different time/facility
4. For Tennis: Wait until next week for limit reset
5. For Leobo: Wait until next month for limit reset

### "Facility booking requires approval"
**Cause:** Booking exceeds standard limits or is Leobo (requires approval)  
**Solution:**
1. For Leobo: Board will approve within 2-3 business days
2. For Tennis excess: Same approval timeline
3. Check email for approval/denial notification
4. View status in portal → Reservations → "TENTATIVE" shows pending approval

### "Cannot book past dates"
**Cause:** Trying to book date that already passed  
**Solution:**
1. Select future date only
2. Date picker may show past dates grayed out
3. If booking for tomorrow, ensure time is in future

### "Guest count exceeds facility capacity"
**Cause:** Too many guests for facility size  
**Solution:**
1. Reduce guest count
2. Contact board to request exception (may not be allowed)
3. Book different facility with larger capacity

### "Facility unavailable on selected date"
**Cause:** Another reservation already booked that time  
**Solution:**
1. Choose different date/time
2. Check Res-Calendar page to see all bookings
3. Contact board@geabotswana.org if need specific time/facility

### Can't cancel reservation
**Cause:** Cancellation deadline passed (usually 24 hours before)  
**Solution:**
1. Contact board@geabotswana.org for manual cancellation
2. May result in no refund if cancellation very late

---

## Payment Issues

### "Cannot submit payment - no payment method available"
**Cause:** Portal error or payment system temporarily down  
**Solution:**
1. Refresh page
2. Try again in 5 minutes
3. If persistent: Try different browser or device
4. Contact board@geabotswana.org

### "Payment amount required"
**Cause:** Amount field blank or zero  
**Solution:**
1. Check dues amount: Shows on Payment page
2. For pro-ration: Shows fraction of annual dues
3. Enter amount (e.g., "250" for $250 USD)
4. Submit again

### "Invalid currency selected"
**Cause:** Currency dropdown not set or invalid selection  
**Solution:**
1. Select currency: USD or BWP
2. Verify you selected correct one
3. Amount should match currency (USD amounts in dollars, BWP in pula)

### "Payment method mismatch"
**Cause:** Selected payment method doesn't match currency or account  
**Solution:**
1. For USD: Use PayPal, Zelle, or SDFCU
2. For BWP: Use Absa or other bank transfer
3. Verify you used correct method
4. If used correct method but portal says wrong: Contact board

### "Payment proof file not accepted"
**Cause:** File format wrong or corrupted  
**Solution:**
1. File should be: JPG, PNG, or PDF
2. File size should be under 10 MB
3. Take new screenshot of payment confirmation
4. Ensure image is clear and legible
5. Re-upload and submit

### Treasurer rejected payment - "receipt not legible"
**Cause:** Screenshot/image too blurry, small, or cut off  
**Solution:**
1. Take clearer screenshot
2. Ensure full confirmation is visible (sender, amount, date, reference)
3. Can take photo of printed receipt instead
4. Resubmit with clearer image

### "Payment clarification requested"
**Cause:** Treasurer needs more information about payment  
**Solution:**
1. Check email for specific question (e.g., "What's the reference number?")
2. Gather requested information
3. Submit payment proof again with info included in notes/screenshot
4. Or contact treasurer directly if you need to explain

### Submitted payment but still showing as not verified after 1 week
**Cause:** Treasurer hasn't reviewed yet, or it got stuck  
**Solution:**
1. Check Payment page status: Shows "Submitted" while pending
2. Treasurer typically verifies within 3-5 business days
3. If longer: Send friendly email to board@geabotswana.org

---

## Document & Upload Issues

### "File upload failed"
**Cause:** Network error, file too large, or server issue  
**Solution:**
1. Check file size: Should be under 10 MB
2. Try again (may be temporary network blip)
3. Try different document (test with smaller file)
4. Try different browser or device
5. Contact board if persists

### "File format not supported"
**Cause:** Uploaded wrong file type  
**Solution:**
1. Documents should be: JPG, PNG, or PDF
2. Don't upload Word docs or other formats
3. Convert to PDF if needed
4. Re-upload correct format

### Document rejected - "Image too blurry"
**Cause:** Document scan/photo not clear enough  
**Solution:**
1. Take new photo with good lighting
2. Ensure all text is readable
3. Document should fill most of frame (not tiny)
4. Avoid shadows or reflections
5. Resubmit clearer version

### Document rejected - "Name doesn't match"
**Cause:** Name on document doesn't match application  
**Solution:**
1. Verify name matches on all documents
2. If legal name changed: Contact board to update
3. If typo on application: Board may need to correct
4. Resubmit document or have board fix application

### Document still pending after 1 week
**Cause:** RSO hasn't reviewed yet, or Board hasn't reviewed after RSO  
**Solution:**
1. RSO typically reviews within 3-5 business days
2. Board reviews within 2-3 business days after RSO
3. Check application status page for current step
4. If longer: Send email to board@geabotswana.org

### "Must submit all required documents"
**Cause:** Missing one or more required documents for your category  
**Solution:**
1. Check application page: Lists required documents
2. Verify each document has been uploaded AND approved
3. "Pending" or "Rejected" documents don't count
4. Resubmit any rejected documents
5. Contact board if unsure which docs required

---

## Email Issues

### Not receiving payment approval/rejection emails
**Cause:** Email sent but not arriving (spam, delay, or configuration)  
**Solution:**
1. Check spam/junk folder
2. Wait 5 minutes (email can be slow)
3. Check email address on file: Portal → Profile
4. If wrong email: Update in portal if possible, or contact board
5. Verify board has correct email in system

### Not receiving application status updates
**Cause:** Email address wrong, or notification system issue  
**Solution:**
1. Same as above: Check email address on file
2. Make sure notifications not blocked in email settings
3. Contact board if emails should be sent but aren't

### Receiving duplicate emails
**Cause:** System bug or email forwarding configuration  
**Solution:**
1. Check email forwarding rules in your email
2. May have rule causing duplicates
3. Report to board@geabotswana.org if system sending duplicates

### Emails from GEA going to spam
**Cause:** Email provider's spam filter  
**Solution:**
1. Check spam folder regularly
2. Mark "Gaborone Employee Association" as safe sender
3. Add board@geabotswana.org to contacts
4. Whitelist emails in your email settings

---

## Data & Membership Issues

### Profile shows wrong information
**Cause:** Out of date, data entry error, or sync issue  
**Solution:**
1. Update profile yourself if you can edit: Profile page
2. If can't edit field: Contact board@geabotswana.org
3. Board can update information directly
4. Changes usually take effect immediately

### Membership card shows expired date
**Cause:** Membership lapsed, date calculated wrong, or not renewed  
**Solution:**
1. Check Dashboard: Shows expiration date
2. If showing "Lapsed": Need to renew (Payment page → Renewal)
3. If showing wrong date: Contact board
4. After renewal payment verified: Card date updates automatically

### Can't find household or it shows wrong members
**Cause:** Data entry error, member added wrong, or household mismatch  
**Solution:**
1. Check Dashboard: Shows your household and members
2. Contact board to correct member list
3. If you need to add family member: Profile → My Household → Add Member
4. Board can batch-add multiple members if needed

### Dues amount shows wrong
**Cause:** Different membership category than expected, or pro-ration  
**Solution:**
1. Check membership category: Dashboard or Profile
2. Different categories have different dues
3. If mid-year join: Dues are pro-rated (Q1: 100%, Q2: 75%, Q3: 50%, Q4: 25%)
4. If amount seems wrong: Contact board@geabotswana.org

### Application shows wrong status
**Cause:** Status not updated after your action, or application stuck  
**Solution:**
1. Refresh page (F5)
2. Log out and log back in
3. Status should update within minutes of action
4. If still wrong after 30 minutes: Contact board

---

## For Board Members & Admins

### Dashboard shows no pending items (but should)
**Cause:** Data not loaded, filter applied, or no actual pending items  
**Solution:**
1. Refresh dashboard (F5)
2. Check filters: "Pending" tab selected?
3. Verify items actually exist in sheet
4. Check Cloud Logs for errors

### Can't approve/deny application
**Cause:** Missing permission, wrong role, or button disabled  
**Solution:**
1. Verify you're logged in as board (not member)
2. Check application status: Can only approve at specific stages
3. Verify token/session valid (try logout/login)
4. Check Cloud Logs for permission errors

### Payment verification won't save
**Cause:** Network error, validation error, or session expired  
**Solution:**
1. Try again (may be temporary)
2. Verify all required fields filled
3. Log out and log back in
4. Try different browser

### Reports won't generate
**Cause:** No data matching filters, or system error  
**Solution:**
1. Check date range: Make sure data exists in that range
2. Try broader date range
3. Refresh page and try again
4. Check Cloud Logs for errors

### Email templates not sending
**Cause:** Configuration wrong, email address invalid, or system issue  
**Solution:**
1. Verify email addresses in Config.js are correct
2. Check that email forwarding is set up (board@geabotswana.org)
3. Check Cloud Logs for email errors
4. Verify GAS has mail permission

---

## When to Contact Support

**Email:** board@geabotswana.org

**Include in your email:**
1. What you were trying to do
2. What error message you saw (screenshot if possible)
3. When it happened (date/time)
4. What you've already tried
5. Your email address and role (member/board/RSO)

**Response time:** Usually 24-48 hours

---

## Emergency Contacts

**System goes completely down:** board@geabotswana.org or call board chair  
**Security issue (password exposed, etc.):** board@geabotswana.org IMMEDIATELY  
**Data looks corrupted:** board@geabotswana.org  

---

**Still need help?** See [MEMBER_PORTAL_GUIDE.md](MEMBER_PORTAL_GUIDE.md) for feature reference or [BOARD_OPERATIONS_GUIDE.md](BOARD_OPERATIONS_GUIDE.md) for admin help.
