#!/usr/bin/env bash
# =============================================================================
# COMPLETION INTEGRITY CHECK
# =============================================================================
# Detects cheating patterns in staged changes:
#   - Warning/error suppression added
#   - Tests commented out
#   - TODOs added without context
#   - Assertions deleted
#   - Test files deleted
# =============================================================================

set -euo pipefail

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

VIOLATIONS=()
WARNINGS=()

# Get staged diff (what's about to be committed)
# Exclude: markdown files, shell scripts in plugin dirs, test fixtures
# All pathspecs must be after a single -- separator
STAGED_DIFF=$(git diff --cached --unified=0 -- \
    ':(exclude)*.md' \
    ':(exclude)**/hooks/scripts/*.sh' \
    ':(exclude)**/scripts/*.sh' \
    ':(exclude)**/*.test.*' \
    ':(exclude)**/*.spec.*' \
    ':(exclude)**/test-fixtures/**' \
    2>/dev/null || echo "")

if [[ -z "$STAGED_DIFF" ]]; then
    echo -e "${GREEN}CLEAN|No staged changes (or only excluded files)${NC}"
    exit 0
fi

# Get only ADDED lines (lines starting with +, excluding +++ header)
ADDED_LINES=$(echo "$STAGED_DIFF" | grep -E '^\+[^+]' | sed 's/^\+//' || true)

# Get only DELETED lines (lines starting with -, excluding --- header)
DELETED_LINES=$(echo "$STAGED_DIFF" | grep -E '^-[^-]' | sed 's/^-//' || true)

# =============================================================================
# RULE 1: WARNING/ERROR SUPPRESSION ADDED
# =============================================================================

# C# suppressions
CS_SUPPRESS=$(echo "$ADDED_LINES" | grep -iE '#pragma\s+warning\s+disable|SuppressMessage|DisableWarning' || true)
if [[ -n "$CS_SUPPRESS" ]]; then
    VIOLATIONS+=("SUPPRESS_CS|Warning suppression added")
    echo -e "${RED}SUPPRESS_CS|C# warning suppression detected${NC}"
    echo "$CS_SUPPRESS" | head -3 | while read -r line; do
        echo "  + $line"
    done
fi

# JavaScript/TypeScript suppressions
JS_SUPPRESS=$(echo "$ADDED_LINES" | grep -iE 'eslint-disable|@ts-ignore|@ts-nocheck|@ts-expect-error|tslint:disable' || true)
if [[ -n "$JS_SUPPRESS" ]]; then
    VIOLATIONS+=("SUPPRESS_JS|ESLint/TS suppression added")
    echo -e "${RED}SUPPRESS_JS|JS/TS warning suppression detected${NC}"
    echo "$JS_SUPPRESS" | head -3 | while read -r line; do
        echo "  + $line"
    done
fi

# Python suppressions
PY_SUPPRESS=$(echo "$ADDED_LINES" | grep -iE '#\s*noqa|#\s*type:\s*ignore|#\s*pylint:\s*disable' || true)
if [[ -n "$PY_SUPPRESS" ]]; then
    VIOLATIONS+=("SUPPRESS_PY|Python linter suppression added")
    echo -e "${RED}SUPPRESS_PY|Python warning suppression detected${NC}"
    echo "$PY_SUPPRESS" | head -3 | while read -r line; do
        echo "  + $line"
    done
fi

# =============================================================================
# RULE 2: TESTS COMMENTED OUT
# =============================================================================

# C# test attributes commented out
CS_COMMENTED_TESTS=$(echo "$ADDED_LINES" | grep -iE '//\s*\[(Test|Fact|Theory|TestMethod)\]' || true)
if [[ -n "$CS_COMMENTED_TESTS" ]]; then
    VIOLATIONS+=("COMMENTED_TEST_CS|C# test commented out")
    echo -e "${RED}COMMENTED_TEST_CS|C# test attribute commented out${NC}"
    echo "$CS_COMMENTED_TESTS" | head -3 | while read -r line; do
        echo "  + $line"
    done
fi

# JS/TS tests commented out
JS_COMMENTED_TESTS=$(echo "$ADDED_LINES" | grep -iE '//\s*(it|test|describe)\s*\(' || true)
if [[ -n "$JS_COMMENTED_TESTS" ]]; then
    VIOLATIONS+=("COMMENTED_TEST_JS|JS test commented out")
    echo -e "${RED}COMMENTED_TEST_JS|JS/TS test commented out${NC}"
    echo "$JS_COMMENTED_TESTS" | head -3 | while read -r line; do
        echo "  + $line"
    done
fi

# Skipped tests added (.skip, [Skip], pytest.mark.skip)
SKIPPED_TESTS=$(echo "$ADDED_LINES" | grep -iE '\.skip\(|xtest\(|xit\(|\[Skip\]|pytest\.mark\.skip|@pytest\.mark\.skip|@ignore|@disabled' || true)
if [[ -n "$SKIPPED_TESTS" ]]; then
    WARNINGS+=("SKIPPED_TEST|Test marked as skip/ignore")
    echo -e "${YELLOW}SKIPPED_TEST|Test skip marker added${NC}"
    echo "$SKIPPED_TESTS" | head -3 | while read -r line; do
        echo "  + $line"
    done
fi

