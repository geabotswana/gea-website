/**
 * FirestorePhase4Service.js
 * Firestore wrappers for File Submissions, Payments, Applications, Households, and Individuals
 * Phase 4 migration: Top-level collections (submissions, payments, applications) + Individuals as subcollection of Households
 */

// ============================================================================
// SUBMISSIONS (Top-level collection)
// ============================================================================

/**
 * Create a file submission document in Firestore.
 * @param {Object} submission - Submission object with all fields
 * @returns {Object} Created submission with submission_id
 */
function firestoreCreateSubmission(submission) {
  var fs = getFirestore();
  var submissionId = submission.submission_id || generateId('FSB');

  var doc = {
    submission_id: submissionId,
    individual_id: submission.individual_id,
    household_id: submission.household_id || '',
    application_id: submission.application_id || null,
    document_type: submission.document_type,
    file_id: submission.file_id,
    file_name: submission.file_name || submission.file_display_name || '',
    file_content_type: submission.file_content_type || '',
    submitted_by_email: submission.submitted_by_email || submission.user_email || '',
    user_email: submission.user_email || submission.submitted_by_email || '',
    submitted_date: submission.submitted_date ? new Date(submission.submitted_date) : new Date(),
    status: submission.status || 'submitted',
    is_current: submission.is_current !== false && String(submission.is_current).toLowerCase() !== 'false',
    disabled_date: submission.disabled_date ? new Date(submission.disabled_date) : null,
    cloud_storage_path: submission.cloud_storage_path || '',
    file_display_name: submission.file_display_name || '',
    file_size_bytes: submission.file_size_bytes || 0,
    rso_approval_link_token: submission.rso_approval_link_token || null,
    rso_approval_link_expires_at: submission.rso_approval_link_expires_at ? new Date(submission.rso_approval_link_expires_at) : null,
    rso_approval_link_used_at: submission.rso_approval_link_used_at ? new Date(submission.rso_approval_link_used_at) : null,
    rso_approval_link_sent_date: submission.rso_approval_link_sent_date ? new Date(submission.rso_approval_link_sent_date) : null,
    rso_reviewed_by: submission.rso_reviewed_by || null,
    rso_review_date: submission.rso_review_date ? new Date(submission.rso_review_date) : null,
    gea_reviewed_by: submission.gea_reviewed_by || null,
    gea_review_date: submission.gea_review_date ? new Date(submission.gea_review_date) : null,
    rejection_reason: submission.rejection_reason || null,
    member_facing_rejection_reason: submission.member_facing_rejection_reason || null,
    clarification_requested_by: submission.clarification_requested_by || null,
    clarification_request_date: submission.clarification_request_date ? new Date(submission.clarification_request_date) : null,
    clarification_request_details: submission.clarification_request_details || null,
    board_rejection_message: submission.board_rejection_message || null,
    board_notified_by: submission.board_notified_by || null,
    board_notification_date: submission.board_notification_date ? new Date(submission.board_notification_date) : null,
    requested_by_admin: submission.requested_by_admin === true || String(submission.requested_by_admin).toLowerCase() === 'true',
    request_date: submission.request_date ? new Date(submission.request_date) : null,
    request_reason: submission.request_reason || null,
    notes: submission.notes || null,
    upload_device_type: submission.upload_device_type || null,
    document_expiration_date: submission.document_expiration_date ? new Date(submission.document_expiration_date) : null,
    expiration_warning_6m_sent_date: submission.expiration_warning_6m_sent_date ? new Date(submission.expiration_warning_6m_sent_date) : null,
    expiration_warning_1m_sent_date: submission.expiration_warning_1m_sent_date ? new Date(submission.expiration_warning_1m_sent_date) : null,
    allow_resubmit: submission.allow_resubmit === true || String(submission.allow_resubmit).toLowerCase() === 'true',
    submission_type: submission.submission_type || 'document',
    created_at: new Date(),
    updated_at: new Date()
  };

  fs.createDocument('submissions/' + submissionId, doc);
  return doc;
}

/**
 * Get a submission by ID.
 */
function firestoreGetSubmission(submissionId) {
  if (!submissionId) return null;
  try {
    var result = getFirestore().getDocument('submissions/' + submissionId);
    return result.obj || null;
  } catch (e) {
    return null;
  }
}

function firestoreGetSubmissionByRsoToken(token) {
  if (!token) return null;
  try {
    var results = getFirestore()
      .query('submissions')
      .Where('rso_approval_link_token', '==', token)
      .Execute();
    return results.length > 0 ? results[0].obj : null;
  } catch (e) {
    Logger.log('Error querying submission by RSO token: ' + e);
    return null;
  }
}

