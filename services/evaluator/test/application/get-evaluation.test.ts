import { describe, expect, it } from "vitest";

import { getEvaluation } from "../../source/application/get-evaluation.js";

import type { QueuedEvaluation } from "../../source/domain/evaluation.js";

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

describe("getEvaluation", () => {
  it("returns queued evaluations", async () => {
    const result = await getEvaluation("evaluation-1", {
      reader: {
        async getQueuedEvaluation() {
          return queuedEvaluation;
        },
      },
    });

    expect(result).toEqual(queuedEvaluation);
  });

  it("returns undefined when an evaluation is not found", async () => {
    const result = await getEvaluation("missing-evaluation", {
      reader: {
        async getQueuedEvaluation() {
          return undefined;
        },
      },
    });

    expect(result).toBeUndefined();
  });
});
