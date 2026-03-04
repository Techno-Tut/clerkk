from pydantic import BaseModel
from decimal import Decimal
from typing import Optional, List
from datetime import datetime


class ExpenseCreate(BaseModel):
    category: str
    name: str
    amount: Decimal


class ExpenseUpdate(BaseModel):
    amount: Decimal
    reason: Optional[str] = None


class ExpenseResponse(BaseModel):
    id: int
    user_id: str
    category: str
    name: str
    amount: Decimal
    created_at: datetime
    updated_at: Optional[datetime] = None
