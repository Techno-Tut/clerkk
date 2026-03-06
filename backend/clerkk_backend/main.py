from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from clerkk_backend.core.container import Container
from clerkk_backend.core.logging import setup_logging
from clerkk_backend.core.middleware import RequestIDMiddleware, AuthMiddleware
from clerkk_backend.core.auth import configure_auth
from clerkk_backend.core.error_handlers import EXCEPTION_HANDLERS
from clerkk_backend.controllers import (
    income_router,
    expense_router,
    user_router,
    dashboard_router,
    debt_router,
)
import os

# Import all models so SQLAlchemy can create tables
import clerkk_backend.models

# Setup logging
setup_logging()

app = FastAPI(
    title="Clerkk API",
    description="Backend Services for Clerrkk app - JWT Bearer token required for authentication",
    version="0.1.0",
)

# Add security scheme to OpenAPI spec for Swagger UI
app.openapi_schema = None  # Reset to regenerate


def get_openapi_schema():
    if app.openapi_schema:
        return app.openapi_schema

    from fastapi.openapi.utils import get_openapi

    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )

    # Add Bearer token security scheme
    if "components" not in openapi_schema:
        openapi_schema["components"] = {}
    if "securitySchemes" not in openapi_schema["components"]:
        openapi_schema["components"]["securitySchemes"] = {}

    openapi_schema["components"]["securitySchemes"]["BearerAuth"] = {
        "type": "http",
        "scheme": "bearer",
        "bearerFormat": "JWT",
    }

    app.openapi_schema = openapi_schema
    return app.openapi_schema


app.openapi = get_openapi_schema

# Initialize and wire container
container = Container()

# Load configuration from YAML file based on environment
environment = os.getenv("ENVIRONMENT", "dev")
# Get the project root directory (one level up from clerkk_backend)
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
config_file = os.path.join(project_root, "config", f"{environment}.yaml")
container.config.from_yaml(config_file, required=True, envs_required=True)

# Create database tables
from clerkk_backend.models import Base

# Base.metadata.drop_all(container.database().engine)  # MVP: Drop old schema
# Base.metadata.create_all(container.database().engine)

# Add CORS middleware (after config is loaded)
app.add_middleware(
    CORSMiddleware,
    allow_origins=container.config.cors.allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add middleware (order matters - last added runs first)
app.add_middleware(AuthMiddleware, user_service=container.user_service())
app.add_middleware(RequestIDMiddleware)

configure_auth(
    domain=container.config.auth0.domain(),
    audience=container.config.auth0.api_audience(),
)

# Wire the controller modules
container.wire(
    modules=[
        "clerkk_backend.controllers.income",
        "clerkk_backend.controllers.expense",
        "clerkk_backend.controllers.user",
        "clerkk_backend.controllers.dashboard",
        "clerkk_backend.controllers.debt",
    ]
)

# Register centralized exception handlers
for exception_type, handler in EXCEPTION_HANDLERS.items():
    app.add_exception_handler(exception_type, handler)

# Include routers
app.include_router(income_router)
app.include_router(expense_router)
app.include_router(user_router)
app.include_router(dashboard_router)
app.include_router(debt_router)


@app.get("/")
async def root():
    return {"message": "InBriefs API is running"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


def main():
    import uvicorn

    uvicorn.run("clerkk_backend.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()

# Lambda handler (for AWS Lambda with Mangum)
from mangum import Mangum

handler = Mangum(app)
