from sqlalchemy import (
    Column,
    String,
    Numeric,
    DateTime,
    func,
    ForeignKey,
    Integer,
    Boolean,
)
from sqlalchemy.dialects.postgresql import UUID
from clerkk_backend.core.database import Base


class IncomeSource(Base):
    """
    Individual income sources (job, side gig, etc.)
    """

    __tablename__ = "income_sources"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    source_name = Column(String(100), nullable=False)
    gross_annual_estimate = Column(Numeric(12, 2), nullable=True)
    monthly_net = Column(Numeric(10, 2), nullable=False)
    pay_frequency = Column(
        String(20), nullable=False, default="monthly"
    )  # 'weekly', 'biweekly', 'monthly'
    is_active = Column(Boolean, default=True)
    added_at = Column(DateTime(timezone=True), server_default=func.now())
