"""
API endpoints. Everything here is served under /api/v1 — bump the prefix
(e.g. /api/v2) when making a breaking change to the API.
"""

from fastapi import APIRouter

import views

router = APIRouter(prefix="/api/v1")

router.add_api_route("/menu", views.menu, methods=["GET"])
router.add_api_route("/auth/login", views.login, methods=["POST"], response_model=views.LoginResponse)
router.add_api_route("/doctors", views.list_doctors, methods=["GET"])
router.add_api_route("/doctors/filters", views.doctor_filters, methods=["GET"])
router.add_api_route("/agent/ask", views.ask_agent, methods=["POST"], response_model=views.AskResponse)
router.add_api_route("/agent/reset", views.reset_agent, methods=["POST"])
