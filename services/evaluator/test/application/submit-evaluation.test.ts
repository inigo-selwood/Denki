import { describe, expect, it } from "vitest";

import { submitEvaluation } from "../../source/application/submit-evaluation.js";

import type {
  EvaluationQueue,
  EvaluationRepository,
} from "../../source/application/submit-evaluation.js";
import type { EvaluationRequest } from "../../source/domain/evaluation.js";

const request: EvaluationRequest = {
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
};

function createRepository(events: string[]): EvaluationRepository {
  return {
    async createQueuedEvaluation(input) {
      events.push(`persist:${input.evaluationId}`);
    },
    async getQueuedEvaluation() {
      return undefined;
    },
    async markEvaluationRunning() {
      throw new Error("Unexpected running evaluation.");
    },
    async markEvaluationFailed() {
      throw new Error("Unexpected failed evaluation.");
    },
    async completeEvaluation() {
      throw new Error("Unexpected completed evaluation.");
    },
  };
}

function createQueue(events: string[]): EvaluationQueue {
  return {
    async enqueueEvaluation(input) {
      events.push(`enqueue:${input.evaluationId}`);
    },
  };
}

describe("submitEvaluation", () => {
  it("returns a queued evaluation response", async () => {
    const result = await submitEvaluation(request, {
      createEvaluationId: () => "evaluation-1",
      repository: createRepository([]),
      queue: createQueue([]),
    });

    expect(result).toEqual({
      evaluationId: "evaluation-1",
      status: "queued",
    });
  });

  it("persists the evaluation before queueing work", async () => {
    const events: string[] = [];

    await submitEvaluation(request, {
      createEvaluationId: () => "evaluation-1",
      repository: createRepository(events),
      queue: createQueue(events),
    });

    expect(events).toEqual(["persist:evaluation-1", "enqueue:evaluation-1"]);
  });

  it("passes the evaluation request to persistence and queue dependencies", async () => {
    const persisted: unknown[] = [];
    const enqueued: unknown[] = [];

    await submitEvaluation(request, {
      createEvaluationId: () => "evaluation-1",
      repository: {
        async createQueuedEvaluation(input) {
          persisted.push(input);
        },
        async getQueuedEvaluation() {
          return undefined;
        },
        async markEvaluationRunning() {
          throw new Error("Unexpected running evaluation.");
        },
        async markEvaluationFailed() {
          throw new Error("Unexpected failed evaluation.");
        },
        async completeEvaluation() {
          throw new Error("Unexpected completed evaluation.");
        },
      },
      queue: {
        async enqueueEvaluation(input) {
          enqueued.push(input);
        },
      },
    });

    expect(persisted).toEqual([
      {
        evaluationId: "evaluation-1",
        request,
      },
    ]);
    expect(enqueued).toEqual([
      {
        evaluationId: "evaluation-1",
        request,
      },
    ]);
  });
});
