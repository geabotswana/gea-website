# **GEA DEVELOPMENT STANDARDS**
*Google Apps Script Development Guidelines*
Effective: March 3, 2026

## 1. Purpose
This document establishes code quality, documentation, testing, and deployment standards for GEA system development. Standards ensure the codebase is maintainable, understandable, and operational by non-technical Board members and future developers.
## 2. Core Principle
Code is written for future maintainers—not for the original developer. A non-technical Treasurer or future Board member should be able to understand, modify, and troubleshoot the system with minimal external help.
## 3. Code Documentation Standards
### Function Documentation
Every function must include comprehensive JSDoc comments explaining:
Purpose: What the function does and why it exists
Parameters: Type, meaning, and valid values for each parameter
Returns: Type and meaning of return value
Side effects: What the function changes (spreadsheets, database, emails, etc.)
Errors: What can go wrong and how errors are handled
Example: Sample function call with expected result

Example:
/**
 * Verifies a member's payment against bank statement
 * 
 * @param {string} memberId - Member household ID (e.g., "H-2026-001")
 * @param {number} amount - Payment amount in USD
 * @param {string} method - Payment method: "EFT", "PayPal", "SDCFE", "Cash"
 * 
 * @returns {object} {verified: boolean, date: string, notes: string}
 * - verified: true if payment confirmed in bank records
 * - date: Payment date from bank (format: "YYYY-MM-DD")
 * - notes: Verification notes (e.g., "Matched to Absa statement 3/1/26")
 * 
 * Side effects:
 * - Updates Payment_Tracking sheet with verification info
 * - Logs verification to Audit_Logs sheet
 * - Sends confirmation email to member
 * 
 * Errors:
 * - Returns {verified: false} if amount doesn't match bank records
 * - Throws error if memberId not found in Members sheet
 * - Logs error if email delivery fails (doesn't stop verification)
 * 
 * Example:
 * const result = verifyPayment("H-2026-001", 50, "EFT");
 * // Returns: {verified: true, date: "2026-03-01", notes: "Matched Absa"}
 */
function verifyPayment(memberId, amount, method) { ... }

### Inline Code Comments
Comment complex logic, not obvious code:
❌ BAD: // Loop through members
✅ GOOD: // Check each member's payment status; suspend access if overdue by 30+ days

Comments should explain the "why" (business logic), not the "what" (code syntax).

## 4. Naming Conventions
### Functions
Use verb-noun naming: action + what it acts on
verifyPayment(), activateMember(), approveReservation()
❌ Avoid: check(), do(), process() – too vague
### Variables
Use camelCase: firstName, memberStatus, isOverdue
Boolean variables: start with is/has/can: isActive, hasSponssor, canInviteGuests
Array/list variables: plural: members, reservations, guestLists
### Constants
Use UPPER_SNAKE_CASE: MAX_RESERVATION_HOURS, PAYMENT_DUE_DAY
### Sheets & Tables
Use descriptive names: Members, Reservations, Payment_Tracking, Audit_Logs
❌ Avoid: Data, Info, Temp

## 5. Code Organization
### File Structure
Google Apps Script files should be organized by function area:
Code.gs – Main entry point, onOpen(), onEdit() triggers
Membership.gs – All membership-related functions (verify, activate, suspend)
Reservations.gs – All reservation-related functions (book, approve, bump)
Payments.gs – All payment functions (verify, track, reconcile)
Utilities.gs – Common functions (email templates, logging, date calculations)
Email.gs – All email sending functions
### Function Grouping
Within files, group related functions together:
Database queries first
Validation/verification second
Update/write operations third
User-facing (UI, email) functions last

## 6. Error Handling
All functions must handle errors gracefully:
Validate all inputs before processing
Use try-catch for operations that can fail (API calls, email, file access)
Log errors to Audit_Logs with context (function, member, timestamp, error message)
Return clear error messages to users (not raw error objects)
Never silently fail – always log what went wrong

try {
 const result = verifyPayment(memberId, amount);
 logToAudit("Payment verified", {memberId, amount, result});
 sendConfirmationEmail(memberId);
} catch(error) {
 logToAudit("Payment verification failed", {memberId, amount, error: error.toString()});
 throwUserError("Payment could not be verified. Check amount and try again.");
}

## 7. Testing Standards
All features must be tested before deployment:
### Unit Testing
Create test functions for core logic: testVerifyPayment(), testActivateMember()
Use test data (dummy members, fake payments) that don't affect live data
Test success cases, error cases, and edge cases
Document test purpose and expected results
### Integration Testing
Test complete workflows: application → payment verification → activation
Verify data flows correctly between sheets
Verify emails send correctly
### Manual Testing
Before deploying to live system:
Full end-to-end test with real (but non-critical) data
Test on live Google Sheets to verify permissions and actual behavior
Document testing results

## 8. Logging & Audit Trail
All significant operations must be logged to Audit_Logs sheet:
Membership changes (create, activate, suspend, delete)
Payment verifications
Reservation approvals and denials
Access control changes
Errors and system issues

Log entries must include:
Timestamp (use Google Sheets NOW() function)
Action (what happened)
Actor (who/what triggered it: user name, automated process, system)
Target (what was affected: member ID, reservation ID, etc.)
Details (relevant data: old value → new value, amounts, reasons)
Result (success, error, notes)

## 9. Deprecation & Backward Compatibility
When changing function signatures or behavior:
Mark old functions as @deprecated with reason
Keep old functions working for 2+ releases if possible
Create new function with improved design; have old function call new one internally
Update all call sites to use new function
Document migration path for future developers

## 10. Version Control & Deployment
Use semantic versioning: MAJOR.MINOR.PATCH (e.g., 1.2.3)
Increment MAJOR when breaking changes (API changes)
Increment MINOR when adding features (backward compatible)
Increment PATCH for bug fixes

Before deploying to live:
Update version number in Code.gs
Document changes in CHANGELOG
Run all test functions
Commit changes to GitHub
Deploy via Clasp to Apps Script

## 11. Code Review Checklist
Before approving any code change:
□ Functions have JSDoc comments with parameters, returns, side effects, errors
□ Complex logic is commented (why, not what)
□ Naming is clear and consistent with standards
□ Error handling: all failures logged and handled gracefully
□ All significant operations logged to Audit_Logs
□ Test functions exist and pass
□ No hardcoded values (use constants)
□ No sensitive data in logs or comments (passwords, tokens)
□ Code follows DRY principle (no duplicate logic)

## 12. Related Documents
CLAUDE_Membership_Implementation.md – Membership module coding guide
CLAUDE_Reservations_Implementation.md – Reservations module coding guide
CLAUDE_Payments_Implementation.md – Payments module coding guide
GEA_System_Architecture.md – Overall system design and patterns
GEA_DOCUMENTATION_INDEX.md – Master documentation hub

*These standards ensure GEA's codebase remains maintainable and understandable by future Boards and developers.*
*Effective: March 3, 2026 | Document Version 1.0*
