# Ingestor Service

Evidence document ingestion and structure extraction service.

## Purpose

The ingestor service accepts an image and returns HTML for the visible
structure. It is intentionally agnostic of evaluator flows,
evidence IDs, filenames, and document identity.

## Current Scope

This service provides the FastAPI boundary, Uvicorn runtime, image validation,
Tesseract OCR adapter, and HTML rendering. The first implementation pass
prioritizes a small stable contract over sophisticated layout intelligence.

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
- `POST /parse`: accepts one multipart image upload and returns
  `text/html`.

## Source Layout

- `source/main.py`: FastAPI entrypoint and app construction.
- `source/endpoints`: route modules, one endpoint group per file.
- `source/controllers`: FastAPI-aware validation and delegation.
- `source/services`: FastAPI-agnostic implementation.
- `test`: service tests.
