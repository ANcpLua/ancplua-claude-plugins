#!/usr/bin/env bash
set -euo pipefail

# nuget-latest.sh <PackageId> — echo the highest stable semver on nuget.org
# for the given package ID. Empty output if the package is unpublished (404).

PKG="${1:?usage: nuget-latest.sh <PackageId>}"
PKG_LOWER=$(echo "$PKG" | tr '[:upper:]' '[:lower:]')
URL="https://api.nuget.org/v3-flatcontainer/${PKG_LOWER}/index.json"

RESP=$(curl -fsS "$URL" 2>/dev/null) || { echo ""; exit 0; }

# Stable = no prerelease suffix (no '-' in the version string).
echo "$RESP" \
  | jq -r '.versions
            | map(select(test("^[0-9]+\\.[0-9]+\\.[0-9]+$")))
            | sort_by(split(".") | map(tonumber))
            | last // ""'
