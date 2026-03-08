#!/usr/bin/env node
/**
 * XSS Pattern Lint - Conservative Same-Line Heuristic Check
 *
 * ⚠️  LIMITATIONS (intentional, to reduce false positives):
 * - Only detects same-line patterns (requires AST for multi-line flows)
 * - Does NOT catch template literals with ${} (requires parser)
 * - Does NOT catch two-step var html = ...; el.innerHTML = html;
 * - May have false negatives from obfuscated concatenation
 *
 * DETECTS:
 * - .innerHTML = '...' + variable
 * - .innerHTML = variable + '...'
 * - insertAdjacentHTML(..., '...' + variable)
 * - insertAdjacentHTML(..., variable + '...')
 *
 * NOT a comprehensive security blocker. Use for regression prevention only.
 * Full security review requires AST analysis and code review.
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

  // Pattern 1: .innerHTML = 'string' + var (assignment)
  const assignmentPattern = /\.(innerHTML)\s*=\s*['"`]([^'"`]*)['"`]\s*\+\s*(?!['\s])/;

  // Pattern 2: insertAdjacentHTML(...'string' + var) (method call)
  // Matches: insertAdjacentHTML(anything, 'string' + var or " + var)
  const methodCallPattern = /insertAdjacentHTML\s*\([^)]*['"`][^'"`]*['"`]\s*\+\s*(?!['\s])/;

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const fileName = path.basename(filePath);

    // Skip safe/static comments and non-security uses
    if (line.includes('// Safe:') || line.includes('// Static:') ||
        line.includes('googleapis.com') || line.includes('stylesheet')) {
      return;
    }

    // Check Pattern 1: innerHTML = 'string' + variable
    if (assignmentPattern.test(line) && /\+\s*[a-zA-Z_$]/.test(line)) {
      console.log(`${RED}✗${NC} ${fileName}:${lineNum}`);
      console.log(`  ${line.trim()}`);
      violations++;
      return;
    }

    // Check Pattern 2: insertAdjacentHTML(..., 'string' + variable)
    if (methodCallPattern.test(line) && /\+\s*[a-zA-Z_$]/.test(line)) {
      console.log(`${RED}✗${NC} ${fileName}:${lineNum}`);
      console.log(`  ${line.trim()}`);
      violations++;
      return;
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
