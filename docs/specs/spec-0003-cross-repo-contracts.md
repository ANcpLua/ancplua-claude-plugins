---
status: accepted
contact: "Alexander Nachtmann"
date: "2025-11-25"
deciders: "Alexander Nachtmann"
consulted: "ancplua-mcp CLAUDE.md, Claude Code docs"
informed: "Contributors to both repositories, Claude sessions working on either repo"
---

# spec-0003: Cross-Repository Contract Coordination

## Feature name

Cross-repo contract coordination between ancplua-claude-plugins (Type A) and ancplua-mcp (Type T).

## 1. Goal of this feature

Establish and maintain stable contracts between:

- **ancplua-claude-plugins** (Type A - Application layer: Skills, workflows, decisions)
- **ancplua-mcp** (Type T - Technology layer: MCP tools, infrastructure)

### Success metric

1. Skills in ancplua-claude-plugins can reliably call MCP tools from ancplua-mcp
2. Spec/ADR ID ranges do not conflict
3. Breaking changes are coordinated with documentation in BOTH repos
4. Claude sessions in either repo understand their boundaries

### Outcome (implementation-free description)

- Clear separation of concerns: Type A decides "what to do", Type T provides "how to do it"
- No orphaned tool references (skills don't call tools that don't exist)
- No ID collisions between repos
- Documented contracts that both repos can reference

## 2. Problem being solved

### Current difficulties without this feature

- Spec IDs could collide (both repos using 0001, 0002, etc.)
- Skills might reference MCP tools by name without verification
- Breaking changes to tools could silently break skills
- No single source of truth for cross-repo coordination

### Pain points

- "Which repo owns spec-0001?" ambiguity
- Skills calling `CiTools.RunDotnetTest` with no guarantee it exists
- Tool signature changes breaking skills without notice

### System complexity issues

Two independent repos must behave as a coordinated system. Without explicit contracts:

- Claude sessions can't know if cross-repo changes are safe
- Refactors in one repo can break the other silently

## 3. API and structure changes

### 3.1 Spec ID Range Allocation (THE LAW)

| Range | Owner Repository | Description |
|-------|------------------|-------------|
| `spec-0001` to `spec-0099` | `ancplua-claude-plugins` | Plugin, skill, and workflow specs |
| `spec-0100` to `spec-0199` | `ancplua-mcp` | MCP tool and infrastructure specs |
| `spec-0200` and above | Cross-repo | Contracts involving both repos |

### 3.2 ADR ID Range Allocation (THE LAW)

| Range | Owner Repository | Description |
|-------|------------------|-------------|
| `ADR-0001` to `ADR-0099` | `ancplua-claude-plugins` | Plugin architecture decisions |
| `ADR-0100` to `ADR-0199` | `ancplua-mcp` | Infrastructure architecture decisions |
| `ADR-0200` and above | Cross-repo | Joint architectural decisions |

### 3.3 Type A / Type T Boundaries

**Type A (ancplua-claude-plugins) MUST:**

- Define Skills that encode workflows and decisions
- Reference MCP tools by documented contract names
- NOT implement tool logic (that belongs in Type T)

**Type T (ancplua-mcp) MUST:**

- Implement MCP tools with stable names and signatures
- Document all tools in `docs/tool-contracts.md`
- NOT define business logic or workflow decisions

### 3.4 Tool Reference Contract

When a skill references an MCP tool:

```markdown
<!-- In a skill -->
1. Run local tests
   - MCP Tool: `ancplua-workstation.CiTools.RunDotnetTest`
   - Input: `{ path: string, filter?: string }`
   - Expected: `TestResult { passed, failed, skipped, success }`
```

The tool MUST exist in ancplua-mcp with matching signature.

### 3.5 Breaking Change Protocol

For ANY change that affects cross-repo contracts:

1. **Create ADR** in the originating repo (ADR-01XX or ADR-00XX)
2. **Create companion ADR** in the other repo referencing the change
3. **Update CHANGELOG** in BOTH repos
4. **Coordinate deployment** - both repos must be updated together

## 4. E2E code and usage samples

### Example 1: Skill referencing MCP tool

In `ancplua-claude-plugins/plugins/autonomous-ci/skills/autonomous-ci/SKILL.md`:

