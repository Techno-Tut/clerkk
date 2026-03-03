from sqlalchemy import Column, String, Numeric, DateTime, func, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from clerkk_backend.core.database import Base


class ExpenseHistory(Base):
    """
    Track expense changes over time.
    Logged whenever an expense amount is updated.
    """

    __tablename__ = "expense_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    expense_id = Column(
        Integer,
        ForeignKey("expenses.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    old_amount = Column(Numeric(10, 2), nullable=False)
    new_amount = Column(Numeric(10, 2), nullable=False)
    reason = Column(String(100), nullable=True)  # "Rent increase", "Moved apartments"
    changed_at = Column(DateTime(timezone=True), server_default=func.now())
