import { describe, expect, it } from "vitest";

import { createHttpApplication } from "../source/inbound/http/application.js";

describe("evaluation endpoint stubs", () => {
  it("exposes the evaluation submission stub", async () => {
    const application = createHttpApplication();

    const response = await application.request("/evaluations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        evidence: [
          {
            id: "evidence-1",
            type: "policy",
            source: "sharepoint",
            content: "Access reviews are performed quarterly.",
          },
        ],
        conditions: [
          {
            id: "condition-1",
            statement: "Access reviews are performed quarterly.",
            criteria: [
              {
                id: "criterion-1",
                statement: "Evidence shows a quarterly access review.",
              },
            ],
          },
        ],
      }),
    });

    await expect(response.json()).resolves.toEqual({
      error: "not_implemented",
    });
    expect(response.status).toBe(501);
  });

  it("exposes the evaluation lookup stub", async () => {
    const application = createHttpApplication();

    const response = await application.request("/evaluations/evaluation-1");

    await expect(response.json()).resolves.toEqual({
      error: "not_implemented",
    });
    expect(response.status).toBe(501);
  });
});
