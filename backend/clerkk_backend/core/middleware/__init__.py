"""
Middleware package for InBriefs API

Contains all HTTP middleware components:
- Request ID middleware
- CORS middleware (future)
- Rate limiting middleware (future)
- Authentication middleware (future)
"""

from .request_id import RequestIDMiddleware
from .auth import AuthMiddleware

__all__ = ["RequestIDMiddleware", "AuthMiddleware"]