function firestoreGetAllSubmissions() {
  try {
    var results = getFirestore().query('submissions').Execute();
    return results.map(function(doc) { return doc.obj; }).filter(Boolean);
  } catch (e) {
    Logger.log('Error querying all submissions: ' + e);
    return [];
  }
}

function firestoreDeleteSubmission(submissionId) {
  if (!submissionId) return false;
  try {
    getFirestore().deleteDocument('submissions/' + submissionId);
    return true;
  } catch (e) {
    Logger.log('Error deleting submission ' + submissionId + ': ' + e);
    return false;
  }
}

/**
 * Get all submissions awaiting RSO review.
 */
function firestoreGetSubmissionsAwaitingRsoReview() {
  var fs = getFirestore();
  try {
    var results = fs.query('submissions')
      .Where('status', '==', 'submitted')
      .Execute();
    return results.map(function(doc) { return doc.obj; });
  } catch (e) {
    Logger.log('Error querying RSO pending submissions: ' + e);
    return [];
  }
}

/**
 * Get all submissions awaiting GEA review.
 */
function firestoreGetSubmissionsAwaitingGeaReview() {
  var fs = getFirestore();
  try {
    var results = fs.query('submissions')
      .Where('status', '==', 'gea_pending')
      .Execute();
    return results.map(function(doc) { return doc.obj; });
  } catch (e) {
    Logger.log('Error querying GEA pending submissions: ' + e);
    return [];
  }
}

/**
 * Get submissions for an individual.
 */
function firestoreGetSubmissionsForIndividual(individualId) {
  var fs = getFirestore();
  try {
    var results = fs.query('submissions')
      .Where('individual_id', '==', individualId)
      .Execute();
    return results.map(function(doc) { return doc.obj; });
  } catch (e) {
    Logger.log('Error querying submissions for individual ' + individualId + ': ' + e);
    return [];
  }
}

/**
 * Get current (is_current = true) submission for an individual by document type.
 */
function firestoreGetCurrentSubmissionByType(individualId, documentType) {
  var fs = getFirestore();
  try {
    var results = fs.query('submissions')
      .Where('individual_id', '==', individualId)
      .Where('document_type', '==', documentType)
      .Where('is_current', '==', true)
      .Execute();
    return results.length > 0 ? results[0].obj : null;
  } catch (e) {
    Logger.log('Error querying current submission for ' + individualId + '/' + documentType + ': ' + e);
    return null;
  }
}

/**
 * Update a submission.
 */
function firestoreUpdateSubmission(submissionId, updates) {
  var fs = getFirestore();
  updates.updated_at = new Date();

  if (updates.submitted_date && typeof updates.submitted_date === 'string') {
    updates.submitted_date = new Date(updates.submitted_date);
  }
  if (updates.rso_review_date && typeof updates.rso_review_date === 'string') {
    updates.rso_review_date = new Date(updates.rso_review_date);
  }
  if (updates.gea_review_date && typeof updates.gea_review_date === 'string') {
    updates.gea_review_date = new Date(updates.gea_review_date);
  }
  if (updates.document_expiration_date && typeof updates.document_expiration_date === 'string') {
    updates.document_expiration_date = new Date(updates.document_expiration_date);
  }

  fs.updateDocument('submissions/' + submissionId, updates, true);
}

/**
 * Get submissions expiring soon (within specified days).
 */
function firestoreGetExpiringSubmissions(daysAhead) {
  var fs = getFirestore();
  try {
    var thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysAhead);

    var results = fs.query('submissions')
      .Where('is_current', '==', true)
      .Where('status', '==', 'verified')
      .Execute();

    return results.filter(function(doc) {
      var sub = doc.obj;
      if (!sub.document_expiration_date) return false;
      var expDate = new Date(sub.document_expiration_date);
      return expDate <= thresholdDate;
    }).map(function(doc) { return doc.obj; });
  } catch (e) {
    Logger.log('Error querying expiring submissions: ' + e);
    return [];
  }
}

// ============================================================================
// PAYMENTS (Top-level collection)
// ============================================================================

/**
 * Create a payment document in Firestore.
 */
