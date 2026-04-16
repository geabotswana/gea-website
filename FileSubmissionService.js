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
    var validTypes = ["photo", "passport", "omang", "employment"];
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
    var payload = {
      submission_id: generateId("FSB"),
      individual_id: params.individual_id,
      document_type: documentType,
      status: isPhoto ? "submitted" : "submitted",
      file_id: file.getId(),
      file_name: params.file_name,
      file_size_bytes: sizeBytes,
      file_content_type: contentType,
      submitted_date: new Date(),
      upload_device_type: params.upload_device_type || "unknown",
      user_email: params.user_email || "",
      is_current: true,
      member_facing_rejection_reason: "",
      disabled_date: "",
      application_id: params.application_id || "",
      document_expiration_date: params.document_expiration_date || "",
      expiration_warning_6m_sent_date: "",
      expiration_warning_1m_sent_date: ""
    };

    _expireCurrentSubmission_(payload.individual_id, documentType);
    _appendRowByHeaders_(submissionSheet, payload);

    if (documentType === "passport" || documentType === "omang") {
      generateRsoApprovalLink(payload.submission_id);

      // Send notifications for document submission
      var individual = getMemberById(payload.individual_id);
      if (individual) {
        var reviewDeadline = new Date();
        reviewDeadline.setDate(reviewDeadline.getDate() + 8);  // 8 days for review window

        // Notify board for awareness
        sendEmailFromTemplate("DOC_DOCUMENT_RECEIVED_TO_BOARD", EMAIL_BOARD, {
          MEMBER_NAME: (individual.first_name || "") + " " + (individual.last_name || ""),
          DOCUMENT_TYPE: documentType.charAt(0).toUpperCase() + documentType.slice(1),
          SUBMISSION_DATE: formatDate(payload.submitted_date),
          SUBMISSION_ID: payload.submission_id
        });

        // Notify RSO to review
        sendEmailFromTemplate("DOC_DOCUMENT_RECEIVED_TO_RSO", EMAIL_RSO_APPROVE, {
          MEMBER_NAME: (individual.first_name || "") + " " + (individual.last_name || ""),
          DOCUMENT_TYPE: documentType.charAt(0).toUpperCase() + documentType.slice(1),
          SUBMISSION_DATE: formatDate(payload.submitted_date),
          SUBMISSION_ID: payload.submission_id,
          REVIEW_DEADLINE: formatDate(reviewDeadline)
        });
      }
    }

    logAuditEntry(params.user_email || "member", AUDIT_FILE_SUBMISSION_CREATED, "FileSubmission", payload.submission_id,
      "Uploaded " + documentType);

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

function generateRsoApprovalLink(submission_id) {
  try {
    var found = _findSubmissionById_(submission_id);
    if (!found) return { ok: false, error: "Submission not found" };

    var docType = String(found.obj.document_type || "").toLowerCase();
    if (docType !== "passport" && docType !== "omang") {
      return { ok: false, error: "RSO links only apply to passport/omang" };
    }

    var tokenSeed = submission_id + "|" + new Date().getTime() + "|" + Utilities.getUuid();
    var tokenBytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, tokenSeed);
    var token = tokenBytes.map(function(b) {
      var v = (b + 256) % 256;
      return (v < 16 ? "0" : "") + v.toString(16);
    }).join("");

    var expiresAt = new Date(new Date().getTime() + (RSO_APPROVAL_LINK_EXPIRY_HOURS * 60 * 60 * 1000));
    _setSubmissionFields_(found, {
      rso_approval_link_token: token,
      rso_approval_link_expires_at: expiresAt,
      rso_approval_link_sent_date: new Date()
    });

    var baseUrl = ScriptApp.getService().getUrl();
    var linkUrl = baseUrl + "?action=rso_approve&token=" + encodeURIComponent(token);

    // NOTE: RSO now reviews documents via portal login (see CLAUDE.md — RSO Portal Access).
    // The token-based approval link above is still generated and stored, but the email
    // directs RSO to the portal. If direct-link approval is needed, add APPROVAL_LINK /
    // EXPIRES_AT / SUBMISSION_ID placeholders to the ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE
    // template in the Email Templates sheet.
    sendEmailFromTemplate("ADM_DOCUMENT_APPROVAL_REQUEST_TO_RSO_APPROVE", EMAIL_RSO_APPROVE, {
      APPLICANT_NAME:    submission_id,
      APPLICATION_ID:    submission_id,
      DOCUMENT_TYPES:    "Document submission",
      APPROVAL_DEADLINE: formatDate(expiresAt)
    });

    return { ok: true, link_url: linkUrl, expires_at: expiresAt };
  } catch (e) {
    Logger.log("ERROR generateRsoApprovalLink: " + e);
    return { ok: false, error: String(e) };
  }
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
      _appendRowByHeaders_(submissionSheet, {
        submission_id: generateId("FSB"),
        individual_id: ids[i],
        document_type: "employment",
        status: "requested",
        requested_by_admin: true,
        request_date: new Date(),
        request_reason: request_reason || "Employment verification requested",
        household_id: household_id,
        is_current: true
      });
    }
    return { ok: true, requested_count: ids.length };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Checks if all required documents for an application are approved (gea_pending or better)
 * Required: photo (approved/verified) AND (passport OR omang) (gea_pending/verified)
 * @param {string} applicationId
 * @returns {Object} { allApproved: bool, missingDocs: [], readyForApproval: bool }
 */
