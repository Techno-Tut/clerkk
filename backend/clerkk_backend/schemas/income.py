from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from decimal import Decimal


class UserIncomeCreate(BaseModel):
    gross_annual_estimate: Decimal


class IncomeEventCreate(BaseModel):
    source_id: Optional[int] = None
    event_type: str = Field(..., pattern="^(pay|bonus|rsu|other)$")
    gross_amount: Optional[Decimal] = None
    net_amount: Decimal
    region: str = Field(..., max_length=2)
    event_date: date
    notes: Optional[str] = None