function firestoreCreatePayment(payment) {
  var fs = getFirestore();
  var paymentId = payment.payment_id || generateId('PAY');

  var doc = {
    payment_id: paymentId,
    household_id: payment.household_id,
    household_name: payment.household_name || '',
    payment_date: payment.payment_date ? new Date(payment.payment_date) : new Date(),
    payment_method: payment.payment_method || '',
    currency: payment.currency || 'USD',
    amount: payment.amount || 0,
    amount_usd: payment.amount_usd || 0,
    amount_bwp: payment.amount_bwp || 0,
    payment_type: payment.payment_type || 'Dues Payment',
    applied_to_period: payment.applied_to_period || '',
    recorded_by: payment.recorded_by || '',
    notes: payment.notes || null,
    journal_entry_id: payment.journal_entry_id || null,
    payment_reference: payment.payment_reference || null,
    payment_confirmation_file_id: payment.payment_confirmation_file_id || null,
    payment_submitted_date: payment.payment_submitted_date ? new Date(payment.payment_submitted_date) : new Date(),
    payment_verified_date: payment.payment_verified_date ? new Date(payment.payment_verified_date) : null,
    payment_verified_by: payment.payment_verified_by || null,
    actual_amount_received: payment.actual_amount_received || null,
    actual_amount_usd: payment.actual_amount_usd || null,
    actual_amount_bwp: payment.actual_amount_bwp || null,
    payment_status: payment.payment_status || 'pending',
    balance_due_amount: payment.balance_due_amount || 0,
    verification_notes: payment.verification_notes || null,
    created_at: new Date(),
    updated_at: new Date()
  };

  fs.createDocument('payments/' + paymentId, doc);
  return doc;
}

/**
 * Get a payment by ID.
 */
function firestoreGetPayment(paymentId) {
  if (!paymentId) return null;
  try {
    var result = getFirestore().getDocument('payments/' + paymentId);
    return result.obj || null;
  } catch (e) {
    return null;
  }
}

/**
 * Get payments for a household.
 */
function firestoreGetPaymentsForHousehold(householdId) {
  var fs = getFirestore();
  try {
    var results = fs.query('payments')
      .Where('household_id', '==', householdId)
      .Execute();
    results.sort(function(a, b) {
      return new Date(b.obj.payment_date) - new Date(a.obj.payment_date);
    });
    return results.map(function(doc) { return doc.obj; });
  } catch (e) {
    Logger.log('Error querying payments for household ' + householdId + ': ' + e);
    return [];
  }
}

/**
 * Get all payments awaiting verification.
 */
function firestoreGetPaymentsAwaitingVerification() {
  var fs = getFirestore();
  try {
    var results = fs.query('payments')
      .Where('payment_status', '==', 'pending')
      .Execute();
    results.sort(function(a, b) {
      return new Date(a.obj.payment_submitted_date) - new Date(b.obj.payment_submitted_date);
    });
    return results.map(function(doc) { return doc.obj; });
  } catch (e) {
    Logger.log('Error querying pending payments: ' + e);
    return [];
  }
}

/**
 * Update a payment.
 */
function firestoreUpdatePayment(paymentId, updates) {
  var fs = getFirestore();
  updates.updated_at = new Date();

  if (updates.payment_verified_date && typeof updates.payment_verified_date === 'string') {
    updates.payment_verified_date = new Date(updates.payment_verified_date);
  }

  fs.updateDocument('payments/' + paymentId, updates, true);
}

// ============================================================================
// APPLICATIONS (Top-level collection)
// ============================================================================

/**
 * Create an application document in Firestore.
 */
function firestoreCreateApplication(application) {
  var fs = getFirestore();
  var appId = application.application_id || generateId('APP');

  var doc = {
    application_id: appId,
    household_id: application.household_id || null,
    primary_individual_id: application.primary_individual_id || null,
    primary_applicant_name: application.primary_applicant_name || '',
    primary_applicant_email: application.primary_applicant_email || '',
    country_code_primary: application.country_code_primary || null,
    phone_primary: application.phone_primary || null,
    phone_primary_whatsapp: application.phone_primary_whatsapp === true,
    membership_category: application.membership_category || '',
    household_type: application.household_type || '',
    employment_job_title: application.employment_job_title || null,
    employment_posting_date: application.employment_posting_date ? new Date(application.employment_posting_date) : null,
    employment_departure_date: application.employment_departure_date ? new Date(application.employment_departure_date) : null,
    dues_amount: application.dues_amount || 0,
    membership_start_date: application.membership_start_date ? new Date(application.membership_start_date) : null,
    membership_expiration_date: application.membership_expiration_date ? new Date(application.membership_expiration_date) : null,
    sponsor_name: application.sponsor_name || null,
    sponsor_email: application.sponsor_email || null,
    sponsor_verified: application.sponsor_verified === true,
    sponsor_verified_date: application.sponsor_verified_date ? new Date(application.sponsor_verified_date) : null,
    sponsor_verified_by: application.sponsor_verified_by || null,
    status: application.status || 'awaiting_docs',
    submitted_date: application.submitted_date ? new Date(application.submitted_date) : new Date(),
    documents_confirmed_date: application.documents_confirmed_date ? new Date(application.documents_confirmed_date) : null,
    board_initial_status: application.board_initial_status || null,
    board_initial_reviewed_by: application.board_initial_reviewed_by || null,
    board_initial_review_date: application.board_initial_review_date ? new Date(application.board_initial_review_date) : null,
    board_initial_notes: application.board_initial_notes || null,
    board_initial_denial_reason: application.board_initial_denial_reason || null,
    rso_status: application.rso_status || null,
    rso_reviewed_by: application.rso_reviewed_by || null,
    rso_review_date: application.rso_review_date ? new Date(application.rso_review_date) : null,
    rso_private_notes: application.rso_private_notes || null,
    board_final_status: application.board_final_status || null,
    board_final_reviewed_by: application.board_final_reviewed_by || null,
    board_final_review_date: application.board_final_review_date ? new Date(application.board_final_review_date) : null,
    board_final_denial_reason: application.board_final_denial_reason || null,
    payment_status: application.payment_status || null,
    payment_id: application.payment_id || null,
    notes: application.notes || null,
    rules_agreement_accepted: application.rules_agreement_accepted === true,
    rules_agreement_name: application.rules_agreement_name || null,
    rules_agreement_date: application.rules_agreement_date ? new Date(application.rules_agreement_date) : null,
    created_at: new Date(),
    updated_at: new Date()
  };

  fs.createDocument('applications/' + appId, doc);
  return doc;
}

