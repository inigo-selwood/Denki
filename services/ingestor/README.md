# Ingestor Service

Evidence document ingestion and structure extraction service.

## Purpose

The ingestor service accepts an image and returns HTML for the visible
structure. It is intentionally agnostic of evaluator flows,
evidence IDs, filenames, and document identity.

## Current Scope

This service provides the FastAPI boundary, Uvicorn runtime, image validation,
PaddleOCR-backed OCR adapter, and HTML rendering. The first implementation pass
prioritizes a small stable contract over sophisticated layout intelligence.

## Local Setup

Task commands install service dependencies automatically when required and
cache setup with `.venv/.setup.stamp`.

Run the service locally:

```sh
task ingestor:run-local
```

Task injects local environment values for development:

- `ENVIRONMENT=development`
- `INGESTOR_PORT=8000`

The Docker task injects the same port and sets `ENVIRONMENT=local`.

Run the full test suite:

```sh
task ingestor:test
```

Run only the ingestor CLI:

```sh
task ingestor:run-cli -- --help
```

## HTTP API

- `GET /health`: returns `{"status":"ok"}`.
- `POST /parse`: accepts one multipart image upload and returns
  `text/html`.
- `POST /annotate`: accepts one multipart image upload and an HTML `markup`
  form field, then returns `image/png` with parsed bounds drawn over the image.

## Source Layout

- `source/main.py`: FastAPI entrypoint and app construction.
- `source/endpoints`: route modules, one endpoint group per file.
- `source/controllers`: FastAPI-aware validation and delegation.
- `source/ocr`: OCR engine adapters behind the service boundary.
- `source/services`: FastAPI-agnostic implementation.
- `test/unit`: fast service tests with fakes where needed.
- `test/integration`: slower end-to-end tests using real fixture images.
- `test/resources`: local document image fixtures.
