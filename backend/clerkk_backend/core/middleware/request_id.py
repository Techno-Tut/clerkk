import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from clerkk_backend.core.logging import request_id_context


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to generate request IDs and add to response headers"""

    async def dispatch(self, request: Request, call_next):
        # Generate unique request ID
        request_id = str(uuid.uuid4())

        # Store in request state (accessible throughout request lifecycle)
        request.state.request_id = request_id

        # Set in context variable for logging
        request_id_context.set(request_id)

        # Process request
        response = await call_next(request)

        # Add request ID to response headers
        response.headers["X-API-Request-ID"] = request_id

        return response