/**
 * Get an application by ID.
 */
function firestoreGetApplication(applicationId) {
  if (!applicationId) return null;
  try {
    var result = getFirestore().getDocument('applications/' + applicationId);
    return result.obj || null;
  } catch (e) {
    return null;
  }
}

/**
 * Get applications for a household.
 */
function firestoreGetApplicationsForHousehold(householdId) {
  var fs = getFirestore();
  try {
    var results = fs.query('applications')
      .Where('household_id', '==', householdId)
      .Execute();
    results.sort(function(a, b) {
      return new Date(b.obj.submitted_date) - new Date(a.obj.submitted_date);
    });
    return results.map(function(doc) { return doc.obj; });
  } catch (e) {
    Logger.log('Error querying applications for household ' + householdId + ': ' + e);
    return [];
  }
}

/**
 * Get all applications in a specific status.
 */
function firestoreGetApplicationsByStatus(statusValue) {
  var fs = getFirestore();
  try {
    var results = fs.query('applications')
      .Where('status', '==', statusValue)
      .Execute();
    results.sort(function(a, b) {
      return new Date(a.obj.submitted_date) - new Date(b.obj.submitted_date);
    });
    return results.map(function(doc) { return doc.obj; });
  } catch (e) {
    Logger.log('Error querying applications with status ' + statusValue + ': ' + e);
    return [];
  }
}

/**
 * Update an application.
 */
function firestoreUpdateApplication(applicationId, updates) {
  var fs = getFirestore();
  updates.updated_at = new Date();

  if (updates.submitted_date && typeof updates.submitted_date === 'string') {
    updates.submitted_date = new Date(updates.submitted_date);
  }
  if (updates.board_initial_review_date && typeof updates.board_initial_review_date === 'string') {
    updates.board_initial_review_date = new Date(updates.board_initial_review_date);
  }
  if (updates.rso_review_date && typeof updates.rso_review_date === 'string') {
    updates.rso_review_date = new Date(updates.rso_review_date);
  }
  if (updates.board_final_review_date && typeof updates.board_final_review_date === 'string') {
    updates.board_final_review_date = new Date(updates.board_final_review_date);
  }

  fs.updateDocument('applications/' + applicationId, updates, true);
}

// ============================================================================
// HOUSEHOLDS (Top-level collection)
// ============================================================================

/**
 * Create a household document in Firestore.
 */
