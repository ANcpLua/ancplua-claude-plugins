#!/usr/bin/env bash
set -euo pipefail

# example-script.sh
# Template script. Replace this content with your actual script.
#
# Usage: ./scripts/example-script.sh [args]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "Example script running from: $PLUGIN_DIR"

# Add your script logic here

echo "Done."
