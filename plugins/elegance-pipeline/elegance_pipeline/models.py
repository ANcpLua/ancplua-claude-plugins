"""Data model for the elegance pipeline workflow.

Plain dataclasses plus the factory that seeds a fresh workflow:
4 scouts -> 2 judges -> 1 planner -> 1 verifier -> 1 gated implementer.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Optional

SCOUT_COUNT = 4
JUDGE_COUNT = 2


@dataclass
class AgentRecord:
    role: str
    slot: str
    status: str = "pending"
    scope: Optional[str] = None
    output_file: Optional[str] = None
    submitted_at: Optional[str] = None


@dataclass
class WorkflowConfig:
    project_anchor: str
    scopes: List[str]
    project_root: str


@dataclass
class WorkflowState:
    implementation_signal: bool = False
    verifier_signal_source: Optional[str] = None
    agents: Dict[str, AgentRecord] = field(default_factory=dict)


def normalize_scopes(scopes: List[str]) -> List[str]:
    """Trim blanks, require at least one scope, pad up to SCOUT_COUNT."""
    cleaned = [scope.strip() for scope in scopes if scope.strip()]
    if not cleaned:
        raise SystemExit("At least one scope is required")
    padding = [cleaned[-1]] * (SCOUT_COUNT - len(cleaned))
    return (cleaned + padding)[:SCOUT_COUNT]


def build_fresh_state(cfg: WorkflowConfig) -> WorkflowState:
    """Seed every pipeline slot in its initial pending state."""
    agents: Dict[str, AgentRecord] = {}
    for index in range(1, SCOUT_COUNT + 1):
        slot = f"scout-{index}"
        scope = cfg.scopes[index - 1] if index - 1 < len(cfg.scopes) else None
        agents[slot] = AgentRecord(role="scout", slot=slot, scope=scope)
    for index in range(1, JUDGE_COUNT + 1):
        slot = f"judge-{index}"
        agents[slot] = AgentRecord(role="judge", slot=slot)
    for role in ("planner", "verifier", "implementer"):
        slot = f"{role}-1"
        agents[slot] = AgentRecord(role=role, slot=slot)
    return WorkflowState(agents=agents)
