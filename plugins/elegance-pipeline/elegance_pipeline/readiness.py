"""Workflow gating: which agent slots are ready to run right now.

The pipeline is a strict relay. Each stage unlocks only once every slot in
the previous stage has submitted:

    scouts -> judges -> planner -> verifier -> (signal) -> implementer
"""
from __future__ import annotations

from typing import List

from models import JUDGE_COUNT, SCOUT_COUNT, WorkflowState

SCOUT_SLOTS = [f"scout-{index}" for index in range(1, SCOUT_COUNT + 1)]
JUDGE_SLOTS = [f"judge-{index}" for index in range(1, JUDGE_COUNT + 1)]


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
