from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from clerkk_backend.schemas.debt import DebtCreate, DebtUpdate, DebtResponse
from clerkk_backend.services.debt_service import DebtService
from clerkk_backend.core.auth import get_current_user
from clerkk_backend.core.container import Container
from dependency_injector.wiring import inject, Provide

router = APIRouter(prefix="/debts", tags=["debts"])


@router.post("/", response_model=DebtResponse, status_code=201)
@inject
async def create_debt(
    debt: DebtCreate,
    current_user: dict = Depends(get_current_user),
    service: DebtService = Depends(Provide[Container.debt_service]),
):
    """Create a new debt"""
    user_id = current_user["id"]
    return service.create_debt(user_id, debt)


@router.get("/", response_model=List[DebtResponse])
@inject
async def get_debts(
    display_currency: Optional[str] = Query(
        None, description="Convert all amounts to this currency"
    ),
    current_user: dict = Depends(get_current_user),
    service: DebtService = Depends(Provide[Container.debt_service]),
):
    """Get all active debts for user"""
    user_id = current_user["id"]
    return service.get_user_debts(user_id, display_currency)


@router.put("/{debt_id}", response_model=DebtResponse)
@inject
async def update_debt(
    debt_id: str,
    debt: DebtUpdate,
    current_user: dict = Depends(get_current_user),
    service: DebtService = Depends(Provide[Container.debt_service]),
):
    """Update a debt"""
    user_id = current_user["id"]
    return service.update_debt(user_id, debt_id, debt)


@router.get("/total", response_model=dict)
@inject
async def get_total_debt(
    current_user: dict = Depends(get_current_user),
    service: DebtService = Depends(Provide[Container.debt_service]),
):
    """Get total monthly debt payments in CAD"""
    user_id = current_user["id"]
    total = service.get_total_monthly_debt_payment(user_id)
    return {"total_monthly_payment_cad": str(total)}
