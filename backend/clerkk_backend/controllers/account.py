from fastapi import APIRouter, Depends, HTTPException
from dependency_injector.wiring import inject, Provide

from clerkk_backend.core.container import Container
from clerkk_backend.core.auth import get_current_user
from clerkk_backend.services.account_service import AccountService
from clerkk_backend.schemas.account import (
    AccountCreate,
    AccountUpdate,
    AccountResponse,
    LedgerEventCreate,
    LedgerEventResponse,
    AccountWithHistory,
)

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.post("/", response_model=AccountResponse, status_code=201)
@inject
async def create_account(
    account: AccountCreate,
    current_user: dict = Depends(get_current_user),
    service: AccountService = Depends(Provide[Container.account_service]),
):
    return service.create_account(current_user["id"], account)


@router.get("/", response_model=list[AccountResponse])
@inject
async def get_accounts(
    current_user: dict = Depends(get_current_user),
    service: AccountService = Depends(Provide[Container.account_service]),
):
    return service.get_user_accounts(current_user["id"])


@router.get("/{account_id}", response_model=AccountResponse)
@inject
async def get_account(
    account_id: str,
    current_user: dict = Depends(get_current_user),
    service: AccountService = Depends(Provide[Container.account_service]),
):
    account = service.get_account(account_id, current_user["id"])
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.put("/{account_id}", response_model=AccountResponse)
@inject
async def update_account(
    account_id: str,
    update_data: AccountUpdate,
    current_user: dict = Depends(get_current_user),
    service: AccountService = Depends(Provide[Container.account_service]),
):
    account = service.update_account(account_id, current_user["id"], update_data)
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.post(
    "/{account_id}/events", response_model=LedgerEventResponse, status_code=201
)
@inject
async def add_ledger_event(
    account_id: str,
    event: LedgerEventCreate,
    current_user: dict = Depends(get_current_user),
    service: AccountService = Depends(Provide[Container.account_service]),
):
    result = service.add_ledger_event(account_id, current_user["id"], event)
    if not result:
        raise HTTPException(status_code=404, detail="Account not found")
    return result


@router.delete("/{account_id}", status_code=204)
@inject
async def delete_account(
    account_id: str,
    current_user: dict = Depends(get_current_user),
    service: AccountService = Depends(Provide[Container.account_service]),
):
    success = service.delete_account(account_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=404, detail="Account not found")


@router.get("/{account_id}/history", response_model=AccountWithHistory)
@inject
async def get_account_history(
    account_id: str,
    current_user: dict = Depends(get_current_user),
    service: AccountService = Depends(Provide[Container.account_service]),
):
    result = service.get_account_history(account_id, current_user["id"])
    if not result:
        raise HTTPException(status_code=404, detail="Account not found")
    return result
