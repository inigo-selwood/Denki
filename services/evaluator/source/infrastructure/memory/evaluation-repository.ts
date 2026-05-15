import type {
  EvaluationRepository,
  EvaluationSubmission,
} from "../../application/submit-evaluation.js";

export function createMemoryEvaluationRepository(): EvaluationRepository {
  const evaluations = new Map<string, EvaluationSubmission>();

  return {
    async createQueuedEvaluation(input) {
      evaluations.set(input.evaluationId, input);
    },
    async getQueuedEvaluation(evaluationId) {
      const evaluation = evaluations.get(evaluationId);

      if (evaluation === undefined) {
        return undefined;
      }

      return {
        evaluationId: evaluation.evaluationId,
        status: "queued",
        request: evaluation.request,
      };
    },
  };
}
