from sqlalchemy import (
    Column,
    String,
    Numeric,
    Integer,
    Date,
    Boolean,
    Text,
    TIMESTAMP,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from clerkk_backend.core.database import Base
import uuid


class UserDebt(Base):
    __tablename__ = "user_debts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    # Basic info (always required)
    name = Column(String(100), nullable=False)
    type = Column(
        String(20), nullable=False
    )  # 'mortgage', 'loan', 'credit_card', 'line_of_credit'
    currency = Column(String(3), nullable=False, default="CAD")  # ISO 4217
    monthly_payment = Column(Numeric(10, 2), nullable=False)
    current_balance = Column(Numeric(12, 2), nullable=False)
    interest_rate = Column(Numeric(5, 2), nullable=False)

    # Optional amortization details
    original_principal = Column(Numeric(12, 2), nullable=True)
    term_months = Column(Integer, nullable=True)
    start_date = Column(Date, nullable=True)
    payment_frequency = Column(String(20), nullable=False, default="monthly")

    # Metadata
    is_active = Column(Boolean, nullable=False, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP, nullable=False, server_default=func.now())
    updated_at = Column(
        TIMESTAMP, nullable=False, server_default=func.now(), onupdate=func.now()
    )
