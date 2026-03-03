from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
import logging
from clerkk_backend.core.exceptions import UserNotFoundError

logger = logging.getLogger(__name__)


class APIError(Exception):
    """Base API error with code and message"""

    def __init__(self, message: str, code: str, status_code: int = 400):
        self.message = message
        self.code = code
        self.status_code = status_code
        super().__init__(message)


# Error code mappings for business exceptions
ERROR_MAPPINGS = {
    UserNotFoundError: ("Invalid request", "INVALID_REQUEST", 400),
}


def create_error_response(message: str, code: str, status_code: int = 400):
    """Create standardized error response"""
    return JSONResponse(
        status_code=status_code, content={"message": message, "code": code}
    )


def handle_business_exception(request, exc):
    """Convert business exceptions to API responses"""
    if type(exc) in ERROR_MAPPINGS:
        default_message, code, status_code = ERROR_MAPPINGS[type(exc)]
        # Use actual exception message if provided, otherwise use default
        exc_message = str(exc).strip()
        message = exc_message if exc_message else default_message
        return create_error_response(message, code, status_code)

    # Fallback for unknown exceptions
    return create_error_response("Internal server error", "INTERNAL_ERROR", 500)


def handle_request_validation_error(request, exc: RequestValidationError):
    """Handle FastAPI request validation errors"""
    # Extract field-specific errors for developer debugging
    error_details = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"] if loc != "body")
        message = error["msg"]
        error_details.append(f"{field}: {message}")

    detailed_message = f"Input validation failed: {'; '.join(error_details)}"
    logger.warning(f"Request validation error: {detailed_message}")

    return create_error_response(detailed_message, "INPUT_VALIDATION_ERROR", 400)


def handle_validation_error(request, exc: ValidationError):
    """Handle Pydantic validation errors with helpful details"""
    # Extract field-specific errors for developer debugging
    error_details = []
    for error in exc.errors():
        field = " -> ".join(str(loc) for loc in error["loc"])
        message = error["msg"]
        error_details.append(f"{field}: {message}")

    detailed_message = f"Input validation failed: {'; '.join(error_details)}"
    logger.warning(f"Validation error: {detailed_message}")

    return create_error_response(detailed_message, "INPUT_VALIDATION_ERROR", 400)


def handle_http_exception(request, exc: HTTPException):
    """Handle FastAPI HTTP exceptions"""
    return create_error_response(exc.detail, "HTTP_ERROR", exc.status_code)


def handle_database_error(request, exc: SQLAlchemyError):
    """Handle database errors - never expose internal DB details"""
    # Log actual error for debugging
    logger.error(f"Database error: {str(exc)}")

    # Return generic 500 error to client (no DB details exposed)
    return create_error_response("Internal server error", "INTERNAL_ERROR", 500)


def handle_generic_exception(request, exc: Exception):
    """Handle any unhandled exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return create_error_response("Internal server error", "INTERNAL_ERROR", 500)


# All exception handlers to register
EXCEPTION_HANDLERS = {
    **{exc_type: handle_business_exception for exc_type in ERROR_MAPPINGS.keys()},
    RequestValidationError: handle_request_validation_error,  # FastAPI request validation
    ValidationError: handle_validation_error,  # Pydantic validation
    HTTPException: handle_http_exception,
    SQLAlchemyError: handle_database_error,
    Exception: handle_generic_exception,  # Catch-all for any unhandled exceptions
}
