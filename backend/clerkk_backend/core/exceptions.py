class BusinessRuleError(Exception):
    """Raised when business rules are violated"""

    pass


class UserNotFoundError(BusinessRuleError):
    """Raised when user does not exist"""

    pass
