# Ingestor Service

Evidence document ingestion and structure extraction service.

## Purpose

The ingestor service accepts evidence documents and returns a normalized,
hierarchical representation of their contents. The structure should behave
like a document tree: sections contain child sections or content blocks, with
text and page geometry preserved for downstream evaluation.

## Current Scope

This scaffold provides the FastAPI service boundary, Uvicorn runtime, and
Tesseract adapter placeholder. The first implementation pass should focus on
HTTP contract stability before tuning extraction quality.

## Local Setup

Install service dependencies before running local checks:

```sh
task ingestor:setup
```

Run the service locally:

```sh
task ingestor:run-local
```

Task injects local environment values for development:

- `ENVIRONMENT=development`
- `INGESTOR_PORT=8000`

The Docker task injects the same port and sets `ENVIRONMENT=local`.

## HTTP API

- `GET /health`: returns `{"status":"ok"}`.
- `POST /documents/parse`: accepts a multipart document upload and returns a
  structured document tree.

## Source Layout

- `source/endpoints`: FastAPI route definitions.
- `source/controllers`: HTTP-facing request handling.
- `source/services`: business orchestration.
- `source/models`: request, response, and document structure models.
- `source/integrations`: adapters for OCR engines and external tools.
- `source/config`: environment parsing and service settings.
- `test`: service tests.
