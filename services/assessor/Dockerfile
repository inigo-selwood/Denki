FROM python:3.12-slim

WORKDIR /app
ENV ENVIRONMENT=local
ENV ASSESSOR_PORT=9000
EXPOSE 9000

COPY setup ./setup
COPY source ./source
RUN pip install --no-cache-dir --upgrade pip \
    && pip install --no-cache-dir --editable ./setup

CMD python -m source.main serve \
    --host 0.0.0.0 \
    --port "$ASSESSOR_PORT"
