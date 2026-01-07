#!/usr/bin/env bash
# =============================================================================
# INSTALL GIT PRE-COMMIT HOOK
# =============================================================================
# Installs the completion-integrity check as a real git pre-commit hook.
# Works in ALL modes including --dangerously-skip-permissions.
# =============================================================================

set -euo pipefail

# Colors for output
GREEN='\033[0;32m'
NC='\033[0m'

# Find git root
GIT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [[ -z "${GIT_ROOT}" ]]; then
    echo "ERROR: Not in a git repository"
    exit 1
fi

HOOKS_DIR="${GIT_ROOT}/.git/hooks"
PRE_COMMIT_HOOK="${HOOKS_DIR}/pre-commit"

# Check if pre-commit hook already exists
if [[ -f "${PRE_COMMIT_HOOK}" ]]; then
    echo "WARNING: pre-commit hook already exists at ${PRE_COMMIT_HOOK}"
    echo "Backing up to ${PRE_COMMIT_HOOK}.backup"
    cp "${PRE_COMMIT_HOOK}" "${PRE_COMMIT_HOOK}.backup"
fi

# Create the pre-commit hook
cat > "${PRE_COMMIT_HOOK}" << 'HOOK_EOF'
#!/usr/bin/env bash
# =============================================================================
# GIT PRE-COMMIT HOOK - Completion Integrity Check
# =============================================================================
# Blocks commits with integrity violations:
#   - Warning suppressions (#pragma warning disable, eslint-disable, noqa)
#   - Commented-out tests
#   - Deleted assertions (>2)
#   - Deleted test files
# =============================================================================

set -euo pipefail

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

VIOLATIONS=()
WARNINGS=()

# Get staged diff, excluding documentation and scripts
STAGED_DIFF=$(git diff --cached --unified=0 -- \
    ':(exclude)*.md' \
    ':(exclude)**/hooks/scripts/*.sh' \
    ':(exclude)**/scripts/*.sh' \
    ':(exclude)**/*.test.*' \
    ':(exclude)**/*.spec.*' \
    ':(exclude)**/test-fixtures/**' \
    2>/dev/null || echo "")

if [[ -z "${STAGED_DIFF}" ]]; then
    exit 0
fi

ADDED_LINES=$(echo "${STAGED_DIFF}" | grep -E '^\+[^+]' | sed 's/^\+//' || true)
DELETED_LINES=$(echo "${STAGED_DIFF}" | grep -E '^-[^-]' | sed 's/^-//' || true)

# RULE 1: Warning suppressions
CS_SUPPRESS=$(echo "${ADDED_LINES}" | grep -iE '#pragma\s+warning\s+disable|SuppressMessage' || true)
if [[ -n "${CS_SUPPRESS}" ]]; then
    VIOLATIONS+=("C# warning suppression")
    echo -e "${RED}BLOCKED: C# warning suppression detected${NC}"
    echo "${CS_SUPPRESS}" | head -3 | while read -r line; do echo "  + ${line}"; done
fi

JS_SUPPRESS=$(echo "${ADDED_LINES}" | grep -iE 'eslint-disable|@ts-ignore|@ts-nocheck' || true)
if [[ -n "${JS_SUPPRESS}" ]]; then
    VIOLATIONS+=("JS/TS warning suppression")
    echo -e "${RED}BLOCKED: JS/TS warning suppression detected${NC}"
    echo "${JS_SUPPRESS}" | head -3 | while read -r line; do echo "  + ${line}"; done
fi

PY_SUPPRESS=$(echo "${ADDED_LINES}" | grep -iE '#\s*noqa|#\s*type:\s*ignore' || true)
if [[ -n "${PY_SUPPRESS}" ]]; then
    VIOLATIONS+=("Python warning suppression")
    echo -e "${RED}BLOCKED: Python warning suppression detected${NC}"
    echo "${PY_SUPPRESS}" | head -3 | while read -r line; do echo "  + ${line}"; done
fi

# RULE 2: Commented tests
COMMENTED_TESTS=$(echo "${ADDED_LINES}" | grep -iE '//\s*\[(Test|Fact|Theory)\]|//\s*(it|test|describe)\s*\(' || true)
if [[ -n "${COMMENTED_TESTS}" ]]; then
    VIOLATIONS+=("Commented-out tests")
    echo -e "${RED}BLOCKED: Commented-out test detected${NC}"
    echo "${COMMENTED_TESTS}" | head -3 | while read -r line; do echo "  + ${line}"; done
fi

# RULE 3: Deleted assertions (>2)
DELETED_ASSERTS=$(echo "${DELETED_LINES}" | grep -iE 'Assert\.|Should\.|Expect\(' || true)
ASSERT_COUNT=0
[[ -n "${DELETED_ASSERTS}" ]] && ASSERT_COUNT=$(echo "${DELETED_ASSERTS}" | wc -l | tr -d ' ')
if [[ "${ASSERT_COUNT}" -gt 2 ]]; then
    VIOLATIONS+=("${ASSERT_COUNT} assertions deleted")
    echo -e "${RED}BLOCKED: ${ASSERT_COUNT} assertions deleted${NC}"
fi

# RULE 4: Test files deleted
DELETED_FILES=$(git diff --cached --name-only --diff-filter=D 2>/dev/null || true)
DELETED_TESTS=$(echo "${DELETED_FILES}" | grep -iE '\.test\.|\.spec\.|_test\.|Tests\.cs' || true)
if [[ -n "${DELETED_TESTS}" ]]; then
    VIOLATIONS+=("Test file(s) deleted")
    echo -e "${RED}BLOCKED: Test file deleted${NC}"
    echo "${DELETED_TESTS}" | while read -r f; do echo "  - ${f}"; done
fi

# Summary
if [[ ${#VIOLATIONS[@]} -gt 0 ]]; then
    echo ""
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${RED}COMMIT BLOCKED - ${#VIOLATIONS[@]} integrity violation(s)${NC}"
    echo -e "${RED}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Fix these issues or use --no-verify to bypass (not recommended)"
    exit 1
fi

exit 0
HOOK_EOF

chmod +x "${PRE_COMMIT_HOOK}"

echo -e "${GREEN}✓ Git pre-commit hook installed at ${PRE_COMMIT_HOOK}${NC}"
echo ""
echo "The hook will now block commits with integrity violations."
echo "To bypass (not recommended): git commit --no-verify"
echo "To uninstall: rm ${PRE_COMMIT_HOOK}"
