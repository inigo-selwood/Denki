import {
  addFlowEvidence,
  createFlow,
  evaluateFlow,
  getFlow,
  runFlow,
  setFlowConditions,
  setFlowMetadata,
} from "../application/flows.js";
import { createDatabaseClient } from "../infrastructure/database/client.js";
import { createDatabaseFlowRepository } from "../infrastructure/database/evaluation-repository.js";
import { createInngestFlowQueue } from "../infrastructure/inngest/evaluation-queue.js";
import { inngest } from "../infrastructure/inngest/client.js";
import {
  createCompositeEvaluationQueue,
  createImmediateEvaluationQueue,
} from "../infrastructure/memory/evaluation-queue.js";

import type { FlowRoutesDependencies } from "../inbound/http/routes/flows.js";

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
): FlowRoutesDependencies {
  if (configuration.database.connectionUrl === undefined) {
    throw new Error(
      "Database connection settings are required for evaluator persistence.",
    );
  }

  const client = createDatabaseClient(configuration.database.connectionUrl);
  const repository = createDatabaseFlowRepository(client.database);
  const immediateQueue = createImmediateEvaluationQueue(async (flowRun) => {
    await evaluateFlow(flowRun, {
      repository,
    });
  });
  const queue =
    configuration.queue.mode === "immediate"
      ? immediateQueue
      : createCompositeEvaluationQueue([
          createInngestFlowQueue(inngest),
          immediateQueue,
        ]);

  return {
    addFlowEvidence: (flowId, evidence) =>
      addFlowEvidence(flowId, evidence, {
        createEvidenceId: () => crypto.randomUUID(),
        repository,
      }),
    createFlow: () =>
      createFlow({
        createFlowId: () => crypto.randomUUID(),
        repository,
      }),
    getFlow: (flowId) =>
      getFlow(flowId, {
        repository,
      }),
    runFlow: (flowId) =>
      runFlow(flowId, {
        queue,
        repository,
      }),
    setFlowConditions: (flowId, conditions) =>
      setFlowConditions(flowId, conditions, {
        repository,
      }),
    setFlowMetadata: (flowId, metadata) =>
      setFlowMetadata(flowId, metadata, {
        repository,
      }),
  };
}
