import type { EvaluationRecord } from "./submit-evaluation.js";

export type EvaluationReader = {
  getQueuedEvaluation(
    evaluationId: string,
  ): Promise<EvaluationRecord | undefined>;
};

export type GetEvaluationDependencies = {
  reader: EvaluationReader;
};

export async function getEvaluation(
  evaluationId: string,
  dependencies: GetEvaluationDependencies,
): Promise<EvaluationRecord | undefined> {
  return dependencies.reader.getQueuedEvaluation(evaluationId);
}