```markdown
## Local Verification

Use the MCP tool to run tests:

- Tool: `ancplua-workstation.CiTools.RunDotnetTest`
- Contract: spec-0102 in ancplua-mcp
```

In `ancplua-mcp/docs/tool-contracts.md`:

```markdown
### CiTools.RunDotnetTest

- **Spec:** spec-0102-workstation-tools
- **Input:** `{ path: string, filter?: string }`
- **Output:** `TestResult { passed: int, failed: int, skipped: int, success: bool }`
```

### Example 2: Verifying cross-repo compliance

```bash
# In ancplua-claude-plugins - find tool references
grep -r "MCP Tool\|ancplua-workstation" plugins/

# In ancplua-mcp - verify tools exist
grep -r "McpServerTool" src/*/Tools/
```

### Example 3: Checking spec ID ranges

```bash
# ancplua-claude-plugins - should have spec-00XX only
ls docs/specs/spec-0[0-9][0-9][0-9]-*.md

# ancplua-mcp - should have spec-01XX only
ls docs/specs/spec-01[0-9][0-9]-*.md
```

## 5. Maintenance rules for Claude

### For Claude in ancplua-claude-plugins

1. **Before referencing MCP tools:**
   - Verify tool exists in ancplua-mcp
   - Document the tool reference with expected contract
   - Add to CHANGELOG if new integration

2. **When allocating spec/ADR IDs:**
   - Use 0001-0099 range ONLY
   - Check for existing IDs before allocating

3. **When breaking changes affect ancplua-mcp:**
   - Create ADR in this repo
   - Note in CHANGELOG that ancplua-mcp must also be updated

### For Claude in ancplua-mcp

1. **When changing tool signatures:**
   - Update `docs/tool-contracts.md`
   - Check if any skill in ancplua-claude-plugins references this tool
   - Create ADR if breaking change

2. **When allocating spec/ADR IDs:**
   - Use 0100-0199 range ONLY
   - Update to 4-digit padded format (spec-0101, not spec-001)

3. **When tools are consumed by skills:**
   - Document the contract in tool-contracts.md
   - Reference the consuming skill for traceability

### Cross-repo coordination checklist

Before claiming cross-repo work complete:

- [ ] Spec IDs follow THE LAW range allocation
- [ ] ADR IDs follow THE LAW range allocation
- [ ] Tool references in skills match actual tools in ancplua-mcp
- [ ] CHANGELOG updated in BOTH repos if cross-repo change
- [ ] No orphaned tool references
- [ ] No duplicate IDs within or across repos

## 6. Known violations requiring remediation

### ancplua-mcp spec ID violations (as of 2025-11-25)

The following files use wrong ID range (should be 01XX):

| Current | Should Be |
|---------|-----------|
| `spec-001-mcp-protocol.md` | `spec-0101-mcp-protocol.md` |
| `spec-002-csharp-14-features.md` | `spec-0102-csharp-14-features.md` |
| `spec-002-workstation-tools.md` | `spec-0103-workstation-tools.md` |
| `spec-004-api-integration-implementation.md` | `spec-0104-api-integration.md` |
| `spec-005-debug-mcp-tools.md` | `spec-0105-debug-mcp-tools.md` |
| `spec-github-apps-integration.md` | `spec-0106-github-apps-integration.md` |
| `spec-whispermesh-protocol.md` | `spec-0107-whispermesh-protocol.md` |

### ancplua-mcp ADR ID violations (as of 2025-11-25)

| Current | Should Be |
|---------|-----------|
| `adr-001-dotnet-version.md` | `ADR-0101-dotnet-version.md` |
| `adr-001-instruction-based-tools.md` | `ADR-0102-instruction-based-tools.md` |
| `adr-002-docker-registry-submission.md` | `ADR-0103-docker-registry.md` |
| `adr-002-dual-server-architecture.md` | `ADR-0104-dual-server-architecture.md` |
| `adr-003-debug-mcp-tools.md` | `ADR-0105-debug-mcp-tools.md` |

### Missing in ancplua-mcp

- `docs/tool-contracts.md` - Required by CLAUDE.md but does not exist

---

**This spec is the canonical reference for cross-repo coordination. Both repos MUST reference this document.**
