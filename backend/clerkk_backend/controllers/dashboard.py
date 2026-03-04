from fastapi import APIRouter, Depends, Query
from dependency_injector.wiring import inject, Provide
from typing import Literal

from clerkk_backend.core.auth import get_current_user
from clerkk_backend.core.container import Container
from clerkk_backend.services.dashboard_service import DashboardService
from clerkk_backend.schemas.dashboard import DashboardResponse, DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats", response_model=DashboardResponse)
@inject
async def get_dashboard_stats(
    period: Literal["monthly", "yearly"] = Query("monthly"),
    current_user: dict = Depends(get_current_user),
    service: DashboardService = Depends(Provide[Container.dashboard_service]),
):
    """Get dashboard statistics for monthly or yearly view"""
    user_id = current_user["id"]
    region = current_user.get("region", "ON")

    stats = service.get_dashboard_stats(user_id, region, period)

    return DashboardResponse(period=period, stats=DashboardStats(**stats))
