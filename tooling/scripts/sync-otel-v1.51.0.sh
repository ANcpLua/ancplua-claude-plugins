#!/usr/bin/env bash
set -euo pipefail

# sync-marketplace.sh
# Scans plugins/ directory and ensures marketplace.json is in sync.
# Detects inconsistencies and optionally updates the marketplace manifest.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
MARKETPLACE_FILE="$ROOT_DIR/.claude-plugin/marketplace.json"
PLUGINS_DIR="$ROOT_DIR/plugins"

echo "Syncing marketplace manifest with plugins directory..."
echo "Root: $ROOT_DIR"
echo ""

# Check if jq is available
if ! command -v jq >/dev/null 2>&1; then
  echo "Error: jq is required for marketplace sync."
  echo "Install with: brew install jq (macOS) or apt-get install jq (Linux)"
  exit 1
fi

# Check marketplace file exists
if [ ! -f "$MARKETPLACE_FILE" ]; then
  echo "Error: Marketplace file not found at $MARKETPLACE_FILE"
  exit 1
fi

# Check plugins directory exists
if [ ! -d "$PLUGINS_DIR" ]; then
  echo "Error: Plugins directory not found at $PLUGINS_DIR"
  exit 1
fi

# Get plugins from marketplace manifest
echo "Reading marketplace manifest..."
MARKETPLACE_PLUGINS=$(jq -r '.plugins[].name' "$MARKETPLACE_FILE" 2>/dev/null | sort)

# Get plugins from filesystem
echo "Scanning plugins directory..."
FILESYSTEM_PLUGINS=""
for plugin_dir in "$PLUGINS_DIR"/*/; do
  if [ -d "$plugin_dir" ]; then
    plugin_name=$(basename "$plugin_dir")
    plugin_json="$plugin_dir/.claude-plugin/plugin.json"
    if [ -f "$plugin_json" ]; then
      FILESYSTEM_PLUGINS="$FILESYSTEM_PLUGINS$plugin_name"$'\n'
    else
      echo "Warning: Plugin $plugin_name is missing .claude-plugin/plugin.json"
    fi
  fi
done
FILESYSTEM_PLUGINS=$(echo "$FILESYSTEM_PLUGINS" | sort | grep -v '^$' || true)

echo ""
echo "Marketplace plugins:"
while IFS= read -r line; do
  [ -n "$line" ] && echo "  - $line"
done <<< "$MARKETPLACE_PLUGINS"
echo ""
echo "Filesystem plugins:"
while IFS= read -r line; do
  [ -n "$line" ] && echo "  - $line"
done <<< "$FILESYSTEM_PLUGINS"
echo ""

# Compare
MISSING_FROM_MARKETPLACE=""
MISSING_FROM_FILESYSTEM=""

# Check for plugins in filesystem but not in marketplace
while IFS= read -r plugin; do
  if [ -n "$plugin" ] && ! echo "$MARKETPLACE_PLUGINS" | grep -q "^${plugin}$"; then
    MISSING_FROM_MARKETPLACE="$MISSING_FROM_MARKETPLACE$plugin"$'\n'
  fi
done <<< "$FILESYSTEM_PLUGINS"

# Check for plugins in marketplace but not in filesystem
while IFS= read -r plugin; do
  if [ -n "$plugin" ] && ! echo "$FILESYSTEM_PLUGINS" | grep -q "^${plugin}$"; then
    MISSING_FROM_FILESYSTEM="$MISSING_FROM_FILESYSTEM$plugin"$'\n'
  fi
done <<< "$MARKETPLACE_PLUGINS"

# Report results
HAS_ISSUES=false

if echo "$MISSING_FROM_MARKETPLACE" | grep -qv '^$'; then
  HAS_ISSUES=true
  echo "Plugins in filesystem but NOT in marketplace:"
  while IFS= read -r line; do
    [ -n "$line" ] && echo "  - $line"
  done <<< "$MISSING_FROM_MARKETPLACE"
  echo ""
fi

if echo "$MISSING_FROM_FILESYSTEM" | grep -qv '^$'; then
  HAS_ISSUES=true
  echo "Plugins in marketplace but NOT in filesystem:"
  while IFS= read -r line; do
    [ -n "$line" ] && echo "  - $line"
  done <<< "$MISSING_FROM_FILESYSTEM"
  echo ""
fi

# Check version consistency
echo "Checking version consistency..."
VERSION_ISSUES=""
while IFS= read -r plugin; do
  if [ -n "$plugin" ]; then
    plugin_json="$PLUGINS_DIR/$plugin/.claude-plugin/plugin.json"
    if [ -f "$plugin_json" ]; then
      PLUGIN_VERSION=$(jq -r '.version' "$plugin_json" 2>/dev/null)
      MARKETPLACE_VERSION=$(jq -r --arg name "$plugin" '.plugins[] | select(.name == $name) | .version' "$MARKETPLACE_FILE" 2>/dev/null)

      if [ "$PLUGIN_VERSION" != "$MARKETPLACE_VERSION" ]; then
        VERSION_ISSUES="$VERSION_ISSUES$plugin: plugin=$PLUGIN_VERSION, marketplace=$MARKETPLACE_VERSION"$'\n'
      fi
    fi
  fi
done <<< "$FILESYSTEM_PLUGINS"

if echo "$VERSION_ISSUES" | grep -qv '^$'; then
  HAS_ISSUES=true
  echo "Version mismatches:"
  while IFS= read -r line; do
    [ -n "$line" ] && echo "  $line"
  done <<< "$VERSION_ISSUES"
  echo ""
fi

# Summary
if [ "$HAS_ISSUES" = true ]; then
  echo "Sync check completed with issues."
  echo "Please update .claude-plugin/marketplace.json to match plugins directory."
  exit 1
else
  echo "Marketplace is in sync with plugins directory."
  exit 0
fi
