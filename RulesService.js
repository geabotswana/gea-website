/**
 * ============================================================
 * RULES & REGULATIONS SERVICE
 * ============================================================
 *
 * PURPOSE:
 * Manages GEA Rules & Regulations including retrieval, formatting,
 * and agreement tracking for membership applications and member portals.
 *
 * KEY FUNCTIONS:
 * - getRulesText() — Returns full rules text with formatting
 * - getRulesHTMLDisplay() — Returns HTML-formatted rules for display
 * - recordRulesAgreement() — Records when member agrees to rules
 * - validateRulesAgreement() — Checks if member has agreed (for applications)
 *
 * ============================================================
 */

/**
 * Get the full text of GEA Rules & Regulations
 * Reads from Rules sheet in Member Directory
 * Returns a structured object with sections for rendering
 * @returns {Object} Rules with sections array
 */
function getRulesText() {
  try {
    // Fetch all rules from the Rules sheet (in System Backend)
    var rulesSheet = SpreadsheetApp.openById(SYSTEM_BACKEND_ID).getSheetByName(TAB_RULES);
    var data = rulesSheet.getDataRange().getValues();

    if (data.length < 2) {
      // No rules found, return empty structure
      return { title: "RULES & REGULATIONS", sections: [] };
    }

    // Parse header row (skip first row which is headers)
    var rules = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      if (!row[0]) continue; // Skip empty rows

      rules.push({
        rule_id: row[0] || '',
        rule_category: row[1] || '',
        rule_category_sort: row[2] ? Number(row[2]) : 999,
        rule_text: row[3] || ''
      });
    }

    // Sort rules by sort order (maintains outline structure A, B, Ba, Bb, C, etc.)
    rules.sort(function(a, b) {
      return a.rule_category_sort - b.rule_category_sort;
    });

    // Group rules into outline structure (A, B, Ba, Bb, C, Ca, D, E...)
    var sections = [];
    var sectionMap = {}; // Map sort order to section for nesting subsections
    var mainSectionIndex = 0; // Track main sections for outline lettering

    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i];
      var sortOrder = rule.rule_category_sort;
      var isSubsection = sortOrder % 10 !== 0; // e.g., 21, 22 are subsections of 20

      if (isSubsection) {
        // This is a subsection - find parent and add as subsection
        var parentSort = Math.floor(sortOrder / 10) * 10;
        if (sectionMap[parentSort]) {
          var parentSection = sectionMap[parentSort];
          if (!parentSection.subsections) {
            parentSection.subsections = [];
          }
          parentSection.subsections.push({
            title: rule.rule_category,
            content: [rule.rule_text]
          });
        }
      } else {
        // This is a main section
        var outlineLetter = String.fromCharCode(65 + mainSectionIndex); // A, B, C, D, E...
        var section = {
          number: outlineLetter,
          title: rule.rule_category,
          content: [rule.rule_text],
          subsections: []
        };
        sections.push(section);
        sectionMap[sortOrder] = section;
        mainSectionIndex++;
      }
    }

    return {
      title: "RULES & REGULATIONS",
      sections: sections
    };
  } catch (error) {
    Logger.log("ERROR in getRulesText: " + error);
    // Fallback to hardcoded rules if spreadsheet access fails
    return getDefaultRulesText();
  }
}

/**
 * Get default (hardcoded) rules as fallback
 * Used if Rules sheet is not accessible
 * @returns {Object} Rules with sections array
 */
