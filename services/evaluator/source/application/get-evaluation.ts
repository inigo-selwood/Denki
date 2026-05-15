import type { QueuedEvaluation } from "../domain/evaluation.js";

export type EvaluationReader = {
  getQueuedEvaluation(
    evaluationId: string,
  ): Promise<QueuedEvaluation | undefined>;
};

export type GetEvaluationDependencies = {
  reader: EvaluationReader;
};

export async function getEvaluation(
  evaluationId: string,
  dependencies: GetEvaluationDependencies,
): Promise<QueuedEvaluation | undefined> {
  return dependencies.reader.getQueuedEvaluation(evaluationId);
}
