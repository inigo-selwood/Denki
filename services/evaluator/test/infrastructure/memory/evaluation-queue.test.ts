import { describe, expect, it } from "vitest";

import {
  createCompositeEvaluationQueue,
  createImmediateEvaluationQueue,
} from "../../../source/infrastructure/memory/evaluation-queue.js";

import type { EvaluationSubmission } from "../../../source/application/submit-evaluation.js";

const submission: EvaluationSubmission = {
  evaluationId: "evaluation-1",
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

describe("immediate evaluation queue", () => {
  it("runs submitted evaluations immediately", async () => {
    const executed: EvaluationSubmission[] = [];
    const queue = createImmediateEvaluationQueue(async (input) => {
      executed.push(input);
    });

    await queue.enqueueEvaluation(submission);

    expect(executed).toEqual([submission]);
  });
});

describe("composite evaluation queue", () => {
  it("passes submitted evaluations to each queue in order", async () => {
    const events: string[] = [];
    const queue = createCompositeEvaluationQueue([
      {
        async enqueueEvaluation(input) {
          events.push(`first:${input.evaluationId}`);
        },
      },
      {
        async enqueueEvaluation(input) {
          events.push(`second:${input.evaluationId}`);
        },
      },
    ]);

    await queue.enqueueEvaluation(submission);

    expect(events).toEqual(["first:evaluation-1", "second:evaluation-1"]);
  });
});
