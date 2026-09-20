"""
API endpoints, served under /api. Versioned endpoints are under /api/v1 — add
a new router with a /v2 prefix when making a breaking change to the API.
"""

from fastapi import APIRouter

import views

router = APIRouter(prefix="/api")
router.add_api_route("/healthceck", views.healthceck, methods=["GET"])

v1 = APIRouter(prefix="/v1")
v1.add_api_route("/menu", views.menu, methods=["GET"])
v1.add_api_route("/auth/login", views.login, methods=["POST"], response_model=views.LoginResponse)
v1.add_api_route("/doctors", views.list_doctors, methods=["GET"])
v1.add_api_route("/doctors/filters", views.doctor_filters, methods=["GET"])
v1.add_api_route("/agent/ask", views.ask_agent, methods=["POST"], response_model=views.AskResponse)
v1.add_api_route("/agent/reset", views.reset_agent, methods=["POST"])

router.include_router(v1)
