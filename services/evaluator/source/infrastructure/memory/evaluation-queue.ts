import type { FlowQueue, FlowRun } from "../../application/flows.js";

export type FlowExecutor = (input: FlowRun) => Promise<void>;

export function createImmediateEvaluationQueue(
  executeEvaluation: FlowExecutor,
): FlowQueue {
  return {
    async enqueueFlow(input) {
      await executeEvaluation(input);
    },
  };
}

export function createCompositeEvaluationQueue(
  queues: FlowQueue[],
): FlowQueue {
  return {
    async enqueueFlow(input) {
      for (const queue of queues) {
        await queue.enqueueFlow(input);
      }
    },
  };
}
