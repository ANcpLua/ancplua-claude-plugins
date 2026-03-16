# Persistent Multi-Agent Worktree Setup

You are setting up a persistent multi-agent worktree environment for Claude and Codex.

## Requirements

- Create 6 permanent worktrees under `.worktrees/`:
  - `.worktrees/agent-collector`
  - `.worktrees/agent-generator`
  - `.worktrees/agent-schema`
  - `.worktrees/agent-investigator`
  - `.worktrees/agent-architect`
  - `.worktrees/agent-gardener`
- Branch policy: each worktree is on `worktree/<worktree-name>`.
- AGENTS is authoritative for each worktree; `CLAUDE.md` and `.codex/agent.md` mirror the read-forward policy.
- Include verification commands in infrastructure files:
  - `dotnet build`
  - `dotnet test`
- Do not modify existing repository source code.
- Idempotent: safe to run multiple times.
- Fail fast on conflicts.

## Execution rules

- Use only `bash`, `git`, and filesystem operations.
- If a worktree path exists but is not a registered worktree, abort.
- If worktree path and branch are already correct, reuse and sync files.
- Do not run model-specific tooling. This is shell/git driven.

## Architecture constraints

- Layer 1: Schema generation
  - `eng/build/SchemaGenerator.cs`
- Layer 2: Roslyn source generator
  - `src/qyl.servicedefaults.generator/`
- Layer 3: Runtime instrumentation
  - `src/qyl.servicedefaults/`
  - `src/qyl.collector/`

Layers must never be conflated.

## Agent roles

`agent-collector`

- Role: OTLP collector maintainer
- Scope: `src/qyl.collector`
- Focus: OTLP ingestion, DuckDB batching, SSE streaming lifecycle
- Rules: minimal diffs; never modify generators or schema code
- Default model: Claude Sonnet 4.6 (`high`)

`agent-generator`

- Role: Roslyn pipeline maintainer
- Scope: `src/qyl.servicedefaults.generator`
- Focus: incremental pipeline behavior, generator correctness, compile-time interception design
- Rules: preserve pipeline isolation/design; never touch `SchemaGenerator.cs` unless explicitly required
- Default model: Claude Opus 4.6 (`max`)

`agent-schema`

- Role: schema generator maintainer
- Scope: `eng/build/SchemaGenerator.cs`
- Focus: OpenAPI to C# scalar/enum generation, DuckDB DDL emission
- Rules: preserve single-source-of-truth schema pipeline
- Default model: Claude Opus 4.6 (`max`)

`agent-investigator`

- Role: cross-layer debugging agent
- Allowed scope: generator, runtime, collector
- Tasks: incident investigation, telemetry tracing, root cause analysis, cross-layer fault isolation
- Default model: Claude Opus 4.6 (`max`)

`agent-architect`

- Role: repository architecture engineer
- Tasks: cross-module cleanup, architecture improvements, multi-file changes, cross-cutting concern reduction
- Default model: Claude Opus 4.6 (`max`)

`agent-gardener`

- Role: repository gardener
- Tasks: small correctness fixes, comment cleanup, verification improvements, documentation accuracy
- Default model: Claude Sonnet 4.6 (`high`)

## Required generated files per worktree

Create/refresh:

- `AGENTS.md`
- `CLAUDE.md`
- `.codex/agent.md`

`CLAUDE.md` content:

```text
Read and follow AGENTS.md in this worktree.
```

`.codex/agent.md` content:

```text
Read and follow AGENTS.md in this worktree.
```

## Script: `scripts/setup-worktrees.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
worktrees_dir="$repo_root/.worktrees"

worktrees=(
  agent-collector
  agent-generator
  agent-schema
  agent-investigator
  agent-architect
  agent-gardener
)

role_contents_common='\
## Repository architecture constraints

Layer 1: Schema generation
- `eng/build/SchemaGenerator.cs`
- NUKE build emits models, enums, scalars, and DuckDB DDL

Layer 2: Roslyn source generator
- `src/qyl.servicedefaults.generator/`
- 7 incremental pipelines that emit compile-time interceptors

Layer 3: Runtime instrumentation
- `src/qyl.servicedefaults/`
- `src/qyl.collector/`

Layers must never be conflated.
'

get_agent_section() {
  local role=$1

  case "$role" in
    agent-collector)
      cat <<'EOF_AGENT'
## Role
- OTLP collector maintainer
- Scope: `src/qyl.collector`
- Focus: OTLP ingestion, DuckDB batching, SSE streaming lifecycle
- Rules: minimal diffs; never modify generators or schema code
- Default model: Claude Sonnet 4.6 (effort: high)
- Escalate to Opus max only for cross-layer investigation.
EOF_AGENT
      ;;
    agent-generator)
      cat <<'EOF_AGENT'
