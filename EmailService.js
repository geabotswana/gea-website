/**
 * ============================================================
 * EMAILSERVICE.GS
 * ============================================================
 * Handles all email sending for the GEA system.
 *
 * How it works:
 *   1. Caller passes a template ID + variables object
 *   2. Template body/subject fetched from Email Templates tab
 *   3. {{PLACEHOLDERS}} replaced with actual values
 *   4. Plain text wrapped in the GEA master HTML template
 *   5. Both HTML + plain text sent via GmailApp
 *
 * Primary entry point: sendEmail(templateId, recipient, variables)
 * ============================================================
 */


// ============================================================
// PRIMARY ENTRY POINT
// ============================================================

/**
 * Sends a styled GEA email using a template from the spreadsheet.
 *
 * @param {string}       templateId  e.g. "tpl_007"
 * @param {string|Array} recipient   Email address(es)
 * @param {Object}       variables   Placeholder values: { FIRST_NAME: "Jane", ... }
 * @param {string}       replyTo     (Optional) Reply-To address. Defaults to EMAIL_BOARD
 * @returns {boolean}    true if sent successfully
 *
 * EXAMPLE:
 *   sendEmail("tpl_007", "jane@state.gov", {
 *     FIRST_NAME:       "Jane",
 *     FACILITY:         "Tennis Court",
 *     RESERVATION_DATE: "Saturday, March 15, 2026",
 *     START_TIME:       "9:00 AM",
 *     END_TIME:         "10:00 AM",
 *     EVENT_NAME:       "Tennis",
 *     RESERVATION_ID:   "RES-2026-145238491"
 *   }, "noreply@geabotswana.org");
 */
function sendEmail(templateId, recipient, variables, replyTo) {
  try {
    var template = getEmailTemplateById(templateId);
    if (!template) {
      Logger.log("ERROR sendEmail: Template not found or inactive: " + templateId);
      return false;
    }

    var subject   = replacePlaceholders(template.subject, variables);
    var plainBody = replacePlaceholders(template.body, variables);
    var htmlBody  = buildHtmlEmail(subject, plainBody);

    var to = Array.isArray(recipient) ? recipient.join(",") : recipient;
    var replyToAddr = replyTo || EMAIL_BOARD;  // Default to board email if not specified
    GmailApp.sendEmail(to, subject, plainBody, {
      htmlBody: htmlBody,
      name:     EMAIL_SENDER_NAME,
      replyTo:  replyToAddr
    });

    Logger.log("Email sent: " + templateId + " → " + to);
    return true;

  } catch (e) {
    Logger.log("ERROR sendEmail(" + templateId + "): " + e);
    return false;
  }
}


/**
 * Sends a styled GEA email FROM the board address (board@geabotswana.org).
 * Uses Gmail API to override the sender, so email appears to come from the board group,
 * not from the individual user. This ensures board notifications arrive as incoming mail,
 * not in the sender's Sent folder.
 *
 * @param {string}       templateId  e.g. "tpl_042"
 * @param {string|Array} recipient   Email address(es)
 * @param {Object}       variables   Placeholder values
 * @returns {boolean}    true if sent successfully
 */
