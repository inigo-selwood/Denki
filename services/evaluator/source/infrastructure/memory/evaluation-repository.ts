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
  };
}
