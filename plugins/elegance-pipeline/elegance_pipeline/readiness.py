"""Workflow gating: which agent slots are ready to run right now.

The pipeline is a strict relay. Each stage unlocks only once every slot in
the previous stage has submitted:

    scouts -> judges -> planner -> verifier -> (signal) -> implementer
"""
from __future__ import annotations

from typing import List

from models import JUDGE_SLOTS, SCOUT_SLOTS, WorkflowState

STAGES = [SCOUT_SLOTS, JUDGE_SLOTS, ["planner-1"], ["verifier-1"], ["implementer-1"]]


def _status(state: WorkflowState, slot: str) -> str:
    return state.agents[slot].status


def _pending(state: WorkflowState, slots: List[str]) -> List[str]:
    return [slot for slot in slots if _status(state, slot) == "pending"]


def _all_submitted(state: WorkflowState, slots: List[str]) -> bool:
    return all(_status(state, slot) == "submitted" for slot in slots)


def ready_agents(state: WorkflowState) -> List[str]:
    ready = _pending(state, SCOUT_SLOTS)
    if _all_submitted(state, SCOUT_SLOTS):
        ready += _pending(state, JUDGE_SLOTS)
    if _all_submitted(state, JUDGE_SLOTS):
        ready += _pending(state, ["planner-1"])
    if _all_submitted(state, ["planner-1"]):
        ready += _pending(state, ["verifier-1"])
    if state.implementation_signal:
        ready += _pending(state, ["implementer-1"])
    return ready


def downstream_submitted(state: WorkflowState, slot: str) -> bool:
    """True once any slot in a stage after ``slot``'s stage has submitted.

    Lets ``submit`` reject re-submitting a slot whose downstream work has
    already advanced, which would otherwise silently invalidate later stages
    or flip an already-open gate shut.
    """
    for index, slots in enumerate(STAGES):
        if slot in slots:
            later = [s for stage in STAGES[index + 1:] for s in stage]
            return any(state.agents[s].status == "submitted" for s in later)
    return False
