from fastapi import APIRouter, Depends, status
from dependency_injector.wiring import inject, Provide

from clerkk_backend.core.auth import get_current_user
from clerkk_backend.core.container import Container
from clerkk_backend.services.expense_service import ExpenseService
from clerkk_backend.schemas.expense import ExpenseCreate, ExpenseUpdate

router = APIRouter(prefix="/expenses", tags=["Expenses"])


@router.post("/", status_code=status.HTTP_201_CREATED)
@inject
async def create_expense(
    expense: ExpenseCreate,
    current_user: dict = Depends(get_current_user),
    service: ExpenseService = Depends(Provide[Container.expense_service]),
):
    """Create new expense"""
    user_id = current_user["id"]

    result = service.create_expense(
        user_id=user_id,
        category=expense.category,
        name=expense.name,
        amount=expense.amount,
    )

    return {"message": "Expense created", "expense_id": result.id}


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
