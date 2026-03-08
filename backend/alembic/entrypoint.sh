#!/bin/sh
set -e

echo "Fetching DATABASE_URL from Parameter Store..."
export DATABASE_URL=$(aws ssm get-parameter \
  --name /clerkk/db/connection_string \
  --with-decryption \
  --region ca-central-1 \
  --query 'Parameter.Value' \
  --output text)

echo "Running migrations..."
alembic upgrade head
echo "Migrations complete"
