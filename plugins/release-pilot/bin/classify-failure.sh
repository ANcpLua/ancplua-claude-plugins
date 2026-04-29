#!/usr/bin/env bash
set -euo pipefail

# classify-failure.sh <run-id> — fetch the failed-step logs of a workflow run
# and classify the failure as one of:
#
#   trivial-format|<msg>  — whitespace/format drift; orchestrator may auto-fix
#   flake|<msg>           — cross-OS matrix flake; orchestrator may rerun once
#   hard|<msg>            — anything else; orchestrator must stop and report
#
# Stdout: single line `verdict|message`
# Exit: always 0 (verdict is in the output, not the exit code)

RUN_ID="${1:?usage: classify-failure.sh <run-id>}"

LOG_TMP=$(mktemp)
trap 'rm -f "$LOG_TMP"' EXIT

if ! gh run view "$RUN_ID" --log-failed > "$LOG_TMP" 2>/dev/null; then
  echo "hard|could not fetch logs for run $RUN_ID"
  exit 0
fi

if [ ! -s "$LOG_TMP" ]; then
  echo "hard|run $RUN_ID has no failed-step logs (workflow may have been cancelled)"
  exit 0
fi

# Hard signals — these never auto-retry.
if grep -qE "\bNU1102\b" "$LOG_TMP"; then
  echo "hard|NU1102 — package version not found upstream; bootstrap chain violation, human resolves"
  exit 0
fi
if grep -qE "\bNU1109\b" "$LOG_TMP"; then
  echo "hard|NU1109 — downgrade detected; CPM transitive bump needed, human picks the floor"
  exit 0
fi
if grep -qE "BannedApiTests|MtpDetectionTests|SourceGeneratorDefaultsTests" "$LOG_TMP"; then
  echo "hard|generator/banned-API test failure — needs interpretation, never mechanical"
  exit 0
fi
if grep -qE "error CS[0-9]+" "$LOG_TMP"; then
  echo "hard|C# compile error in source — never auto-fix"
  exit 0
fi

# Flake signal — only one OS in the matrix failed.
W_FAIL=$(grep -cE "windows-latest.*(failed|exit code [1-9])" "$LOG_TMP" || true)
U_FAIL=$(grep -cE "ubuntu-latest.*(failed|exit code [1-9])" "$LOG_TMP" || true)
M_FAIL=$(grep -cE "macos-latest.*(failed|exit code [1-9])" "$LOG_TMP" || true)
if [ "$W_FAIL" -gt 0 ] && [ "$U_FAIL" -eq 0 ] && [ "$M_FAIL" -eq 0 ]; then
  echo "flake|windows-only failure — retry once via gh run rerun --failed"
  exit 0
fi

# Trivial: whitespace/format drift.
if grep -qE "Whitespace formatting issues|dotnet format whitespace --verify-no-changes|Format complete" "$LOG_TMP"; then
  echo "trivial-format|run 'dotnet format whitespace' at repo root, recommit, retry"
  exit 0
fi

# Default — caller must surface to human.
echo "hard|unrecognized failure pattern in run $RUN_ID — fetch full log with 'gh run view $RUN_ID --log-failed'"