function firestoreCreateHousehold(household) {
  var fs = getFirestore();
  var householdId = household.household_id || generateId('HSH');

  var doc = {
    household_id: householdId,
    household_name: household.household_name || '',
    primary_member_id: household.primary_member_id || '',
    household_type: household.household_type || '',
    membership_category: household.membership_category || '',
    membership_level_id: household.membership_level_id || null,
    membership_duration_months: household.membership_duration_months || 12,
    membership_start_date: household.membership_start_date ? new Date(household.membership_start_date) : new Date(),
    membership_expiration_date: household.membership_expiration_date ? new Date(household.membership_expiration_date) : null,
    dues_amount: household.dues_amount || 0,
    dues_paid_amount: household.dues_paid_amount || 0,
    dues_last_payment_date: household.dues_last_payment_date ? new Date(household.dues_last_payment_date) : null,
    balance_due: household.balance_due || 0,
    address_street: household.address_street || null,
    address_city: household.address_city || null,
    address_country: household.address_country || null,
    country_code_primary: household.country_code_primary || null,
    phone_primary: household.phone_primary || null,
    phone_primary_whatsapp: household.phone_primary_whatsapp === true,
    country_code_secondary: household.country_code_secondary || null,
    phone_secondary: household.phone_secondary || null,
    phone_secondary_whatsapp: household.phone_secondary_whatsapp === true,
    country_code_emergency: household.country_code_emergency || null,
    phone_emergency: household.phone_emergency || null,
    phone_emergency_whatsapp: household.phone_emergency_whatsapp === true,
    active: household.active !== false,
    membership_status: household.membership_status || 'Applicant',
    application_date: household.application_date ? new Date(household.application_date) : null,
    approved_by: household.approved_by || null,
    approved_date: household.approved_date ? new Date(household.approved_date) : null,
    denial_reason: household.denial_reason || null,
    sponsor_name: household.sponsor_name || null,
    sponsor_email: household.sponsor_email || null,
    sponsor_verified: household.sponsor_verified === true,
    sponsor_verified_date: household.sponsor_verified_date ? new Date(household.sponsor_verified_date) : null,
    sponsor_verified_by: household.sponsor_verified_by || null,
    sponsor_notes: household.sponsor_notes || null,
    lapsed_date: household.lapsed_date ? new Date(household.lapsed_date) : null,
    termination_date: household.termination_date ? new Date(household.termination_date) : null,
    termination_reason: household.termination_reason || null,
    notes: household.notes || null,
    created_at: new Date(),
    updated_at: new Date()
  };

  fs.createDocument('households/' + householdId, doc);
  return doc;
}

/**
 * Get a household by ID.
 */
function firestoreGetHousehold(householdId) {
  if (!householdId) return null;
  try {
    var result = getFirestore().getDocument('households/' + householdId);
    return result.obj || null;
  } catch (e) {
    return null;
  }
}

/**
 * Get all active households.
 */
function firestoreGetActiveHouseholds() {
  var fs = getFirestore();
  try {
    var results = fs.query('households')
      .Where('active', '==', true)
      .Execute();
    return results.map(function(doc) { return doc.obj; });
  } catch (e) {
    Logger.log('Error querying active households: ' + e);
    return [];
  }
}

/**
 * Get households with specific membership status.
 */
function firestoreGetHouseholdsByStatus(statusValue) {
  var fs = getFirestore();
  try {
    var results = fs.query('households')
      .Where('membership_status', '==', statusValue)
      .Execute();
    return results.map(function(doc) { return doc.obj; });
  } catch (e) {
    Logger.log('Error querying households with status ' + statusValue + ': ' + e);
    return [];
  }
}

/**
 * Update a household.
 */
function firestoreUpdateHousehold(householdId, updates) {
  var fs = getFirestore();
  updates.updated_at = new Date();

  if (updates.membership_start_date && typeof updates.membership_start_date === 'string') {
    updates.membership_start_date = new Date(updates.membership_start_date);
  }
  if (updates.membership_expiration_date && typeof updates.membership_expiration_date === 'string') {
    updates.membership_expiration_date = new Date(updates.membership_expiration_date);
  }
  if (updates.approved_date && typeof updates.approved_date === 'string') {
    updates.approved_date = new Date(updates.approved_date);
  }

  fs.updateDocument('households/' + householdId, updates, true);
}

// ============================================================================
// INDIVIDUALS (Subcollection of households)
// ============================================================================

/**
 * Create an individual document in a household subcollection.
 */