function sendEmailFromBoard(templateId, recipient, variables) {
  try {
    var template = getEmailTemplateById(templateId);
    if (!template) {
      Logger.log("ERROR sendEmailFromBoard: Template not found or inactive: " + templateId);
      return false;
    }

    var subject = replacePlaceholders(template.subject, variables);
    var plainBody = replacePlaceholders(template.body, variables);
    var htmlBody = buildHtmlEmail(subject, plainBody);

    var to = Array.isArray(recipient) ? recipient.join(",") : recipient;

    // Get OAuth token from service account
    var accessToken = _getServiceAccountAccessToken();
    if (!accessToken) {
      Logger.log("ERROR: Could not get service account access token");
      return false;
    }

    // Build raw email message
    var fromHeader = BOARD_EMAIL_DISPLAY_NAME + ' <' + BOARD_EMAIL_TO_SEND_FROM + '>';
    var emailMessage = 'From: ' + fromHeader + '\r\n' +
                       'To: ' + to + '\r\n' +
                       'Subject: ' + subject + '\r\n' +
                       'Content-Type: text/html; charset=UTF-8\r\n' +
                       'MIME-Version: 1.0\r\n' +
                       '\r\n' +
                       htmlBody;

    var encodedMessage = Utilities.base64Encode(emailMessage);
    var payload = {
      raw: encodedMessage
    };

    // Call Gmail API with service account credentials
    var options = {
      method: 'post',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      options
    );

    var result = JSON.parse(response.getContentText());
    if (response.getResponseCode() === 200) {
      Logger.log("Email sent FROM board: " + templateId + " → " + to);
      return true;
    } else {
      Logger.log("ERROR: Gmail API error: " + response.getContentText());
      return false;
    }

  } catch (e) {
    Logger.log("ERROR sendEmailFromBoard(" + templateId + "): " + e);
    return false;
  }
}

// ============================================================
// TEMPLATE RETRIEVAL
// ============================================================

/**
 * Fetches a template from the Email Templates tab.
 * Cached per script execution to avoid repeated reads.
 *
 * Column layout: template_id(A), template_name(B), subject(C), body(D), active(E)
 *
 * @param {string} templateId
 * @returns {Object|null} { id, name, subject, body } or null if not found/inactive
 */
var _templateCache = {};

