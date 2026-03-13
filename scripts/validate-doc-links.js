#!/usr/bin/env node

/**
 * Validate local markdown links in docs/*.md files.
 *
 * Usage:
 *   node scripts/validate-doc-links.js
 */

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.join(__dirname, '..');
const DOCS_ROOT = path.join(REPO_ROOT, 'docs');
const MARKDOWN_LINK_RE = /\[[^\]]+\]\(([^)#]+)(?:#[^)]+)?\)/g;

function walk(dir) {
  const out = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.md')) {
      out.push(full);
    }
  }
  return out;
}

function isExternalLink(linkTarget) {
  return /^(https?:|mailto:|tel:)/i.test(linkTarget);
}

const markdownFiles = walk(DOCS_ROOT);
const errors = [];

for (const filePath of markdownFiles) {
  const raw = fs.readFileSync(filePath, 'utf8');
  let m;
  while ((m = MARKDOWN_LINK_RE.exec(raw)) !== null) {
    const target = m[1].trim();
    if (!target || target.startsWith('#') || isExternalLink(target)) {
      continue;
    }

    const resolvedPath = path.normalize(path.join(path.dirname(filePath), target));
    if (!fs.existsSync(resolvedPath)) {
      const relFile = path.relative(REPO_ROOT, filePath);
      errors.push(`${relFile} -> ${target}`);
    }
  }
}

if (errors.length) {
  console.error(`Found ${errors.length} broken local documentation link(s):`);
  for (const err of errors) {
    console.error(` - ${err}`);
  }
  process.exit(1);
}

console.log(`Validated ${markdownFiles.length} docs markdown file(s): no broken local links.`);
