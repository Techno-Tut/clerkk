import requests
from decimal import Decimal
from datetime import datetime, timezone, timedelta
import logging

from clerkk_backend.core.database import Database
from clerkk_backend.models.exchange_rate import ExchangeRateCache

logger = logging.getLogger(__name__)

EXCHANGE_API_URL = "https://open.er-api.com/v6/latest"
CACHE_TTL = timedelta(hours=24)


class CurrencyService:
    def __init__(self, database: Database):
        self.database = database

    def _fetch_from_api(self, base: str) -> dict | None:
        try:
            response = requests.get(f"{EXCHANGE_API_URL}/{base}", timeout=5)
            response.raise_for_status()
            return response.json()["rates"]
        except Exception as e:
            logger.error(f"Failed to fetch exchange rates for {base}: {e}")
            return None

    def _get_cached_rates(self, base: str) -> dict:
        with self.database.session() as session:
            cache = (
                session.query(ExchangeRateCache).filter_by(base_currency=base).first()
            )
            now = datetime.now(timezone.utc)

            if (
                cache
                and (now - cache.fetched_at.replace(tzinfo=timezone.utc)) < CACHE_TTL
            ):
                return cache.rates

            rates = self._fetch_from_api(base)
            if rates:
                if cache:
                    cache.rates = rates
                    cache.fetched_at = now
                else:
                    session.add(
                        ExchangeRateCache(
                            base_currency=base, rates=rates, fetched_at=now
                        )
                    )
                session.commit()
                return rates

            if cache:
                logger.warning(f"Using stale cached rates for {base}")
                return cache.rates

            raise RuntimeError(f"No exchange rates available for {base}")

    def get_rate(self, source: str, target: str) -> Decimal:
        """Get conversion rate: 1 source = X target"""
        if source == target:
            return Decimal("1")

        rates = self._get_cached_rates(source)

        if target not in rates:
            raise ValueError(f"Unsupported currency: {target}")

        return Decimal(str(rates[target]))
