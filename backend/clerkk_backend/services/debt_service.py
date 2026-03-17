from sqlalchemy.orm import Session
from typing import List
from decimal import Decimal
from clerkk_backend.core.database import Database
from clerkk_backend.models.debt import UserDebt
from clerkk_backend.schemas.debt import DebtCreate, DebtUpdate, DebtResponse
from clerkk_backend.core.enums import Currency


class DebtService:
    def __init__(self, database: Database, currency_service=None):
        self.database = database
        self.currency_service = currency_service

    def create_debt(self, user_id: str, debt_data: DebtCreate) -> DebtResponse:
        """Create a new debt for user"""
        with self.database.session() as session:
            debt = UserDebt(
                user_id=user_id,
                name=debt_data.name,
                type=debt_data.type.value,
                currency=debt_data.currency,
                monthly_payment=debt_data.monthly_payment,
                current_balance=debt_data.current_balance,
                interest_rate=debt_data.interest_rate,
                original_principal=debt_data.original_principal,
                term_months=debt_data.term_months,
                start_date=debt_data.start_date,
                notes=debt_data.notes,
            )
            session.add(debt)
            session.commit()
            session.refresh(debt)

            return self._to_response(debt)

    def update_debt(
        self, user_id: str, debt_id: str, debt_data: DebtUpdate
    ) -> DebtResponse:
        """Update a debt"""
        with self.database.session() as session:
            debt = (
                session.query(UserDebt)
                .filter(UserDebt.id == debt_id, UserDebt.user_id == user_id)
                .first()
            )

            if not debt:
                raise ValueError("Debt not found")

            # Update fields (only if provided)
            if debt_data.name is not None:
                debt.name = debt_data.name
            if debt_data.monthly_payment is not None:
                debt.monthly_payment = debt_data.monthly_payment
            if debt_data.current_balance is not None:
                debt.current_balance = debt_data.current_balance
            if debt_data.interest_rate is not None:
                debt.interest_rate = debt_data.interest_rate
            if debt_data.original_principal is not None:
                debt.original_principal = debt_data.original_principal
            if debt_data.term_months is not None:
                debt.term_months = debt_data.term_months
            if debt_data.start_date is not None:
                debt.start_date = debt_data.start_date
            if debt_data.notes is not None:
                debt.notes = debt_data.notes
            if debt_data.is_active is not None:
                debt.is_active = debt_data.is_active

            session.commit()
            session.refresh(debt)

            return self._to_response(debt)

    def get_user_debts(
        self, user_id: str, display_currency: str = None
    ) -> List[DebtResponse]:
        """Get all active debts for user, optionally converted to display_currency"""
        with self.database.session() as session:
            debts = (
                session.query(UserDebt)
                .filter(UserDebt.user_id == user_id, UserDebt.is_active == True)
                .all()
            )

            if display_currency:
                for debt in debts:
                    session.expunge(debt)
                converted_debts = [
                    self._convert_debt_currency(debt, display_currency)
                    for debt in debts
                ]
                return [self._to_response(debt) for debt in converted_debts]

            return [self._to_response(debt) for debt in debts]

    def _convert_debt_currency(self, debt: UserDebt, target_currency: str) -> UserDebt:
        """Convert debt amounts to target currency"""
        if debt.currency == target_currency:
            return debt

        rate = self.currency_service.get_rate(debt.currency, target_currency)

        debt.monthly_payment = round(debt.monthly_payment * rate, 2)
        debt.current_balance = round(debt.current_balance * rate, 2)
        debt.original_principal = (
            round(debt.original_principal * rate, 2)
            if debt.original_principal
            else None
        )
        debt.currency = target_currency
        return debt

    def get_total_monthly_debt_payment(self, user_id: str) -> Decimal:
        """Get total monthly debt payments in CAD (all currencies converted)"""
        with self.database.session() as session:
            debts = (
                session.query(UserDebt)
                .filter(UserDebt.user_id == user_id, UserDebt.is_active == True)
                .all()
            )

            total_cad = Decimal("0")
            for debt in debts:
                rate = self.currency_service.get_rate(debt.currency, Currency.CAD)
                total_cad += debt.monthly_payment * rate

            return total_cad

    def _to_response(self, debt: UserDebt) -> DebtResponse:
        """Convert model to response schema"""
        return DebtResponse(
            id=str(debt.id),
            name=debt.name,
            type=debt.type,
            currency=debt.currency,
            monthly_payment=str(debt.monthly_payment),
            current_balance=str(debt.current_balance),
            interest_rate=str(debt.interest_rate),
            original_principal=(
                str(debt.original_principal) if debt.original_principal else None
            ),
            term_months=debt.term_months,
            start_date=debt.start_date.isoformat() if debt.start_date else None,
            is_active=debt.is_active,
            notes=debt.notes,
        )
