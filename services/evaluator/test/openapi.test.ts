import { describe, expect, it } from "vitest";

import { createHttpApplication } from "../source/inbound/http/application.js";

describe("API documentation endpoints", () => {
  it("serves the OpenAPI document", async () => {
    const application = createHttpApplication();

    const response = await application.request("/openapi.json");
    const document = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(document.paths).toHaveProperty("/health");
    expect(document.paths).toHaveProperty("/evaluations");
    expect(document.paths).toHaveProperty("/evaluations/{id}");
  });

  it("serves the interactive API documentation", async () => {
    const application = createHttpApplication();

    const response = await application.request("/docs");

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
  });
});
