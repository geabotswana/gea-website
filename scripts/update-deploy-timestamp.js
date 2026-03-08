#!/usr/bin/env node

/**
 * Update deployment timestamp in member.html
 * Run this before `clasp push` to embed the current time
 *
 * Usage: node scripts/update-deploy-timestamp.js
 */

const fs = require('fs');
const path = require('path');

const memberHtmlPath = path.join(__dirname, '..', 'member.html');

// Read the file
let content = fs.readFileSync(memberHtmlPath, 'utf8');

// Get current timestamp
const now = new Date();
const timestamp = now.toISOString().replace('T', ' ').substring(0, 19); // YYYY-MM-DD HH:MM:SS

// Update the DEPLOYMENT_TIMESTAMP in the JS section
// Look for: const DEPLOYMENT_TIMESTAMP = '...';
const timestampPattern = /const DEPLOYMENT_TIMESTAMP = '[^']*';/;
const replacement = `const DEPLOYMENT_TIMESTAMP = '${timestamp}';`;

if (content.match(timestampPattern)) {
  content = content.replace(timestampPattern, replacement);
  console.log(`✓ Updated deployment timestamp to: ${timestamp}`);
} else {
  // Add it if it doesn't exist
  const scriptInsertPoint = content.indexOf('  const DEPLOYMENTS = {');
  if (scriptInsertPoint !== -1) {
    const indent = '  ';
    const timestampLine = `${indent}const DEPLOYMENT_TIMESTAMP = '${timestamp}';\n\n`;
    content = content.slice(0, scriptInsertPoint) + timestampLine + content.slice(scriptInsertPoint);
    console.log(`✓ Added deployment timestamp: ${timestamp}`);
  } else {
    console.error('✗ Could not find insertion point in member.html');
    process.exit(1);
  }
}

// Write back
fs.writeFileSync(memberHtmlPath, content, 'utf8');
console.log('✓ Saved member.html');
