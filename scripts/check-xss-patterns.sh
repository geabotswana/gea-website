#!/bin/bash
# Pre-commit check for XSS-prone patterns in Portal.html and Admin.html
# Detects innerHTML/insertAdjacentHTML with string interpolation of user data
# Run: bash scripts/check-xss-patterns.sh

set -e

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

VIOLATIONS=0

echo "🔍 Scanning for XSS-prone patterns..."
echo ""

# Check for innerHTML with string concatenation (user data interpolation)
echo "Checking for innerHTML/insertAdjacentHTML with '+' (string interpolation)..."
if grep -n "\.innerHTML\s*=.*['\"][^'\"]*['\s]*+\|insertAdjacentHTML.*['\"][^'\"]*['\s]*+" Portal.html Admin.html 2>/dev/null | grep -v "// Safe:" | grep -v "// Static:"; then
    echo -e "${RED}❌ Found potentially unsafe innerHTML/insertAdjacentHTML with string interpolation${NC}"
    VIOLATIONS=$((VIOLATIONS + 1))
else
    echo -e "${GREEN}✅ No unsafe innerHTML/insertAdjacentHTML patterns detected${NC}"
fi

echo ""
echo "Checking for onclick handlers with string interpolation (+ operator)..."
if grep -n "onclick\s*=\s*['\"].*['\"\s]*+['\"\s]*.*['\"]" Portal.html Admin.html 2>/dev/null | grep -v "// Safe:"; then
    echo -e "${RED}❌ Found onclick handlers with string interpolation${NC}"
    VIOLATIONS=$((VIOLATIONS + 1))
else
    echo -e "${GREEN}✅ No unsafe onclick with string interpolation detected${NC}"
fi

echo ""
if [ $VIOLATIONS -eq 0 ]; then
    echo -e "${GREEN}✅ All XSS pattern checks passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Found $VIOLATIONS XSS pattern violation(s)${NC}"
    echo ""
    echo "REMEDIATION:"
    echo "  - Use createElement() + textContent for user data"
    echo "  - Use closures for event handlers with IDs"
    echo "  - Reserve innerHTML only for static HTML"
    exit 1
fi
