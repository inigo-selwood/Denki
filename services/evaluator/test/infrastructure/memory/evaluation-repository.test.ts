import { describe, expect, it } from "vitest";

import { createMemoryEvaluationRepository } from "../../../source/infrastructure/memory/evaluation-repository.js";

describe("memory evaluation repository", () => {
  it("stores and returns queued evaluations", async () => {
    const repository = createMemoryEvaluationRepository();
    const request = {
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

    await repository.createQueuedEvaluation({
      evaluationId: "evaluation-1",
      request,
    });

    await expect(
      repository.getQueuedEvaluation("evaluation-1"),
    ).resolves.toEqual({
      evaluationId: "evaluation-1",
      status: "queued",
      request,
    });
  });

  it("returns undefined for missing evaluations", async () => {
    const repository = createMemoryEvaluationRepository();

    await expect(
      repository.getQueuedEvaluation("missing-evaluation"),
    ).resolves.toBeUndefined();
  });

  it("stores and returns completed evaluations", async () => {
    const repository = createMemoryEvaluationRepository();
    const result = {
      evaluationId: "evaluation-1",
      status: "completed_with_review" as const,
      conditions: [
        {
          conditionId: "condition:0",
          verdict: "requires_manual_review" as const,
          criteria: [
            {
              criterionId: "condition:0:criterion:0",
              verdict: "requires_manual_review" as const,
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

    await repository.completeEvaluation(result);

    await expect(
      repository.getQueuedEvaluation("evaluation-1"),
    ).resolves.toEqual(result);
  });
});
