#!/usr/bin/env node
/**
 * Install pre-commit hooks for XSS regression prevention
 *
 * This script copies git hooks from scripts/hooks/ to .git/hooks/ with proper permissions.
 * Run this after cloning the repo or when hooks are updated.
 *
 * Usage:
 *   node scripts/install-hooks.js
 *
 * Or add to package.json postinstall (if using npm):
 *   "postinstall": "node scripts/install-hooks.js"
 */

const fs = require('fs');
const path = require('path');

const HOOKS_SRC_DIR = path.join(__dirname, 'git-hooks');
const HOOKS_DST_DIR = path.join(__dirname, '..', '.git', 'hooks');

// Ensure source directory exists
if (!fs.existsSync(HOOKS_SRC_DIR)) {
  console.error(`❌ Hook source directory not found: ${HOOKS_SRC_DIR}`);
  process.exit(1);
}

// Ensure .git/hooks directory exists
if (!fs.existsSync(HOOKS_DST_DIR)) {
  console.error(`❌ .git/hooks directory not found: ${HOOKS_DST_DIR}`);
  console.error('   Run this script from the repository root or ensure .git directory exists');
  process.exit(1);
}

// Copy each hook file
const hookFiles = fs.readdirSync(HOOKS_SRC_DIR);
let installed = 0;

hookFiles.forEach(hookFile => {
  const srcPath = path.join(HOOKS_SRC_DIR, hookFile);
  const dstPath = path.join(HOOKS_DST_DIR, hookFile);

  try {
    // Copy file
    fs.copyFileSync(srcPath, dstPath);

    // Make executable (Unix-like systems)
    if (process.platform !== 'win32') {
      fs.chmodSync(dstPath, 0o755);
    }

    console.log(`✅ Installed hook: ${hookFile}`);
    installed++;
  } catch (err) {
    console.error(`❌ Failed to install ${hookFile}: ${err.message}`);
  }
});

console.log(`\n${installed}/${hookFiles.length} hooks installed`);

if (installed === 0) {
  process.exit(1);
} else if (installed < hookFiles.length) {
  process.exit(1);
} else {
  console.log('\n🔒 Git hooks enabled. XSS regression checks will run before commits.\n');
  process.exit(0);
}
