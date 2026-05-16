import type {
  EvaluationRecord,
  EvaluationRepository,
  EvaluationSubmission,
} from "../../application/submit-evaluation.js";
import type { EvaluationResult } from "../../domain/evaluation.js";

export function createMemoryEvaluationRepository(): EvaluationRepository {
  const evaluations = new Map<string, EvaluationRecord>();

  return {
    async createQueuedEvaluation(input) {
      evaluations.set(input.evaluationId, {
        evaluationId: input.evaluationId,
        status: "queued",
        request: input.request,
      });
    },
    async getQueuedEvaluation(evaluationId) {
      return evaluations.get(evaluationId);
    },
    async markEvaluationRunning(evaluationId) {
      const evaluation = evaluations.get(evaluationId);

      if (evaluation === undefined || evaluation.status !== "queued") {
        return;
      }

      evaluations.set(evaluationId, {
        ...evaluation,
        status: "running",
      });
    },
    async completeEvaluation(result: EvaluationResult) {
      evaluations.set(result.evaluationId, result);
    },
  };
}
