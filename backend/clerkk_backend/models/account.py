from sqlalchemy import (
    Column,
    String,
    Numeric,
    DateTime,
    Date,
    Integer,
    Text,
    Boolean,
    ForeignKey,
    Enum as SQLEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
import enum

from clerkk_backend.core.database import Base


class AccountType(str, enum.Enum):
    CASH = "cash"
    INVESTMENT = "investment"
    RRSP = "rrsp"
    TFSA = "tfsa"


class EventType(str, enum.Enum):
    CONTRIBUTE = "contribute"
    WITHDRAW = "withdraw"
    UPDATE_BALANCE = "update_balance"


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = Column(String(100), nullable=False)
    account_type = Column(SQLEnum(AccountType), nullable=False)
    purpose = Column(Text, nullable=True)
    goal_amount = Column(Numeric(12, 2), nullable=True)
    goal_date = Column(Date, nullable=True)
    annual_contribution_limit = Column(Numeric(12, 2), nullable=True)
    limit_year = Column(Integer, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True, server_default="true")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


class AccountLedger(Base):
    __tablename__ = "account_ledger"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id = Column(
        UUID(as_uuid=True),
        ForeignKey("user_accounts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    event_type = Column(SQLEnum(EventType), nullable=False)
    amount = Column(Numeric(12, 2), nullable=True)
    balance_snapshot = Column(Numeric(12, 2), nullable=False)
    source = Column(String(100), nullable=True)
    event_date = Column(DateTime(timezone=True), nullable=False, index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
