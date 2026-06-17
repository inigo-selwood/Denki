FROM python:3.12-slim

WORKDIR /app
ENV ENVIRONMENT=local
ENV INGESTOR_PORT=8000
EXPOSE 8000

RUN apt-get update \
    && apt-get install --no-install-recommends --yes \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY . .
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --editable .

CMD python -m source.main serve \
    --host 0.0.0.0 \
    --port "$INGESTOR_PORT"
