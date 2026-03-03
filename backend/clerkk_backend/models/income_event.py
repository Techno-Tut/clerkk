from sqlalchemy import (
    Column,
    String,
    Numeric,
    DateTime,
    func,
    ForeignKey,
    Integer,
    Date,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from clerkk_backend.core.database import Base


class IncomeEvent(Base):
    """
    All cash income events: weekly pay, monthly salary, bonuses, one-offs.
    Logs gross/net for tax nudges, net for surplus calc.
    One row per pay period or surprise cash.
    """

    __tablename__ = "income_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_id = Column(
        Integer, ForeignKey("income_sources.id", ondelete="SET NULL"), nullable=True
    )
    event_type = Column(String(50), nullable=False)  # 'pay', 'bonus', 'rsu', 'other'
    gross_amount = Column(Numeric(10, 2), nullable=True)
    net_amount = Column(Numeric(10, 2), nullable=False)
    region = Column(String(2), nullable=False)  # Province/State at time of event
    event_date = Column(Date, nullable=False, index=True)
    notes = Column(Text, nullable=True)
    logged_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
