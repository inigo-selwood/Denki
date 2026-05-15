import { describe, expect, it } from "vitest";

import {
  conditionResultSchema,
  evaluationRequestSchema,
  evaluationResultSchema,
} from "../../source/domain/evaluation.js";

describe("evaluation domain schemas", () => {
  it("accepts a structured evaluation request", () => {
    const request = evaluationRequestSchema.parse({
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
              statement: "The evidence shows a quarterly access review.",
            },
          ],
        },
      ],
    });

    expect(request.conditions[0]?.criteria[0]?.expectations).toEqual([]);
  });

  it("rejects evaluation requests without evidence", () => {
    const result = evaluationRequestSchema.safeParse({
      evidence: [],
      conditions: [
        {
          id: "condition-1",
          statement: "Access reviews are performed quarterly.",
          criteria: [
            {
              id: "criterion-1",
              statement: "The evidence shows a quarterly access review.",
            },
          ],
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it("accepts criterion results that require manual review", () => {
    const result = conditionResultSchema.parse({
      conditionId: "condition-1",
      verdict: "requires_manual_review",
      criteria: [
        {
          criterionId: "criterion-1",
          verdict: "requires_manual_review",
          confidence: {
            score: 0.2,
            factors: ["Evidence does not include review dates."],
          },
          rationale: "The criterion cannot be determined from the evidence.",
          evidenceIds: ["evidence-1"],
        },
      ],
    });

    expect(result.verdict).toBe("requires_manual_review");
  });

  it("accepts evaluation results with completed_with_review status", () => {
    const result = evaluationResultSchema.parse({
      evaluationId: "evaluation-1",
      status: "completed_with_review",
      conditions: [
        {
          conditionId: "condition-1",
          verdict: "requires_manual_review",
          criteria: [
            {
              criterionId: "criterion-1",
              verdict: "requires_manual_review",
              confidence: {
                score: 0.2,
              },
              rationale:
                "The criterion cannot be determined from the evidence.",
            },
          ],
        },
      ],
    });

    expect(result.conditions[0]?.criteria[0]?.confidence.factors).toEqual([]);
    expect(result.conditions[0]?.criteria[0]?.evidenceIds).toEqual([]);
  });
});
