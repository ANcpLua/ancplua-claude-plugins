#!/bin/bash
# Deterministic .NET architecture linter
# Output format: RULE_X|file|details
# Exit codes: 0 = clean, 1 = violations

REPO_ROOT="${1:-.}"

# ============================================================
# Try dotnet tool first (single source of truth)
# ============================================================
if command -v ancplua-lint &> /dev/null; then
  ancplua-lint "$REPO_ROOT" --format compact
  exit $?
fi

# ============================================================
# Fallback to bash implementation
# ============================================================
set -e
VIOLATIONS=()

# ============================================================
# RULE A: No hardcoded versions in Directory.Packages.props
# ============================================================
DPP="$REPO_ROOT/Directory.Packages.props"
if [[ -f "$DPP" ]]; then
  # Match Version="X.Y.Z" but not Version="$(Var)"
  HARDCODED=$(grep -n 'PackageVersion.*Version="[^$]' "$DPP" 2>/dev/null || true)
  if [[ -n "$HARDCODED" ]]; then
    VIOLATIONS+=("RULE_A:$DPP")
    echo "RULE_A|$DPP"
    echo "$HARDCODED" | while read -r line; do
      echo "  $line"
    done
  fi
fi

# ============================================================
# RULE B: Only allowed files import Version.props
# Allowed:
#   - Directory.Packages.props (CPM projects)
#   - eng/Directory.Build.props (CPM-disabled projects)
#   - src/Sdk/*/Sdk.props (SDK entry points)
#   - src/common/*.props (shared SDK infrastructure)
# ============================================================
while IFS= read -r -d '' file; do
  if grep -q 'Import.*Version\.props' "$file" 2>/dev/null; then
    BASENAME=$(basename "$file")
    # Get relative path from repo root
    RELPATH="${file#$REPO_ROOT/}"

    # Allow Directory.Packages.props anywhere
    if [[ "$BASENAME" == "Directory.Packages.props" ]]; then
      continue
    fi

    # Allow eng/Directory.Build.props specifically
    if [[ "$RELPATH" == "eng/Directory.Build.props" ]]; then
      continue
    fi

    # Allow SDK entry points (src/Sdk/*/Sdk.props)
    if [[ "$RELPATH" == src/Sdk/*/Sdk.props ]]; then
      continue
    fi

    # Allow shared SDK infrastructure (src/common/*.props)
    if [[ "$RELPATH" == src/common/*.props ]]; then
      continue
    fi

    # Everything else is a violation
    LINE=$(grep -n 'Import.*Version\.props' "$file" | head -1)
    VIOLATIONS+=("RULE_B:$file")
    echo "RULE_B|$file"
    echo "  $LINE"
  fi
done < <(find "$REPO_ROOT" -name "*.props" -print0 2>/dev/null)

# ============================================================
# RULE C: Version.props symlink integrity
# In consumer repos: must be symlink
# In source repo (has src/common/Version.props): can be regular file
# ============================================================
VP="$REPO_ROOT/Version.props"
if [[ -e "$VP" || -L "$VP" ]]; then
  if [[ -L "$VP" ]]; then
    # Is a symlink - check if broken
    if [[ ! -e "$VP" ]]; then
      VIOLATIONS+=("RULE_C:$VP")
      TARGET=$(readlink "$VP" 2>/dev/null || echo "unknown")
      echo "RULE_C|$VP"
      echo "  Broken symlink -> $TARGET"
    fi
  else
    # Not a symlink - check if this is the source repo
    if [[ ! -f "$REPO_ROOT/src/common/Version.props" ]]; then
      VIOLATIONS+=("RULE_C:$VP")
      echo "RULE_C|$VP"
      echo "  Expected symlink, found regular file"
    fi
  fi
fi

# ============================================================
# RULE G: No PackageReference with hardcoded Version in .csproj
# Allowed: VersionOverride, Version="$(Variable)", CPM-disabled projects
# ============================================================
while IFS= read -r -d '' file; do
  # Skip projects that explicitly disable CPM
  if grep -q '<ManagePackageVersionsCentrally>false</ManagePackageVersionsCentrally>' "$file" 2>/dev/null; then
    continue
  fi

  # Match Version= but exclude VersionOverride and $(Variable) patterns
  INLINE=$(grep -n 'PackageReference.*Version=' "$file" 2>/dev/null | grep -v 'VersionOverride' | grep -v 'Version="\$(' || true)
  if [[ -n "$INLINE" ]]; then
    VIOLATIONS+=("RULE_G:$file")
    echo "RULE_G|$file"
    echo "$INLINE" | while read -r line; do
      echo "  $line"
    done
  fi
done < <(find "$REPO_ROOT" -name "*.csproj" -print0 2>/dev/null)

# ============================================================
# Summary
# ============================================================
echo ""
if [[ ${#VIOLATIONS[@]} -eq 0 ]]; then
  echo "CLEAN|All rules passed"
  exit 0
else
  echo "VIOLATIONS|${#VIOLATIONS[@]} found"
  exit 1
fi
