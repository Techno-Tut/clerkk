# Stage 1: Build dependencies
FROM public.ecr.aws/lambda/python:3.12 AS builder

WORKDIR /build

# Install Poetry
RUN pip install poetry==1.7.1

# Copy Poetry files
COPY pyproject.toml poetry.lock ./

# Export dependencies to requirements.txt
RUN poetry export -f requirements.txt --output requirements.txt --without-hashes --only=main

# Install dependencies to target directory
RUN pip install --target /build/python -r requirements.txt

# Stage 2: Runtime
FROM public.ecr.aws/lambda/python:3.12

# Copy installed packages from builder
COPY --from=builder /build/python ${LAMBDA_RUNTIME_DIR}/

# Copy application code
COPY clerkk_backend ${LAMBDA_TASK_ROOT}/clerkk_backend
COPY config ${LAMBDA_TASK_ROOT}/config

# Set Lambda handler
CMD ["clerkk_backend.main.handler"]
