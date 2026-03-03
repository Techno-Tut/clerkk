import logging
import sys
from contextvars import ContextVar

# Context variable to store request ID across the request lifecycle
request_id_context: ContextVar[str] = ContextVar("request_id", default="")


class StructuredFormatter(logging.Formatter):
    """Industry standard structured log formatter with request ID"""

    def format(self, record):
        # Get request ID from context
        request_id = request_id_context.get("") or "no-request-id"

        # Add request ID to log record
        record.request_id = request_id

        # Industry standard structured format
        log_format = (
            "%(asctime)s %(levelname)-8s "
            "request_id=%(request_id)s "
            "%(name)s:%(funcName)s:%(lineno)d "
            "%(message)s"
        )

        formatter = logging.Formatter(log_format)
        return formatter.format(record)


def setup_logging():
    """Configure application logging to stdout/stderr"""

    # Create formatter
    formatter = StructuredFormatter()

    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)

    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)

    # Stdout for INFO and above
    stdout_handler = logging.StreamHandler(sys.stdout)
    stdout_handler.setLevel(logging.INFO)
    stdout_handler.setFormatter(formatter)

    # Stderr for ERROR and above
    stderr_handler = logging.StreamHandler(sys.stderr)
    stderr_handler.setLevel(logging.ERROR)
    stderr_handler.setFormatter(formatter)

    # Add handlers
    root_logger.addHandler(stdout_handler)
    root_logger.addHandler(stderr_handler)

    return root_logger


def get_logger(name: str):
    """Get logger with structured formatting"""
    return logging.getLogger(name)