function firestoreCreateIndividual(householdId, individual) {
  var fs = getFirestore();
  var individualId = individual.individual_id || generateId('IND');

  var doc = {
    individual_id: individualId,
    household_id: householdId,
    first_name: individual.first_name || '',
    last_name: individual.last_name || '',
    email: individual.email || null,
    date_of_birth: individual.date_of_birth ? new Date(individual.date_of_birth) : null,
    age_category: individual.age_category || null,
    relationship_to_primary: individual.relationship_to_primary || null,
    citizenship_country: individual.citizenship_country || null,
    us_citizen: individual.us_citizen === true,
    country_code_primary: individual.country_code_primary || null,
    phone_primary: individual.phone_primary || null,
    phone_primary_whatsapp: individual.phone_primary_whatsapp === true,
    country_code_secondary: individual.country_code_secondary || null,
    phone_secondary: individual.phone_secondary || null,
    phone_secondary_whatsapp: individual.phone_secondary_whatsapp === true,
    country_code_emergency: individual.country_code_emergency || null,
    phone_emergency: individual.phone_emergency || null,
    phone_emergency_whatsapp: individual.phone_emergency_whatsapp === true,
    current_passport_submission_id: individual.current_passport_submission_id || null,
    current_omang_submission_id: individual.current_omang_submission_id || null,
    current_photo_submission_id: individual.current_photo_submission_id || null,
    passport_status: individual.passport_status || null,
    passport_expiration_date: individual.passport_expiration_date ? new Date(individual.passport_expiration_date) : null,
    omang_status: individual.omang_status || null,
    omang_expiration_date: individual.omang_expiration_date ? new Date(individual.omang_expiration_date) : null,
    photo_status: individual.photo_status || null,
    passport_expiration_warning_sent: individual.passport_expiration_warning_sent === true,
    passport_expiration_warning_date: individual.passport_expiration_warning_date ? new Date(individual.passport_expiration_warning_date) : null,
    omang_expiration_warning_sent: individual.omang_expiration_warning_sent === true,
    omang_expiration_warning_date: individual.omang_expiration_warning_date ? new Date(individual.omang_expiration_warning_date) : null,
    can_access_unaccompanied: individual.can_access_unaccompanied === true,
    voting_eligible: individual.voting_eligible === true,
    employment_office: individual.employment_office || null,
    employment_job_title: individual.employment_job_title || null,
    employment_verification_file_id: individual.employment_verification_file_id || null,
    emergency_contact_name: individual.emergency_contact_name || null,
    emergency_contact_relationship: individual.emergency_contact_relationship || null,
    emergency_contact_email: individual.emergency_contact_email || null,
    arrival_date: individual.arrival_date ? new Date(individual.arrival_date) : null,
    departure_date: individual.departure_date ? new Date(individual.departure_date) : null,
    active: individual.active !== false,
    staff_rso_cleared: individual.staff_rso_cleared === true,
    staff_rso_clearance_date: individual.staff_rso_clearance_date ? new Date(individual.staff_rso_clearance_date) : null,
    fitness_center_eligible: individual.fitness_center_eligible === true,
    office_eligible: individual.office_eligible === true,
    password_hash: individual.password_hash || null,
    first_login_date: individual.first_login_date ? new Date(individual.first_login_date) : null,
    last_login_date: individual.last_login_date ? new Date(individual.last_login_date) : null,
    created_at: new Date(),
    updated_at: new Date()
  };

  fs.createDocument('households/' + householdId + '/individuals/' + individualId, doc);
  return doc;
}

/**
 * Get an individual by household ID and individual ID.
 */
function firestoreGetIndividual(householdId, individualId) {
  if (!householdId || !individualId) return null;
  try {
    var result = getFirestore().getDocument('households/' + householdId + '/individuals/' + individualId);
    return result.obj || null;
  } catch (e) {
    return null;
  }
}

/**
 * Get all individuals in a household.
 */
function firestoreGetIndividualsForHousehold(householdId) {
  var fs = getFirestore();
  try {
    var results = fs.query('households/' + householdId + '/individuals').Execute();
    return results.map(function(doc) { return doc.obj; });
  } catch (e) {
    Logger.log('Error querying individuals for household ' + householdId + ': ' + e);
    return [];
  }
}

/**
 * Update an individual.
 */
function firestoreUpdateIndividual(householdId, individualId, updates) {
  var fs = getFirestore();
  updates.updated_at = new Date();

  if (updates.date_of_birth && typeof updates.date_of_birth === 'string') {
    updates.date_of_birth = new Date(updates.date_of_birth);
  }
  if (updates.passport_expiration_date && typeof updates.passport_expiration_date === 'string') {
    updates.passport_expiration_date = new Date(updates.passport_expiration_date);
  }
  if (updates.omang_expiration_date && typeof updates.omang_expiration_date === 'string') {
    updates.omang_expiration_date = new Date(updates.omang_expiration_date);
  }
  if (updates.arrival_date && typeof updates.arrival_date === 'string') {
    updates.arrival_date = new Date(updates.arrival_date);
  }
  if (updates.departure_date && typeof updates.departure_date === 'string') {
    updates.departure_date = new Date(updates.departure_date);
  }
  if (updates.staff_rso_clearance_date && typeof updates.staff_rso_clearance_date === 'string') {
    updates.staff_rso_clearance_date = new Date(updates.staff_rso_clearance_date);
  }

  fs.updateDocument('households/' + householdId + '/individuals/' + individualId, updates, true);
}

