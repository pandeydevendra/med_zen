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
v1.add_api_route(
    "/auth/hospital/login", views.hospital_login, methods=["POST"], response_model=views.TokenResponse
)
v1.add_api_route("/auth/ops/login", views.ops_login, methods=["POST"], response_model=views.TokenResponse)
v1.add_api_route(
    "/ops/hospitals", views.create_hospital, methods=["POST"], response_model=views.CreateHospitalResponse
)
v1.add_api_route("/doctors", views.list_doctors, methods=["GET"])
v1.add_api_route("/doctors/filters", views.doctor_filters, methods=["GET"])
v1.add_api_route("/agent/ask", views.ask_agent, methods=["POST"], response_model=views.AskResponse)
v1.add_api_route("/agent/reset", views.reset_agent, methods=["POST"])

# tse_ops — hospital onboarding. Login is the same POST /v1/auth/login above.
v1.add_api_route(
    "/tse-ops/hospitals", views.onboard_hospital, methods=["POST"], response_model=views.HospitalSummary
)
v1.add_api_route("/tse-ops/hospitals", views.tse_ops_hospitals, methods=["GET"])

router.include_router(v1)
