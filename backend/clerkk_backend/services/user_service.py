from sqlalchemy.orm import Session
from typing import Optional

from clerkk_backend.core.database import Database
from clerkk_backend.models.user import User


class UserService:
    """Service for user operations"""

    def __init__(self, database: Database):
        self.database = database

    def get_user_by_auth0_id(self, auth0_id: str) -> Optional[User]:
        """Get user by auth0_id"""
        with self.database.session() as db:
            return db.query(User).filter(User.auth0_id == auth0_id).first()

    def get_user_uuid(self, auth0_id: str) -> Optional[str]:
        """Get user UUID from auth0_id"""
        user = self.get_user_by_auth0_id(auth0_id)
        return str(user.id) if user else None

    def get_user_profile(self, user_id: str) -> Optional[dict]:
        """Get user profile"""
        with self.database.session() as db:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                return None

            return {
                "user_id": str(user.id),
                "email": user.email,
                "country": user.country,
                "region": user.region,
                "onboarding_completed": user.onboarding_completed,
                "created_at": user.created_at.isoformat() if user.created_at else None,
            }

    def complete_onboarding(self, user_id: str) -> User:
        """Mark user onboarding as complete"""
        with self.database.session() as db:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise ValueError("User not found")

            user.onboarding_completed = True
            db.commit()
            db.refresh(user)
            return user