/**
 * Get an individual by email across all households.
 * Queries all households' individuals subcollections (fallback since CollectionGroup not directly supported).
 */
function firestoreGetIndividualByEmail(email) {
  var fs = getFirestore();
  try {
    // Get all households
    var households = firestoreGetActiveHouseholds();

    // Search each household's individuals for matching email
    for (var i = 0; i < households.length; i++) {
      var householdId = households[i].household_id;
      var individuals = firestoreGetIndividualsForHousehold(householdId);

      for (var j = 0; j < individuals.length; j++) {
        if (individuals[j].email === email) {
          return individuals[j];
        }
      }
    }

    // Also search inactive households if not found
    var allHouseholds = fs.query('households').Execute();
    for (var k = 0; k < allHouseholds.length; k++) {
      var hhId = allHouseholds[k].obj.household_id;
      var inds = firestoreGetIndividualsForHousehold(hhId);

      for (var l = 0; l < inds.length; l++) {
        if (inds[l].email === email) {
          return inds[l];
        }
      }
    }

    return null;
  } catch (e) {
    Logger.log('Error querying individual by email ' + email + ': ' + e);
    return null;
  }
}

// ============================================================================
// TESTS
// ============================================================================

/**
 * Creates test documents for all Phase 4 collections.
 * Run this first, then run testPhase4Read() to verify.
 */
function createTestPhase4Data() {
  var db  = getFirestore();
  var now = new Date();

  var householdId   = 'HSH-TEST-00001';
  var individualId  = 'IND-TEST-00001';
  var submissionId  = 'FSB-TEST-00001';
  var paymentId     = 'PAY-TEST-00001';
  var applicationId = 'APP-TEST-00001';

  // Clean up existing test docs
  try { db.deleteDocument('households/' + householdId); } catch (e) {}
  try { db.deleteDocument('households/' + householdId + '/individuals/' + individualId); } catch (e) {}
  try { db.deleteDocument('submissions/' + submissionId); } catch (e) {}
  try { db.deleteDocument('payments/' + paymentId); } catch (e) {}
  try { db.deleteDocument('applications/' + applicationId); } catch (e) {}

  // Household
  firestoreCreateHousehold({
    household_id:              householdId,
    household_name:            'Test Family',
    primary_member_id:         individualId,
    household_type:            'Family',
    membership_category:       'Full',
    membership_level_id:       'full_family',
    membership_duration_months: 12,
    membership_start_date:     new Date('2026-01-01'),
    membership_expiration_date: new Date('2026-12-31'),
    dues_amount:               500,
    dues_paid_amount:          500,
    balance_due:               0,
    address_city:              'Gaborone',
    address_country:           'Botswana',
    active:                    true,
    membership_status:         'Member',
    approved_by:               'board@geabotswana.org',
    approved_date:             new Date('2026-01-10')
  });
  Logger.log('Created test household: ' + householdId);

  // Individual (subcollection)
  firestoreCreateIndividual(householdId, {
    individual_id:             individualId,
    first_name:                'Test',
    last_name:                 'User',
    email:                     'testuser@example.com',
    date_of_birth:             new Date('1985-06-15'),
    age_category:              'Adult',
    relationship_to_primary:   'Primary',
    citizenship_country:       'United States',
    us_citizen:                true,
    passport_status:           'verified',
    passport_expiration_date:  new Date('2030-01-01'),
    photo_status:              'approved',
    can_access_unaccompanied:  true,
    voting_eligible:           true,
    fitness_center_eligible:   true,
    office_eligible:           true,
    active:                    true,
    employment_job_title:      'Test Officer',
    employment_office:         'EXEC'
  });
  Logger.log('Created test individual: ' + individualId + ' under ' + householdId);

  // Submission
  firestoreCreateSubmission({
    submission_id:        submissionId,
    individual_id:        individualId,
    household_id:         householdId,
    document_type:        'passport',
    file_id:              'test_file_id_001',
    submitted_by_email:   'testuser@example.com',
    submitted_date:       now,
    status:               'verified',
    is_current:           true,
    cloud_storage_path:   'gs://gea-test/passport_test.pdf',
    file_display_name:    'passport_test.pdf',
    file_size_bytes:      204800,
    document_expiration_date: new Date('2030-01-01'),
    submission_type:      'document'
  });
  Logger.log('Created test submission: ' + submissionId);

  // Payment
  firestoreCreatePayment({
    payment_id:              paymentId,
    household_id:            householdId,
    household_name:          'Test Family',
    payment_date:            new Date('2026-01-15'),
    payment_method:          'Bank Transfer',
    currency:                'USD',
    amount:                  500,
    amount_usd:              500,
    amount_bwp:              6700,
    payment_type:            'Dues Payment',
    applied_to_period:       '2026',
    recorded_by:             'board@geabotswana.org',
    payment_submitted_date:  new Date('2026-01-10'),
    payment_verified_date:   new Date('2026-01-15'),
    payment_verified_by:     'board@geabotswana.org',
    payment_status:          'verified',
    balance_due_amount:      0
  });
  Logger.log('Created test payment: ' + paymentId);

  // Application
  firestoreCreateApplication({
    application_id:            applicationId,
    household_id:              householdId,
    primary_individual_id:     individualId,
    primary_applicant_name:    'Test User',
    primary_applicant_email:   'testuser@example.com',
    membership_category:       'Full',
    household_type:            'Family',
    employment_job_title:      'Test Officer',
    dues_amount:               500,
    membership_start_date:     new Date('2026-01-01'),
    membership_expiration_date: new Date('2026-12-31'),
    status:                    'activated',
    submitted_date:            new Date('2025-12-01'),
    board_initial_status:      'approved',
    board_initial_reviewed_by: 'board@geabotswana.org',
    board_initial_review_date: new Date('2025-12-10'),
    rso_status:                'approved',
    rso_reviewed_by:           'rso@embassy.gov',
    rso_review_date:           new Date('2025-12-15'),
    board_final_status:        'approved',
    board_final_reviewed_by:   'board@geabotswana.org',
    board_final_review_date:   new Date('2025-12-20'),
    payment_status:            'verified',
    payment_id:                paymentId,
    rules_agreement_accepted:  true,
    rules_agreement_name:      'Test User',
    rules_agreement_date:      new Date('2025-12-01')
  });
  Logger.log('Created test application: ' + applicationId);

  Logger.log('Phase 4 test data ready — run testPhase4Read() to verify.');
}

