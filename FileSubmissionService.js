/**
 * ============================================================
 * FILESUBMISSIONSERVICE.GS
 * ============================================================
 * File upload, approval, and document verification workflow.
 *
 * This module powers member-facing document uploads, board approval,
 * RSO one-time review links, and nightly expiration checks.
 * ============================================================
 */

/**
 * FUNCTION: uploadFileSubmission
 * PURPOSE: Stores an uploaded file and creates a File Submissions record.
 * @param {Object} params upload parameters
 * @returns {Object}
 */
function uploadFileSubmission(params) {
  try {
    if (!params || !params.individual_id || !params.document_type || !params.file_blob || !params.file_name) {
      return { ok: false, error: "Missing required fields", code: "INVALID_PARAM" };
    }

    var documentType = String(params.document_type).toLowerCase();
    var validTypes = ["photo", "passport", "omang", "employment", "funding verification", "diplomatic accreditation"];
    if (validTypes.indexOf(documentType) === -1) {
      return { ok: false, error: "Invalid document type", code: "INVALID_DOCUMENT_TYPE" };
    }

    var sizeBytes = Number(params.file_size_bytes || params.file_blob.getBytes().length || 0);
    var isPhoto = documentType === "photo";
    var maxSizeMb = isPhoto ? PHOTO_MAX_SIZE_MB : 10;
    if (sizeBytes > maxSizeMb * 1024 * 1024) {
      return { ok: false, error: "File exceeds maximum size", code: "FILE_TOO_LARGE" };
    }

    var contentType = String(params.file_blob.getContentType() || "").toLowerCase();
    if (isPhoto && PHOTO_ACCEPTED_TYPES.indexOf(contentType) === -1) {
      return { ok: false, error: "Invalid photo format", code: "INVALID_FILE_FORMAT" };
    }

    var folderId = _getSubmissionFolderId_(documentType);
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(params.file_blob).setName(params.file_name);

    var submissionSheet = _getFileSubmissionsSheet_();
    var applicationId = params.application_id || "";

    // Calculate photo expiration date if not provided
    var expirationDate = params.document_expiration_date || "";
    if (isPhoto && !expirationDate) {
      var individual = getMemberById(params.individual_id);
      if (individual && individual.date_of_birth) {
        var calculatedExpiry = calculatePhotoExpirationDate(individual.date_of_birth, new Date());
        expirationDate = calculatedExpiry || "";
      }
    }

    var payload = {
      submission_id: generateId("FSB"),
      individual_id: params.individual_id,
      document_type: documentType,
      status: "submitted",
      file_id: file.getId(),
      file_name: params.file_name,
      file_size_bytes: sizeBytes,
      file_content_type: contentType,
      submitted_date: formatDate(new Date(), true),
      upload_device_type: params.upload_device_type || "unknown",
      user_email: params.user_email || "",
      is_current: true,
      member_facing_rejection_reason: "",
      disabled_date: "",
      application_id: applicationId,
      submission_type: applicationId ? "applicant" : "member",
      document_expiration_date: expirationDate,
      expiration_warning_6m_sent_date: "",
      expiration_warning_1m_sent_date: ""
    };

    _handleOldSubmissionOnReplacement_(payload.individual_id, documentType);
    _appendRowByHeaders_(submissionSheet, payload);

    if (documentType === "passport" || documentType === "omang") {
      if (!applicationId) {
        // Member document upload: notify RSO immediately. For applicant uploads, RSO is
        // notified only after board approval via the application workflow (ApplicationService).
        sendEmailFromTemplate("ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE", EMAIL_RSO_APPROVE, {
          APPLICANT_NAME:    payload.submission_id,
          APPLICATION_ID:    payload.submission_id,
          DOCUMENT_TYPES:    documentType.charAt(0).toUpperCase() + documentType.slice(1),
          APPROVAL_DEADLINE: formatDate(addBusinessDays(new Date(), 5))
        });

        // Notify board for awareness (background notification, no action needed)
        var individual = getMemberById(payload.individual_id);
        if (individual) {
          sendEmailFromTemplate("DOC_DOCUMENT_RECEIVED_TO_BOARD", EMAIL_BOARD, {
            MEMBER_NAME: (individual.first_name || "") + " " + (individual.last_name || ""),
            DOCUMENT_TYPE: documentType.charAt(0).toUpperCase() + documentType.slice(1),
            SUBMISSION_DATE: formatDate(payload.submitted_date),
            SUBMISSION_ID: payload.submission_id
          });
        }
      }
    } else if (documentType === "photo") {
      // Send notifications for photo submission to GEA Board (not RSO)
      var individual = getMemberById(payload.individual_id);
      if (individual) {
        // Notify board to review
        sendEmailFromTemplate("DOC_PHOTO_RECEIVED_TO_BOARD", EMAIL_BOARD, {
          MEMBER_NAME: (individual.first_name || "") + " " + (individual.last_name || ""),
          SUBMISSION_DATE: formatDate(payload.submitted_date),
          SUBMISSION_ID: payload.submission_id
        });
      }
    }

    logAuditEntry(params.user_email || "member", AUDIT_FILE_SUBMISSION_CREATED, "FileSubmission", payload.submission_id,
      "Uploaded " + documentType);

    // Convert PDFs to images asynchronously (non-blocking)
    if (contentType === "application/pdf" && (documentType === "passport" || documentType === "omang")) {
      try {
        convertPdfToImages(file.getId(), payload.submission_id);
      } catch (e) {
        Logger.log("Warning: PDF conversion failed for submission " + payload.submission_id + ": " + e);
        // Don't fail the upload if conversion fails; user can still download original PDF
      }
    }

    return { ok: true, submission_id: payload.submission_id, message: "File uploaded successfully" };
  } catch (e) {
    Logger.log("ERROR uploadFileSubmission: " + e);
    return { ok: false, error: String(e), code: "SERVER_ERROR" };
  }
}

function getFileSubmissionStatus(individual_id) {
  try {
    var individualsSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_INDIVIDUALS);
    var indData = individualsSheet.getDataRange().getValues();
    var indHeaders = indData[0];
    var ind = null;
    for (var i = 1; i < indData.length; i++) {
      var rowObj = rowToObject(indHeaders, indData[i]);
      if (rowObj.individual_id === individual_id) {
        ind = rowObj;
        break;
      }
    }
    if (!ind) return { ok: false, error: "Individual not found" };

    var submissions = _getSubmissionsForIndividual_(individual_id);
    return {
      individual_id: individual_id,
      full_name: ((ind.first_name || "") + " " + (ind.last_name || "")).trim(),
      date_of_birth: ind.date_of_birth || "",
      photo: _buildStatusForType_(submissions, "photo"),
      passport: _buildStatusForType_(submissions, "passport"),
      omang: _buildStatusForType_(submissions, "omang"),
      employment: _buildStatusForType_(submissions, "employment"),
      all_required_complete: _allRequiredFilesComplete_(submissions),
      household_id: ind.household_id || ""
    };
  } catch (e) {
    Logger.log("ERROR getFileSubmissionStatus: " + e);
    return { ok: false, error: String(e) };
  }
}

function approveFileSubmission(submission_id, user_email) {
  return _reviewFileSubmission_(submission_id, "approve", "", user_email);
}

function rejectFileSubmission(submission_id, rejection_reason, user_email) {
  return _reviewFileSubmission_(submission_id, "reject", rejection_reason || "Rejected by reviewer", user_email);
}

function handleRsoApprovalLink(token, action, rejection_reason) {
  try {
    if (!token) return { ok: false, error: "Missing token" };

    var found = _findSubmissionByToken_(token);
    if (!found) return { ok: false, error: "Invalid or expired link" };

    var now = new Date();
    var expires = found.obj.rso_approval_link_expires_at ? new Date(found.obj.rso_approval_link_expires_at) : null;
    if (expires && now > expires) {
      return { ok: false, error: "Link expired" };
    }
    if (found.obj.rso_approval_link_used_at) {
      return { ok: false, error: "Link already used" };
    }

    var approve = String(action || "approve").toLowerCase() === "approve";
    _setSubmissionFields_(found, {
      status: approve ? "gea_pending" : "rso_rejected",
      rso_reviewed_by: EMAIL_RSO_APPROVE,
      rso_review_date: now,
      member_facing_rejection_reason: approve ? "" : (rejection_reason || "Rejected by RSO"),
      rso_approval_link_used_at: now
    });

    logAuditEntry(EMAIL_RSO_APPROVE, approve ? AUDIT_FILE_SUBMISSION_RSO_APPROVED : AUDIT_FILE_SUBMISSION_RSO_REJECTED,
      "FileSubmission", found.obj.submission_id, approve ? "Approved via one-time link" : "Rejected via one-time link");

    return { ok: true, submission_id: found.obj.submission_id, status: approve ? "gea_pending" : "rso_rejected" };
  } catch (e) {
    Logger.log("ERROR handleRsoApprovalLink: " + e);
    return { ok: false, error: String(e) };
  }
}

