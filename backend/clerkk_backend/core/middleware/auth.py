from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from clerkk_backend.core.auth import verify_jwt_token
from clerkk_backend.core.logging import request_id_context
from clerkk_backend.services.user_service import UserService
import logging

logger = logging.getLogger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    """Centralized JWT authentication middleware"""

    # Endpoints that don't require authentication
    EXCLUDED_PATHS = {"/docs", "/redoc", "/openapi.json", "/health"}

    def __init__(self, app, user_service: UserService):
        super().__init__(app)
        self.user_service = user_service

    async def dispatch(self, request: Request, call_next):
        # Skip auth for excluded paths
        if request.url.path in self.EXCLUDED_PATHS:
            return await call_next(request)

        # Skip auth for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)

        try:
            # Extract token from Authorization header
            authorization = request.headers.get("Authorization")
            if not authorization:
                return JSONResponse(
                    status_code=401,
                    content={
                        "message": "Authorization header missing",
                        "code": "UNAUTHORIZED",
                    },
                )

            if not authorization.startswith("Bearer "):
                return JSONResponse(
                    status_code=401,
                    content={
                        "message": "Invalid authorization header format",
                        "code": "UNAUTHORIZED",
                    },
                )

            token = authorization.split(" ")[1]

            # Verify JWT token
            payload = verify_jwt_token(token)

            # Extract auth0_id from token
            auth0_id = payload.get("sub")
            email = payload.get("email")
            permissions = payload.get("permissions", [])

            if not auth0_id:
                return JSONResponse(
                    status_code=401,
                    content={
                        "message": "Invalid token payload",
                        "code": "UNAUTHORIZED",
                    },
                )

            # Look up user UUID via UserService
            user_uuid = self.user_service.get_user_uuid(auth0_id)
            if not user_uuid:
                return JSONResponse(
                    status_code=401,
                    content={"message": "User not found", "code": "UNAUTHORIZED"},
                )

            # Add user info to request state (with UUID, not auth0_id)
            request.state.current_user = {
                "id": user_uuid,  # This is the UUID
                "auth0_id": auth0_id,
                "email": email,
                "permissions": permissions,
                "token_payload": payload,
            }

            # Log authenticated request
            request_id = request_id_context.get("")
            logger.info(
                f"Authenticated request: user_id={user_uuid}, path={request.url.path}"
            )

        except Exception as e:
            logger.error(f"Authentication error: {str(e)}")
            return JSONResponse(
                status_code=401,
                content={"message": "Invalid or expired token", "code": "UNAUTHORIZED"},
            )

        return await call_next(request)