function getEmailTemplateById(templateId) {
  if (_templateCache[templateId]) return _templateCache[templateId];
  try {
    var data = SpreadsheetApp.openById(SYSTEM_BACKEND_ID)
                 .getSheetByName(TAB_EMAIL_TEMPLATES)
                 .getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (data[i][0] === templateId && data[i][4] === true) {
        // Google Sheets sometimes prepends a leading quote to cells that start with
        // special characters (its plain-text prefix trick). Strip any leading or
        // trailing " or ' from subject and body so they never reach the email.
        var subject = String(data[i][2]).trim().replace(/^["']+|["']+$/g, "").trim();
        var body    = String(data[i][3]).trim().replace(/^["']+|["']+$/g, "").trim();
        var t = { id: data[i][0], name: data[i][1], subject: subject, body: body };
        _templateCache[templateId] = t;
        return t;
      }
    }
  } catch (e) {
    Logger.log("ERROR getEmailTemplate(" + templateId + "): " + e);
  }
  Logger.log("Template not found or inactive: " + templateId);
  return null;
}


// ============================================================
// DRIVE-BASED EMAIL TEMPLATE SYSTEM
// ============================================================

/**
 * Cache for Drive-based email templates.
 * Key: semantic_name, Value: { subject, body, placeholders, name }
 */
var _driveTemplateCache = {};

/**
 * Fetches a template from the Email Templates tab with Drive-based plain text bodies.
 * Reads from the sheet and loads the body from a plain text (.txt) file in Google Drive.
 * The body is passed through buildHtmlEmail() at send time for GEA branding.
 *
 * Sheet layout:
 *   A=template_id, B=template_name, C=subject, D=body (legacy), E=active
 *   F=semantic_name, G=display_name, H=drive_file_id, I=placeholders, J=notes
 *
 * @param {string} templateName  Semantic name of template (e.g., "MEM_APPLICATION_SUBMITTED_TO_APPLICANT")
 * @returns {Object|null}        { subject, body, placeholders, name } or null if not found/inactive
 */
function getEmailTemplate(templateName) {
  if (_driveTemplateCache[templateName]) {
    return _driveTemplateCache[templateName];
  }

  try {
    var sheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID)
                  .getSheetByName(TAB_EMAIL_TEMPLATES);
    var data = sheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var semanticName = String(row[0]).trim();  // A = semantic_name
      var active = row[5];                        // F = active

      if (semanticName === templateName && (active === true || String(active).toUpperCase() === "TRUE")) {
        var subject = String(row[2]).trim();           // C = subject
        var driveFileId = String(row[3]).trim();       // D = drive_file_id
        var placeholderStr = String(row[4]).trim();    // E = placeholders (comma-separated)
        var displayName = String(row[1]).trim();       // B = display_name

        // Parse placeholders — sheet may use commas or semicolons as delimiter
        var placeholders = [];
        if (placeholderStr) {
          placeholders = placeholderStr.split(/[;,]/).map(function(p) {
            return p.trim();
          }).filter(function(p) { return p.length > 0; });
        }

        // Load plain text body from Drive .txt file
        var body = "";
        if (driveFileId) {
          try {
            body = DriveApp.getFileById(driveFileId).getBlob().getDataAsString();
          } catch (driveErr) {
            Logger.log("ERROR getEmailTemplate: Could not load Drive file " + driveFileId + ": " + driveErr);
            logAuditEntry("system", AUDIT_EMAIL_TEMPLATE_NOT_FOUND, "EmailTemplate", templateName,
              "Drive file not accessible: " + driveErr);
            return null;
          }
        }

        var template = {
          subject: subject,
          body: body,
          placeholders: placeholders,
          name: displayName
        };

        _driveTemplateCache[templateName] = template;
        logAuditEntry("system", AUDIT_EMAIL_TEMPLATE_LOADED, "EmailTemplate", templateName,
          "Loaded with " + placeholders.length + " placeholders");
        return template;
      }
    }

    // Not found or inactive
    logAuditEntry("system", AUDIT_EMAIL_TEMPLATE_NOT_FOUND, "EmailTemplate", templateName, "Not found or inactive");
    return null;

  } catch (e) {
    Logger.log("ERROR getEmailTemplate(" + templateName + "): " + e);
    logAuditEntry("system", AUDIT_EMAIL_TEMPLATE_NOT_FOUND, "EmailTemplate", templateName,
      "Exception: " + e);
    return null;
  }
}

/**
 * Substitutes variables into HTML body.
 * Replaces {{VARIABLE}} tokens with values from the variables object.
 *
 * @param {string} htmlBody    Template HTML
 * @param {Object} variables   Key-value pairs for substitution
 * @returns {string}           HTML with substitutions applied
 */
function substituteTemplateVariables(htmlBody, variables) {
  if (!htmlBody) return "";
  if (typeof variables !== 'object' || variables === null) {
    return htmlBody;
  }

  var result = htmlBody;
  for (var key in variables) {
    if (variables.hasOwnProperty(key)) {
      var value = variables[key];
      var safeValue = String(value === null || value === undefined ? "" : value);
      var pattern = new RegExp('\\{\\{' + key + '\\}\\}', 'g');
      result = result.replace(pattern, safeValue);
    }
  }

  return result;
}

/**
 * Validates that all required template variables are provided.
 *
 * @param {string} templateName     Semantic name of template
 * @param {Object} providedVariables Variables object passed by caller
 * @returns {Object}                { valid: boolean, missing: [], extra: [] }
 */
function validateTemplateVariables(templateName, providedVariables) {
  var template = getEmailTemplate(templateName);
  if (!template) {
    return { valid: false, missing: [], extra: [] };
  }

  providedVariables = providedVariables || {};
  var provided = Object.keys(providedVariables);
  var required = template.placeholders || [];

  var missing = [];
  var extra = [];

  for (var i = 0; i < required.length; i++) {
    if (!providedVariables.hasOwnProperty(required[i])) {
      missing.push(required[i]);
    }
  }

  for (var j = 0; j < provided.length; j++) {
    if (required.indexOf(provided[j]) === -1) {
      extra.push(provided[j]);
    }
  }

  return {
    valid: missing.length === 0,
    missing: missing,
    extra: extra
  };
}

/**
 * Sends an email using a Drive-based template.
 * Loads template, validates variables, substitutes placeholders, and sends via Gmail API.
 *
 * @param {string} templateName     Semantic name of template
 * @param {string|Array} recipient  Email address(es)
 * @param {Object} variables        Placeholder values
 * @param {Object} options          Optional: { cc, bcc, attachments } — Phase 2
 * @returns {boolean}               true if sent successfully
 */
function sendEmailFromTemplate(templateName, recipient, variables, options) {
  try {
    variables = variables || {};
    options = options || {};

    var template = getEmailTemplate(templateName);
    if (!template) {
      Logger.log("ERROR sendEmailFromTemplate: Template not found: " + templateName);
      logAuditEntry("system", AUDIT_EMAIL_SEND_FAILED, "EmailTemplate", templateName, "Template not found");
      return false;
    }

    // Validate variables (warn but continue if missing)
    var validation = validateTemplateVariables(templateName, variables);
    if (!validation.valid) {
      Logger.log("WARNING sendEmailFromTemplate: Missing variables: " + validation.missing.join(", "));
      logAuditEntry("system", AUDIT_EMAIL_MISSING_VARIABLES, "EmailTemplate", templateName,
        "Missing: " + validation.missing.join(", "));
    }

    // Substitute variables in subject and body
    var subject = substituteTemplateVariables(template.subject, variables);
    var plainBody = substituteTemplateVariables(template.body, variables);

    // Wrap in GEA master HTML template for consistent branding
    var htmlBody = buildHtmlEmail(subject, plainBody);

    var to = Array.isArray(recipient) ? recipient.join(",") : recipient;

    // Send via Gmail API with service account delegation
    var accessToken = _getServiceAccountAccessToken();
    if (!accessToken) {
      Logger.log("ERROR sendEmailFromTemplate: Could not get service account access token");
      logAuditEntry("system", AUDIT_EMAIL_SEND_FAILED, "EmailTemplate", templateName,
        "Could not obtain access token");
      return false;
    }

    // Build raw email message with GEA branding
    var fromHeader = BOARD_EMAIL_DISPLAY_NAME + ' <' + BOARD_EMAIL_TO_SEND_FROM + '>';
    var emailMessage = 'From: ' + fromHeader + '\r\n' +
                       'To: ' + to + '\r\n' +
                       'Subject: ' + subject + '\r\n' +
                       'Content-Type: text/html; charset=UTF-8\r\n' +
                       'MIME-Version: 1.0\r\n' +
                       '\r\n' +
                       htmlBody;

    var encodedMessage = Utilities.base64Encode(emailMessage);
    var payload = {
      raw: encodedMessage
    };

    var fetchOptions = {
      method: 'post',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      fetchOptions
    );

    if (response.getResponseCode() === 200) {
      Logger.log("Email sent via template: " + templateName + " → " + to);
      logAuditEntry("system", AUDIT_EMAIL_SENT_FROM_TEMPLATE, "EmailTemplate", templateName,
        "Sent to " + to);
      return true;
    } else {
      Logger.log("ERROR: Gmail API error: " + response.getContentText());
      logAuditEntry("system", AUDIT_EMAIL_SEND_FAILED, "EmailTemplate", templateName,
        "Gmail API error: " + response.getContentText());
      return false;
    }

  } catch (e) {
    Logger.log("ERROR sendEmailFromTemplate(" + templateName + "): " + e);
    logAuditEntry("system", AUDIT_EMAIL_SEND_FAILED, "EmailTemplate", templateName,
      "Exception: " + e);
    return false;
  }
}

/**
 * Test the Drive-based email template system.
 * Validates template loading, variable substitution, and sending.
 */
function testEmailTemplateSystem() {
  Logger.log("========== EMAIL TEMPLATE SYSTEM TEST ==========");

  var testTemplateName = "MEM_APPLICATION_SUBMITTED_TO_APPLICANT";
  var testVariables = {
    FIRST_NAME: "Jane",
    APPLICATION_ID: "APP-2026-00001",
    SUBMITTED_DATE: "March 16, 2026",
    PORTAL_URL: "https://geabotswana.org/member.html"
  };
  var testRecipient = "michael.raney@geabotswana.org";

  // Test 1: Load template
  Logger.log("\n[TEST 1] Loading template...");
  var template = getEmailTemplate(testTemplateName);
  if (template && template.subject && template.body && template.placeholders) {
    Logger.log("[PASS] Template loaded");
    Logger.log("  Subject: " + template.subject);
    Logger.log("  Placeholders: " + template.placeholders.join(", "));
  } else {
    Logger.log("[FAIL] Template not loaded or incomplete");
    return;
  }

  // Test 2: Validate variables
  Logger.log("\n[TEST 2] Validating variables...");
  var validation = validateTemplateVariables(testTemplateName, testVariables);
  if (validation.valid) {
    Logger.log("[PASS] All required variables provided");
  } else {
    Logger.log("[WARN] Missing variables: " + validation.missing.join(", "));
  }
  if (validation.extra.length > 0) {
    Logger.log("[WARN] Extra variables: " + validation.extra.join(", "));
  }

  // Test 3: Substitute variables
  Logger.log("\n[TEST 3] Substituting variables...");
  var substitutedBody = substituteTemplateVariables(template.body, testVariables);
  var hasUnreplacedTokens = /\{\{[A-Z_]+\}\}/.test(substitutedBody);
  if (!hasUnreplacedTokens) {
    Logger.log("[PASS] All {{VARIABLES}} replaced");
  } else {
    Logger.log("[WARN] Some {{VARIABLES}} not replaced");
  }

  // Test 4: Send test email
  Logger.log("\n[TEST 4] Sending test email...");
  var sent = sendEmailFromTemplate(testTemplateName, testRecipient, testVariables);
  if (sent) {
    Logger.log("[PASS] Test email sent successfully");
    Logger.log("  To: " + testRecipient);
    Logger.log("  From: " + BOARD_EMAIL_TO_SEND_FROM);
  } else {
    Logger.log("[FAIL] Test email failed to send");
  }

  Logger.log("\n========== TEST COMPLETE ==========");
}


// ============================================================
// PLACEHOLDER REPLACEMENT
// ============================================================

/**
 * Replaces {{PLACEHOLDER}} tokens in a string with values from
 * the variables object. Also handles conditional blocks:
 *
 *   {{IF_GUESTS}}...content shown only if IF_GUESTS is truthy...{{END_IF}}
 *
 * Missing variables are replaced with empty string (no broken {{tokens}}).
 *
 * @param {string} text
 * @param {Object} variables
 * @returns {string}
 */
function replacePlaceholders(text, variables) {
  if (!text) return "";
  variables = variables || {};

  // Process conditional blocks first.
  // The regex optionally captures a single leading \n before the opening tag
  // so that when a block is removed, it doesn't leave a stray blank line.
  var result = text.replace(
    /(\n?)\{\{IF_([A-Z0-9_]+)\}\}([\s\S]*?)\{\{END_IF\}\}/g,
    function(match, leadingNewline, key, content) {
      var val = variables["IF_" + key];
      if (val === true || (val && val !== "false" && val !== "0" && val !== "")) {
        // Block is shown: restore the leading newline that was captured
        return leadingNewline + replacePlaceholders(content, variables);
      }
      // Block is hidden: return nothing; leading \n is consumed so no blank line remains
      return "";
    }
  );

  // Replace all remaining tokens
  result = result.replace(/\{\{([A-Z0-9_]+)\}\}/g, function(match, key) {
    var v = variables[key];
    return (v === undefined || v === null) ? "" : String(v);
  });

  return result;
}


// ============================================================
// HTML EMAIL BUILDER
// ============================================================

/**
 * Wraps email content in the GEA master HTML template.
 * Converts plain text to HTML paragraphs, section headers,
 * key-value pairs, and bullet lists automatically.
 *
 * @param {string} subject    Used in the HTML <title> tag
 * @param {string} plainText  Plain text body from template
 * @returns {string}          Complete HTML email string
 */
function buildHtmlEmail(subject, plainText) {
  var bodyHtml = plainTextToHtml(plainText);
  return (
    '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1.0">' +
    '<title>' + escapeHtml(subject) + '</title>' +
    '<style>' +
    'body{margin:0;padding:0;font-family:Arial,sans-serif;background:#F5F5F5;color:#212121;}' +
    '.ew{width:100%;background:#F5F5F5;padding:20px 0;}' +
    '.ec{max-width:600px;margin:0 auto;background:#fff;border-radius:5px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.12);}' +
    // Header
    '.eh{background:#0A3161;padding:24px 30px;text-align:center;border-bottom:4px solid #B31942;}' +
    '.eh img{height:68px;width:68px;display:block;margin:0 auto 10px;}' +
    '.eh h1{color:#FFFFFF;font-size:16px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0 0 3px;}' +
    '.eh p{color:#ABCAE9;font-size:10px;letter-spacing:3px;text-transform:uppercase;margin:0;}' +
    // Body
    '.eb{padding:28px 32px;background:#fff;}' +
    '.eb h2{color:#0A3161;font-size:18px;font-weight:bold;margin:0 0 8px;padding-bottom:8px;border-bottom:2px solid #B31942;}' +
    '.eb p{font-size:14px;line-height:1.7;color:#333;margin:0 0 14px;}' +
    // Section header
    '.sh{color:#0A3161;font-family:Arial,sans-serif;font-size:10px;text-transform:uppercase;letter-spacing:2px;margin:18px 0 8px;padding-bottom:5px;border-bottom:1px solid #ABCAE9;}' +
    // Key-value rows
    '.kv{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #F0F0F0;font-size:13px;}' +
    '.kv:last-of-type{border-bottom:none;}' +
    '.kk{color:#555;font-weight:bold;min-width:180px;flex-shrink:0;margin-right:16px;}' +
    '.kv2{color:#212121;}' +
    // Warning box
    '.wb{background:#FFF0F3;border:2px solid #B31942;border-radius:5px;padding:14px 18px;margin:18px 0;}' +
    '.wb p{color:#B31942;font-weight:bold;font-size:14px;margin:0;line-height:1.5;}' +
    // Info box
    '.ib{background:#EFF6FF;border-left:5px solid #0A3161;border-radius:0 5px 5px 0;padding:14px 18px;margin:18px 0;}' +
    // List
    'ul.el{font-size:14px;color:#333;line-height:1.8;margin:8px 0;padding-left:20px;}' +
    // Divider
    '.dv{border:none;border-top:1px solid #E0E0E0;margin:20px 0;}' +
    // Footer
    '.ef{background:#0A3161;padding:20px 30px;text-align:center;border-top:3px solid #B31942;}' +
    '.ft{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#B31942;margin-bottom:8px;}' +
    '.ef p{font-size:11px;color:#B31942;margin:3px 0;}' +
    '.ef a{color:#ABCAE9;text-decoration:none;}' +
    '.fa{font-size:10px;color:rgba(255,255,255,.4);margin-top:8px;}' +
    '@media(max-width:600px){.eb{padding:18px 16px;}.kv{flex-direction:column;}.kv2{text-align:left;}}' +
    '</style></head><body>' +
    '<div class="ew"><div class="ec">' +
    // Header
    '<div class="eh">' +
    '<img src="' + LOGO_ROUND_80_URL + '" alt="GEA">' +
    '<h1>Gaborone Employee Association</h1>' +
    '<p>U.S. Mission to Botswana</p>' +
    '</div>' +
    // Body
    '<div class="eb">' + bodyHtml + '</div>' +
    // Footer
    '<div class="ef">' +
    '<div class="ft">Serving the USG Community in Gaborone</div>' +
    '<p><a href="' + URL_HOME + '">' + ASSOCIATION_WEBSITE + '</a></p>' +
    '<p>Questions? <a href="mailto:' + ASSOCIATION_EMAIL + '">' + ASSOCIATION_EMAIL + '</a></p>' +
    '<p class="fa">This is an automated message from the GEA Management System.</p>' +
    '</div>' +
    '</div></div></body></html>'
  );
}


/**
 * Converts plain text email body to HTML.
 * Handles:
 *   - ALL CAPS lines → section headers
 *   - "Key: Value" lines → styled key-value rows
 *   - "- item" lines → bullet lists
 *   - "*** WARNING" lines → warning box
 *   - Empty lines → spacing
 *   - Everything else → paragraph
 *
 * @param {string} plainText
 * @returns {string} HTML
 */
function plainTextToHtml(plainText) {
  if (!plainText) return "";
  var lines   = String(plainText).split("\n");
  var html    = "";
  var inList  = false;
  var inKv    = false;

  for (var i = 0; i < lines.length; i++) {
    var raw     = lines[i];
    var trimmed = raw.trim();

    // Empty line
    if (trimmed === "") {
      if (inList) { html += "</ul>"; inList = false; }
      if (inKv)   { html += "</div>"; inKv = false; }
      html += "<br>";
      continue;
    }

    // WARNING line (*** WARNING ...)
    if (trimmed.match(/^\*\*\*\s*WARNING/i)) {
      if (inList) { html += "</ul>"; inList = false; }
      if (inKv)   { html += "</div>"; inKv = false; }
      html += '<div class="wb"><p>' + escapeHtml(trimmed.replace(/\*/g, "").trim()) + '</p></div>';
      continue;
    }

    // Bullet item (- or [ ])
    if (trimmed.match(/^[-•]\s/) || trimmed.match(/^\[[ x]\]\s/)) {
      if (inKv)  { html += "</div>"; inKv = false; }
      if (!inList) { html += '<ul class="el">'; inList = true; }
      html += "<li>" + escapeHtml(trimmed.replace(/^[-•\[[ x\]]\s+/, "")) + "</li>";
      continue;
    }

    // Close list for any non-bullet line
    if (inList) { html += "</ul>"; inList = false; }

    // ALL CAPS section header (at least 3 uppercase chars, no lowercase)
    if (trimmed.length >= 3 && trimmed === trimmed.toUpperCase() &&
        /[A-Z]/.test(trimmed) && !/^[\[\(]/.test(trimmed)) {
      if (inKv) { html += "</div>"; inKv = false; }
      html += '<p class="sh">' + escapeHtml(trimmed) + '</p>';
      continue;
    }

    // Key: Value line (has ": " and reasonable length)
    if (trimmed.indexOf(": ") !== -1 && trimmed.length < 140 &&
        !trimmed.match(/^(http|www)/i)) {
      var colon = trimmed.indexOf(": ");
      var key   = trimmed.substring(0, colon);
      var val   = trimmed.substring(colon + 2);
      if (!inKv) { html += '<div>'; inKv = true; }
      html += '<div class="kv"><span class="kk">' + escapeHtml(key) + '</span>' +
              '<span class="kv2">' + escapeHtml(val) + '</span></div>';
      continue;
    }

    // Close kv block before regular paragraph
    if (inKv) { html += "</div>"; inKv = false; }

    // Regular paragraph
    html += '<p>' + escapeHtml(trimmed) + '</p>';
  }

  if (inList) html += "</ul>";
  if (inKv)   html += "</div>";

  return html;
}


// ============================================================
// UTILITIES
// ============================================================

/**
 * Escapes HTML special characters to prevent broken emails.
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}


// ============================================================
// SERVICE ACCOUNT EMAIL SENDING (sendEmailFromBoard helpers)
// ============================================================

/**
 * Initializes the Board service account credentials in PropertiesService.
 * Call this ONCE in the Apps Script editor to store the service account JSON.
 * The key will persist across clasp push/pull operations.
 *
 * Usage in Apps Script editor:
 *   initializeBoardServiceAccount({
 *     "type": "service_account",
 *     "project_id": "...",
 *     "private_key_id": "...",
 *     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
 *     "client_email": "gea-apps-script@gea-association-platform.iam.gserviceaccount.com",
 *     "client_id": "...",
 *     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
 *     "token_uri": "https://oauth2.googleapis.com/token",
 *     "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
 *     "client_x509_cert_url": "..."
 *   });
 *
 * @param {Object} serviceAccountJson  Complete service account JSON object
 * @returns {boolean} true if saved successfully
 */
function initializeBoardServiceAccount(serviceAccountJson) {
  try {
    var props = PropertiesService.getScriptProperties();
    props.setProperty("BOARD_SERVICE_ACCOUNT_JSON", JSON.stringify(serviceAccountJson));
    Logger.log("Successfully stored Board service account credentials in PropertiesService");
    return true;
  } catch (e) {
    Logger.log("ERROR initializeBoardServiceAccount: " + e);
    return false;
  }
}

/**
 * Retrieves the Board service account credentials from PropertiesService.
 * Reads the JSON that was stored by initializeBoardServiceAccount().
 *
 * @returns {Object|null} Service account JSON object, or null if not found/invalid
 */
function _getBoardServiceAccount() {
  try {
    var props = PropertiesService.getScriptProperties();
    var json = props.getProperty("BOARD_SERVICE_ACCOUNT_JSON");
    if (!json) {
      Logger.log("ERROR: Board service account not initialized. Call initializeBoardServiceAccount() first.");
      return null;
    }
    return JSON.parse(json);
  } catch (e) {
    Logger.log("ERROR _getBoardServiceAccount: " + e);
    return null;
  }
}

/**
 * Gets an access token for the service account via OAuth2.
 * Uses JWT grant flow to authenticate the service account.
 * @returns {string|null} Access token or null if request failed
 */
/**
 * Gets an OAuth access token using Domain-Wide Delegation.
 * Service account key is stored in PropertiesService (set via initializeBoardServiceAccount).
 *
 * Steps:
 * 1. Create a JWT with the delegated user in the 'sub' claim
 * 2. Sign the JWT with the service account's private key
 * 3. Exchange the signed JWT for an OAuth access token
 * 4. Return the access token for Gmail API calls
 *
 * @returns {string|null} OAuth access token, or null if error
 */
function _getServiceAccountAccessToken() {
  try {
    // Step 1: Create and sign JWT with service account's private key
    var signedJwt = _createSignedDomainDelegationJwt();
    if (!signedJwt) {
      Logger.log("ERROR: Could not create signed JWT");
      return null;
    }

    // Step 2: Exchange signed JWT for OAuth access token
    var options = {
      method: 'post',
      payload: {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: signedJwt
      },
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', options);
    var result = JSON.parse(response.getContentText());

    if (response.getResponseCode() === 200) {
      Logger.log("Successfully obtained access token via JWT bearer grant");
      return result.access_token;
    } else {
      Logger.log("ERROR exchanging JWT for access token: " + response.getContentText());
      return null;
    }
  } catch (e) {
    Logger.log("ERROR _getServiceAccountAccessToken: " + e);
    return null;
  }
}

/**
 * Creates and signs a JWT for domain-wide delegation.
 * The private key is stored in PropertiesService (set via initializeBoardServiceAccount).
 *
 * @returns {string|null} Signed JWT (header.payload.signature), or null if error
 */
function _createSignedDomainDelegationJwt() {
  try {
    var serviceAccount = _getBoardServiceAccount();
    if (!serviceAccount) {
      Logger.log("ERROR: Service account not initialized in PropertiesService");
      return null;
    }

    var now = Math.floor(Date.now() / 1000);
    var expiresAt = now + 3600;  // Token valid for 1 hour

    var header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    var payload = {
      iss: serviceAccount.client_email || BOARD_SERVICE_ACCOUNT_EMAIL,
      sub: BOARD_EMAIL_DELEGATED_USER,  // Impersonate this user (has Send As delegation for board@)
      scope: 'https://www.googleapis.com/auth/gmail.send',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: expiresAt
    };

    var encodedHeader = Utilities.base64Encode(JSON.stringify(header))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    var encodedPayload = Utilities.base64Encode(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    var toSign = encodedHeader + '.' + encodedPayload;

    // Sign with service account's private key using RS256
    var signature = Utilities.computeRsaSha256Signature(toSign, serviceAccount.private_key);
    var encodedSignature = Utilities.base64Encode(signature)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

    var signedJwt = toSign + '.' + encodedSignature;
    Logger.log("Successfully created and signed JWT for domain-wide delegation");
    return signedJwt;

  } catch (e) {
    Logger.log("ERROR _createSignedDomainDelegationJwt: " + e);
    return null;
  }
}