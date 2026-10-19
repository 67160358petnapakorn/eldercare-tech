FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt ./

RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir -r requirements.txt

COPY ./app ./app

EXPOSE 8000

# Shell form (not exec form) so $PORT expands — Render/Railway/Fly inject
# their own PORT at runtime; 8000 is the fallback for plain `docker run`
# and docker-compose, which don't set it.
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
