import type {
  EvaluationAccepted,
  EvaluationResult,
  EvaluationRequest,
  QueuedEvaluation,
} from "../domain/evaluation.js";

export type EvaluationRecord = QueuedEvaluation | EvaluationResult;

export type EvaluationSubmission = {
  evaluationId: string;
  request: EvaluationRequest;
};

export type EvaluationRepository = {
  createQueuedEvaluation(input: EvaluationSubmission): Promise<void>;
  getQueuedEvaluation(
    evaluationId: string,
  ): Promise<EvaluationRecord | undefined>;
  completeEvaluation(result: EvaluationResult): Promise<void>;
};

export type EvaluationQueue = {
  enqueueEvaluation(input: EvaluationSubmission): Promise<void>;
};

export type SubmitEvaluationDependencies = {
  createEvaluationId: () => string;
  repository: EvaluationRepository;
  queue: EvaluationQueue;
};

export async function submitEvaluation(
  request: EvaluationRequest,
  dependencies: SubmitEvaluationDependencies,
): Promise<EvaluationAccepted> {
  const evaluationId = dependencies.createEvaluationId();
  const submission = {
    evaluationId,
    request,
  };

  await dependencies.repository.createQueuedEvaluation(submission);
  await dependencies.queue.enqueueEvaluation(submission);

  return {
    evaluationId,
    status: "queued",
  };
}