## Role
- Roslyn pipeline maintainer
- Scope: `src/qyl.servicedefaults.generator`
- Focus: incremental pipeline behavior, generator correctness, compile-time interception design
- Rules: maintain pipeline isolation; preserve incremental generator design; never touch `SchemaGenerator.cs` unless explicitly required
- Default model: Claude Opus 4.6 (effort: max)
EOF_AGENT
      ;;
    agent-schema)
      cat <<'EOF_AGENT'
## Role
- schema generator maintainer
- Scope: `eng/build/SchemaGenerator.cs`
- Focus: OpenAPI to C# scalar/enum generation and DuckDB DDL emission
- Rules: maintain single-source-of-truth schema pipeline
- Default model: Claude Opus 4.6 (effort: max)
EOF_AGENT
      ;;
    agent-investigator)
      cat <<'EOF_AGENT'
## Role
- cross-layer debugging agent
- Allowed scope: generator, runtime, collector
- Tasks: incident investigation, telemetry tracing, root cause analysis, cross-layer fault isolation
- Default model: Claude Opus 4.6 (effort: max)
EOF_AGENT
      ;;
    agent-architect)
      cat <<'EOF_AGENT'
## Role
- repository architecture engineer
- Tasks: cross-module cleanup, architecture improvements, multi-file changes, cross-cutting concern reduction
- Default model: Claude Opus 4.6 (effort: max)
EOF_AGENT
      ;;
    agent-gardener)
      cat <<'EOF_AGENT'
## Role
- repository gardener
- Tasks: small correctness fixes, comment cleanup, verification improvements, documentation accuracy
- Default model: Claude Sonnet 4.6 (effort: high)
EOF_AGENT
      ;;
    *)
      echo "Unknown role: $role" >&2
      exit 1
      ;;
  esac
}

write_common_files() {
  local path=$1
  local role=$2

  cat > "$path/AGENTS.md" <<EOF_AGENTS
# AGENTS.md for $role

${role_contents_common}

$(get_agent_section "$role")

## Required verification
- dotnet build
- dotnet test
EOF_AGENTS

  mkdir -p "$path/.codex"
  printf 'Read and follow AGENTS.md in this worktree.\n' > "$path/CLAUDE.md"
  printf 'Read and follow AGENTS.md in this worktree.\n' > "$path/.codex/agent.md"
}

is_registered_worktree() {
  local target=$1
  git worktree list --porcelain | awk -v target="$target" '
    $1 == "worktree" {path = $2}
    path == target {found = 1}
    END {exit found ? 0 : 1}
  '
}

mkdir -p "$worktrees_dir"
declare -A status

for name in "${worktrees[@]}"; do
  path="$worktrees_dir/$name"
  branch="worktree/$name"

  if [[ -e "$path" ]]; then
    if ! is_registered_worktree "$path"; then
      echo "ERROR: path exists but is not a registered worktree: $path" >&2
      exit 1
    fi

    existing_branch=$(git -C "$path" rev-parse --abbrev-ref HEAD)
    if [[ "$existing_branch" != "$branch" ]]; then
      echo "ERROR: path $path uses branch '$existing_branch', expected '$branch'" >&2
      exit 1
    fi

    write_common_files "$path" "$name"
    status["$name"]=reused
    continue
  fi

  if ! git show-ref --verify --quiet "refs/heads/$branch"; then
    git branch "$branch" HEAD
  fi

  if git worktree list --porcelain | awk -v branch="refs/heads/$branch" '
      $1 == "branch" && $2 == branch {found = 1}
      END {exit found ? 0 : 1}
    '; then
    echo "ERROR: branch '$branch' already used by another worktree" >&2
    exit 1
  fi

  git worktree add "$path" "$branch"
  write_common_files "$path" "$name"
  status["$name"]=created

done

echo "--- Worktree summary ---"
for name in "${worktrees[@]}"; do
  path="$worktrees_dir/$name"
  b=$(git -C "$path" rev-parse --abbrev-ref HEAD)
  printf "%s | %s | %s\n" "$name" "${status[$name]}" "$path"
  printf "  AGENTS.md: %s\n" "$( [[ -f \"$path/AGENTS.md\" ]] && echo exists || echo missing )"
  printf "  CLAUDE.md: %s\n" "$( [[ -f \"$path/CLAUDE.md\" ]] && echo exists || echo missing )"
  printf "  .codex/agent.md: %s\n" "$( [[ -f \"$path/.codex/agent.md\" ]] && echo exists || echo missing )"
  echo "  branch: $b"
done

printf "\nGit worktree list (worktrees only):\n"
git worktree list --porcelain | awk '$1 == "worktree" {print $2}'
