import { describe, expect, it } from "vitest";

import { createHttpApplication } from "../source/inbound/http/application.js";

import type {
  EvaluationResult,
  QueuedEvaluation,
} from "../source/domain/evaluation.js";

describe("evaluation endpoints", () => {
  const queuedEvaluation: QueuedEvaluation = {
    evaluationId: "evaluation-1",
    status: "queued",
    request: {
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
    },
  };

  const completedEvaluation: EvaluationResult = {
    evaluationId: "evaluation-1",
    status: "completed_with_review",
    conditions: [
      {
        conditionId: "condition:0",
        verdict: "requires_manual_review",
        criteria: [
          {
            criterionId: "condition:0:criterion:0",
            verdict: "requires_manual_review",
            confidence: {
              score: 0,
              factors: [
                "Placeholder evaluator has not performed evidence analysis.",
              ],
            },
            rationale:
              "Manual review required for criterion: Evidence shows a quarterly access review.",
            evidenceIds: ["evidence:0"],
          },
        ],
      },
    ],
  };

  it("submits an evaluation", async () => {
    const application = createHttpApplication({
      async getEvaluation() {
        return undefined;
      },
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

  it("returns queued evaluations", async () => {
    const application = createHttpApplication({
      async getEvaluation() {
        return queuedEvaluation;
      },
      async submitEvaluation() {
        return {
          evaluationId: "evaluation-1",
          status: "queued",
        };
      },
    });

    const response = await application.request("/evaluations/evaluation-1");

    await expect(response.json()).resolves.toEqual(queuedEvaluation);
    expect(response.status).toBe(200);
  });

  it("returns completed evaluation results", async () => {
    const application = createHttpApplication({
      async getEvaluation() {
        return completedEvaluation;
      },
      async submitEvaluation() {
        return {
          evaluationId: "evaluation-1",
          status: "queued",
        };
      },
    });

    const response = await application.request("/evaluations/evaluation-1");

    await expect(response.json()).resolves.toEqual(completedEvaluation);
    expect(response.status).toBe(200);
  });

  it("returns not found for missing evaluations", async () => {
    const application = createHttpApplication({
      async getEvaluation() {
        return undefined;
      },
      async submitEvaluation() {
        return {
          evaluationId: "evaluation-1",
          status: "queued",
        };
      },
    });

    const response = await application.request("/evaluations/missing");

    await expect(response.json()).resolves.toEqual({
      error: "not_found",
    });
    expect(response.status).toBe(404);
  });
});
