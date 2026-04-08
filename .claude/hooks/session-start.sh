#!/bin/bash
# GEA Website - Claude Code session startup hook
# Runs at the start of every web session to ensure the environment is ready.
# Only runs in remote (web) environments.

set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo "==> Installing XSS prevention git hooks..."
node scripts/install-hooks.js || echo "⚠️  Hook install warning (non-fatal)"

echo "==> Fetching latest from remote..."
git fetch origin

echo "✓ Session ready."
