FROM python:3.12-slim

WORKDIR /app
ENV ENVIRONMENT=local
ENV INGESTOR_PORT=8000
EXPOSE 8000

RUN apt-get update \
    && apt-get install --no-install-recommends --yes tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

COPY . .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --editable .

CMD uvicorn source.main:run \
    --factory \
    --host 0.0.0.0 \
    --port "$INGESTOR_PORT"
