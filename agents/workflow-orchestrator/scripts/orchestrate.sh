#!/usr/bin/env bash
# orchestrate.sh - Pipeline orchestration script for workflow-orchestrator agent
# Usage: ./orchestrate.sh <pipeline> [options]
#
# Pipelines:
#   pre-commit  - Validate, review, prepare commit
#   pr-create   - Full validation to PR pipeline
#   ci-recover  - Diagnose and fix CI failures
#   status      - Show current state

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"
VALIDATE_SCRIPT="${REPO_ROOT}/tooling/scripts/local-validate.sh"
MAX_RETRIES=3

# Logging functions
log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

log_step() {
    local step_num=$1
    local step_name=$2
    echo -e "\n${BLUE}━━━ Step ${step_num}: ${step_name} ━━━${NC}"
}

# State gathering
gather_context() {
    log_info "Gathering context..."

    echo -e "\n${YELLOW}CHANGELOG [Unreleased]:${NC}"
    grep -A 20 "\[Unreleased\]" "${REPO_ROOT}/CHANGELOG.md" 2>/dev/null | head -25 || echo "  (no CHANGELOG found)"

    echo -e "\n${YELLOW}Git Status:${NC}"
    git status --short 2>/dev/null || echo "  (not a git repo)"

    echo -e "\n${YELLOW}Recent Commits:${NC}"
    git log --oneline -5 2>/dev/null || echo "  (no commits)"
}

# Validation step
run_validation() {
    log_step 1 "Validation"

    if [[ ! -x "${VALIDATE_SCRIPT}" ]]; then
        log_error "Validation script not found or not executable: ${VALIDATE_SCRIPT}"
        return 1
    fi

    if "${VALIDATE_SCRIPT}"; then
        log_success "Validation passed"
        return 0
    else
        log_error "Validation failed"
        return 1
    fi
}

# Code review step (placeholder - invokes skill via Claude)
run_code_review() {
    log_step 2 "Code Review"
    log_info "Code review requires Claude skill invocation"
    echo ""
    echo "To run code review, use Claude with:"
    echo "  Use the code-review skill to analyze the current changes"
    echo ""
    log_warn "Skipping automated review (requires Claude context)"
    return 0
}

# Commit message step (placeholder - invokes skill via Claude)
run_smart_commit() {
    log_step 3 "Commit Message Generation"
    log_info "Commit generation requires Claude skill invocation"
    echo ""
    echo "To generate commit message, use Claude with:"
    echo "  Use the smart-commit skill to generate a commit message"
    echo ""

    # Show diff summary for context
    echo -e "\n${YELLOW}Changes Summary:${NC}"
    git diff --stat 2>/dev/null || echo "  (no changes)"

    log_warn "Skipping automated commit (requires Claude context)"
    return 0
}

# Jules delegation step
run_jules_delegation() {
    log_step 4 "Jules Delegation"

    local jules_script="${REPO_ROOT}/plugins/jules-integration/scripts/jules-session.sh"

    if [[ ! -x "${jules_script}" ]]; then
        log_warn "Jules integration not available: ${jules_script}"
        echo "To delegate to Jules manually, use:"
        echo "  Use the jules-integration skill to create a PR"
        return 0
    fi

    if [[ -z "${JULES_API_KEY:-}" ]]; then
        log_warn "JULES_API_KEY not set, skipping Jules delegation"
        return 0
    fi

    log_info "Delegating PR creation to Jules..."
    # shellcheck disable=SC2016
    echo 'Would run: ${jules_script} "Create PR for current changes"'
    log_warn "Jules delegation requires manual confirmation"
    return 0
}

# CI recovery step
run_ci_recovery() {
    log_step 1 "CI Failure Diagnosis"
    log_info "CI recovery requires systematic-debugging skill"
    echo ""
    echo "To diagnose CI failure, use Claude with:"
    echo "  Use the systematic-debugging skill to analyze the CI failure"
    echo ""

    # Check if CI status is available
    local ci_script="${REPO_ROOT}/plugins/autonomous-ci/scripts/wait-for-ci.sh"
    if [[ -x "${ci_script}" ]]; then
        log_info "CI monitoring script available: ${ci_script}"
    fi

    return 0
}

