import type {
  EvaluationAccepted,
  EvaluationRequest,
} from "../domain/evaluation.js";

type EvaluationSubmission = {
  evaluationId: string;
  request: EvaluationRequest;
};

export type EvaluationRepository = {
  createQueuedEvaluation(input: EvaluationSubmission): Promise<void>;
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