function checkApplicationDocumentReadiness(applicationId) {
  try {
    var sheet = _getFileSubmissionsSheet_();
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var submissions = [];

    for (var i = 1; i < data.length; i++) {
      var obj = rowToObject(headers, data[i]);
      if (obj.application_id === applicationId) {
        submissions.push(obj);
      }
    }

    var photoApproved = false;
    var passportReady = false;
    var omangReady = false;
    var missingDocs = [];

    for (var j = 0; j < submissions.length; j++) {
      var s = submissions[j];
      var status = String(s.status || "").toLowerCase();
      var docType = String(s.document_type || "").toLowerCase();

      if (docType === "photo" && (status === "approved" || status === "verified")) {
        photoApproved = true;
      } else if (docType === "passport" && (status === "gea_pending" || status === "verified")) {
        passportReady = true;
      } else if (docType === "omang" && (status === "gea_pending" || status === "verified")) {
        omangReady = true;
      }
    }

    if (!photoApproved) missingDocs.push("photo");
    if (!passportReady && !omangReady) missingDocs.push("passport or omang");

    var allApproved = photoApproved && (passportReady || omangReady);

    return {
      ok: true,
      allApproved: allApproved,
      missingDocs: missingDocs,
      readyForApproval: allApproved // RSO can approve application when all docs ready
    };
  } catch (e) {
    Logger.log("ERROR checkApplicationDocumentReadiness: " + e);
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
    var readiness = checkApplicationDocumentReadiness(applicationId);
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

    // Update application status to RSO_APPLICATION_REVIEW (intermediate state)
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_RSO_APPLICATION_REVIEW);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_status")).setValue("docs_approved");
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_reviewed_by")).setValue(rsoEmail);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_review_date")).setValue(new Date());
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

