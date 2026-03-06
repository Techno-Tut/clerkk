from pydantic import BaseModel, Field
from datetime import datetime, date
from decimal import Decimal
from typing import Optional
from clerkk_backend.models.account import AccountType, EventType


class AccountCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    account_type: AccountType
    initial_balance: Decimal = Field(..., ge=0)
    purpose: Optional[str] = None
    goal_amount: Optional[Decimal] = Field(None, ge=0)
    goal_date: Optional[date] = None
    annual_contribution_limit: Optional[Decimal] = Field(None, ge=0)
    limit_year: Optional[int] = None


class AccountUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    purpose: Optional[str] = None
    goal_amount: Optional[Decimal] = Field(None, ge=0)
    goal_date: Optional[date] = None
    annual_contribution_limit: Optional[Decimal] = Field(None, ge=0)
    limit_year: Optional[int] = None


class AccountResponse(BaseModel):
    id: str
    name: str
    account_type: AccountType
    current_balance: Decimal
    purpose: Optional[str]
    goal_amount: Optional[Decimal]
    goal_date: Optional[date]
    annual_contribution_limit: Optional[Decimal]
    limit_year: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True


class LedgerEventCreate(BaseModel):
    event_type: EventType
    amount: Optional[Decimal] = Field(None, ge=0)
    balance_snapshot: Optional[Decimal] = Field(None, ge=0)
    source: Optional[str] = Field(None, max_length=100)
    event_date: Optional[datetime] = None
    notes: Optional[str] = None


class LedgerEventResponse(BaseModel):
    id: str
    event_type: EventType
    amount: Optional[Decimal]
    balance_snapshot: Decimal
    source: Optional[str]
    event_date: datetime
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AccountWithHistory(BaseModel):
    account: AccountResponse
    history: list[LedgerEventResponse]
    remaining_contribution_room: Optional[Decimal] = None
