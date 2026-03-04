from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime
from decimal import Decimal
from typing import Optional

from clerkk_backend.core.database import Database
from clerkk_backend.models.user_income import UserIncome
from clerkk_backend.models.income_event import IncomeEvent


class IncomeService:
    """Service layer for income operations"""

    def __init__(self, database: Database):
        self.database = database

    def get_user_income(self, user_id: str) -> Optional[UserIncome]:
        """Get user income profile"""
        with self.database.session() as db:
            return db.query(UserIncome).filter(UserIncome.user_id == user_id).first()

    def create_user_income(self, user_id: str, gross_annual: Decimal) -> UserIncome:
        """Create initial income setup"""
        with self.database.session() as db:
            user_income = UserIncome(
                user_id=user_id,
                gross_annual_estimate=gross_annual,
                total_monthly_net=Decimal("0.00"),
            )
            db.add(user_income)
            db.commit()
            db.refresh(user_income)
            return user_income

    def log_income(
        self,
        user_id: str,
        event_type: str,
        net_amount: Decimal,
        region: str,
        event_date,
        **kwargs,
    ) -> IncomeEvent:
        """Log income event and update monthly total"""
        with self.database.session() as db:
            event = IncomeEvent(
                user_id=user_id,
                event_type=event_type,
                net_amount=net_amount,
                region=region,
                event_date=event_date,
                **kwargs,
            )
            db.add(event)

            # Atomic increment at database level (prevents race conditions)
            db.query(UserIncome).filter(UserIncome.user_id == user_id).update(
                {"total_monthly_net": UserIncome.total_monthly_net + net_amount}
            )

            db.commit()
            db.refresh(event)
            return event

    def _update_monthly_total(self, db: Session, user_id: str):
        """Recalculate total_monthly_net from current month's events"""
        now = datetime.now()

        total = db.query(func.sum(IncomeEvent.net_amount)).filter(
            IncomeEvent.user_id == user_id,
            extract("month", IncomeEvent.event_date) == now.month,
            extract("year", IncomeEvent.event_date) == now.year,
        ).scalar() or Decimal("0.00")

        user_income = db.query(UserIncome).filter(UserIncome.user_id == user_id).first()
        if user_income:
            user_income.total_monthly_net = total