function getDefaultRulesText() {
  return {
    title: "RULES & REGULATIONS",
    sections: [
      {
        number: 1,
        title: "General Membership Rules",
        content: [
          "An active membership is required to access GEA facilities and events.",
          "Members must follow all posted rules and conduct themselves respectfully.",
          "Guests must be accompanied by a GEA member and adhere to all guidelines. Guests may not be left at the facility in the absence of an active member escort.",
          "The GEA Board reserves the right to modify rules and revoke access for violations."
        ]
      },
      {
        number: 2,
        title: "Recreation Center Rules",
        content: [
          "Open to members and registered guests only, and only during the hours of 7am to 8pm. Everyone must depart by 8pm.",
          "Children under 14 must be supervised by an adult.",
          "Respect noise levels, shared spaces, and dispose of trash properly.",
          "Report any damage, maintenance needs, or safety concerns to board@geabotswana.org."
        ],
        subsections: [
          {
            title: "Leobo & Event Space",
            content: [
              "Members may reserve the space once per month for up to 6 hours.",
              "Official Embassy events take precedence over GEA member reservations.",
              "Leobo reservations are subject to approval by the Embassy and may be cancelled at any time.",
              "Reservations must include setup and cleanup time (these count toward your 6-hour maximum).",
              "Events must maintain respectful noise levels and conclude by 8pm to respect neighboring residents.",
              "No fundraising is allowed at the Rec Center.",
              "Guest lists must be submitted 3 business days in advance to board@geabotswana.org. For large events (30+ people), guest lists should be submitted 5 business days in advance.",
              "Parking inside is limited and subject to security directives; guest parking is outside."
            ]
          },
          {
            title: "Basketball & Tennis Courts",
            content: [
              "Reservations are limited to 2 hours per day per member-family.",
              "No food is allowed on the courts (water and sports drinks are permitted).",
              "Members must clean up after use and follow supervision rules for minors."
            ]
          }
        ]
      },
      {
        number: 3,
        title: "Fitness Center Rules",
        content: [
          "Use at your own risk – GEA and the U.S. Embassy are not liable for injuries or accidents.",
          "Minimum age for use: 15 years old.",
          "No children under 10 are allowed inside the fitness center; children 11-14 may enter under supervision but may not use the equipment.",
          "The door code is for members only – do not share it.",
          "Personal trainers are allowed, but the code must not be disclosed.",
          "Wipe down equipment after use and return it to its place.",
          "Limit electronic equipment use (treadmills, ellipticals, etc.) to 30 minutes when others are waiting.",
          "Turn off air conditioning, lights, and unplug machines before leaving and close the door securely.",
          "No alcohol, drugs, or smoking allowed in the Fitness Center.",
          "Report equipment issues to board@geabotswana.org."
        ],
        subsections: [
          {
            title: "Fitness Center Liability Waiver",
            content: [
              "By using the Fitness Center, you acknowledge that physical activity involves inherent risks. The Gaborone Employee Association (GEA) and the U.S. Embassy Gaborone assume no responsibility for injuries, accidents, or loss of property. Members agree to use the facilities at their own risk and waive all claims against GEA and its affiliates."
            ]
          }
        ]
      },
      {
        number: 4,
        title: "Events & Conduct",
        content: [
          "RSVP is required for some events; fees are non-refundable unless stated otherwise.",
          "Guests may attend certain events — guidelines will be provided.",
          "Children must be supervised by an adult at all times.",
          "Disruptive behavior may result in removal from events and facility restrictions."
        ]
      },
      {
        number: 5,
        title: "Compliance & Enforcement",
        content: [
          "Failure to comply with these rules may result in suspension or termination of membership privileges. The GEA Board reserves the right to enforce all policies to maintain a safe and welcoming environment.",
          "These rules and regulations are subject to change by agreement of the Board of Directors. Members will be notified of any changes.",
          "For questions, reservations, or concerns, contact board@geabotswana.org."
        ]
      }
    ]
  };
}

/**
 * Get HTML-formatted version of rules for display in portals
 * @returns {string} HTML string with formatted rules
 */
function getRulesHTMLDisplay() {
  var rules = getRulesText();
  var html = '<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">';

  // Title
  html += '<h2 style="text-align: center; color: #0A3161; margin-bottom: 30px; font-size: 24px; font-weight: bold;">' + rules.title + '</h2>';

  // Sections
  rules.sections.forEach(function(section) {
    html += '<div style="margin-bottom: 24px;">';

    // Section heading with outline letter
    html += '<h3 style="color: #0A3161; font-size: 16px; font-weight: bold; margin-bottom: 12px; border-bottom: 2px solid #0A3161; padding-bottom: 8px;">';
    html += section.number + '. ' + section.title;
    html += '</h3>';

    // Main content
    section.content.forEach(function(item) {
      html += '<p style="margin: 10px 0; padding-left: 16px;">' + sanitizeHtmlOutput(item) + '</p>';
    });

    // Subsections (if any) with outline style (Ba, Bb, Ca, etc.)
    if (section.subsections && section.subsections.length > 0) {
      section.subsections.forEach(function(subsection, index) {
        var subLetter = section.number + String.fromCharCode(97 + index); // A+a=Aa, B+a=Ba, etc.
        html += '<div style="margin-left: 16px; margin-top: 16px;">';
        html += '<h4 style="color: #0A3161; font-size: 14px; font-weight: bold; margin-bottom: 8px;">' + subLetter + '. ' + sanitizeHtmlOutput(subsection.title) + '</h4>';
        subsection.content.forEach(function(item) {
          html += '<p style="margin: 8px 0; padding-left: 16px; font-size: 14px;">' + sanitizeHtmlOutput(item) + '</p>';
        });
        html += '</div>';
      });
    }

    html += '</div>';
  });

  html += '</div>';
  return html;
}

