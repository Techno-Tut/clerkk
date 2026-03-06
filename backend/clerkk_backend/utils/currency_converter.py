import requests
from decimal import Decimal
from functools import lru_cache
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

EXCHANGE_API_URL = "https://open.er-api.com/v6/latest/CAD"


@lru_cache(maxsize=1)
def get_exchange_rates(timestamp: int) -> dict:
    """
    Fetch exchange rates from CAD base.
    Cached for 1 hour using timestamp as cache key.
    """
    try:
        response = requests.get(EXCHANGE_API_URL, timeout=5)
        response.raise_for_status()
        data = response.json()
        return data["rates"]
    except Exception as e:
        logger.error(f"Failed to fetch exchange rates: {e}")
        # Fallback rates if API fails
        return {"CAD": 1, "USD": 0.73, "INR": 67.5, "EUR": 0.68}


def get_current_rates() -> dict:
    """Get rates cached for current hour"""
    current_hour = datetime.now().replace(minute=0, second=0, microsecond=0)
    return get_exchange_rates(int(current_hour.timestamp()))


def convert_to_cad(amount: Decimal, from_currency: str) -> Decimal:
    """
    Convert amount from any currency to CAD.

    Args:
        amount: Amount in source currency
        from_currency: Source currency code (e.g., 'INR', 'USD')

    Returns:
        Amount in CAD
    """
    if from_currency == "CAD":
        return amount

    rates = get_current_rates()

    if from_currency not in rates:
        logger.warning(f"Currency {from_currency} not found, using 1:1 rate")
        return amount

    # API gives rates FROM CAD, so 1 CAD = X INR
    # To convert INR to CAD: amount_cad = amount_inr / rate
    rate = Decimal(str(rates[from_currency]))
    return amount / rate
