import { describe, expect, it } from "vitest";

import { createHttpApplication } from "../source/inbound/http/application.js";

describe("health endpoint", () => {
  it("returns ok", async () => {
    const application = createHttpApplication();

    const response = await application.request("/health");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
    });
  });
});
