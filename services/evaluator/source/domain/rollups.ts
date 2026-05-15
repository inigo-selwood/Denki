import type {
  ConditionResult,
  ConditionVerdict,
  CriterionResult,
  EvaluationStatus,
} from "./evaluation.js";

export function rollUpConditionVerdict(
  criteria: CriterionResult[],
): ConditionVerdict {
  if (criteria.length === 0) {
    throw new Error("Cannot roll up a condition without criteria.");
  }

  if (criteria.some((criterion) => criterion.verdict === "failed")) {
    return "failed";
  }

  if (
    criteria.some(
      (criterion) => criterion.verdict === "requires_manual_review",
    )
  ) {
    return "requires_manual_review";
  }

  return "met";
}

export function rollUpEvaluationStatus(
  conditions: ConditionResult[],
): EvaluationStatus {
  if (conditions.length === 0) {
    throw new Error("Cannot roll up an evaluation without conditions.");
  }

  if (conditions.some((condition) => condition.verdict !== "met")) {
    return "completed_with_review";
  }

  return "completed";
}
