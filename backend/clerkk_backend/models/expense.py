from sqlalchemy import Column, String, Numeric, DateTime, func, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID
from clerkk_backend.core.database import Base


class Expense(Base):
    """
    Fixed monthly expenses: rent, utilities, groceries, etc.
    Updated when amounts change (rent hike, etc.)
    """

    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    category = Column(
        String(50), nullable=False
    )  # 'rent', 'utilities', 'groceries', 'transportation', 'misc'
    name = Column(String(100), nullable=False)  # e.g., "Apartment Rent", "Hydro Bill"
    amount = Column(Numeric(10, 2), nullable=False)  # Monthly amount
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
