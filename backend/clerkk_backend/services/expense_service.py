from sqlalchemy import func
from decimal import Decimal
from typing import List

from clerkk_backend.core.database import Database
from clerkk_backend.models.expense import Expense
from clerkk_backend.models.expense_history import ExpenseHistory
from clerkk_backend.schemas.expense import ExpenseCreate


class ExpenseService:
    """Service for expense operations"""

    def __init__(self, database: Database):
        self.database = database

    def create_expense(
        self, user_id: str, category: str, name: str, amount: Decimal
    ) -> Expense:
        """Create new expense"""
        with self.database.session() as db:
            expense = Expense(
                user_id=user_id, category=category, name=name, amount=amount
            )
            db.add(expense)
            db.commit()
            db.refresh(expense)
            return expense

    def create_expenses_batch(
        self, user_id: str, expenses: List[ExpenseCreate]
    ) -> List[Expense]:
        """Create multiple expenses in one transaction"""
        with self.database.session() as db:
            expense_objects = [
                Expense(
                    user_id=user_id,
                    category=exp.category,
                    name=exp.name,
                    amount=exp.amount,
                )
                for exp in expenses
            ]
            db.add_all(expense_objects)
            db.commit()
            for exp in expense_objects:
                db.refresh(exp)
            return expense_objects

    def update_expense(
        self, expense_id: int, user_id: str, new_amount: Decimal, reason: str = None
    ) -> Expense:
        """Update expense amount and log to history"""
        with self.database.session() as db:
            expense = (
                db.query(Expense)
                .filter(Expense.id == expense_id, Expense.user_id == user_id)
                .first()
            )

            if not expense:
                raise ValueError("Expense not found")

            # Log to history
            history = ExpenseHistory(
                expense_id=expense_id,
                old_amount=expense.amount,
                new_amount=new_amount,
                reason=reason,
            )
            db.add(history)

            # Update expense
            expense.amount = new_amount

            db.commit()
            db.refresh(expense)
            return expense

    def get_total_expenses(self, user_id: str) -> Decimal:
        """Get sum of all expenses"""
        with self.database.session() as db:
            total = (
                db.query(func.sum(Expense.amount))
                .filter(Expense.user_id == user_id)
                .scalar()
            )
            return total or Decimal("0.00")
