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
 *   });
 */
function sendEmail(templateId, recipient, variables) {
  try {
    var template = getEmailTemplate(templateId);
    if (!template) {
      Logger.log("ERROR sendEmail: Template not found or inactive: " + templateId);
      return false;
    }

    var subject   = replacePlaceholders(template.subject, variables);
    var plainBody = replacePlaceholders(template.body, variables);
    var htmlBody  = buildHtmlEmail(subject, plainBody);

    var to = Array.isArray(recipient) ? recipient.join(",") : recipient;
    GmailApp.sendEmail(to, subject, plainBody, {
      htmlBody: htmlBody,
      name:     EMAIL_SENDER_NAME,
      replyTo:  EMAIL_BOARD
    });

    Logger.log("Email sent: " + templateId + " → " + to);
    return true;

  } catch (e) {
    Logger.log("ERROR sendEmail(" + templateId + "): " + e);
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

function getEmailTemplate(templateId) {
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
    '.eh h1{color:#fff;font-size:16px;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin:0 0 3px;}' +
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
    '.ft{font-size:9px;letter-spacing:3px;text-transform:uppercase;color:#ABCAE9;margin-bottom:8px;}' +
    '.ef p{font-size:11px;color:rgba(255,255,255,.75);margin:3px 0;}' +
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