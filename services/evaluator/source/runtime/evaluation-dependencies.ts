import { getEvaluation } from "../application/get-evaluation.js";
import { submitEvaluation } from "../application/submit-evaluation.js";
import { createInngestEvaluationQueue } from "../infrastructure/inngest/evaluation-queue.js";
import { inngest } from "../infrastructure/inngest/client.js";
import { createMemoryEvaluationRepository } from "../infrastructure/memory/evaluation-repository.js";

import type { EvaluationRoutesDependencies } from "../inbound/http/routes/evaluations.js";

export function createRuntimeEvaluationDependencies(): EvaluationRoutesDependencies {
  const repository = createMemoryEvaluationRepository();
  const queue = createInngestEvaluationQueue(inngest);

  return {
    getEvaluation: (evaluationId) =>
      getEvaluation(evaluationId, {
        reader: repository,
      }),
    submitEvaluation: (request) =>
      submitEvaluation(request, {
        createEvaluationId: () => crypto.randomUUID(),
        repository,
        queue,
      }),
  };
}
