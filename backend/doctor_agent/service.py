"""
Service layer used by the FastAPI endpoints in backend/main.py.

Wraps the static DOCTORS dataset (structured filtering, no LLM needed) and the
DoctorAvailabilityAgentOpenAI chat agent (LLM-backed, session-scoped history)
defined in chat_agent.py.
"""

from typing import Optional

from .chat_agent import DoctorAvailabilityAgentOpenAI
from .doctors_data import DOCTORS

DAYS_ORDER = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

# One agent instance per chat session, kept in memory for the life of the process.
_sessions: dict[str, DoctorAvailabilityAgentOpenAI] = {}


def get_agent(session_id: str) -> DoctorAvailabilityAgentOpenAI:
    agent = _sessions.get(session_id)
    if agent is None:
        agent = DoctorAvailabilityAgentOpenAI(DOCTORS)
        _sessions[session_id] = agent
    return agent


def reset_session(session_id: str) -> None:
    _sessions.pop(session_id, None)


def filter_doctors(
    specialty: Optional[str] = None,
    day: Optional[str] = None,
):
    results = DOCTORS
    if specialty:
        results = [d for d in results if d["specialty"].lower() == specialty.lower()]
    if day:
        results = [d for d in results if day in d["availability"]]
    return results


def get_filter_options():
    specialties = sorted({d["specialty"] for d in DOCTORS})
    days = [day for day in DAYS_ORDER if any(day in d["availability"] for d in DOCTORS)]
    return {"specialties": specialties, "days": days}