function copyApprovedPhotoToCloudStorage(submission_id, individual_id) {
  try {
    var found = _findSubmissionById_(submission_id);
    if (!found) return { ok: false, error: "Submission not found" };

    var src = DriveApp.getFileById(found.obj.file_id);
    var archiveFolder = DriveApp.getFolderById(FOLDER_FILE_SUBMISSION_ARCHIVE);
    var copy = src.makeCopy("approved_photo_" + individual_id + "_" + new Date().getTime(), archiveFolder);

    var objectPath = "members/" + individual_id + "/photos/current/" + copy.getName();
    _setSubmissionFields_(found, { cloud_storage_path: "gs://" + CLOUD_STORAGE_MEMBER_DATA_BUCKET + "/" + objectPath });

    return { ok: true, cloud_storage_path: "gs://" + CLOUD_STORAGE_MEMBER_DATA_BUCKET + "/" + objectPath };
  } catch (e) {
    Logger.log("ERROR copyApprovedPhotoToCloudStorage: " + e);
    return { ok: false, error: String(e) };
  }
}

function getSubmissionHistory(individual_id) {
  var submissions = _getSubmissionsForIndividual_(individual_id);
  submissions.sort(function(a, b) {
    return new Date(b.submitted_date || 0).getTime() - new Date(a.submitted_date || 0).getTime();
  });
  return { ok: true, individual_id: individual_id, history: submissions };
}

