from fastapi import APIRouter, Depends, status, HTTPException
from dependency_injector.wiring import inject, Provide

from clerkk_backend.core.auth import get_current_user
from clerkk_backend.core.container import Container
from clerkk_backend.services.user_service import UserService
from clerkk_backend.schemas.user import UserProfileResponse, OnboardingCompleteResponse

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/me", status_code=status.HTTP_200_OK, response_model=UserProfileResponse)
@inject
async def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends(Provide[Container.user_service]),
):
    """Get current user profile"""
    user_id = current_user["id"]
    profile = service.get_user_profile(user_id)

    if not profile:
        raise HTTPException(status_code=404, detail="User not found")

    return profile


@router.post(
    "/complete-onboarding",
    status_code=status.HTTP_200_OK,
    response_model=OnboardingCompleteResponse,
)
@inject
async def complete_onboarding(
    current_user: dict = Depends(get_current_user),
    service: UserService = Depends(Provide[Container.user_service]),
):
    """Mark onboarding as complete"""
    user_id = current_user["id"]

    try:
        user = service.complete_onboarding(user_id)
        return {"message": "Onboarding completed", "user_id": str(user.id)}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
