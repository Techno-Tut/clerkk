from pydantic import BaseModel
from decimal import Decimal
from typing import Literal


class DashboardStats(BaseModel):
    surplus: Decimal
    income: Decimal
    post_tax_income: Decimal
    taxes: Decimal
    expenses: Decimal
    effective_tax_rate: Decimal
    marginal_tax_rate: Decimal
    income_percentile: str


class DashboardResponse(BaseModel):
    period: Literal["monthly", "yearly"]
    stats: DashboardStats
