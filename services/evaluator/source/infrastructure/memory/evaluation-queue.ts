import type { EvaluationQueue } from "../../application/submit-evaluation.js";
import type { EvaluationSubmission } from "../../application/submit-evaluation.js";

export type EvaluationExecutor = (
  input: EvaluationSubmission,
) => Promise<void>;

export function createImmediateEvaluationQueue(
  executeEvaluation: EvaluationExecutor,
): EvaluationQueue {
  return {
    async enqueueEvaluation(input) {
      await executeEvaluation(input);
    },
  };
}

export function createCompositeEvaluationQueue(
  queues: EvaluationQueue[],
): EvaluationQueue {
  return {
    async enqueueEvaluation(input) {
      for (const queue of queues) {
        await queue.enqueueEvaluation(input);
      }
    },
  };
}
