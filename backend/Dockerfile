FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY alembic.ini .
COPY alembic ./alembic
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

COPY app ./app

CMD ["./entrypoint.sh"]
