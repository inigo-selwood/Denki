import { describe, expect, it } from "vitest";

import {
  conditionResultSchema,
  documentTypeSchema,
  evaluationRequestSchema,
  evaluationResultSchema,
  flowEvidenceSchema,
} from "../../source/domain/evaluation.js";
import { createFlowEvidence } from "../fixtures/evidence.js";

describe("evaluation domain schemas", () => {
  it("accepts a structured evaluation request", () => {
    const request = evaluationRequestSchema.parse({
      evidence: [createFlowEvidence()],
      conditions: [
        {
          statement: "Access reviews are performed quarterly.",
          criteria: ["The evidence shows a quarterly access review."],
        },
      ],
    });

    expect(request.conditions[0]?.criteria[0]).toBe(
      "The evidence shows a quarterly access review.",
    );
  });

  it("accepts supported document types", () => {
    expect(documentTypeSchema.parse("invoice")).toBe("invoice");
    expect(documentTypeSchema.parse("platform_screenshot")).toBe(
      "platform_screenshot",
    );
  });

  it("rejects unsupported document types", () => {
    expect(documentTypeSchema.safeParse("random_document").success).toBe(
      false,
    );
  });

  it("accepts normalized evidence blocks with bounding boxes", () => {
    const evidence = flowEvidenceSchema.parse(createFlowEvidence());

    expect(evidence.ingestion.blocks[0]).toMatchObject({
      content: "Access reviews are performed quarterly.",
      page: 1,
      bbox: {
        page: 1,
      },
    });
  });

  it("rejects evaluation requests without evidence", () => {
    const result = evaluationRequestSchema.safeParse({
      evidence: [],
      conditions: [
        {
          statement: "Access reviews are performed quarterly.",
          criteria: ["The evidence shows a quarterly access review."],
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
      flowId: "flow-1",
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
