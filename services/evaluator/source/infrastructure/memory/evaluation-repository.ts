import type { FlowRecord, FlowRepository } from "../../application/flows.js";
import type { EvaluationResult } from "../../domain/evaluation.js";

export function createMemoryFlowRepository(): FlowRepository {
  const flows = new Map<string, FlowRecord>();

  return {
    async addFlowEvidence(flowId, evidence) {
      const flow = flows.get(flowId);

      if (flow === undefined || flow.status !== "draft") {
        return;
      }

      flows.set(flowId, {
        ...flow,
        evidence: [...flow.evidence, ...evidence],
      });
    },
    async completeFlow(result: EvaluationResult) {
      flows.set(result.flowId, result);
    },
    async createDraftFlow(flowId) {
      flows.set(flowId, {
        conditions: [],
        evidence: [],
        flowId,
        metadata: {},
        status: "draft",
      });
    },
    async getFlow(flowId) {
      return flows.get(flowId);
    },
    async markFlowFailed(flowId, error) {
      flows.set(flowId, {
        error,
        flowId,
        status: "failed",
      });
    },
    async markFlowQueued(flowId) {
      const flow = flows.get(flowId);

      if (flow === undefined) {
        return;
      }

      flows.set(flowId, {
        flowId,
        status: "queued",
      });
    },
    async markFlowRunning(flowId) {
      const flow = flows.get(flowId);

      if (flow === undefined) {
        return;
      }

      flows.set(flowId, {
        flowId,
        status: "running",
      });
    },
    async setFlowConditions(flowId, conditions) {
      const flow = flows.get(flowId);

      if (flow === undefined || flow.status !== "draft") {
        return;
      }

      flows.set(flowId, {
        ...flow,
        conditions,
      });
    },
    async setFlowMetadata(flowId, metadata) {
      const flow = flows.get(flowId);

      if (flow === undefined || flow.status !== "draft") {
        return;
      }

      flows.set(flowId, {
        ...flow,
        metadata,
      });
    },
  };
}