# Pipeline: pre-commit
pipeline_pre_commit() {
    echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}  Pipeline: PRE-COMMIT                  ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"

    gather_context

    if ! run_validation; then
        log_error "Pipeline failed at validation step"
        return 1
    fi

    run_code_review
    run_smart_commit

    echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}  Pre-commit pipeline complete          ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"

    echo ""
    log_info "Next steps:"
    echo "  1. Review the suggested commit message"
    echo "  2. Stage changes: git add ."
    echo "  3. Commit: git commit -m '<message>'"
    echo "  4. Push: git push"
}

# Pipeline: pr-create
pipeline_pr_create() {
    echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}  Pipeline: PR-CREATE                   ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"

    gather_context

    if ! run_validation; then
        log_error "Pipeline failed at validation step"
        return 1
    fi

    run_code_review
    run_smart_commit
    run_jules_delegation

    echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}  PR-create pipeline complete           ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
}

# Pipeline: ci-recover
pipeline_ci_recover() {
    echo -e "\n${YELLOW}═══════════════════════════════════════${NC}"
    echo -e "${YELLOW}  Pipeline: CI-RECOVER                  ${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"

    gather_context
    run_ci_recovery

    local retry_count=0
    while [[ ${retry_count} -lt ${MAX_RETRIES} ]]; do
        echo -e "\n${YELLOW}Validation attempt $((retry_count + 1))/${MAX_RETRIES}${NC}"

        if run_validation; then
            log_success "CI recovery successful!"
            return 0
        fi

        retry_count=$((retry_count + 1))

        if [[ ${retry_count} -lt ${MAX_RETRIES} ]]; then
            log_warn "Retrying in 5 seconds..."
            sleep 5
        fi
    done

    log_error "CI recovery failed after ${MAX_RETRIES} attempts"
    echo ""
    log_info "Manual intervention required. Use Claude with:"
    echo "  Use the systematic-debugging skill to analyze this failure"
    return 1
}

# Pipeline: status
pipeline_status() {
    echo -e "\n${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}  Workflow Orchestrator Status          ${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"

    gather_context

    echo -e "\n${YELLOW}Available Plugins:${NC}"
    for plugin_dir in "${REPO_ROOT}"/plugins/*/; do
        if [[ -d "${plugin_dir}" ]]; then
            local plugin_name
            plugin_name=$(basename "${plugin_dir}")
            if [[ -f "${plugin_dir}.claude-plugin/plugin.json" ]]; then
                echo -e "  ${GREEN}✓${NC} ${plugin_name}"
            else
                echo -e "  ${RED}✗${NC} ${plugin_name} (missing plugin.json)"
            fi
        fi
    done

    echo -e "\n${YELLOW}Environment:${NC}"
    echo -e "  JULES_API_KEY: ${JULES_API_KEY:+set}${JULES_API_KEY:-not set}"
    echo -e "  GITHUB_TOKEN:  ${GITHUB_TOKEN:+set}${GITHUB_TOKEN:-not set}"
}

# Usage
usage() {
    echo "Usage: $0 <pipeline> [options]"
    echo ""
    echo "Pipelines:"
    echo "  pre-commit  - Validate, review, prepare commit"
    echo "  pr-create   - Full validation to PR pipeline"
    echo "  ci-recover  - Diagnose and fix CI failures"
    echo "  status      - Show current state"
    echo ""
    echo "Examples:"
    echo "  $0 pre-commit"
    echo "  $0 pr-create"
    echo "  $0 ci-recover"
    echo "  $0 status"
}

# Main
main() {
    if [[ $# -lt 1 ]]; then
        usage
        exit 1
    fi

    local pipeline="$1"
    shift

    case "${pipeline}" in
        pre-commit)
            pipeline_pre_commit "$@"
            ;;
        pr-create)
            pipeline_pr_create "$@"
            ;;
        ci-recover)
            pipeline_ci_recover "$@"
            ;;
        status)
            pipeline_status "$@"
            ;;
        -h|--help|help)
            usage
            exit 0
            ;;
        *)
            log_error "Unknown pipeline: ${pipeline}"
            usage
            exit 1
            ;;
    esac
}

main "$@"
