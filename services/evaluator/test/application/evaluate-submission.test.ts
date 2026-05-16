import { describe, expect, it } from "vitest";

import { evaluateSubmission } from "../../source/application/evaluate-submission.js";

import type { EvaluationResult } from "../../source/domain/evaluation.js";

describe("evaluateSubmission", () => {
  it("creates and persists placeholder results for every criterion", async () => {
    const persisted: EvaluationResult[] = [];
    const lifecycleEvents: string[] = [];

    const result = await evaluateSubmission(
      {
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
              criteria: [
                "Evidence shows a quarterly access review.",
                "Evidence identifies the review owner.",
              ],
            },
          ],
        },
      },
      {
        repository: {
          async markEvaluationRunning(evaluationId) {
            lifecycleEvents.push(`running:${evaluationId}`);
          },
          async completeEvaluation(input) {
            lifecycleEvents.push(`completed:${input.evaluationId}`);
            persisted.push(input);
          },
        },
      },
    );

    expect(result).toEqual({
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
            {
              criterionId: "condition:0:criterion:1",
              verdict: "requires_manual_review",
              confidence: {
                score: 0,
                factors: [
                  "Placeholder evaluator has not performed evidence analysis.",
                ],
              },
              rationale:
                "Manual review required for criterion: Evidence identifies the review owner.",
              evidenceIds: ["evidence:0"],
            },
          ],
        },
      ],
    });
    expect(persisted).toEqual([result]);
    expect(lifecycleEvents).toEqual([
      "running:evaluation-1",
      "completed:evaluation-1",
    ]);
  });
});
