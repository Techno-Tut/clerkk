from fastapi import APIRouter, Depends, status
from dependency_injector.wiring import inject, Provide

from clerkk_backend.core.auth import get_current_user
from clerkk_backend.core.container import Container
from clerkk_backend.services.income_service import IncomeService
from clerkk_backend.schemas.income import UserIncomeCreate, IncomeEventCreate

router = APIRouter(prefix="/income", tags=["Income"])


@router.post("/", status_code=status.HTTP_201_CREATED)
@inject
async def create_income(
    income: UserIncomeCreate,
    current_user: dict = Depends(get_current_user),
    service: IncomeService = Depends(Provide[Container.income_service]),
):
    """Create user income profile (onboarding)"""
    user_id = current_user["id"]  # Middleware sets this from JWT 'sub' claim

    result = service.create_user_income(
        user_id=user_id, gross_annual=income.gross_annual_estimate
    )

    return {"message": "Income created", "user_id": str(result.user_id)}


@router.post("/events", status_code=status.HTTP_201_CREATED)
@inject
async def log_income_event(
    event: IncomeEventCreate,
    current_user: dict = Depends(get_current_user),
    service: IncomeService = Depends(Provide[Container.income_service]),
):
    """Log income event (paycheck, bonus, etc.)"""
    user_id = current_user["id"]  # Middleware sets this from JWT 'sub' claim

    result = service.log_income(
        user_id=user_id,
        event_type=event.event_type,
        net_amount=event.net_amount,
        region=event.region,
        event_date=event.event_date,
        source_id=event.source_id,
        gross_amount=event.gross_amount,
        notes=event.notes,
    )

    return {"message": "Income logged", "event_id": result.id}
