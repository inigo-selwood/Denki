import { submitEvaluation } from "../application/submit-evaluation.js";
import { createInngestEvaluationQueue } from "../infrastructure/inngest/evaluation-queue.js";
import { inngest } from "../infrastructure/inngest/client.js";
import { createMemoryEvaluationRepository } from "../infrastructure/memory/evaluation-repository.js";

import type { SubmitEvaluation } from "../inbound/http/routes/evaluations.js";

export function createRuntimeSubmitEvaluation(): SubmitEvaluation {
  const repository = createMemoryEvaluationRepository();
  const queue = createInngestEvaluationQueue(inngest);

  return (request) =>
    submitEvaluation(request, {
      createEvaluationId: () => crypto.randomUUID(),
      repository,
      queue,
    });
}
