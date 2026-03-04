from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class UserProfileResponse(BaseModel):
    user_id: str
    email: Optional[str] = None  # MVP: nullable
    country: str
    region: str
    onboarding_completed: bool
    created_at: str


class OnboardingCompleteResponse(BaseModel):
    message: str
    user_id: str
