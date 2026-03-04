from fastapi import APIRouter, Depends, status
from dependency_injector.wiring import inject, Provide
from typing import List, Union

from clerkk_backend.core.auth import get_current_user
from clerkk_backend.core.container import Container
from clerkk_backend.services.expense_service import ExpenseService
from clerkk_backend.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
    ExpenseResponse,
)

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=Union[ExpenseResponse, List[ExpenseResponse]],
)
@inject
async def create_expense(
    expenses: Union[ExpenseCreate, List[ExpenseCreate]],
    current_user: dict = Depends(get_current_user),
    service: ExpenseService = Depends(Provide[Container.expense_service]),
):
    """Create expense(s) - accepts single object or array"""
    user_id = current_user["id"]

    # Handle single expense
    if isinstance(expenses, ExpenseCreate):
        result = service.create_expense(
            user_id=user_id,
            category=expenses.category,
            name=expenses.name,
            amount=expenses.amount,
        )
        return ExpenseResponse(
            id=result.id,
            user_id=str(result.user_id),
            category=result.category,
            name=result.name,
            amount=result.amount,
            created_at=result.created_at,
            updated_at=result.updated_at,
        )

    # Handle multiple expenses - batch insert
    results = service.create_expenses_batch(user_id=user_id, expenses=expenses)
    return [
        ExpenseResponse(
            id=r.id,
            user_id=str(r.user_id),
            category=r.category,
            name=r.name,
            amount=r.amount,
            created_at=r.created_at,
            updated_at=r.updated_at,
        )
        for r in results
    ]


@router.put("/{expense_id}", status_code=status.HTTP_200_OK)
@inject
async def update_expense(
    expense_id: int,
    expense: ExpenseUpdate,
    current_user: dict = Depends(get_current_user),
    service: ExpenseService = Depends(Provide[Container.expense_service]),
):
    """Update expense amount"""
    user_id = current_user["id"]

    result = service.update_expense(
        expense_id=expense_id,
        user_id=user_id,
        new_amount=expense.amount,
        reason=expense.reason,
    )

    return {"message": "Expense updated", "expense_id": result.id}


@router.get("/total", status_code=status.HTTP_200_OK)
@inject
async def get_total_expenses(
    current_user: dict = Depends(get_current_user),
    service: ExpenseService = Depends(Provide[Container.expense_service]),
):
    """Get total monthly expenses"""
    user_id = current_user["id"]
    total = service.get_total_expenses(user_id)

    return {"total_expenses": total}
