import { evaluateSubmission } from "../application/evaluate-submission.js";
import { getEvaluation } from "../application/get-evaluation.js";
import { submitEvaluation } from "../application/submit-evaluation.js";
import { createDatabaseClient } from "../infrastructure/database/client.js";
import { createDatabaseEvaluationRepository } from "../infrastructure/database/evaluation-repository.js";
import { createInngestEvaluationQueue } from "../infrastructure/inngest/evaluation-queue.js";
import { inngest } from "../infrastructure/inngest/client.js";
import {
  createCompositeEvaluationQueue,
  createImmediateEvaluationQueue,
} from "../infrastructure/memory/evaluation-queue.js";

import type { EvaluationRoutesDependencies } from "../inbound/http/routes/evaluations.js";

export type RuntimeEvaluationConfiguration = {
  database: {
    connectionUrl: string | undefined;
  };
  queue: {
    mode: "immediate" | "inngest";
  };
};

export function createRuntimeEvaluationDependencies(
  configuration: RuntimeEvaluationConfiguration,
): EvaluationRoutesDependencies {
  if (configuration.database.connectionUrl === undefined) {
    throw new Error(
      "Database connection settings are required for evaluator persistence.",
    );
  }

  const client = createDatabaseClient(configuration.database.connectionUrl);
  const repository = createDatabaseEvaluationRepository(client.database);
  const immediateQueue = createImmediateEvaluationQueue(async (submission) => {
    await evaluateSubmission(submission, {
      repository,
    });
  });
  const queue =
    configuration.queue.mode === "immediate"
      ? immediateQueue
      : createCompositeEvaluationQueue([
          createInngestEvaluationQueue(inngest),
          immediateQueue,
        ]);

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
