import {
  createConditionResult,
  createEvaluationResult,
} from "../domain/results.js";

import type { EvaluationSubmission } from "./submit-evaluation.js";
import type {
  CriterionResult,
  EvaluationResult,
} from "../domain/evaluation.js";

export type EvaluationResultRepository = {
  markEvaluationRunning(evaluationId: string): Promise<void>;
  completeEvaluation(result: EvaluationResult): Promise<void>;
};

export type EvaluateSubmissionDependencies = {
  repository: EvaluationResultRepository;
};

export async function evaluateSubmission(
  submission: EvaluationSubmission,
  dependencies: EvaluateSubmissionDependencies,
): Promise<EvaluationResult> {
  await dependencies.repository.markEvaluationRunning(submission.evaluationId);

  const result = createPlaceholderEvaluationResult(submission);

  await dependencies.repository.completeEvaluation(result);

  return result;
}

function createPlaceholderEvaluationResult(
  submission: EvaluationSubmission,
): EvaluationResult {
  const conditions = submission.request.conditions.map(
    (condition, conditionIndex) =>
      createConditionResult({
        conditionId: `condition:${conditionIndex}`,
        criteria: condition.criteria.map((criterion, criterionIndex) =>
          createPlaceholderCriterionResult({
            conditionIndex,
            criterionIndex,
            criterion,
            evidenceCount: submission.request.evidence.length,
          }),
        ),
      }),
  );

  return createEvaluationResult({
    evaluationId: submission.evaluationId,
    conditions,
  });
}

function createPlaceholderCriterionResult(input: {
  conditionIndex: number;
  criterionIndex: number;
  criterion: string;
  evidenceCount: number;
}): CriterionResult {
  return {
    criterionId: `condition:${input.conditionIndex}:criterion:${input.criterionIndex}`,
    verdict: "requires_manual_review",
    confidence: {
      score: 0,
      factors: ["Placeholder evaluator has not performed evidence analysis."],
    },
    rationale: `Manual review required for criterion: ${input.criterion}`,
    evidenceIds: Array.from(
      { length: input.evidenceCount },
      (_, evidenceIndex) => `evidence:${evidenceIndex}`,
    ),
  };
}
