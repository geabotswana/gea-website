#!/usr/bin/env node
/**
 * XSS Pattern Lint - Conservative Heuristic Check
 *
 * WARNING: This is a LINT TOOL, not a comprehensive security blocker.
 * It catches obvious patterns but can have false negatives and false positives.
 *
 * Detects ONLY obvious same-line patterns:
 * - .innerHTML = '...' + variable + '...'
 * - insertAdjacentHTML('beforeend', '...' + variable)
 *
 * Does NOT catch:
 * - Template literals with ${} (requires AST parser)
 * - Multi-line patterns (requires statement-level analysis)
 * - Two-step var html = ...; el.innerHTML = html; (requires cross-statement analysis)
 * - Safe concatenation into textContent (false positive)
 *
 * Usage: node scripts/check-xss-patterns.js
 */

const fs = require('fs');
const path = require('path');

const RED = '\x1b[0;31m';
const GREEN = '\x1b[0;32m';
const YELLOW = '\x1b[1;33m';
const NC = '\x1b[0m';

let violations = 0;

function checkFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // ONLY match: .innerHTML = 'string' + var + 'string'
  // This is intentionally narrow to avoid false positives
  const innerHTMLPattern = /\.(innerHTML|insertAdjacentHTML)\s*=\s*['"`]([^'"`]*)['"`]\s*\+\s*(?!['\s])/;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const fileName = path.basename(filePath);

    // Skip safe/static comments
    if (line.includes('// Safe:') || line.includes('// Static:')) {
      return;
    }

    // Skip Google Fonts URLs and other non-security uses
    if (line.includes('googleapis.com') || line.includes('stylesheet')) {
      return;
    }

    // Only flag actual innerHTML/insertAdjacentHTML assignments with + on same line
    if (innerHTMLPattern.test(line) && (line.includes('.innerHTML =') || line.includes('insertAdjacentHTML'))) {
      // Additional filter: must actually have a variable, not just string literals
      if (/\+\s*[a-zA-Z_$]/.test(line)) {
        console.log(`${RED}✗${NC} ${fileName}:${lineNum}`);
        console.log(`  ${line.trim()}`);
        violations++;
      }
    }
  });
}

console.log('🔍 XSS lint check (conservative mode)...\n');

checkFile('Portal.html');
checkFile('Admin.html');

console.log('');
if (violations === 0) {
  console.log(`${GREEN}✅ No obvious innerHTML/insertAdjacentHTML + variable patterns found.${NC}`);
  console.log(`${YELLOW}Note: This is a heuristic check only. Full security review requires AST analysis.${NC}\n`);
  process.exit(0);
} else {
  console.log(`${RED}⚠️  Found ${violations} potential innerHTML/insertAdjacentHTML + variable pattern(s)${NC}\n`);
  process.exit(1);
}
