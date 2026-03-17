from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from clerkk_backend.core.database import Base


class ExchangeRateCache(Base):
    __tablename__ = "exchange_rate_cache"

    base_currency = Column(String(3), primary_key=True)
    rates = Column(JSONB, nullable=False)
    fetched_at = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
