#!/usr/bin/env bash
# Sync Anthropic skills from anthropics/skills upstream into this plugin marketplace.
#
# Pattern: upstream-tracking / vendor-fork. anthropics/skills is the source of truth
# for skill content; this plugin repo wraps each skill in plugin.json + marketplace.json
# entries. Run this to pull new commits from upstream and diff against the local copies.
#
# Usage:
#   ./scripts/sync-from-anthropic.sh                  # pull upstream + diff all tracked skills
#   ./scripts/sync-from-anthropic.sh --apply skill-creator   # actually copy upstream over local
#   ./scripts/sync-from-anthropic.sh --list                  # list skills upstream has, plugin status
#   ./scripts/sync-from-anthropic.sh --add docx              # add a new skill as a new plugin
set -euo pipefail

UPSTREAM_DIR="${UPSTREAM_DIR:-$HOME/RiderProjects/anthropics-skills}"
PLUGIN_DIR="$(cd "$(dirname "$0")/.." && pwd)"
UPSTREAM_REPO="https://github.com/anthropics/skills.git"

if [ ! -d "$UPSTREAM_DIR" ]; then
    echo "→ Klone $UPSTREAM_REPO nach $UPSTREAM_DIR"
    git clone "$UPSTREAM_REPO" "$UPSTREAM_DIR"
else
    echo "→ pull upstream"
    git -C "$UPSTREAM_DIR" pull --ff-only origin main
fi

cmd="${1:-diff}"
shift || true

case "$cmd" in
    --list|list)
        echo "skill                            upstream  local-plugin  status"
        echo "------------------------------------------------------------------"
        for s in "$UPSTREAM_DIR"/skills/*/; do
            name=$(basename "$s")
            local_skill="$PLUGIN_DIR/plugins/$name/skills/$name"
            if [ -d "$local_skill" ]; then
                if diff -rq "$s" "$local_skill" >/dev/null 2>&1; then
                    status="✓ identisch"
                else
                    status="◇ abweichend"
                fi
            else
                status="✗ fehlt"
            fi
            printf "  %-30s ✓         %-12s %s\n" "$name" "$([ -d "$local_skill" ] && echo "ja" || echo "—")" "$status"
        done
        ;;
    --apply|apply)
        name="${1:?Skill-Name angeben: --apply <skill-name>}"
        src="$UPSTREAM_DIR/skills/$name"
        dst="$PLUGIN_DIR/plugins/$name/skills/$name"
        [ -d "$src" ] || { echo "✗ Skill '$name' nicht in upstream"; exit 1; }
        [ -d "$dst" ] || { echo "✗ Plugin '$name' fehlt lokal — nutze --add stattdessen"; exit 1; }
        echo "→ rsync upstream → local (OHNE --delete: deine lokalen Extras bleiben erhalten)"
        rsync -av "$src/" "$dst/"
        echo ""
        echo "→ Dateien die NUR upstream hat (neue/umbenannte): wurden gerade angelegt"
        echo "→ Dateien die NUR du lokal hast (deine Erweiterungen): bleiben unangetastet"
        echo "→ Dateien die in beiden existieren: upstream-Version überschreibt deine (wenn du Anpassungen drin hattest, sieh git diff!)"
        echo ""
        echo "→ git diff stats:"
        git -C "$PLUGIN_DIR" diff --stat -- "plugins/$name/"
        echo ""
        echo "Wenn du Anpassungen an upstream-Files hattest, prüfe mit:"
        echo "  git -C $PLUGIN_DIR diff -- plugins/$name/"
        echo "Commit (wenn OK):"
        echo "  git -C $PLUGIN_DIR add plugins/$name/ && git commit -m \"sync: $name from anthropics/skills@$(git -C "$UPSTREAM_DIR" rev-parse --short HEAD)\""
        ;;
    --add|add)
        name="${1:?Skill-Name angeben: --add <skill-name>}"
        src="$UPSTREAM_DIR/skills/$name"
        dst_plugin="$PLUGIN_DIR/plugins/$name"
        [ -d "$src" ] || { echo "✗ Skill '$name' nicht in upstream — verfügbar: $(ls "$UPSTREAM_DIR/skills/" | tr '\n' ' ')"; exit 1; }
        [ ! -d "$dst_plugin" ] || { echo "✗ Plugin '$name' existiert schon — nutze --apply stattdessen"; exit 1; }
        echo "→ Plugin-Skeleton bauen + Skill kopieren"
        mkdir -p "$dst_plugin/skills/$name" "$dst_plugin/.claude-plugin"
        rsync -av "$src/" "$dst_plugin/skills/$name/"
        # plugin.json mit Defaults
        version="1.0.0"
        upstream_sha="$(git -C "$UPSTREAM_DIR" rev-parse --short HEAD)"
        desc=$(awk '/^description:/{sub(/^description: */,""); print; exit}' "$src/SKILL.md" | tr -d '"' | head -c 200)
        cat > "$dst_plugin/.claude-plugin/plugin.json" <<EOF
{
  "name": "$name",
  "version": "$version",
  "description": "$desc",
  "upstream": {
    "repo": "anthropics/skills",
    "path": "skills/$name",
    "sha": "$upstream_sha"
  },
  "skills": [{"path": "skills/$name"}]
}
EOF
        cat > "$dst_plugin/README.md" <<EOF
# $name

Vendored from [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/$name) at commit \`$upstream_sha\`.

Sync via \`./scripts/sync-from-anthropic.sh --apply $name\`.
EOF
        echo "→ Plugin angelegt. Marketplace-Eintrag manuell zu .claude-plugin/marketplace.json hinzufügen, dann commit."
        echo ""
        git -C "$PLUGIN_DIR" status --short -- "plugins/$name/" | head
        ;;
    --diff|diff|"")
        for s in "$UPSTREAM_DIR"/skills/*/; do
            name=$(basename "$s")
            local_skill="$PLUGIN_DIR/plugins/$name/skills/$name"
            [ -d "$local_skill" ] || continue
            if ! diff -rq "$s" "$local_skill" >/dev/null 2>&1; then
                echo "◇ $name — Abweichungen:"
                diff -rq "$s" "$local_skill" 2>&1 | sed 's/^/    /' | head -10
                echo ""
            fi
        done
        ;;
    *)
        echo "Unbekannter Befehl: $cmd"
        echo "Usage: $0 [--list | --diff | --apply <name> | --add <name>]"
        exit 1
        ;;
esac