# =============================================================================
# RULE 3: TODO/FIXME ADDED (without context)
# Threshold: >2 TODOs added triggers warning
# Rationale: Occasional notes are fine, but bulk TODOs suggest deferred work
# =============================================================================

TODO_ADDED=$(echo "$ADDED_LINES" | grep -iE '//\s*TODO|#\s*TODO|//\s*FIXME|#\s*FIXME|//\s*HACK|#\s*HACK' || true)
TODO_COUNT=0
[[ -n "$TODO_ADDED" ]] && TODO_COUNT=$(echo "$TODO_ADDED" | wc -l | tr -d ' ')
if [[ "$TODO_COUNT" -gt 2 ]]; then
    WARNINGS+=("TODO_ADDED|$TODO_COUNT TODOs added")
    echo -e "${YELLOW}TODO_ADDED|$TODO_COUNT new TODOs added${NC}"
    echo "$TODO_ADDED" | head -3 | while read -r line; do
        echo "  + $line"
    done
fi

# =============================================================================
# RULE 4: ASSERTIONS DELETED
# Threshold: >2 assertions deleted triggers violation
# Rationale: Allows minor refactoring (1-2 removals) but catches bulk deletion
# =============================================================================

# C# assertions deleted
CS_ASSERT_DELETED=$(echo "$DELETED_LINES" | grep -iE 'Assert\.|Should\.|Expect\(' || true)
CS_ASSERT_DELETED_COUNT=0
[[ -n "$CS_ASSERT_DELETED" ]] && CS_ASSERT_DELETED_COUNT=$(echo "$CS_ASSERT_DELETED" | wc -l | tr -d ' ')
if [[ "$CS_ASSERT_DELETED_COUNT" -gt 2 ]]; then
    VIOLATIONS+=("ASSERT_DELETED|$CS_ASSERT_DELETED_COUNT assertions removed")
    echo -e "${RED}ASSERT_DELETED|$CS_ASSERT_DELETED_COUNT assertions deleted${NC}"
    echo "$CS_ASSERT_DELETED" | head -3 | while read -r line; do
        echo "  - $line"
    done
fi

# JS assertions deleted
JS_ASSERT_DELETED=$(echo "$DELETED_LINES" | grep -iE 'expect\(|assert\.|should\.' || true)
JS_ASSERT_DELETED_COUNT=0
[[ -n "$JS_ASSERT_DELETED" ]] && JS_ASSERT_DELETED_COUNT=$(echo "$JS_ASSERT_DELETED" | wc -l | tr -d ' ')
if [[ "$JS_ASSERT_DELETED_COUNT" -gt 2 ]]; then
    VIOLATIONS+=("ASSERT_DELETED_JS|$JS_ASSERT_DELETED_COUNT JS assertions removed")
    echo -e "${RED}ASSERT_DELETED_JS|$JS_ASSERT_DELETED_COUNT JS assertions deleted${NC}"
    echo "$JS_ASSERT_DELETED" | head -3 | while read -r line; do
        echo "  - $line"
    done
fi

# =============================================================================
# RULE 5: TEST FILES DELETED
# =============================================================================

DELETED_FILES=$(git diff --cached --name-only --diff-filter=D 2>/dev/null || true)
DELETED_TEST_FILES=$(echo "$DELETED_FILES" | grep -iE '\.test\.|\.spec\.|_test\.|Tests\.cs|Test\.cs' || true)
if [[ -n "$DELETED_TEST_FILES" ]]; then
    VIOLATIONS+=("TEST_FILE_DELETED|Test file(s) deleted")
    echo -e "${RED}TEST_FILE_DELETED|Test file(s) deleted${NC}"
    echo "$DELETED_TEST_FILES" | while read -r file; do
        echo "  - $file"
    done
fi

# =============================================================================
# RULE 6: CATCH-ALL EXCEPTION HANDLERS ADDED
# =============================================================================

CATCH_ALL=$(echo "$ADDED_LINES" | grep -iE 'catch\s*\(\s*(Exception|Error|e|ex|err)?\s*\)\s*\{?\s*\}|except:\s*$|except\s+Exception:' || true)
if [[ -n "$CATCH_ALL" ]]; then
    WARNINGS+=("CATCH_ALL|Empty or catch-all exception handler")
    echo -e "${YELLOW}CATCH_ALL|Empty/catch-all exception handler added${NC}"
    echo "$CATCH_ALL" | head -3 | while read -r line; do
        echo "  + $line"
    done
fi

# =============================================================================
# SUMMARY
# =============================================================================

echo ""
VIOLATION_COUNT=${#VIOLATIONS[@]}
WARNING_COUNT=${#WARNINGS[@]}

if [[ "$VIOLATION_COUNT" -eq 0 && "$WARNING_COUNT" -eq 0 ]]; then
    echo -e "${GREEN}CLEAN|No integrity issues found${NC}"
    exit 0
elif [[ "$VIOLATION_COUNT" -eq 0 ]]; then
    echo -e "${YELLOW}WARNINGS|$WARNING_COUNT warnings (review recommended)${NC}"
    exit 0
else
    echo -e "${RED}BLOCKED|$VIOLATION_COUNT violations, $WARNING_COUNT warnings${NC}"
    echo ""
    echo "Fix violations before committing. These patterns indicate shortcuts that will cause problems later."
    exit 1
fi