/**
 * Verifies Firestore reads for all Phase 4 collections.
 * Run after createTestPhase4Data().
 */
function testPhase4Read() {
  var householdId   = 'HSH-TEST-00001';
  var individualId  = 'IND-TEST-00001';
  var submissionId  = 'FSB-TEST-00001';
  var paymentId     = 'PAY-TEST-00001';
  var applicationId = 'APP-TEST-00001';

  var hh = firestoreGetHousehold(householdId);
  Logger.log('Household read: ' + (hh ? 'OK — ' + hh.household_name + ', status: ' + hh.membership_status : 'FAILED'));

  var ind = firestoreGetIndividual(householdId, individualId);
  Logger.log('Individual read: ' + (ind ? 'OK — ' + ind.first_name + ' ' + ind.last_name + ', email: ' + ind.email : 'FAILED'));

  var indByEmail = firestoreGetIndividualByEmail('testuser@example.com');
  Logger.log('Individual by email: ' + (indByEmail ? 'OK — ' + indByEmail.individual_id : 'FAILED'));

  var inds = firestoreGetIndividualsForHousehold(householdId);
  Logger.log('Individuals for household: ' + (inds.length > 0 ? 'OK — ' + inds.length + ' found' : 'FAILED (0 returned)'));

  var sub = firestoreGetSubmission(submissionId);
  Logger.log('Submission read: ' + (sub ? 'OK — ' + sub.document_type + ', status: ' + sub.status : 'FAILED'));

  var currentPassport = firestoreGetCurrentSubmissionByType(individualId, 'passport');
  Logger.log('Current passport: ' + (currentPassport ? 'OK — ' + currentPassport.submission_id : 'FAILED'));

  var subsByInd = firestoreGetSubmissionsForIndividual(individualId);
  Logger.log('Submissions for individual: ' + (subsByInd.length > 0 ? 'OK — ' + subsByInd.length + ' found' : 'FAILED (0 returned)'));

  var pay = firestoreGetPayment(paymentId);
  Logger.log('Payment read: ' + (pay ? 'OK — $' + pay.amount_usd + ' ' + pay.payment_status : 'FAILED'));

  var paysByHh = firestoreGetPaymentsForHousehold(householdId);
  Logger.log('Payments for household: ' + (paysByHh.length > 0 ? 'OK — ' + paysByHh.length + ' found' : 'FAILED (0 returned)'));

  var app = firestoreGetApplication(applicationId);
  Logger.log('Application read: ' + (app ? 'OK — ' + app.membership_category + ', status: ' + app.status : 'FAILED'));

  var appsByHh = firestoreGetApplicationsForHousehold(householdId);
  Logger.log('Applications for household: ' + (appsByHh.length > 0 ? 'OK — ' + appsByHh.length + ' found' : 'FAILED (0 returned)'));
}
