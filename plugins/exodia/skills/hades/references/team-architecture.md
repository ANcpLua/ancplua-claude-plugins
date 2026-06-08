# Hades Team Architecture

```text
HADES (Lead — Delegate Mode — Opus 4.8)
│
├─ INIT: Generate Smart ID, create deletion permit, init ledger
│        Smart-target: detect frontend files in scope → auto-equip goggles
│        Smart-target: detect public-API surface → auto-equip guillotine
│        If guillotine equipped: init break-manifest
│
├─ Phase 0: AUDIT (4 Auditors + 3 Goggles + 1 Guillotine if equipped) — see templates/
│  ├── smart-audit-suppressions
│  ├── smart-audit-deadcode
│  ├── smart-audit-duplication
│  ├── smart-audit-imports
│  │   ↕ debate via messaging ↕
│  │
│  ├── [GOGGLES] smart-goggles-taste       ← aesthetic direction judge
│  ├── [GOGGLES] smart-goggles-spec        ← measurable quality judge
│  ├── [GOGGLES] smart-goggles-compliance  ← implementation rules judge
│  │   ↕ pipeline: taste → spec → compliance ↕
│  │   ↕ cross-message with standard auditors ↕
│  │
│  └── [GUILLOTINE] smart-guillotine-audit ← public API contract judge (KEEP/DOWNGRADE/BREAK)
│  │   ↕ cross-message with smart-audit-deadcode + smart-audit-suppressions ↕
│  └── GATE 0 -> PROCEED | HALT | SCAN_COMPLETE
│
├─ Phase 1: ELIMINATION (4 Eliminators + design fixes + 1 Guillotine if equipped) — see templates/
│  ├── smart-elim-suppressions
│  ├── smart-elim-deadcode
│  ├── smart-elim-duplication
│  ├── smart-elim-imports
│  │   ↕ coordinate via messaging ↕
│  │   ↕ log every deletion to ledger ↕
│  │   ↕ goggles findings become elimination tasks ↕
│  │
│  └── [GUILLOTINE] smart-guillotine-elim  ← deletes/downgrades + emits break-manifest entries
│  │   ↕ also writes deletion ledger entries via "break-public-api" action ↕
│  └── GATE 1 -> PROCEED | HALT
│
└─ Phase 2: VERIFICATION (4 Verifiers + goggles re-check + 1 Guillotine if equipped) — see templates/
   ├── smart-verify-build
   ├── smart-verify-tests
   ├── smart-verify-grep     ← also verifies goggles violations resolved
   ├── smart-verify-challenger
   │
   └── [GUILLOTINE] smart-guillotine-verify ← two-axis: shim-free + functionally equivalent
       ↕ challenge each other's claims ↕
       ↕ verify ledger completeness ↕
       ↕ verify break-manifest completeness + validity ↕
   └── GATE 2 -> COMPLETE | ITERATE (back to Phase 1)
```

**Concurrency:** 4 teammates per phase (+3 goggles in Phase 0 when equipped, +1 guillotine per phase when equipped). Shut down before spawning next phase.
**File ownership:** Each teammate owns disjoint files. Lead resolves conflicts.
**Task sizing:** 5-6 tasks per teammate. No kanban overflow.
**Smart targeting:**
  - Goggles: scope contains .tsx/.jsx/.css/.html/.svelte/.vue files.
  - Guillotine: scope contains `PublicAPI.Shipped.txt`, an `<IsPackable>true</IsPackable>` csproj, or any path under `packages/`.
**Model:** All teammates spawn as Opus 4.8 (`model: opus`).

## Smart Infrastructure layout

```text
.smart/                          <- gitignored, session-local
├── delete-ledger.jsonl          <- append-only deletion audit log (JSONL)
├── delete-permit.json           <- active deletion permit (TTL-based)
└── break-manifest.jsonl         <- public-API break manifest (JSONL, --guillotine)

${CLAUDE_PLUGIN_ROOT}/scripts/smart/    <- checked-in tooling
├── smart-id.sh                  <- SMART-YYYY-MM-DD-<timestamp><random>
├── ledger.sh                    <- init | append | query | count
├── permit.sh                    <- create | validate | revoke | show
├── break-manifest.sh            <- init | append | query | count | validate (--guillotine)
└── hookify-rules/
    ├── hookify.smart-hades-delete-guard.local.md   <- blocks raw rm/git rm
    └── hookify.smart-hades-stop-guard.local.md     <- opt-in completion guard
```

## Smart Target auto-detection (STEP 0b)

After building `$FILE_LIST` from the diff, the lead runs this detection to auto-equip
goggles and the guillotine:

```bash
# Check if scope contains frontend files
FRONTEND_FILES=$(echo "$FILE_LIST" | grep -cE '\.(tsx|jsx|css|html|svelte|vue)$')
if [ "$FRONTEND_FILES" -gt 0 ] || [ "${3-}" = "--goggles" ] || [ "${4-}" = "--goggles" ]; then
  GOGGLES=true   # Equip the Pink Glasses
fi

# Check if scope crosses a public-API surface
PUBLIC_API_SHIPPED=$(echo "$FILE_LIST" | grep -c 'PublicAPI\.Shipped\.txt')
PACKABLE_CSPROJ=0
while IFS= read -r csproj; do
  [ -z "$csproj" ] && continue
  if grep -qE '<IsPackable>true</IsPackable>|<PackageId>' "$csproj" 2>/dev/null; then
    PACKABLE_CSPROJ=$((PACKABLE_CSPROJ + 1))
  fi
done < <(echo "$FILE_LIST" | grep -E '\.csproj$')
PACKAGES_PATHS=$(echo "$FILE_LIST" | grep -c '^packages/')
if [ "$PUBLIC_API_SHIPPED" -gt 0 ] || [ "$PACKABLE_CSPROJ" -gt 0 ] \
   || [ "$PACKAGES_PATHS" -gt 0 ] \
   || [ "${3-}" = "--guillotine" ] || [ "${4-}" = "--guillotine" ]; then
  GUILLOTINE=true   # Equip the Guillotine
  ${CLAUDE_PLUGIN_ROOT}/scripts/smart/break-manifest.sh init
fi
```

- `$3`/`$4` = `--goggles` OR frontend files in scope → equip goggles.
- `$3`/`$4` = `--guillotine` OR public-API surface (PublicAPI.Shipped.txt, packable csproj, or `packages/`) → equip the Guillotine and init the break manifest.

Hades is smart enough to know when he needs his glasses — and his guillotine.

---

**Smart ID format:** `SMART-YYYY-MM-DD-<10-digit-epoch><20-char-random>`
**Ledger entry:** `{"ts","smart_id","action","path","reason","agent","git_sha"}`
**Permit:** `{"smart_id","created_at","expires_at","ttl","expires_epoch","paths","status"}`
**Break manifest entry (--guillotine):** `{"ts","smart_id","agent","removed_symbol_id","replacement_symbol_id","consumer_call_sites_before","consumer_call_sites_after","removed_tests","removal_justification","git_sha"}`
