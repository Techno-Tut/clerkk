from sqlalchemy import Column, Numeric, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from clerkk_backend.core.database import Base


class UserIncome(Base):
    """
    Core income totals - updated monthly. Is the finaincial snapshot of the user income
    """

    __tablename__ = "user_income"

    user_id = Column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    gross_annual_estimate = Column(Numeric(12, 2), nullable=False)
    total_monthly_net = Column(Numeric(10, 2), nullable=False)
    last_updated = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
