from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from decimal import Decimal
from clerkk_backend.core.enums import IncomeEventType


class UserIncomeCreate(BaseModel):
    gross_annual_estimate: Decimal


class IncomeEventCreate(BaseModel):
    source_id: Optional[int] = None
    event_type: IncomeEventType
    gross_amount: Optional[Decimal] = None
    net_amount: Decimal
    region: str = Field(..., max_length=2)
    event_date: date
    notes: Optional[str] = None
