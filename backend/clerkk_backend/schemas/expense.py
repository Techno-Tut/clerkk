from pydantic import BaseModel
from decimal import Decimal
from typing import Optional


class ExpenseCreate(BaseModel):
    category: str
    name: str
    amount: Decimal


class ExpenseUpdate(BaseModel):
    amount: Decimal
    reason: Optional[str] = None
