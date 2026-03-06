from datetime import datetime
from decimal import Decimal
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from clerkk_backend.models.account import (
    UserAccount,
    AccountLedger,
    EventType,
    AccountType,
)
from clerkk_backend.schemas.account import (
    AccountCreate,
    AccountUpdate,
    AccountResponse,
    LedgerEventCreate,
    LedgerEventResponse,
    AccountWithHistory,
)


class AccountService:
    def __init__(self, database):
        self.database = database

    def create_account(
        self, user_id: str, account_data: AccountCreate
    ) -> AccountResponse:
        with self.database.session() as session:
            # Create account
            account = UserAccount(
                user_id=user_id,
                name=account_data.name,
                account_type=account_data.account_type,
                purpose=account_data.purpose,
                goal_amount=account_data.goal_amount,
                goal_date=account_data.goal_date,
                annual_contribution_limit=account_data.annual_contribution_limit,
                limit_year=account_data.limit_year,
            )
            session.add(account)
            session.flush()

            # Create initial ledger entry
            initial_entry = AccountLedger(
                account_id=account.id,
                event_type=EventType.UPDATE_BALANCE,
                amount=None,
                balance_snapshot=account_data.initial_balance,
                event_date=datetime.now(),
                notes="Initial balance",
            )
            session.add(initial_entry)
            session.commit()

            contributions_this_year, remaining_room = (
                self._calculate_contribution_stats(session, account)
            )
            return self._to_account_response(
                account,
                account_data.initial_balance,
                contributions_this_year,
                remaining_room,
            )

    def get_user_accounts(self, user_id: str) -> list[AccountResponse]:
        with self.database.session() as session:
            accounts = (
                session.query(UserAccount)
                .filter(UserAccount.user_id == user_id, UserAccount.is_active == True)
                .all()
            )
            return [
                self._get_account_with_balance(session, account) for account in accounts
            ]

    def get_account(self, account_id: str, user_id: str) -> Optional[AccountResponse]:
        with self.database.session() as session:
            account = (
                session.query(UserAccount)
                .filter(UserAccount.id == account_id, UserAccount.user_id == user_id)
                .first()
            )
            if not account:
                return None
            return self._get_account_with_balance(session, account)

    def update_account(
        self, account_id: str, user_id: str, update_data: AccountUpdate
    ) -> Optional[AccountResponse]:
        with self.database.session() as session:
            account = (
                session.query(UserAccount)
                .filter(UserAccount.id == account_id, UserAccount.user_id == user_id)
                .first()
            )
            if not account:
                return None

            for field, value in update_data.model_dump(exclude_unset=True).items():
                setattr(account, field, value)

            session.commit()
            return self._get_account_with_balance(session, account)

    def add_ledger_event(
        self, account_id: str, user_id: str, event_data: LedgerEventCreate
    ) -> Optional[LedgerEventResponse]:
        with self.database.session() as session:
            account = (
                session.query(UserAccount)
                .filter(UserAccount.id == account_id, UserAccount.user_id == user_id)
                .first()
            )
            if not account:
                return None

            # Get current balance
            current_balance = self._get_current_balance(session, account_id)

            # Calculate new balance
            if event_data.event_type == EventType.UPDATE_BALANCE:
                new_balance = event_data.balance_snapshot
            elif event_data.event_type == EventType.CONTRIBUTE:
                new_balance = current_balance + event_data.amount
            elif event_data.event_type == EventType.WITHDRAW:
                new_balance = current_balance - event_data.amount
            else:
                raise ValueError(f"Unknown event type: {event_data.event_type}")

            # Create ledger entry
            entry = AccountLedger(
                account_id=account_id,
                event_type=event_data.event_type,
                amount=event_data.amount,
                balance_snapshot=new_balance,
                source=event_data.source,
                event_date=event_data.event_date or datetime.now(),
                notes=event_data.notes,
            )
            session.add(entry)
            session.commit()

            return self._to_ledger_response(entry)

    def delete_account(self, account_id: str, user_id: str) -> bool:
        """Soft delete account by setting is_active=False"""
        with self.database.session() as session:
            account = (
                session.query(UserAccount)
                .filter(UserAccount.id == account_id, UserAccount.user_id == user_id)
                .first()
            )
            if not account:
                return False

            account.is_active = False
            session.commit()
            return True

    def get_account_history(
        self, account_id: str, user_id: str
    ) -> Optional[AccountWithHistory]:
        with self.database.session() as session:
            account = (
                session.query(UserAccount)
                .filter(UserAccount.id == account_id, UserAccount.user_id == user_id)
                .first()
            )
            if not account:
                return None

            history = (
                session.query(AccountLedger)
                .filter(AccountLedger.account_id == account_id)
                .order_by(AccountLedger.event_date.desc())
                .all()
            )

            account_response = self._get_account_with_balance(session, account)
            history_response = [self._to_ledger_response(entry) for entry in history]

            # Calculate remaining contribution room
            remaining_room = None
            if (
                account.account_type in [AccountType.RRSP, AccountType.TFSA]
                and account.annual_contribution_limit
            ):
                remaining_room = self._calculate_remaining_room(session, account)

            return AccountWithHistory(
                account=account_response,
                history=history_response,
                remaining_contribution_room=remaining_room,
            )

    def _get_current_balance(self, session: Session, account_id: str) -> Decimal:
        latest_entry = (
            session.query(AccountLedger)
            .filter(AccountLedger.account_id == account_id)
            .order_by(AccountLedger.event_date.desc())
            .first()
        )
        return latest_entry.balance_snapshot if latest_entry else Decimal("0")

    def _calculate_remaining_room(
        self, session: Session, account: UserAccount
    ) -> Decimal:
        if not account.annual_contribution_limit or not account.limit_year:
            return Decimal("0")

        # Sum contributions for the limit year
        contributed = (
            session.query(func.sum(AccountLedger.amount))
            .filter(
                AccountLedger.account_id == account.id,
                AccountLedger.event_type == EventType.CONTRIBUTE,
                extract("year", AccountLedger.event_date) == account.limit_year,
            )
            .scalar()
        ) or Decimal("0")

        return account.annual_contribution_limit - contributed

    def _calculate_contribution_stats(
        self, session: Session, account: UserAccount
    ) -> tuple[Decimal | None, Decimal | None]:
        """Calculate contributions_this_year and remaining_room for TFSA/RRSP accounts"""
        if (
            account.account_type not in [AccountType.RRSP, AccountType.TFSA]
            or not account.annual_contribution_limit
            or not account.limit_year
        ):
            return None, None

        contributions_this_year = (
            session.query(func.sum(AccountLedger.amount))
            .filter(
                AccountLedger.account_id == account.id,
                AccountLedger.event_type == EventType.CONTRIBUTE,
                extract("year", AccountLedger.event_date) == account.limit_year,
            )
            .scalar()
        ) or Decimal("0")

        remaining_room = account.annual_contribution_limit - contributions_this_year
        return contributions_this_year, remaining_room

    def _get_account_with_balance(
        self, session: Session, account: UserAccount
    ) -> AccountResponse:
        current_balance = self._get_current_balance(session, account.id)
        contributions_this_year, remaining_room = self._calculate_contribution_stats(
            session, account
        )
        return self._to_account_response(
            account, current_balance, contributions_this_year, remaining_room
        )

    def _to_account_response(
        self,
        account: UserAccount,
        current_balance: Decimal,
        contributions_this_year: Optional[Decimal] = None,
        remaining_room: Optional[Decimal] = None,
    ) -> AccountResponse:
        return AccountResponse(
            id=str(account.id),
            name=account.name,
            account_type=account.account_type,
            current_balance=current_balance,
            purpose=account.purpose,
            goal_amount=account.goal_amount,
            goal_date=account.goal_date,
            annual_contribution_limit=account.annual_contribution_limit,
            limit_year=account.limit_year,
            contributions_this_year=contributions_this_year,
            remaining_contribution_room=remaining_room,
            created_at=account.created_at,
        )

    def _to_ledger_response(self, entry: AccountLedger) -> LedgerEventResponse:
        return LedgerEventResponse(
            id=str(entry.id),
            event_type=entry.event_type,
            amount=entry.amount,
            balance_snapshot=entry.balance_snapshot,
            source=entry.source,
            event_date=entry.event_date,
            notes=entry.notes,
            created_at=entry.created_at,
        )
