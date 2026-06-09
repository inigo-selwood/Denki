import { describe, expect, it } from "vitest";

import { FlowClientError } from "../source/application/flows.js";
import { createHttpApplication } from "../source/inbound/http/application.js";

import type {
  EvaluationResult,
  FailedEvaluation,
  FlowDraft,
  FlowQueued,
} from "../source/domain/evaluation.js";

const condition = {
  statement: "Access reviews are performed quarterly.",
  criteria: ["Evidence shows a quarterly access review."],
};

const evidence = {
  name: "Quarterly access review policy.pdf",
  content: "Access reviews are performed quarterly.",
};

describe("flow endpoints", () => {
  const draftFlow: FlowDraft = {
    conditionCount: 0,
    evidenceCount: 0,
    flowId: "flow-1",
    metadata: {},
    status: "draft",
  };

  const queuedFlow: FlowQueued = {
    flowId: "flow-1",
    status: "queued",
  };

  const completedFlow: EvaluationResult = {
    flowId: "flow-1",
    status: "completed_with_review",
    conditions: [
      {
        conditionId: "condition:0",
        verdict: "requires_manual_review",
        criteria: [
          {
            criterionId: "condition:0:criterion:0",
            verdict: "requires_manual_review",
            confidence: {
              score: 0,
              factors: [
                "Placeholder evaluator has not performed evidence analysis.",
              ],
            },
            rationale:
              "Manual review required for criterion: Evidence shows a quarterly access review.",
            evidenceIds: ["evidence-1"],
          },
        ],
      },
    ],
  };

  const failedFlow: FailedEvaluation = {
    flowId: "flow-1",
    status: "failed",
    error: {
      message: "Could not evaluate evidence.",
    },
  };

  it("creates draft flows", async () => {
    const application = createHttpApplication({
      async addFlowEvidence() {
        return {
          evidenceIds: [],
          flowId: "flow-1",
        };
      },
      async createFlow() {
        return {
          flowId: "flow-1",
          status: "draft",
        };
      },
      async getFlow() {
        return undefined;
      },
      async runFlow() {
        return queuedFlow;
      },
      async setFlowConditions() {
        return draftFlow;
      },
      async setFlowMetadata() {
        return draftFlow;
      },
    });

    const response = await application.request("/flows", {
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({
      flowId: "flow-1",
      status: "draft",
    });
    expect(response.status).toBe(201);
  });

  it("replaces flow metadata", async () => {
    const application = createHttpApplication({
      async addFlowEvidence() {
        return {
          evidenceIds: [],
          flowId: "flow-1",
        };
      },
      async createFlow() {
        return {
          flowId: "flow-1",
          status: "draft",
        };
      },
      async getFlow() {
        return undefined;
      },
      async runFlow() {
        return queuedFlow;
      },
      async setFlowConditions() {
        return draftFlow;
      },
      async setFlowMetadata(flowId, metadata) {
        return {
          ...draftFlow,
          flowId,
          metadata,
        };
      },
    });

    const response = await application.request("/flows/flow-1/metadata", {
      body: JSON.stringify({
        metadata: {
          owner: "Internal Audit",
        },
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "PUT",
    });

    await expect(response.json()).resolves.toEqual({
      ...draftFlow,
      metadata: {
        owner: "Internal Audit",
      },
    });
    expect(response.status).toBe(200);
  });

  it("replaces flow conditions", async () => {
    const application = createHttpApplication({
      async addFlowEvidence() {
        return {
          evidenceIds: [],
          flowId: "flow-1",
        };
      },
      async createFlow() {
        return {
          flowId: "flow-1",
          status: "draft",
        };
      },
      async getFlow() {
        return undefined;
      },
      async runFlow() {
        return queuedFlow;
      },
      async setFlowConditions(flowId, conditions) {
        return {
          ...draftFlow,
          conditionCount: conditions.length,
          flowId,
        };
      },
      async setFlowMetadata() {
        return draftFlow;
      },
    });

    const response = await application.request("/flows/flow-1/conditions", {
      body: JSON.stringify({
        conditions: [condition],
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "PUT",
    });

    await expect(response.json()).resolves.toEqual({
      ...draftFlow,
      conditionCount: 1,
    });
    expect(response.status).toBe(200);
  });

  it("adds flow evidence and returns evidence IDs", async () => {
    const application = createHttpApplication({
      async addFlowEvidence(flowId) {
        return {
          evidenceIds: ["evidence-1"],
          flowId,
        };
      },
      async createFlow() {
        return {
          flowId: "flow-1",
          status: "draft",
        };
      },
      async getFlow() {
        return undefined;
      },
      async runFlow() {
        return queuedFlow;
      },
      async setFlowConditions() {
        return draftFlow;
      },
      async setFlowMetadata() {
        return draftFlow;
      },
    });

    const response = await application.request("/flows/flow-1/evidence", {
      body: JSON.stringify({
        evidence: [evidence],
      }),
      headers: {
        "content-type": "application/json",
      },
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({
      evidenceIds: ["evidence-1"],
      flowId: "flow-1",
    });
    expect(response.status).toBe(200);
  });

  it("rejects invalid flow runs", async () => {
    const application = createHttpApplication({
      async addFlowEvidence() {
        return {
          evidenceIds: [],
          flowId: "flow-1",
        };
      },
      async createFlow() {
        return {
          flowId: "flow-1",
          status: "draft",
        };
      },
      async getFlow() {
        return undefined;
      },
      async runFlow() {
        throw new FlowClientError("Flow requires at least one evidence item.");
      },
      async setFlowConditions() {
        return draftFlow;
      },
      async setFlowMetadata() {
        return draftFlow;
      },
    });

    const response = await application.request("/flows/flow-1/run", {
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({
      error: "Flow requires at least one evidence item.",
    });
    expect(response.status).toBe(400);
  });

  it("queues valid flow runs", async () => {
    const application = createHttpApplication({
      async addFlowEvidence() {
        return {
          evidenceIds: [],
          flowId: "flow-1",
        };
      },
      async createFlow() {
        return {
          flowId: "flow-1",
          status: "draft",
        };
      },
      async getFlow() {
        return undefined;
      },
      async runFlow(flowId) {
        return {
          flowId,
          status: "queued",
        };
      },
      async setFlowConditions() {
        return draftFlow;
      },
      async setFlowMetadata() {
        return draftFlow;
      },
    });

    const response = await application.request("/flows/flow-1/run", {
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({
      flowId: "flow-1",
      status: "queued",
    });
    expect(response.status).toBe(202);
  });

  it.each([
    ["draft", draftFlow],
    ["queued", queuedFlow],
    ["failed", failedFlow],
    ["completed", completedFlow],
  ])("returns %s flow state", async (_status, flow) => {
    const application = createHttpApplication({
      async addFlowEvidence() {
        return {
          evidenceIds: [],
          flowId: "flow-1",
        };
      },
      async createFlow() {
        return {
          flowId: "flow-1",
          status: "draft",
        };
      },
      async getFlow() {
        return flow;
      },
      async runFlow() {
        return queuedFlow;
      },
      async setFlowConditions() {
        return draftFlow;
      },
      async setFlowMetadata() {
        return draftFlow;
      },
    });

    const response = await application.request("/flows/flow-1");

    await expect(response.json()).resolves.toEqual(flow);
    expect(response.status).toBe(200);
  });

  it("returns not found for missing flows", async () => {
    const application = createHttpApplication({
      async addFlowEvidence() {
        return {
          evidenceIds: [],
          flowId: "flow-1",
        };
      },
      async createFlow() {
        return {
          flowId: "flow-1",
          status: "draft",
        };
      },
      async getFlow() {
        return undefined;
      },
      async runFlow() {
        return queuedFlow;
      },
      async setFlowConditions() {
        return draftFlow;
      },
      async setFlowMetadata() {
        return draftFlow;
      },
    });

    const response = await application.request("/flows/missing");

    await expect(response.json()).resolves.toEqual({
      error: "not_found",
    });
    expect(response.status).toBe(404);
  });

  it("does not expose the old evaluations endpoint", async () => {
    const application = createHttpApplication();

    const response = await application.request("/evaluations", {
      method: "POST",
    });

    expect(response.status).toBe(404);
  });
});