/**
 * Get plain text version of rules (for emails, etc.)
 * @returns {string} Plain text rules
 */
function getRulesPlainText() {
  var rules = getRulesText();
  var text = rules.title + '\n';
  text += '='.repeat(rules.title.length) + '\n\n';

  rules.sections.forEach(function(section) {
    text += section.number + '. ' + section.title + '\n';
    text += '-'.repeat(40) + '\n';

    section.content.forEach(function(item) {
      text += '• ' + item + '\n';
    });

    if (section.subsections && section.subsections.length > 0) {
      section.subsections.forEach(function(subsection, index) {
        var subLetter = section.number + String.fromCharCode(97 + index); // Ba, Bb, Ca, etc.
        text += '\n  ' + subLetter + '. ' + subsection.title + ':\n';
        subsection.content.forEach(function(item) {
          text += '    • ' + item + '\n';
        });
      });
    }

    text += '\n';
  });

  return text;
}

/**
 * Record that a member/applicant agrees to the rules
 * Called when submitting application or accepting rules in member portal
 * @param {string} individualId — ID of the individual agreeing
 * @param {string} householdId — ID of the household (if applicable)
 * @param {string} email — Email of the individual
 * @param {string} context — Context (e.g., "membership_application", "profile_update")
 * @returns {Object} Result with success flag and message
 */
function recordRulesAgreement(individualId, householdId, email, context) {
  try {
    var timestamp = new Date().toISOString();

    // Log to audit trail
    Utilities.logAuditEntry({
      timestamp: timestamp,
      user_email: email,
      action_type: 'rules_agreement_accepted',
      target_id: individualId,
      details: 'Context: ' + context + '; Household: ' + (householdId || 'N/A'),
      ip_address: ''
    });

    return {
      success: true,
      message: 'Rules agreement recorded',
      timestamp: timestamp
    };
  } catch (error) {
    Utilities.logAuditEntry({
      timestamp: new Date().toISOString(),
      user_email: email,
      action_type: 'rules_agreement_error',
      target_id: individualId,
      details: 'Error: ' + error.message,
      ip_address: ''
    });

    return {
      success: false,
      message: 'Error recording rules agreement: ' + error.message
    };
  }
}

/**
 * Validate that member has agreed to current rules
 * Used in membership application submission
 * @param {string} fullName — Full name entered by applicant as agreement
 * @returns {Object} Validation result
 */
function validateRulesAgreement(fullName) {
  if (!fullName || fullName.trim().length === 0) {
    return {
      valid: false,
      message: 'You must enter your full name to agree to the rules and regulations.'
    };
  }

  if (fullName.trim().length < 3) {
    return {
      valid: false,
      message: 'Please enter your complete full name.'
    };
  }

  // Check for reasonable name format (at least 2 parts, not too long)
  var nameParts = fullName.trim().split(/\s+/);
  if (nameParts.length < 2) {
    return {
      valid: false,
      message: 'Please enter your full name (first and last name).'
    };
  }

  if (fullName.length > 100) {
    return {
      valid: false,
      message: 'Name is too long. Please enter your name as it appears on your ID.'
    };
  }

  return {
    valid: true,
    message: 'Rules agreement accepted',
    name: fullName.trim()
  };
}

/**
 * Sanitize HTML output to prevent XSS
 * Used internally when rendering rules HTML
 * @param {string} text — Text to sanitize
 * @returns {string} Safe text
 */
function sanitizeHtmlOutput(text) {
  // Escape HTML special characters
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