function rsoDenyApplication(applicationId, rsoEmail, denialMessage) {
  try {
    var readiness = checkApplicationDocumentReadiness(applicationId);
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

    // Update application status to RSO_APPLICATION_REVIEW with denial flag
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "status")).setValue(APP_STATUS_RSO_APPLICATION_REVIEW);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_status")).setValue("denied_recommendation");
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_reviewed_by")).setValue(rsoEmail);
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_review_date")).setValue(new Date());
    appSheet.getRange(appRow, _getColumnIndex(TAB_MEMBERSHIP_APPLICATIONS, "rso_private_notes")).setValue(denialMessage);

    logAuditEntry(rsoEmail, "APPLICATION_RSO_DENIED", "Application", applicationId,
      "RSO recommended denial of application");

    // Send email to board with denial message
    var boardEmail = getConfigValue("EMAIL_BOARD") || "board@geabotswana.org";
    sendEmailFromTemplate("ADM_RSO_APPLICATION_DENIED_TO_BOARD", boardEmail, {
      FIRST_NAME:       "Board",
      APPLICANT_NAME:   application.primary_applicant_name || "",
      APPLICATION_ID:   applicationId,
      DENIAL_MESSAGE:   denialMessage,
      NEXT_STEPS:       "RSO has recommended denial. You may accept this recommendation or approve the application if you believe it meets requirements. Please contact the applicant with a diplomatic response."
    });

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
          _setSubmissionFields_(found, { expiration_warning_6m_sent_date: new Date() });
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
          _setSubmissionFields_(found2, { expiration_warning_1m_sent_date: new Date() });
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
      gea_review_date: new Date(),
      member_facing_rejection_reason: approved ? "" : rejectionReason,
      is_current: approved ? true : false,
      disabled_date: approved ? "" : new Date()
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
            RESUBMIT_DEADLINE: formatDate(new Date(new Date().getTime() + (10 * 24 * 60 * 60 * 1000)))
          });
          sendEmailFromTemplate("DOC_PHOTO_REJECTION_TO_BOARD", EMAIL_BOARD, {
            MEMBER_NAME: (individual.first_name || "") + " " + (individual.last_name || ""),
            REJECTED_BY: userEmail,
            REJECTION_DATE: formatDate(new Date()),
            SUBMISSION_ID: submission_id,
            BOARD_REJECTION_MESSAGE: rejectionReason || "Rejected by board",
            RESUBMIT_DEADLINE: formatDate(new Date(new Date().getTime() + (10 * 24 * 60 * 60 * 1000)))
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
          var resubmitDeadline = new Date(new Date().getTime() + (10 * 24 * 60 * 60 * 1000));
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
  if (documentType === "employment") return FOLDER_EMPLOYMENT_VERIFICATION;
  return FOLDER_IDENTIFICATION_SCANS;  // passport, omang
}

function _getFileSubmissionsSheet_() {
  return SpreadsheetApp.openById(MEMBER_DIRECTORY_ID).getSheetByName(TAB_FILE_SUBMISSIONS);
}

function _appendRowByHeaders_(sheet, obj) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = [];
  for (var i = 0; i < headers.length; i++) row.push(obj[headers[i]] !== undefined ? obj[headers[i]] : "");
  sheet.appendRow(row);
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
      if (disabledCol > 0) sheet.getRange(i + 1, disabledCol).setValue(new Date());
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
 * Returns all passport/omang submissions with status="submitted" awaiting RSO review.
 * Optionally filtered by document_type.
 *
 * @param {string|null} documentTypeFilter  "passport", "omang", or null for all
 * @returns {Array}
 */
function getDocumentsForRsoReview(documentTypeFilter) {
  try {
    var sheet   = _getFileSubmissionsSheet_();
    var data    = sheet.getDataRange().getValues();
    var headers = data[0];
    var results = [];

    for (var i = 1; i < data.length; i++) {
      var obj = rowToObject(headers, data[i]);
      var docType = String(obj.document_type || "").toLowerCase();
      var status  = String(obj.status || "").toLowerCase();

      // RSO reviews passport and omang only; status must be "submitted"
      if (docType !== "passport" && docType !== "omang") continue;
      if (status !== "submitted") continue;
      if (documentTypeFilter && docType !== documentTypeFilter.toLowerCase()) continue;

      // Get applicant name from Individuals sheet
      var individual = getMemberById(obj.individual_id);
      // Look up application_id via household so RSO can load full application context
      var applicationId = "";
      if (individual && individual.household_id) {
        var app = _getApplicationByHouseholdId(individual.household_id);
        if (app) applicationId = app.application_id || "";
      }
      results.push({
        submission_id:   obj.submission_id,
        individual_id:   obj.individual_id,
        application_id:  applicationId,
        applicant_name:  individual ? (individual.first_name + " " + individual.last_name) : "(unknown)",
        applicant_email: individual ? individual.email : "",
        document_type:   obj.document_type,
        status:          obj.status,
        submitted_date:  obj.submission_timestamp ? formatDate(new Date(obj.submission_timestamp), true) : "",
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
    var newStatus  = approve ? "gea_pending" : "rso_rejected";

    var patchObj = {
      status:                          newStatus,
      rso_reviewed_by:                 rsoEmail,
      rso_review_date:                 new Date(),
      member_facing_rejection_reason:  approve ? "" : (rejectionReason || "Rejected by RSO")
    };

    // If rejecting, track that RSO rejected it
    if (!approve) {
      // Default to allowing resubmission unless explicitly set otherwise
      patchObj.allow_resubmit = allowResubmit !== undefined ? allowResubmit : true;
    }

    _setSubmissionFields_(found, patchObj);

    logAuditEntry(rsoEmail,
      approve ? AUDIT_FILE_SUBMISSION_RSO_APPROVED : AUDIT_FILE_SUBMISSION_RSO_REJECTED,
      "FileSubmission", submissionId,
      approve ? "Approved via RSO portal" : "Rejected via RSO portal: " + rejectionReason);

    var individual = getMemberById(found.obj.individual_id);
    var boardEmail = EMAIL_BOARD;

    if (approve) {
      // RSO approved - notify board that document is ready for their final review
      if (individual) {
        sendEmailFromTemplate("ADM_DOCUMENT_APPROVAL_REQUEST_TO_BOARD", boardEmail, {
          APPLICANT_NAME: (individual.first_name || "") + " " + (individual.last_name || ""),
          APPLICATION_ID: found.obj.application_id || submissionId,
          APPROVAL_DEADLINE: formatDate(new Date(new Date().getTime() + (3 * 24 * 60 * 60 * 1000))),
          BOARD_ITEM_TYPE: "Document Review: " + docType
        });
      }
    } else {
      // RSO rejected - notify board with rejection reason
      var applicantName = individual ? (individual.first_name + " " + individual.last_name) : "Unknown";
      sendEmailFromTemplate("ADM_DOCUMENT_REJECTED_BY_RSO_TO_BOARD", boardEmail, {
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
      var readiness = checkApplicationDocumentReadiness(found.obj.application_id);
      if (readiness.ok && readiness.allApproved) {
        // Get application to verify it's in RSO_REVIEW status
        var app = _getApplicationById(found.obj.application_id);
        if (app && String(app.status || "").toLowerCase() === String(APP_STATUS_RSO_DOCS_REVIEW).toLowerCase()) {
          // All documents approved - notify board that RSO can now finalize application
          var boardEmail = getConfigValue("EMAIL_BOARD") || "board@geabotswana.org";
          var appName = app.primary_applicant_name || "Applicant";
          sendEmailFromTemplate("ADM_RSO_ALL_DOCS_APPROVED_TO_BOARD", boardEmail, {
            FIRST_NAME:     "Board",
            APPLICANT_NAME: appName,
            APPLICATION_ID: found.obj.application_id,
            APPROVAL_DATE:  formatDate(new Date())
          });
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
        _setSubmissionFields_(data[i], {
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
