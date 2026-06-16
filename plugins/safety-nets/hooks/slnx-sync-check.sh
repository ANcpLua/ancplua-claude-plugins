#!/bin/bash
# slnx-sync-check — Stop hook.
# Fires once per turn. If the project has a .slnx solution file but one or more
# .csproj on disk (excluding bin/obj) are NOT registered in it, it blocks once and
# lists the missing projects. No-op when there is no .slnx (non-.NET / no-solution
# repos), when every .csproj is already registered, or when the repo is an
# upstream/VMR-synced fork (e.g. dotnet/aspnetcore) whose .slnx is curated upstream
# with deliberate exclusions — see the skip block below. Opt out per-repo with a
# .slnx-sync-ignore file. Deterministic — no LLM.
# Enforces the CLAUDE.md "Register new projects in the solution yourself" rule.
input=$(cat)
py() { printf '%s' "$input" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('$1',''))" 2>/dev/null; }
stop_active=$(py stop_hook_active)
# nudge at most once per turn (a prior block sets stop_hook_active=true)
[ "$stop_active" = "True" ] && exit 0

root="${CLAUDE_PROJECT_DIR:-$PWD}"
[ -n "$root" ] || exit 0

# --- Skip upstream / VMR-synced forks: their .slnx is curated upstream with
# deliberate exclusions (e.g. dotnet/aspnetcore omits *InvalidSignature host
# fixtures, internal & packaging projects, runtime-shared tests). This hook
# enforces "register YOUR new projects"; it must not flag projects upstream
# intentionally leaves out, and adding them would diverge a VMR fork. ---
[ -f "$root/.slnx-sync-ignore" ] && exit 0            # explicit per-repo opt-out
if git -C "$root" log -100 --format='%an|%s' 2>/dev/null \
     | grep -qiE 'dotnet-maestro|Source code updates from dotnet/dotnet'; then
  exit 0                                              # VMR codeflow in history
fi
git -C "$root" remote get-url upstream 2>/dev/null \
  | grep -qiE 'github\.com[:/]+dotnet/' && exit 0     # dotnet/* upstream remote

python3 - "$root" <<'PY'
import sys, os, glob, re, json, subprocess

root = sys.argv[1]

# nearest .slnx: shallow search under root (depth 0..2), prefer the one closest to root
candidates = []
for depth in range(0, 3):
    candidates += glob.glob(os.path.join(root, *(["*"] * depth), "*.slnx"))
candidates = [p for p in candidates if "/bin/" not in p and "/obj/" not in p]
if not candidates:
    sys.exit(0)  # no .slnx -> no-op (not a .slnx-based solution)
slnx = min(candidates, key=lambda p: p.count(os.sep))
soln_dir = os.path.dirname(slnx)

try:
    text = open(slnx, encoding="utf-8").read()
except Exception:
    sys.exit(0)

registered = {m.replace("\\", "/") for m in re.findall(r'Path="([^"]+)"', text)}

# Git-ignored directories (vendored sample repos, scratch trees, etc.) are not
# "our" projects to register. Resolve the set of wholly-ignored dirs once, up
# front (`--directory` collapses each to its top dir so we never descend). Empty
# set if soln_dir isn't a git repo — the nested-solution guard below still applies.
ignored_dirs = set()
try:
    out = subprocess.run(
        ["git", "-C", soln_dir, "ls-files", "-oi", "--exclude-standard", "--directory"],
        capture_output=True, text=True, timeout=10,
    ).stdout
    ignored_dirs = {
        os.path.normpath(os.path.join(soln_dir, p)) for p in out.split("\n") if p.strip()
    }
except (OSError, subprocess.SubprocessError):
    # Only tolerate the expected best-effort failures: git absent / not on PATH
    # (OSError/FileNotFoundError) or the 10s timeout firing (TimeoutExpired).
    # Anything else (e.g. a bug in this block) propagates loudly. The nested-
    # solution guard below still covers vendored repos & fixtures without git.
    pass

missing = []
for dirpath, dirnames, filenames in os.walk(soln_dir):
    dirnames[:] = [
        d for d in dirnames
        if d not in ("bin", "obj")
        and os.path.normpath(os.path.join(dirpath, d)) not in ignored_dirs
    ]
    # Skip `dotnet new` template content: a dir holding a .template.config is a
    # template root whose placeholder-named .csproj must NOT be in the solution.
    if ".template.config" in dirnames:
        dirnames[:] = []
        continue
    # Skip nested independent solutions: any dir BELOW the solution dir that holds
    # its own .sln/.slnx is a separate solution root — a vendored sample repo or an
    # isolated test fixture (e.g. DependencyInspector TestAssets, including a
    # deliberately-circular one). Its .csproj belong to THAT solution, not this one.
    if dirpath != soln_dir and any(fn.endswith((".sln", ".slnx")) for fn in filenames):
        dirnames[:] = []
        continue
    for f in filenames:
        if f.endswith(".csproj"):
            rel = os.path.relpath(os.path.join(dirpath, f), soln_dir).replace("\\", "/")
            if rel not in registered:
                missing.append(rel)

if not missing:
    sys.exit(0)

reason = (
    "slnx-sync: these .csproj are on disk but NOT registered in %s:\n%s\n"
    "Add a <Project Path=\"...\"/> entry for each (paths relative to the .slnx; do NOT "
    "duplicate ones already present), then finish. (Fires once.)"
) % (os.path.relpath(slnx, root), "\n".join("  - " + m for m in sorted(missing)))

print(json.dumps({"decision": "block", "reason": reason}))
PY
