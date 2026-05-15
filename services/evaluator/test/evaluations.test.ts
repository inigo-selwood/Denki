import { describe, expect, it } from "vitest";

import { createHttpApplication } from "../source/inbound/http/application.js";

describe("evaluation endpoints", () => {
  it("submits an evaluation", async () => {
    const application = createHttpApplication({
      async submitEvaluation() {
        return {
          evaluationId: "evaluation-1",
          status: "queued",
        };
      },
    });

    const response = await application.request("/evaluations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        evidence: [
          {
            name: "Quarterly access review policy.pdf",
            content: "Access reviews are performed quarterly.",
          },
        ],
        conditions: [
          {
            statement: "Access reviews are performed quarterly.",
            criteria: ["Evidence shows a quarterly access review."],
          },
        ],
      }),
    });

    await expect(response.json()).resolves.toEqual({
      evaluationId: "evaluation-1",
      status: "queued",
    });
    expect(response.status).toBe(202);
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
