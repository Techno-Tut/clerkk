from decimal import Decimal
from typing import Literal

from clerkk_backend.core.database import Database
from clerkk_backend.services.income_service import IncomeService
from clerkk_backend.services.expense_service import ExpenseService
from clerkk_backend.services.debt_service import DebtService
from clerkk_backend.utils.tax_calculator import calculate_canadian_tax
from clerkk_backend.utils.income_percentile import get_income_percentile


class DashboardService:
    """Service for dashboard calculations"""

    def __init__(
        self,
        database: Database,
        income_service: IncomeService,
        expense_service: ExpenseService,
        debt_service: DebtService,
    ):
        self.database = database
        self.income_service = income_service
        self.expense_service = expense_service
        self.debt_service = debt_service

    def get_dashboard_stats(
        self, user_id: str, region: str, period: Literal["monthly", "yearly"]
    ) -> dict:
        """Calculate dashboard statistics"""
        # Get user income
        user_income = self.income_service.get_user_income(user_id)
        if not user_income:
            return {
                "surplus": Decimal("0"),
                "income": Decimal("0"),
                "taxes": Decimal("0"),
                "expenses": Decimal("0"),
                "effective_tax_rate": Decimal("0"),
                "income_percentile": "N/A",
            }

        gross_annual = user_income.gross_annual_estimate

        # Calculate taxes
        tax_info = calculate_canadian_tax(gross_annual, region)

        # Get income percentile
        income_percentile = get_income_percentile(gross_annual)

        # Get total expenses
        total_expenses = self.expense_service.get_total_expenses(user_id)

        # Get total debt payments (in CAD)
        total_debt = self.debt_service.get_total_monthly_debt_payment(user_id)

        # Calculate based on period
        if period == "monthly":
            income = gross_annual / 12
            taxes = tax_info["monthly_tax"]
            post_tax_income = income - taxes
            expenses = total_expenses
            debt = total_debt
            surplus = post_tax_income - expenses - debt
        else:  # yearly
            income = gross_annual
            taxes = tax_info["total_tax"]
            post_tax_income = income - taxes
            expenses = total_expenses * 12
            debt = total_debt * 12
            surplus = post_tax_income - expenses - debt

        return {
            "surplus": round(surplus, 2),
            "income": round(income, 2),
            "post_tax_income": round(post_tax_income, 2),
            "income_percentile": income_percentile,
            "taxes": round(taxes, 2),
            "expenses": round(expenses, 2),
            "debt": round(debt, 2),
            "effective_tax_rate": tax_info["effective_rate"],
            "marginal_tax_rate": tax_info["marginal_rate"],
        }
