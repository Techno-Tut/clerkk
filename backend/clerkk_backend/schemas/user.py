from pydantic import BaseModel
from datetime import datetime


class UserProfileResponse(BaseModel):
    user_id: str
    email: str
    country: str
    region: str
    onboarding_completed: bool
    created_at: str


class OnboardingCompleteResponse(BaseModel):
    message: str
    user_id: str
