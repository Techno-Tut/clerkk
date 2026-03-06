from pydantic import BaseModel, Field
from decimal import Decimal
from datetime import date
from typing import Optional
from enum import Enum


class DebtType(str, Enum):
    MORTGAGE = "mortgage"
    LOAN = "loan"
    CREDIT_CARD = "credit_card"
    LINE_OF_CREDIT = "line_of_credit"


class DebtCreate(BaseModel):
    # Required
    name: str = Field(
        ..., max_length=100, description="Debt name (e.g., 'TD Mortgage')"
    )
    type: DebtType
    monthly_payment: Decimal = Field(..., gt=0, decimal_places=2)
    current_balance: Decimal = Field(..., ge=0, decimal_places=2)
    interest_rate: Decimal = Field(
        ..., ge=0, le=100, decimal_places=2, description="Annual rate (e.g., 3.5)"
    )

    # Optional - for amortization insights
    currency: str = Field(default="CAD", max_length=3)
    original_principal: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    term_months: Optional[int] = Field(None, gt=0)
    start_date: Optional[date] = None
    notes: Optional[str] = None


class DebtUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    monthly_payment: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    current_balance: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    interest_rate: Optional[Decimal] = Field(None, ge=0, le=100, decimal_places=2)
    original_principal: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    term_months: Optional[int] = Field(None, gt=0)
    start_date: Optional[date] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class DebtResponse(BaseModel):
    id: str
    name: str
    type: str
    currency: str
    monthly_payment: str
    current_balance: str
    interest_rate: str

    # Optional amortization fields
    original_principal: Optional[str] = None
    term_months: Optional[int] = None
    start_date: Optional[str] = None

    is_active: bool
    notes: Optional[str] = None

    class Config:
        from_attributes = True
