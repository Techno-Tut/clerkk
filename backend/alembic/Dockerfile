FROM public.ecr.aws/lambda/python:3.12

WORKDIR ${LAMBDA_TASK_ROOT}

RUN pip install alembic psycopg2-binary sqlalchemy awscli

COPY alembic.ini .
COPY alembic ./alembic
COPY clerkk_backend ./clerkk_backend
COPY alembic/entrypoint.sh .
RUN chmod +x entrypoint.sh

ENTRYPOINT ["./entrypoint.sh"]
