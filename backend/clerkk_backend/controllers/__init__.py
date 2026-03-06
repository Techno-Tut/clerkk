from clerkk_backend.controllers.income import router as income_router
from clerkk_backend.controllers.expense import router as expense_router
from clerkk_backend.controllers.user import router as user_router
from clerkk_backend.controllers.dashboard import router as dashboard_router
from clerkk_backend.controllers.debt import router as debt_router
from clerkk_backend.controllers.account import router as account_router

__all__ = [
    "income_router",
    "expense_router",
    "user_router",
    "dashboard_router",
    "debt_router",
    "account_router",
]
