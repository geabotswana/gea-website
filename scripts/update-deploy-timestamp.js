#!/usr/bin/env node

/**
 * Update deployment timestamp in Config.js
 * Run this before `clasp push` to embed the current time
 *
 * Usage: node scripts/update-deploy-timestamp.js
 */

const fs = require('fs');
const path = require('path');

const configJsPath = path.join(__dirname, '..', 'Config.js');

// Read the file
let content = fs.readFileSync(configJsPath, 'utf8');

// Get current timestamp in Central Africa Time (UTC+2)
const now = new Date();
const utcTime = new Date(now.getTime() + now.getTimezoneOffset() * 60000); // Convert to UTC
const catTime = new Date(utcTime.getTime() + 2 * 60 * 60 * 1000); // Add 2 hours for CAT (UTC+2)
const timestamp = catTime.toISOString().replace('T', ' ').substring(0, 19); // YYYY-MM-DD HH:MM:SS CAT

// Update the DEPLOYMENT_TIMESTAMP constant
// Look for: var DEPLOYMENT_TIMESTAMP = "..."; (with any amount of whitespace)
const timestampPattern = /var DEPLOYMENT_TIMESTAMP\s*=\s*"[^"]*";/;
const timestampReplacement = `var DEPLOYMENT_TIMESTAMP    = "${timestamp}";  // Updated by scripts/update-deploy-timestamp.js before clasp push`;

if (content.match(timestampPattern)) {
  content = content.replace(timestampPattern, timestampReplacement);
  console.log(`✓ Updated Config.js DEPLOYMENT_TIMESTAMP to: ${timestamp}`);
} else {
  console.error('✗ DEPLOYMENT_TIMESTAMP constant not found in Config.js');
  console.error('Add this line to Config.js after SYSTEM_LAST_FEATURE:');
  console.error(`var DEPLOYMENT_TIMESTAMP = '${timestamp}';  // Updated by scripts/update-deploy-timestamp.js`);
  process.exit(1);
}

// Update the BUILD_ID constant (should equal DEPLOYMENT_TIMESTAMP)
const buildIdPattern = /var BUILD_ID\s*=\s*DEPLOYMENT_TIMESTAMP;/;
if (content.match(buildIdPattern)) {
  // BUILD_ID just references DEPLOYMENT_TIMESTAMP, so it auto-updates
  console.log(`✓ BUILD_ID will use updated DEPLOYMENT_TIMESTAMP`);
} else {
  console.error('⚠ BUILD_ID constant not found in Config.js (it should reference DEPLOYMENT_TIMESTAMP)');
}

// Write back
fs.writeFileSync(configJsPath, content, 'utf8');
console.log('✓ Saved Config.js');
