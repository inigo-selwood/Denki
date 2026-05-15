import { describe, expect, it } from "vitest";

import {
  rollUpConditionVerdict,
  rollUpEvaluationStatus,
} from "../../source/domain/rollups.js";

import type {
  ConditionResult,
  CriterionResult,
} from "../../source/domain/evaluation.js";

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

function conditionResult(
  conditionId: string,
  criteria: CriterionResult[],
): ConditionResult {
  return {
    conditionId,
    verdict: rollUpConditionVerdict(criteria),
    criteria,
  };
}

describe("condition verdict rollups", () => {
  it("rolls all met criteria to met", () => {
    expect(rollUpConditionVerdict([metCriterion])).toBe("met");
  });

  it("rolls any failed criterion to failed", () => {
    expect(rollUpConditionVerdict([metCriterion, failedCriterion])).toBe(
      "failed",
    );
  });

  it("rolls manual-review criteria to requires_manual_review", () => {
    expect(rollUpConditionVerdict([metCriterion, manualReviewCriterion])).toBe(
      "requires_manual_review",
    );
  });

  it("lets failed criteria win over manual review", () => {
    expect(
      rollUpConditionVerdict([manualReviewCriterion, failedCriterion]),
    ).toBe("failed");
  });

  it("rejects empty criterion lists", () => {
    expect(() => rollUpConditionVerdict([])).toThrow(
      "Cannot roll up a condition without criteria.",
    );
  });
});

describe("evaluation status rollups", () => {
  it("rolls all met conditions to completed", () => {
    expect(
      rollUpEvaluationStatus([conditionResult("condition-1", [metCriterion])]),
    ).toBe("completed");
  });

  it("rolls failed conditions to completed_with_review", () => {
    expect(
      rollUpEvaluationStatus([
        conditionResult("condition-1", [metCriterion]),
        conditionResult("condition-2", [failedCriterion]),
      ]),
    ).toBe("completed_with_review");
  });

  it("rolls manual-review conditions to completed_with_review", () => {
    expect(
      rollUpEvaluationStatus([
        conditionResult("condition-1", [metCriterion]),
        conditionResult("condition-2", [manualReviewCriterion]),
      ]),
    ).toBe("completed_with_review");
  });

  it("rejects empty condition lists", () => {
    expect(() => rollUpEvaluationStatus([])).toThrow(
      "Cannot roll up an evaluation without conditions.",
    );
  });
});
