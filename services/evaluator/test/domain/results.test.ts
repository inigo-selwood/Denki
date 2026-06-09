import { describe, expect, it } from "vitest";

import {
  createConditionResult,
  createEvaluationResult,
} from "../../source/domain/results.js";

import type { CriterionResult } from "../../source/domain/evaluation.js";

const metCriterion: CriterionResult = {
  criterionId: "criterion-met",
  verdict: "met",
  confidence: {
    score: 0.9,
    factors: [],
  },
  rationale: "Evidence supports the criterion.",
  evidenceIds: ["evidence-1"],
};

const failedCriterion: CriterionResult = {
  criterionId: "criterion-failed",
  verdict: "failed",
  confidence: {
    score: 0.8,
    factors: [],
  },
  rationale: "Evidence contradicts the criterion.",
  evidenceIds: ["evidence-1"],
};

const manualReviewCriterion: CriterionResult = {
  criterionId: "criterion-review",
  verdict: "requires_manual_review",
  confidence: {
    score: 0.2,
    factors: [],
  },
  rationale: "Evidence is insufficient to assess the criterion.",
  evidenceIds: [],
};

describe("condition result builder", () => {
  it("creates condition results with a rolled-up verdict", () => {
    const result = createConditionResult({
      conditionId: "condition-1",
      criteria: [metCriterion],
    });

    expect(result).toEqual({
      conditionId: "condition-1",
      verdict: "met",
      criteria: [metCriterion],
    });
  });

  it("uses failed when any criterion failed", () => {
    const result = createConditionResult({
      conditionId: "condition-1",
      criteria: [metCriterion, failedCriterion],
    });

    expect(result.verdict).toBe("failed");
  });

  it("uses manual review when criteria need review but none failed", () => {
    const result = createConditionResult({
      conditionId: "condition-1",
      criteria: [metCriterion, manualReviewCriterion],
    });

    expect(result.verdict).toBe("requires_manual_review");
  });
});

describe("evaluation result builder", () => {
  it("creates completed evaluation results when every condition is met", () => {
    const result = createEvaluationResult({
      flowId: "flow-1",
      conditions: [
        createConditionResult({
          conditionId: "condition-1",
          criteria: [metCriterion],
        }),
      ],
    });

    expect(result.status).toBe("completed");
  });

  it("creates completed-with-review results when a condition fails", () => {
    const result = createEvaluationResult({
      flowId: "flow-1",
      conditions: [
        createConditionResult({
          conditionId: "condition-1",
          criteria: [failedCriterion],
        }),
      ],
    });

    expect(result.status).toBe("completed_with_review");
  });

  it("creates completed-with-review results when a condition needs review", () => {
    const result = createEvaluationResult({
      flowId: "flow-1",
      conditions: [
        createConditionResult({
          conditionId: "condition-1",
          criteria: [manualReviewCriterion],
        }),
      ],
    });

    expect(result.status).toBe("completed_with_review");
  });
});
