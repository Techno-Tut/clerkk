from decimal import Decimal
from typing import Dict

# Canadian income percentile thresholds (2024 data)
# Source: Statistics Canada High Income Canadians Report (2024-10-28)
# Note: These are individual income thresholds (all ages), updated annually

INCOME_PERCENTILES = [
    (Decimal("283200"), "Top 1%"),  # Top 1%
    (Decimal("200000"), "Top 2%"),  # Top 2% (estimated)
    (Decimal("150000"), "Top 5%"),  # Top 5%
    (Decimal("110000"), "Top 10%"),  # Top 10%
    (Decimal("80000"), "Top 20%"),  # Top 20%
    (Decimal("60000"), "Top 30%"),  # Top 30%
    (Decimal("50000"), "Top 40%"),  # Top 40%
    (Decimal("40000"), "Top 50%"),  # Top 50% (median)
]


def get_income_percentile(annual_income: Decimal) -> str:
    """
    Get income percentile ranking for Canadian individual income

    Args:
        annual_income: Gross annual income

    Returns:
        String like "Top 5%" or "Top 50%"

    Note: Based on 2024 Statistics Canada data (all ages combined).
          Should be updated annually when new data releases.
    """
    for threshold, percentile in INCOME_PERCENTILES:
        if annual_income >= threshold:
            return percentile

    # Below median
    return "Below median"