function requestEmploymentVerification(household_id, individual_ids, request_reason) {
  try {
    var ids = individual_ids || [];
    for (var i = 0; i < ids.length; i++) {
      var submissionSheet = _getFileSubmissionsSheet_();
      var employmentPayload = {
        submission_id: generateId("FSB"),
        individual_id: ids[i],
        document_type: "employment",
        status: "requested",
        requested_by_admin: true,
        request_date: formatDate(new Date(), true),
        request_reason: request_reason || "Employment verification requested",
        household_id: household_id,
        is_current: true
      };
      _appendRowByHeaders_(submissionSheet, employmentPayload);
    }
    return { ok: true, requested_count: ids.length };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Checks that all required documents for an application have been submitted (submitted or better).
 * Used at initial submission time to verify the applicant has uploaded everything before
 * the application enters board_initial_review.
 * @param {string} applicationId
 * @returns {Object} { ok, allApproved, missingDocs, requiredDocuments, category }
 */
function checkApplicationDocumentReadiness(applicationId) {
  try {
    var application = _getApplicationById(applicationId);
    if (!application) {
      return { ok: false, error: "Application not found" };
    }

    var category = application.membership_category || "";
    var allSubmissions = _getAllSubmissions_();
    var submissions = [];

    for (var i = 0; i < allSubmissions.length; i++) {
      if (allSubmissions[i].application_id === applicationId) {
        submissions.push(allSubmissions[i]);
      }
    }

    var requiredDocs = APPLICANT_UPLOAD_TYPES[category] || [];
    var submittedDocs = {};
    var missingDocs = [];

    // Rejected statuses: rso_rejected, gea_rejected — do not count as "submitted"
    var _rejectedStatuses = ["rso_rejected", "gea_rejected"];

    for (var j = 0; j < submissions.length; j++) {
      var s = submissions[j];
      var status = String(s.status || "").toLowerCase();
      var docType = String(s.document_type || "").toLowerCase();
      if (_rejectedStatuses.indexOf(status) === -1) {
        submittedDocs[docType] = true;
      }
    }

    for (var k = 0; k < requiredDocs.length; k++) {
      var requiredType = String(requiredDocs[k]).toLowerCase();
      if (!submittedDocs[requiredType]) {
        missingDocs.push(requiredDocs[k]);
      }
    }

    var allDocumentsReady = missingDocs.length === 0;

    return {
      ok: true,
      allApproved: allDocumentsReady,
      missingDocs: missingDocs,
      readyForApproval: allDocumentsReady,
      category: category,
      requiredDocuments: requiredDocs
    };
  } catch (e) {
    Logger.log("ERROR checkApplicationDocumentReadiness: " + e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Checks whether RSO has approved all passport/omang documents for an application.
 * Used to auto-advance the application from rso_docs_review to rso_application_review
 * when the last RSO-reviewable document is approved. Photos and non-RSO docs are ignored.
 * @param {string} applicationId
 * @returns {Object} { ok, allApproved, missingDocs }
 */
function checkRsoDocReadiness(applicationId) {
  try {
    var application = _getApplicationById(applicationId);
    if (!application) {
      return { ok: false, error: "Application not found" };
    }

    // Get all individuals in the household to check each one requiring an ID doc
    var individuals = application.household_id
      ? _getIndividualsByHouseholdId(application.household_id)
      : [];
    if (individuals.length === 0) {
      return { ok: false, error: "No individuals found for application" };
    }

    var allSubmissions = _getAllSubmissions_();
    var rsoApprovedStatuses = ["gea_pending", "verified", "approved"];
    var rsoDocTypes = ["passport", "omang"];

    // Build per-individual map: individualId → { found: bool, approved: bool }
    // Only track individuals who are old enough to require an ID doc
    var individualStatus = {};
    for (var p = 0; p < individuals.length; p++) {
      var ind = individuals[p];
      var age = ind.date_of_birth ? calculateAge(ind.date_of_birth) : null;
      if (age === null || age >= AGE_DOCUMENT_REQUIRED) {
        individualStatus[ind.individual_id] = { name: (ind.first_name || "") + " " + (ind.last_name || ""), found: false, approved: false };
      }
    }

    for (var i = 0; i < allSubmissions.length; i++) {
      var s = allSubmissions[i];
      if (s.application_id !== applicationId) continue;
      if (s.is_current === false || s.is_current === "false" || s.is_current === "FALSE") continue;
      var indId   = s.individual_id;
      var docType = String(s.document_type || "").toLowerCase();
      var status  = String(s.status || "").toLowerCase();
      if (rsoDocTypes.indexOf(docType) === -1) continue;
      if (!individualStatus[indId]) continue;  // individual not old enough / not on this application
      individualStatus[indId].found = true;
      if (rsoApprovedStatuses.indexOf(status) !== -1) {
        individualStatus[indId].approved = true;
      }
    }

    var missingDocs = [];
    var indIds = Object.keys(individualStatus);
    for (var d = 0; d < indIds.length; d++) {
      var entry = individualStatus[indIds[d]];
      if (!entry.found) {
        missingDocs.push(entry.name + ": no Passport or Omang submitted");
      } else if (!entry.approved) {
        missingDocs.push(entry.name + ": Passport/Omang pending RSO approval");
      }
    }

    return { ok: true, allApproved: missingDocs.length === 0, missingDocs: missingDocs };
  } catch (e) {
    Logger.log("ERROR checkRsoDocReadiness: " + e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Checks that all required documents are fully approved before the board makes a final
 * decision. Requirements by doc type:
 *   - passport / omang:  rso_approved or later
 *   - photo:             submitted or later (non-blocking — just must exist)
 *   - all others (e.g. funding verification, diplomatic accreditation): gea_pending or later
 * @param {string} applicationId
 * @returns {Object} { ok, allApproved, missingDocs }
 */
function checkBoardFinalDocReadiness(applicationId) {
  try {
    var application = _getApplicationById(applicationId);
    if (!application) {
      return { ok: false, error: "Application not found" };
    }

    var category = application.membership_category || "";
    var requiredDocs = APPLICANT_UPLOAD_TYPES[category] || [];
    var allSubmissions = _getAllSubmissions_();
    var bestStatus = {};  // docType → best status seen

    var statusRank = { "submitted": 1, "gea_pending": 2, "verified": 3, "approved": 4 };

    for (var i = 0; i < allSubmissions.length; i++) {
      var s = allSubmissions[i];
      if (s.application_id !== applicationId) continue;
      if (s.is_current === false || s.is_current === "false" || s.is_current === "FALSE") continue;
      var docType = String(s.document_type || "").toLowerCase();
      var status  = String(s.status || "").toLowerCase();
      if (!statusRank[status]) continue;  // skip rejected / unknown
      if (!bestStatus[docType] || statusRank[status] > statusRank[bestStatus[docType]]) {
        bestStatus[docType] = status;
      }
    }

    var missingDocs = [];

    // For passport/omang: treat as either-or — at least one must be verified+.
    // Applicants in Associate/Affiliate/Community categories submit one or the other.
    var idDocTypes = ["passport", "omang"];
    var categoryRequiresIdDoc = false;
    for (var m = 0; m < requiredDocs.length; m++) {
      if (idDocTypes.indexOf(String(requiredDocs[m]).toLowerCase()) !== -1) {
        categoryRequiresIdDoc = true;
        break;
      }
    }
    if (categoryRequiresIdDoc) {
      var idDocSatisfied = false;
      for (var n = 0; n < idDocTypes.length; n++) {
        var best = bestStatus[idDocTypes[n]];
        if (best && statusRank[best] >= statusRank["verified"]) {
          idDocSatisfied = true;
          break;
        }
      }
      if (!idDocSatisfied) {
        missingDocs.push("Passport or Omang (not RSO-approved)");
      }
    }

    // Check non-ID required docs at their appropriate threshold
    for (var k = 0; k < requiredDocs.length; k++) {
      var requiredType = String(requiredDocs[k]).toLowerCase();
      if (idDocTypes.indexOf(requiredType) !== -1) continue;  // handled above
      var docBest = bestStatus[requiredType];
      // funding verification, diplomatic accreditation, etc. — board approval sets "verified"
      var acceptable = docBest && statusRank[docBest] >= statusRank["verified"];
      if (!acceptable) {
        missingDocs.push(requiredDocs[k] + " (not fully approved)");
      }
    }

    return { ok: true, allApproved: missingDocs.length === 0, missingDocs: missingDocs };
  } catch (e) {
    Logger.log("ERROR checkBoardFinalDocReadiness: " + e);
    return { ok: false, error: String(e) };
  }
}

/**
 * RSO finalizes approval of an application after all documents are approved
 * Moves application from RSO_REVIEW to RSO_DOCS_APPROVED status
 * @param {string} applicationId
 * @param {string} rsoEmail
 * @param {string} notes (optional) RSO notes
 * @returns {Object} { ok, message }
 */
function rsoApproveApplication(applicationId, rsoEmail, notes) {
  try {
    var readiness = checkRsoDocReadiness(applicationId);
    if (!readiness.ok) {
      return { ok: false, message: "Could not check document status." };
    }
    if (!readiness.allApproved) {
      return { ok: false, message: "Not all required documents are approved. Missing: " + readiness.missingDocs.join(", ") };
    }

    // Get application from ApplicationService
    var application = _getApplicationById(applicationId);
    if (!application) {
      return { ok: false, message: "Application not found." };
    }

    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var appRow = _findApplicationRow(applicationId);
    if (appRow === -1) {
      return { ok: false, message: "Application row not found in sheet." };
    }

    // Update application status to BOARD_FINAL_REVIEW — RSO has approved the application
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_BOARD_FINAL_REVIEW);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_status")).setValue("docs_approved");
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_reviewed_by")).setValue(rsoEmail);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_review_date")).setValue(formatDate(new Date(), true));
    if (notes) {
      appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_private_notes")).setValue(notes);
    }

    logAuditEntry(rsoEmail, "APPLICATION_RSO_DOCS_APPROVED", "Application", applicationId,
      "RSO approved all documents and application");

    // Send email to board (no email to applicant at this stage)
    var boardEmail = getConfigValue("EMAIL_BOARD") || "board@geabotswana.org";
    sendEmailFromTemplate("ADM_RSO_APPLICATION_APPROVED_TO_BOARD", boardEmail, {
      FIRST_NAME:       "Board",
      APPLICANT_NAME:   application.primary_applicant_name || "",
      APPLICATION_ID:   applicationId,
      APPROVAL_DATE:    formatDate(new Date()),
      NEXT_STEPS:       "All RSO documents approved. Ready for your final approval and payment instructions."
    });

    return { ok: true, message: "Application documents approved by RSO. Awaiting board final approval." };
  } catch (e) {
    Logger.log("ERROR rsoApproveApplication: " + e);
    return { ok: false, message: String(e) };
  }
}

function rsoDenyApplication(applicationId, rsoEmail, denialMessage, allowReapplication) {
  try {
    // NOTE: No document readiness gate here — RSO can recommend denial at any point,
    // including when some documents are still pending or rejected. The readiness gate
    // only applies to approval (rsoApproveApplication).
    var application = _getApplicationById(applicationId);
    if (!application) {
      return { ok: false, message: "Application not found." };
    }

    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var appRow = _findApplicationRow(applicationId);
    if (appRow === -1) {
      return { ok: false, message: "Application row not found in sheet." };
    }

    // Advance to board_final_review with a denial recommendation so the board makes the final call.
    // The board will see the RSO reason and a facility-access warning before approving.
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_BOARD_FINAL_REVIEW);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_status")).setValue("denied_recommendation");
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_reviewed_by")).setValue(rsoEmail);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_review_date")).setValue(formatDate(new Date(), true));
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_private_notes")).setValue(denialMessage);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "allow_reapplication")).setValue(allowReapplication ? "true" : "false");

    logAuditEntry(rsoEmail, "APPLICATION_RSO_DENIED", "Application", applicationId,
      "RSO recommended denial of application" + (allowReapplication ? " (reapplication allowed)" : " (permanent)"));

    // Notify board with RSO denial reason and facility-access warning (board makes final call)
    var boardEmail = getConfigValue("EMAIL_BOARD") || "board@geabotswana.org";
    sendEmailFromTemplate("ADM_RSO_DENIAL_RECOMMENDATION_TO_BOARD", boardEmail, {
      FIRST_NAME:          "Board",
      APPLICANT_NAME:      application.primary_applicant_name || "",
      APPLICATION_ID:      applicationId,
      RSO_DENIAL_REASON:   denialMessage,
      FACILITY_WARNING:    "WARNING: If you approve this application over RSO's recommendation, the applicant will have full access to GEA facilities.",
      ALLOW_REAPPLICATION: allowReapplication ? "Yes" : "No",
      REVIEW_DEADLINE:     formatDate(addBusinessDays(new Date(), 5))
    });
    // Applicant is NOT notified at this stage — board contacts them after making the final decision

    return { ok: true, message: "Application denial recommended. Board will review." };
  } catch (e) {
    Logger.log("ERROR rsoDenyApplication: " + e);
    return { ok: false, message: String(e) };
  }
}

function checkDocumentExpirationWarnings() {
  var submissions = _getAllSubmissions_();
  var warningsSent = 0;
  var now = new Date();
  var sixMonths = new Date(now.getFullYear(), now.getMonth() + PASSPORT_WARNING_MONTHS, now.getDate());
  var oneMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

  for (var i = 0; i < submissions.length; i++) {
    var s = submissions[i];
    if (!s.is_current || (s.status !== "verified" && s.status !== "approved")) continue;
    var docType = String(s.document_type || "").toLowerCase();
    // Only send expiration warnings for passports and onangs, not photos
    // Photos show need for renewal in Member Portal, no emails
    if (docType !== "passport" && docType !== "omang") continue;
    if (!s.document_expiration_date) continue;
    var expiry = new Date(s.document_expiration_date);
    if (expiry <= now) continue; // Already expired

    var individual = getMemberById(s.individual_id);
    if (!individual || !individual.email) continue;

    // Check for 6-month warning
    if (expiry <= sixMonths && expiry > oneMonth) {
      if (!s.expiration_warning_6m_sent_date) {
        // Send 6-month warning
        sendEmailFromTemplate("MEM_PASSPORT_EXPIRATION_WARNING_6M_TO_MEMBER", individual.email, {
          FIRST_NAME:        individual.first_name || "Member",
          DOCUMENT_TYPE:     docType === "passport" ? "passport" : "omang",
          EXPIRATION_DATE:   formatDate(expiry),
          PORTAL_URL:        getConfigValue("PORTAL_URL") || ""
        });

        // Mark as sent
        var found = _findSubmissionById_(s.submission_id);
        if (found) {
          _setSubmissionFields_(found, { expiration_warning_6m_sent_date: formatDate(new Date(), true) });
        }
        warningsSent++;
      }
    }

    // Check for 1-month warning (only if 6-month wasn't just sent)
    if (expiry <= oneMonth && expiry > now) {
      if (!s.expiration_warning_1m_sent_date) {
        // Send 1-month warning
        sendEmailFromTemplate("MEM_PASSPORT_EXPIRATION_WARNING_1M_TO_MEMBER", individual.email, {
          FIRST_NAME:        individual.first_name || "Member",
          DOCUMENT_TYPE:     docType === "passport" ? "passport" : "omang",
          EXPIRATION_DATE:   formatDate(expiry),
          PORTAL_URL:        getConfigValue("PORTAL_URL") || ""
        });

        // Mark as sent
        var found2 = _findSubmissionById_(s.submission_id);
        if (found2) {
          _setSubmissionFields_(found2, { expiration_warning_1m_sent_date: formatDate(new Date(), true) });
        }
        warningsSent++;
      }
    }
  }

  return { ok: true, warnings_sent: warningsSent };
}

function deleteExpiredRsoLinks() {
  var sheet = _getFileSubmissionsSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var expiredCount = 0;
  var now = new Date();

  for (var i = 1; i < data.length; i++) {
    var rowObj = rowToObject(headers, data[i]);
    if (!rowObj.rso_approval_link_token || rowObj.rso_approval_link_used_at) continue;
    if (!rowObj.rso_approval_link_expires_at) continue;
    var exp = new Date(rowObj.rso_approval_link_expires_at);
    if (now > exp) {
      expiredCount++;
      var statusCol = headers.indexOf("status") + 1;
      var tokenCol = headers.indexOf("rso_approval_link_token") + 1;
      if (statusCol > 0) sheet.getRange(i + 1, statusCol).setValue("rso_link_expired");
      if (tokenCol > 0) sheet.getRange(i + 1, tokenCol).setValue("");
    }
  }

  return { ok: true, expired_count: expiredCount };
}

function _reviewFileSubmission_(submission_id, decision, rejectionReason, userEmail) {
  try {
    var found = _findSubmissionById_(submission_id);
    if (!found) return { ok: false, error: "Submission not found" };

    var docType = String(found.obj.document_type || "").toLowerCase();
    var approved = decision === "approve";
    var newStatus = approved ? (docType === "photo" || docType === "employment" ? "approved" : "verified") :
      (found.obj.status === "submitted" ? "rso_rejected" : "gea_rejected");

    var patchObj = {
      status: newStatus,
      gea_reviewed_by: userEmail,
      gea_review_date: formatDate(new Date(), true),
      member_facing_rejection_reason: approved ? "" : rejectionReason,
      is_current: approved ? true : false,
      disabled_date: approved ? "" : formatDate(new Date(), true)
    };

    // When document is approved, blank out expiration warning dates so new document is tracked
    if (approved) {
      patchObj.expiration_warning_6m_sent_date = "";
      patchObj.expiration_warning_1m_sent_date = "";
    }

    _setSubmissionFields_(found, patchObj);

    if (approved && docType === "photo") {
      copyApprovedPhotoToCloudStorage(submission_id, found.obj.individual_id);
    }

    // Send approval/rejection emails
    var individual = getMemberById(found.obj.individual_id);
    if (individual) {
      if (docType === "photo") {
        if (approved) {
          // Photo approved - notify member and board
          sendEmailFromTemplate("DOC_PHOTO_APPROVED_TO_MEMBER_POST_ACTIVATION", individual.email, {
            FIRST_NAME: individual.first_name || "Member",
            APPROVED_DATE: formatDate(new Date()),
            PORTAL_URL: "https://geabotswana.org/member.html"
          });
          sendEmailFromTemplate("DOC_PHOTO_APPROVED_TO_BOARD", EMAIL_BOARD, {
            MEMBER_NAME: (individual.first_name || "") + " " + (individual.last_name || ""),
            APPROVED_BY: userEmail,
            APPROVED_DATE: formatDate(new Date()),
            SUBMISSION_ID: submission_id
          });
        } else {
          // Photo rejected - notify member and board
          sendEmailFromTemplate("DOC_PHOTO_REJECTED_TO_MEMBER_WITH_BOARD_MESSAGE", individual.email, {
            FIRST_NAME: individual.first_name || "Member",
            BOARD_REJECTION_MESSAGE: rejectionReason || "Your photo was rejected. Please resubmit.",
            PORTAL_URL: "https://geabotswana.org/member.html",
            RESUBMIT_DEADLINE: formatDate(addBusinessDays(new Date(), 10))
          });
          sendEmailFromTemplate("DOC_PHOTO_REJECTION_TO_BOARD", EMAIL_BOARD, {
            MEMBER_NAME: (individual.first_name || "") + " " + (individual.last_name || ""),
            REJECTED_BY: userEmail,
            REJECTION_DATE: formatDate(new Date()),
            SUBMISSION_ID: submission_id,
            BOARD_REJECTION_MESSAGE: rejectionReason || "Rejected by board",
            RESUBMIT_DEADLINE: formatDate(addBusinessDays(new Date(), 10))
          });
        }
      } else if (docType === "passport" || docType === "omang") {
        if (approved) {
          // Document approved - notify member and board
          sendEmailFromTemplate("DOC_DOCUMENT_APPROVED_TO_MEMBER", individual.email, {
            FIRST_NAME: individual.first_name || "Member",
            DOCUMENT_TYPE: docType.charAt(0).toUpperCase() + docType.slice(1),
            APPROVED_DATE: formatDate(new Date()),
            PORTAL_URL: "https://geabotswana.org/member.html"
          });
          sendEmailFromTemplate("DOC_DOCUMENT_APPROVED_TO_BOARD", EMAIL_BOARD, {
            MEMBER_NAME: (individual.first_name || "") + " " + (individual.last_name || ""),
            DOCUMENT_TYPE: docType.charAt(0).toUpperCase() + docType.slice(1),
            APPROVED_BY: userEmail,
            APPROVED_DATE: formatDate(new Date()),
            SUBMISSION_ID: submission_id
          });
        } else {
          // Document rejected - send to board to compose message, then to member
          var resubmitDeadline = addBusinessDays(new Date(), 10);
          sendEmailFromTemplate("DOC_DOCUMENT_REJECTED_TO_BOARD", EMAIL_BOARD, {
            MEMBER_NAME: (individual.first_name || "") + " " + (individual.last_name || ""),
            DOCUMENT_TYPE: docType.charAt(0).toUpperCase() + docType.slice(1),
            REJECTED_BY: userEmail,
            REJECTION_DATE: formatDate(new Date()),
            SUBMISSION_ID: submission_id,
            RSO_REJECTION_MESSAGE: found.obj.member_facing_rejection_reason || rejectionReason || "Rejected",
            SUGGESTED_DEADLINE: formatDate(resubmitDeadline),
            RESUBMISSION_DAYS: "10"
          });
          // Also notify member if rejection reason provided
          if (rejectionReason) {
            sendEmailFromTemplate("DOC_DOCUMENT_REJECTED_TO_MEMBER_WITH_BOARD_MESSAGE", individual.email, {
              FIRST_NAME: individual.first_name || "Member",
              DOCUMENT_TYPE: docType.charAt(0).toUpperCase() + docType.slice(1),
              BOARD_REJECTION_MESSAGE: rejectionReason || "Your document was rejected.",
              PORTAL_URL: "https://geabotswana.org/member.html",
              RESUBMIT_DEADLINE: formatDate(resubmitDeadline)
            });
          }
        }
      }
    }

    logAuditEntry(userEmail,
      approved ? AUDIT_FILE_SUBMISSION_GEA_APPROVED : AUDIT_FILE_SUBMISSION_GEA_REJECTED,
      "FileSubmission", submission_id,
      approved ? "Submission approved" : "Submission rejected: " + rejectionReason);

    return { ok: true, individual_id: found.obj.individual_id, document_type: docType, status: newStatus };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

function _getSubmissionFolderId_(documentType) {
  if (documentType === "photo") return FOLDER_PHOTOS_PENDING;
  if (documentType === "employment" || documentType === "funding verification" || documentType === "diplomatic accreditation") {
    return FOLDER_EMPLOYMENT_VERIFICATION;
  }
  return FOLDER_IDENTIFICATION_SCANS;  // passport, omang
}

function _getFileSubmissionsSheet_() {
  return SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_FILE_SUBMISSIONS);
}

function _findSubmissionById_(submissionId) {
  var sheet = _getFileSubmissionsSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  for (var i = 1; i < data.length; i++) {
    var obj = rowToObject(headers, data[i]);
    if (obj.submission_id === submissionId) {
      return { sheet: sheet, headers: headers, rowIndex: i + 1, obj: obj };
    }
  }
  return null;
}

function _findSubmissionByToken_(token) {
  var sheet = _getFileSubmissionsSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  for (var i = 1; i < data.length; i++) {
    var obj = rowToObject(headers, data[i]);
    if (obj.rso_approval_link_token === token) {
      return { sheet: sheet, headers: headers, rowIndex: i + 1, obj: obj };
    }
  }
  return null;
}

function _setSubmissionFields_(found, patch) {
  if (!found || !found.obj) return;
  var headers = found.headers;
  for (var key in patch) {
    if (!patch.hasOwnProperty(key)) continue;
    var col = headers.indexOf(key) + 1;
    if (col > 0) {
      found.sheet.getRange(found.rowIndex, col).setValue(patch[key]);
      found.obj[key] = patch[key];
    }
  }
}

function _getSubmissionsForIndividual_(individualId) {
  var all = _getAllSubmissions_();
  var list = [];
  for (var i = 0; i < all.length; i++) {
    if (all[i].individual_id === individualId) list.push(all[i]);
  }
  return list;
}

function _getAllSubmissions_() {
  var sheet = _getFileSubmissionsSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var out = [];
  for (var i = 1; i < data.length; i++) out.push(rowToObject(headers, data[i]));
  return out;
}

/**
 * Deletes a document submission that is still in 'submitted' status (not yet in review).
 * Only the current submission can be removed; once RSO has started review it is locked.
 */
function removeDocumentSubmission(individualId, documentType, callerEmail) {
  try {
    var sheet = _getFileSubmissionsSheet_();
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    for (var i = data.length - 1; i >= 1; i--) {
      var obj = rowToObject(headers, data[i]);
      if (obj.individual_id === individualId
          && String(obj.document_type || '').toLowerCase() === String(documentType || '').toLowerCase()
          && (obj.is_current === true || obj.is_current === 'TRUE')
          && obj.status === 'submitted') {
        var submissionId = obj.submission_id;
        var fileId = obj.file_id;
        sheet.deleteRow(i + 1);
        if (fileId) {
          try { DriveApp.getFileById(fileId).setTrashed(true); } catch (fe) { /* file already gone */ }
        }
        logAuditEntry(callerEmail, 'document_removed', 'FileSubmission', submissionId,
          'Applicant removed ' + documentType + ' submission before review');
        return { ok: true };
      }
    }
    return { ok: false, message: 'No removable submission found. The document may already be under review.' };
  } catch (e) {
    logError('removeDocumentSubmission', e);
    return { ok: false, message: 'Error removing document.' };
  }
}

/**
 * Removes ALL file submissions for an individual (used when member is deleted from application).
 * Deletes rows from File Submissions sheet and cleans up associated Drive files.
 */
function removeAllFileSubmissionsForIndividual(individualId, callerEmail) {
  try {
    var sheet = _getFileSubmissionsSheet_();
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var deletedCount = 0;

    // Iterate backwards to safely delete rows
    for (var i = data.length - 1; i >= 1; i--) {
      var obj = rowToObject(headers, data[i]);
      if (obj.individual_id === individualId) {
        var fileId = obj.file_id;
        sheet.deleteRow(i + 1);
        deletedCount++;

        // Clean up associated Drive file
        if (fileId) {
          try { DriveApp.getFileById(fileId).setTrashed(true); } catch (fe) { /* file already gone */ }
        }
      }
    }

    if (deletedCount > 0) {
      logAuditEntry(callerEmail, 'member_deleted_with_submissions', 'FileSubmission', individualId,
        'Deleted ' + deletedCount + ' file submission(s) when member was removed');
    }
    return { ok: true, deletedCount: deletedCount };
  } catch (e) {
    logError('removeAllFileSubmissionsForIndividual', e);
    return { ok: false, deletedCount: 0 };
  }
}

function _expireCurrentSubmission_(individualId, documentType) {
  var sheet = _getFileSubmissionsSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  for (var i = 1; i < data.length; i++) {
    var obj = rowToObject(headers, data[i]);
    if (obj.individual_id === individualId && String(obj.document_type || "").toLowerCase() === documentType && obj.is_current === true) {
      var currCol = headers.indexOf("is_current") + 1;
      var disabledCol = headers.indexOf("disabled_date") + 1;
      if (currCol > 0) sheet.getRange(i + 1, currCol).setValue(false);
      if (disabledCol > 0) sheet.getRange(i + 1, disabledCol).setValue(formatDate(new Date(), true));
    }
  }
}

function _handleOldSubmissionOnReplacement_(individualId, documentType) {
  var sheet = _getFileSubmissionsSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];

  for (var i = data.length - 1; i >= 1; i--) {
    var obj = rowToObject(headers, data[i]);
    if (obj.individual_id === individualId &&
        String(obj.document_type || "").toLowerCase() === documentType &&
        obj.is_current === true) {
      var status = String(obj.status || "").toLowerCase();

      if (status === "submitted") {
        // Unapproved submission - delete it completely
        var fileId = obj.file_id;
        sheet.deleteRow(i + 1);
        if (fileId) {
          try { DriveApp.getFileById(fileId).setTrashed(true); } catch (fe) { /* file already gone */ }
        }
      } else {
        // Approved submission - deactivate it (preserve audit trail)
        var currCol = headers.indexOf("is_current") + 1;
        var disabledCol = headers.indexOf("disabled_date") + 1;
        if (currCol > 0) sheet.getRange(i + 1, currCol).setValue(false);
        if (disabledCol > 0) sheet.getRange(i + 1, disabledCol).setValue(formatDate(new Date(), true));
      }

      return;
    }
  }
}

function _buildStatusForType_(submissions, documentType) {
  var latest = null;
  for (var i = 0; i < submissions.length; i++) {
    var s = submissions[i];
    if (String(s.document_type || "").toLowerCase() !== documentType) continue;
    if (!latest) {
      latest = s;
    } else {
      var a = new Date(latest.submitted_date || 0).getTime();
      var b = new Date(s.submitted_date || 0).getTime();
      if (b > a) latest = s;
    }
  }

  if (!latest) return { status: "none", submission_id: null, can_resubmit: true };

  var status = String(latest.status || "submitted").toLowerCase();
  var out = {
    status: status,
    submission_id: latest.submission_id,
    submitted_date: latest.submitted_date || null,
    rejection_reason: latest.member_facing_rejection_reason || null,
    can_resubmit: (status.indexOf("rejected") >= 0 || status === "none")
  };
  if (latest.expiration_date || latest.doc_expiry_date) {
    out.expiration_date = latest.expiration_date || latest.doc_expiry_date;
  }
  if (documentType === "employment") {
    out.requested_by_admin = latest.requested_by_admin === true;
    out.request_date = latest.request_date || null;
  }
  return out;
}

function _allRequiredFilesComplete_(submissions) {
  var need = { photo: false, passport: false, omang: false };
  for (var i = 0; i < submissions.length; i++) {
    var s = submissions[i];
    var dt = String(s.document_type || "").toLowerCase();
    var st = String(s.status || "").toLowerCase();
    if (dt === "photo" && (st === "approved" || st === "verified")) need.photo = true;
    if (dt === "passport" && st === "verified") need.passport = true;
    if (dt === "omang" && st === "verified") need.omang = true;
  }
  return need.photo && (need.passport || need.omang);
}

// ============================================================
// RSO PORTAL: DOCUMENT REVIEW (AUTHENTICATED)
// ============================================================

/**
 * Returns all applicant (ADR) passport/omang submissions with status="submitted" awaiting RSO review.
 * Filters by submission_type="applicant".
 *
 * @param {string|null} documentTypeFilter  "passport", "omang", or null for all
 * @returns {Array}
 */
function getApplicantDocumentsForRsoReview(documentTypeFilter) {
  return _getDocumentsForRsoReviewByType_("applicant", documentTypeFilter);
}

/**
 * Returns all member (MDR) passport/omang submissions with status="submitted" awaiting RSO review.
 * Filters by submission_type="member".
 *
 * @param {string|null} documentTypeFilter  "passport", "omang", or null for all
 * @returns {Array}
 */
function getMemberDocumentsForRsoReview(documentTypeFilter) {
  return _getDocumentsForRsoReviewByType_("member", documentTypeFilter);
}

/**
 * Returns all passport/omang submissions with status="submitted" awaiting RSO review.
 * Optionally filtered by document_type.
 *
 * @param {string|null} documentTypeFilter  "passport", "omang", or null for all
 * @returns {Array}
 */
function getDocumentsForRsoReview(documentTypeFilter) {
  return _getDocumentsForRsoReviewByType_(null, documentTypeFilter);
}

/**
 * Helper: Returns documents for RSO review, filtered by type and document type.
 *
 * @param {string|null} submissionType  "applicant", "member", or null for all
 * @param {string|null} documentTypeFilter  "passport", "omang", or null for all
 * @returns {Array}
 * @private
 */
function _getDocumentsForRsoReviewByType_(submissionType, documentTypeFilter) {
  try {
    var submissions = _getAllSubmissions_();
    var results = [];

    for (var i = 0; i < submissions.length; i++) {
      var obj = submissions[i];
      var docType = String(obj.document_type || "").toLowerCase();
      var status  = String(obj.status || "").toLowerCase();
      var subType = String(obj.submission_type || "").toLowerCase();

      // RSO reviews passport and omang only; status must be "submitted"
      if (docType !== "passport" && docType !== "omang") continue;
      if (status !== "submitted") continue;
      if (documentTypeFilter && docType !== documentTypeFilter.toLowerCase()) continue;
      if (submissionType && subType !== submissionType.toLowerCase()) continue;

      // Get applicant name from Individuals sheet
      var individual = getMemberById(obj.individual_id);
      var applicationId = obj.application_id || "";

      // For applicant documents, only include if application is in rso_docs_review stage or later
      if (submissionType === "applicant" && applicationId) {
        var application = _getApplicationById(applicationId);
        if (!application) continue;  // Application not found
        // Only include if status is rso_docs_review or later in the progression
        var allowedStatuses = ["rso_docs_review", "rso_application_review", "board_final_review",
                               "approved_pending_payment", "payment_submitted", "payment_verified", "activated"];
        if (allowedStatuses.indexOf(application.status) === -1) continue;
      }

      results.push({
        submission_id:   obj.submission_id,
        individual_id:   obj.individual_id,
        application_id:  applicationId,
        submission_type: obj.submission_type || "unknown",
        applicant_name:  individual ? (individual.first_name + " " + individual.last_name) : "(unknown)",
        applicant_email: individual ? individual.email : "",
        document_type:   obj.document_type,
        status:          obj.status,
        submitted_date:  obj.submitted_date ? formatDate(new Date(obj.submitted_date), true) : "",
        file_id:         obj.file_id || "",
        file_name:       obj.file_name || ""
      });
    }

    results.sort(function(a, b) { return a.submitted_date < b.submitted_date ? -1 : 1; });
    return results;
  } catch (e) {
    Logger.log("ERROR getDocumentsForRsoReview: " + e);
    return [];
  }
}

/**
 * Approves or rejects a document submission by an authenticated RSO member.
 * Equivalent to handleRsoApprovalLink() but uses the portal session instead of a one-time link.
 *
 * @param {string} submissionId
 * @param {string} decision       "approve" or "reject"
 * @param {string} rejectionReason  Required if decision="reject"
 * @param {string} rsoEmail       Authenticated RSO member's email (from session)
 * @returns {Object}  { ok, new_status } or { ok: false, error }
 */
function approveDocumentByRso(submissionId, decision, rejectionReason, rsoEmail, allowResubmit) {
  try {
    var found = _findSubmissionById_(submissionId);
    if (!found) return { ok: false, error: "Submission not found." };

    var docType = String(found.obj.document_type || "").toLowerCase();
    if (docType !== "passport" && docType !== "omang") {
      return { ok: false, error: "RSO review only applies to passport/omang documents." };
    }
    if (found.obj.status !== "submitted") {
      return { ok: false, error: "Document is not in 'submitted' state (current: " + found.obj.status + ")." };
    }

    var approve    = decision === "approve";
    var newStatus  = approve ? "verified" : "rso_rejected";

    var patchObj = {
      status:                          newStatus,
      rso_reviewed_by:                 rsoEmail,
      rso_review_date:                 formatDate(new Date(), true),
      member_facing_rejection_reason:  approve ? "" : (rejectionReason || "Rejected by RSO")
    };

    // If rejecting, track that RSO rejected it
    if (!approve) {
      // Default to allowing resubmission unless explicitly set otherwise
      patchObj.allow_resubmit = allowResubmit !== undefined ? allowResubmit : true;
    }

    _setSubmissionFields_(found, patchObj);
    SpreadsheetApp.flush();  // ensure write is visible to the readiness check below

    logAuditEntry(rsoEmail,
      approve ? AUDIT_FILE_SUBMISSION_RSO_APPROVED : AUDIT_FILE_SUBMISSION_RSO_REJECTED,
      "FileSubmission", submissionId,
      approve ? "Approved via RSO portal" : "Rejected via RSO portal: " + rejectionReason);

    var individual = getMemberById(found.obj.individual_id);
    var notifEmail = EMAIL_BOARD;

    if (approve) {
      // RSO approved - notify board as informational notification
      if (individual) {
        sendEmailFromTemplate("ADM_DOCUMENT_APPROVED_BY_RSO_TO_BOARD", notifEmail, {
          FIRST_NAME: "Board",
          APPLICANT_NAME: (individual.first_name || "") + " " + (individual.last_name || ""),
          DOCUMENT_TYPE: docType,
          APPLICATION_ID: found.obj.application_id || submissionId,
          APPROVAL_DATE: formatDate(new Date())
        });
      }
    } else {
      // RSO rejected - notify board with rejection reason
      var applicantName = individual ? (individual.first_name + " " + individual.last_name) : "Unknown";
      sendEmailFromTemplate("ADM_DOCUMENT_REJECTED_BY_RSO_TO_BOARD", notifEmail, {
        FIRST_NAME:        "Board",
        APPLICANT_NAME:    applicantName,
        INDIVIDUAL_ID:     found.obj.individual_id,
        DOCUMENT_TYPE:     docType,
        REJECTION_REASON:  rejectionReason || "Rejected by RSO",
        APPLICATION_ID:    found.obj.application_id || "(standalone document)"
      });
    }

    // If approved and part of an application, check if all documents are now approved
    if (approve && found.obj.application_id) {
      var readiness = checkRsoDocReadiness(found.obj.application_id);
      if (readiness.ok && readiness.allApproved) {
        // Get application to verify it's in RSO_DOCS_REVIEW status
        var app = _getApplicationById(found.obj.application_id);
        if (app && String(app.status || "").toLowerCase() === String(APP_STATUS_RSO_DOCS_REVIEW).toLowerCase()) {
          var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
          var appRow = _findApplicationRow(found.obj.application_id);
          if (appRow !== -1) {
            appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_RSO_APPLICATION_REVIEW);
            logAuditEntry(rsoEmail, "APPLICATION_STATUS_AUTO_ADVANCED", "Application", found.obj.application_id,
              "All required documents RSO-approved; status advanced to rso_application_review");
            sendEmailFromTemplate("ADM_RSO_ALL_DOCS_APPROVED_TO_BOARD", notifEmail, {
              FIRST_NAME:     "Board",
              APPLICANT_NAME: app.primary_applicant_name || "Applicant",
              APPLICATION_ID: found.obj.application_id,
              APPROVAL_DATE:  formatDate(new Date())
            });
          }
        }
      }
    }

    return { ok: true, new_status: newStatus };
  } catch (e) {
    Logger.log("ERROR approveDocumentByRso: " + e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Auto-reject all pending file submissions for a member being removed from household.
 * Used when member is removed to clean up pending documents/photos.
 *
 * @param {string} individualId
 * @param {string} actingBy - Email of person performing the action
 * @returns {Object} { ok: boolean, rejectedCount: number }
 */
function autoRejectPendingSubmissionsOnMemberRemoval(individualId, actingBy) {
  try {
    var sheet = _getFileSubmissionsSheet_();
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var rejectedCount = 0;
    var today = formatDate(new Date());

    // Status values that are considered "pending" (not final)
    var pendingStatuses = ['submitted', 'rso_approved', 'gea_pending'];

    for (var i = data.length - 1; i >= 1; i--) {
      var obj = rowToObject(headers, data[i]);
      if (obj.individual_id === individualId && pendingStatuses.includes(obj.status)) {
        // Update submission to rejected with automated message
        _setSubmissionFields_({ sheet: sheet, headers: headers, rowIndex: i + 1, obj: obj }, {
          status: 'rejected',
          rejection_reason: 'Subject individual has been removed from member household',
          gea_reviewed_by: actingBy,
          gea_review_date: today,
          is_current: false
        });
        rejectedCount++;
      }
    }

    if (rejectedCount > 0) {
      logAuditEntry(actingBy, 'pending_submissions_auto_rejected_on_member_removal',
        'FileSubmission', individualId,
        'Auto-rejected ' + rejectedCount + ' pending submission(s) when member was removed');
    }

    return { ok: true, rejectedCount: rejectedCount };
  } catch (e) {
    Logger.log("ERROR autoRejectPendingSubmissionsOnMemberRemoval: " + e);
    return { ok: false, rejectedCount: 0, error: String(e) };
  }
}

/**
 * RSO approves a post-activation member document (passport/omang replacement).
 * Document is marked as verified. Member and board are notified.
 */
function approveRsoMemberDocument(submission_id, rso_email) {
  try {
    var found = _findSubmissionById_(submission_id);
    if (!found) return { ok: false, error: "Submission not found" };

    var docType = String(found.obj.document_type || "").toLowerCase();
    if (docType !== "passport" && docType !== "omang") {
      return { ok: false, error: "RSO approval only applies to passport/omang" };
    }

    // Mark as verified (final approval for post-activation documents)
    var patchObj = {
      status: "verified",
      rso_reviewed_by: rso_email,
      rso_review_date: formatDate(new Date(), true),
      is_current: true,
      expiration_warning_6m_sent_date: "",
      expiration_warning_1m_sent_date: ""
    };

    _setSubmissionFields_(found, patchObj);

    // Send approval notifications
    var individual = getMemberById(found.obj.individual_id);
    if (individual) {
      sendEmailFromTemplate("DOC_DOCUMENT_APPROVED_TO_MEMBER", individual.email, {
        FIRST_NAME: individual.first_name || "Member",
        DOCUMENT_TYPE: docType.charAt(0).toUpperCase() + docType.slice(1),
        APPROVED_DATE: formatDate(new Date()),
        PORTAL_URL: "https://geabotswana.org/member.html"
      });
      sendEmailFromTemplate("DOC_DOCUMENT_APPROVED_TO_BOARD", EMAIL_BOARD, {
        MEMBER_NAME: (individual.first_name || "") + " " + (individual.last_name || ""),
        DOCUMENT_TYPE: docType.charAt(0).toUpperCase() + docType.slice(1),
        APPROVED_BY: rso_email,
        APPROVED_DATE: formatDate(new Date()),
        SUBMISSION_ID: submission_id
      });
    }

    logAuditEntry(rso_email, AUDIT_FILE_SUBMISSION_RSO_APPROVED, "FileSubmission", submission_id,
      "RSO approved " + docType + " replacement for member");

    return { ok: true };
  } catch (e) {
    Logger.log("ERROR approveRsoMemberDocument: " + e);
    return { ok: false, error: String(e) };
  }
}

/**
 * RSO rejects a post-activation member document (passport/omang replacement).
 * Document is marked as rejected. Board is notified to compose diplomatic message.
 */
function rejectRsoMemberDocument(submission_id, rso_rejection_reason, rso_email) {
  try {
    var found = _findSubmissionById_(submission_id);
    if (!found) return { ok: false, error: "Submission not found" };

    var docType = String(found.obj.document_type || "").toLowerCase();
    if (docType !== "passport" && docType !== "omang") {
      return { ok: false, error: "RSO approval only applies to passport/omang" };
    }

    var resubmitDeadline = addBusinessDays(new Date(), 10);

    // Mark as rejected
    var patchObj = {
      status: "rso_rejected",
      rso_reviewed_by: rso_email,
      rso_review_date: formatDate(new Date(), true),
      member_facing_rejection_reason: rso_rejection_reason,
      is_current: false,
      disabled_date: formatDate(new Date(), true)
    };

    _setSubmissionFields_(found, patchObj);

    // Notify board to compose diplomatic message
    var individual = getMemberById(found.obj.individual_id);
    if (individual) {
      sendEmailFromTemplate("DOC_DOCUMENT_REJECTED_TO_BOARD", EMAIL_BOARD, {
        MEMBER_NAME: (individual.first_name || "") + " " + (individual.last_name || ""),
        DOCUMENT_TYPE: docType.charAt(0).toUpperCase() + docType.slice(1),
        REJECTED_BY: rso_email,
        REJECTION_DATE: formatDate(new Date()),
        SUBMISSION_ID: submission_id,
        RSO_REJECTION_MESSAGE: rso_rejection_reason || "Rejected",
        SUGGESTED_DEADLINE: formatDate(resubmitDeadline),
        RESUBMISSION_DAYS: "10"
      });
    }

    logAuditEntry(rso_email, AUDIT_FILE_SUBMISSION_RSO_REJECTED, "FileSubmission", submission_id,
      "RSO rejected " + docType + " replacement: " + rso_rejection_reason);

    return { ok: true };
  } catch (e) {
    Logger.log("ERROR rejectRsoMemberDocument: " + e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Board sends diplomatic rejection message to member (after RSO rejection).
 * Document is marked as board_rejected_member_notified.
 * Member gets email with both RSO and board messages.
 * Board gets confirmation email.
 */
function sendBoardDocumentRejectionResponse(submission_id, board_rejection_message, board_email) {
  try {
    var found = _findSubmissionById_(submission_id);
    if (!found) return { ok: false, error: "Submission not found" };

    var docType = String(found.obj.document_type || "").toLowerCase();
    if (docType !== "passport" && docType !== "omang") {
      return { ok: false, error: "Document rejection response only applies to passport/omang" };
    }

    var rsoRejectionReason = found.obj.member_facing_rejection_reason || "";

    // Mark as board_rejected_member_notified (final state)
    var patchObj = {
      status: "board_rejected_member_notified",
      board_rejection_message: board_rejection_message,
      board_notified_by: board_email,
      board_notification_date: formatDate(new Date(), true)
    };

    _setSubmissionFields_(found, patchObj);

    // Send email to member with both RSO and board messages
    var individual = getMemberById(found.obj.individual_id);
    if (individual) {
      sendEmailFromTemplate("DOC_MEMBER_DOCUMENT_REJECTED_BY_BOARD", individual.email, {
        FIRST_NAME: individual.first_name || "Member",
        DOCUMENT_TYPE: docType.charAt(0).toUpperCase() + docType.slice(1),
        RSO_REJECTION_REASON: rsoRejectionReason,
        BOARD_REJECTION_MESSAGE: board_rejection_message,
        RESUBMISSION_INSTRUCTIONS: "Please review the feedback above and resubmit your document. You can upload a new document through your member portal.",
        PORTAL_URL: "https://geabotswana.org/member.html",
        SUPPORT_EMAIL: EMAIL_BOARD
      });

      // Send board confirmation with both messages for audit trail
      sendEmailFromTemplate("DOC_BOARD_DOCUMENT_REJECTION_CONFIRMATION", EMAIL_BOARD, {
        MEMBER_NAME: (individual.first_name || "") + " " + (individual.last_name || ""),
        DOCUMENT_TYPE: docType.charAt(0).toUpperCase() + docType.slice(1),
        RSO_REASON: rsoRejectionReason,
        BOARD_MESSAGE: board_rejection_message,
        SUBMISSION_ID: submission_id,
        NOTIFICATION_DATE: formatDate(new Date())
      });
    }

    logAuditEntry(board_email, AUDIT_FILE_SUBMISSION_BOARD_REJECTED, "FileSubmission", submission_id,
      "Board sent diplomatic rejection to member for " + docType + " replacement");

    return { ok: true };
  } catch (e) {
    Logger.log("ERROR sendBoardDocumentRejectionResponse: " + e);
    return { ok: false, error: String(e) };
  }
}

/**
 * Board sends diplomatic rejection message to applicant (after RSO denial).
 * Updates application with board message and sends email to applicant.
 */
function sendBoardApplicationRejectionResponse(applicationId, boardMessage, allowReapplication, boardEmail) {
  try {
    var appSheet = SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_MEMBERSHIP_APPLICATIONS);
    var appRow = _findApplicationRow(applicationId);
    if (!appRow) return { ok: false, error: "Application not found" };

    var application = _getApplicationById(applicationId);
    if (!application) return { ok: false, error: "Application not found" };

    // Record board message and mark as responded
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_rejection_message")).setValue(boardMessage);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_notified_by")).setValue(boardEmail);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "board_notification_date")).setValue(formatDate(new Date(), true));

    // Send email to applicant with RSO + board messages
    var applicantEmail = application.primary_applicant_email;
    if (applicantEmail) {
      var reapplicationInfo = allowReapplication
        ? "You are welcome to reapply in the future. Please contact the board if you have questions about the process or would like to discuss your application."
        : "Please note that you are not eligible to reapply at this time. If you believe this decision is in error, you may contact the board to discuss.";

      sendEmailFromTemplate("MEM_APPLICATION_REJECTED_BY_BOARD_TO_APPLICANT", applicantEmail, {
        FIRST_NAME: application.primary_applicant_first_name || "Applicant",
        APPLICATION_ID: applicationId,
        RSO_REASON: application.rso_private_notes || "",
        BOARD_MESSAGE: boardMessage,
        REAPPLICATION_INFO: reapplicationInfo,
        SUPPORT_EMAIL: getConfigValue("EMAIL_BOARD") || "board@geabotswana.org"
      });

      // Send board confirmation with both messages for audit trail
      sendEmailFromTemplate("MEM_APPLICATION_REJECTION_CONFIRMATION_TO_BOARD", getConfigValue("EMAIL_BOARD") || "board@geabotswana.org", {
        APPLICANT_NAME: application.primary_applicant_name || "",
        APPLICATION_ID: applicationId,
        RSO_REASON: application.rso_private_notes || "",
        BOARD_MESSAGE: boardMessage,
        ALLOW_REAPPLICATION: allowReapplication ? "Yes" : "No",
        NOTIFICATION_DATE: formatDate(new Date())
      });
    }

    logAuditEntry(boardEmail, "APPLICATION_BOARD_REJECTION_RESPONSE", "Application", applicationId,
      "Board sent diplomatic rejection response to applicant");

    return { ok: true };
  } catch (e) {
    Logger.log("ERROR sendBoardApplicationRejectionResponse: " + e);
    return { ok: false, error: String(e) };
  }
}

/**
 * MIGRATION: Backfill submission_type field for existing documents.
 * Sets "applicant" if application_id is not empty, "member" if empty.
 * Run once to populate all existing documents.
 */
function migrateSubmissionTypeField() {
  try {
    var sheet = _getFileSubmissionsSheet_();
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var submissionTypeColIndex = headers.indexOf("submission_type");
    var applicationIdColIndex = headers.indexOf("application_id");

    if (submissionTypeColIndex === -1) {
      Logger.log("WARNING: submission_type column not found in File Submissions sheet");
      return { ok: false, error: "submission_type column not found" };
    }

    if (applicationIdColIndex === -1) {
      Logger.log("WARNING: application_id column not found in File Submissions sheet");
      return { ok: false, error: "application_id column not found" };
    }

    var updatedCount = 0;
    for (var i = 1; i < data.length; i++) {
      var submissionType = String(data[i][submissionTypeColIndex] || "").trim();
      if (!submissionType) {
        var applicationId = String(data[i][applicationIdColIndex] || "").trim();
        var newType = applicationId ? "applicant" : "member";
        sheet.getRange(i + 1, submissionTypeColIndex + 1).setValue(newType);
        updatedCount++;
      }
    }

    Logger.log("SUCCESS: Migrated " + updatedCount + " documents with submission_type field");
    return { ok: true, updated: updatedCount };
  } catch (e) {
    Logger.log("ERROR migrateSubmissionTypeField: " + e);
    return { ok: false, error: String(e) };
  }
}

/**
 * FUNCTION: _ensureSubmissionColumns_
 * PURPOSE: Add missing columns to File Submissions sheet
 * @param {Array} requiredColumns Column names to ensure exist
 * @returns {Object} { ok, added: [] }
 */
function _ensureSubmissionColumns_(requiredColumns) {
  try {
    var sheet = _getFileSubmissionsSheet_();
    var headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var added = [];
    var nextCol = headerRow.length + 1;

    for (var i = 0; i < requiredColumns.length; i++) {
      var col = requiredColumns[i];
      if (headerRow.indexOf(col) === -1) {
        sheet.getRange(1, nextCol).setValue(col);
        added.push(col);
        nextCol++;
      }
    }

    return { ok: true, added: added };
  } catch (e) {
    Logger.log("Warning: Could not ensure columns: " + e);
    return { ok: false, error: String(e) };
  }
}

/**
 * FUNCTION: convertPdfToImages
 * PURPOSE: Convert PDF to PNG images (one per page) using Google Docs API.
 * Stores image file IDs in spreadsheet, then deletes original PDF and temp Google Doc.
 * Note: This is a best-effort async conversion. Failures are logged but don't block upload.
 * @param {string} pdfFileId File ID of PDF in Google Drive
 * @param {string} submissionId Submission ID for tracking
 * @returns {Object} { ok, imageFileIds: [], imageCount }
 */
function convertPdfToImages(pdfFileId, submissionId) {
  try {
    if (!pdfFileId) {
      return { ok: false, error: "PDF file ID required" };
    }

    // Ensure required columns exist in File Submissions sheet
    _ensureSubmissionColumns_(["image_file_ids", "pdf_conversion_date", "image_count", "pdf_conversion_attempted"]);

    var pdfFile = DriveApp.getFileById(pdfFileId);
    var pdfBlob = pdfFile.getBlob();
    var imageFolder = DriveApp.getFolderById(FOLDER_FILE_SUBMISSION_ARCHIVE);

    // Mark that we attempted conversion
    var found = _findSubmissionById_(submissionId);
    if (found) {
      _setSubmissionFields_(found, { pdf_conversion_attempted: formatDate(new Date(), true) });
    }

    // Attempt to import PDF into Google Docs and convert to images
    // This is a best-effort conversion; if it fails, the original PDF remains viewable
    var tempFolder = null;
    try {
      tempFolder = DriveApp.createFolder('_temp_pdf_' + submissionId);
      var tempPdfFile = tempFolder.createFile(pdfBlob);

      // Try to import via DocumentApp (only works if PDF has text/structured content)
      // If this fails, conversion simply won't happen, but the PDF is still accessible
      var doc = DocumentApp.importFile(tempPdfFile);
      var docBody = doc.getBody();

      // For now, just mark conversion as attempted
      // Full PDF→images conversion via Google Docs is complex and conversion failures are expected
      // Fallback: Server-side blob data URL works for all PDFs in the modal

      return { ok: false, error: "PDF conversion to images not yet available" };
    } catch (convErr) {
      Logger.log("Info: PDF conversion failed (expected for most PDFs): " + convErr);
      return { ok: false, error: "PDF conversion not available" };
    } finally {
      // Clean up temp folder on both success and failure paths
      if (tempFolder) {
        try {
          tempFolder.setTrashed(true);
        } catch (cleanupErr) {
          Logger.log("Warning: Could not delete temp folder: " + cleanupErr);
        }
      }
    }
  } catch (e) {
    Logger.log("WARNING convertPdfToImages: " + e);
    return { ok: false, error: String(e) };
  }
}

/**
 * FUNCTION: _getImageFilesForSubmission
 * PURPOSE: Get converted image file IDs for a submission
 * @param {string} submissionId
 * @returns {Array} Array of image file IDs
 */
function _getImageFilesForSubmission(submissionId) {
  var found = _findSubmissionById_(submissionId);
  if (!found || !found.obj.image_file_ids) {
    return [];
  }
  var imageIds = String(found.obj.image_file_ids || '').split(',');
  return imageIds.filter(function(id) { return id.trim().length > 0; });
}

/**
 * FUNCTION: _findSubmissionByFileId
 * PURPOSE: Find submission record by Google Drive file_id
 * @param {string} fileId Google Drive file ID
 * @returns {Object} { idx, obj } or null
 */
function _findSubmissionByFileId(fileId) {
  var sheet = _getFileSubmissionsSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  var fileIdIdx = headers.indexOf('file_id');

  if (fileIdIdx === -1) return null;

  for (var i = 1; i < data.length; i++) {
    if (data[i][fileIdIdx] === fileId) {
      return { idx: i, obj: rowToObject(headers, data[i]) };
    }
  }
  return null;
}
