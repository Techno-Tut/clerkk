"""User permissions enum"""

from enum import Enum


class Permission(str, Enum):
    """User permission levels"""

    ADMIN = "admin"
    USER = "user"


def has_permission(permissions: list, required: Permission) -> bool:
    """Check if user has required permission"""
    return required.value in permissions
