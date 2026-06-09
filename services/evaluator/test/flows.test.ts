import { describe, expect, it } from "vitest";

import {
  FlowClientError,
  FlowUnsupportedMediaTypeError,
} from "../source/application/flows.js";
import { createHttpApplication } from "../source/inbound/http/application.js";

import type {
  EvaluationResult,
  FailedEvaluation,
  FlowDraft,
  FlowQueued,
} from "../source/domain/evaluation.js";
import type { HttpApplicationDependencies } from "../source/inbound/http/application.js";

const condition = {
  statement: "Access reviews are performed quarterly.",
  criteria: ["Evidence shows a quarterly access review."],
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

  it("uploads flow evidence and returns evidence IDs", async () => {
    const application = createHttpApplication({
      async addFlowEvidence(flowId, upload) {
        expect(upload).toMatchObject({
          documentType: "policy_or_contract",
          filename: "Quarterly access review policy.pdf",
          metadata: {
            owner: "Internal Audit",
          },
          mimeType: "application/pdf",
          sizeBytes: 3,
        });
        expect([...upload.content]).toEqual([1, 2, 3]);

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
    const form = createEvidenceForm();

    const response = await application.request("/flows/flow-1/evidence", {
      body: form,
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({
      evidenceIds: ["evidence-1"],
      flowId: "flow-1",
    });
    expect(response.status).toBe(200);
  });

  it("rejects evidence upload without a file", async () => {
    const application = createHttpApplication(createDependencies());
    const form = new FormData();

    form.set("documentType", "policy_or_contract");

    const response = await application.request("/flows/flow-1/evidence", {
      body: form,
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({
      error: "Evidence upload requires a file.",
    });
    expect(response.status).toBe(400);
  });

  it("rejects evidence upload without a document type", async () => {
    const application = createHttpApplication(createDependencies());
    const form = createEvidenceForm();

    form.delete("documentType");

    const response = await application.request("/flows/flow-1/evidence", {
      body: form,
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({
      error: "Evidence upload requires a documentType.",
    });
    expect(response.status).toBe(400);
  });

  it("rejects unsupported document types", async () => {
    const application = createHttpApplication(createDependencies());
    const form = createEvidenceForm();

    form.set("documentType", "random_document");

    const response = await application.request("/flows/flow-1/evidence", {
      body: form,
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({
      error: "Unsupported documentType.",
    });
    expect(response.status).toBe(400);
  });

  it("rejects unsupported evidence file formats", async () => {
    const application = createHttpApplication({
      ...createDependencies(),
      async addFlowEvidence() {
        throw new FlowUnsupportedMediaTypeError(
          "application/x-msdownload",
          "notes.exe",
        );
      },
    });

    const response = await application.request("/flows/flow-1/evidence", {
      body: createEvidenceForm(),
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({
      error: "Unsupported evidence file type: application/x-msdownload",
    });
    expect(response.status).toBe(415);
  });

  it("returns client errors when evidence upload is not allowed", async () => {
    const application = createHttpApplication({
      ...createDependencies(),
      async addFlowEvidence() {
        throw new FlowClientError(
          "Flow can only be changed while it is draft.",
        );
      },
    });

    const response = await application.request("/flows/flow-1/evidence", {
      body: createEvidenceForm(),
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({
      error: "Flow can only be changed while it is draft.",
    });
    expect(response.status).toBe(400);
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

function createDependencies(
  overrides: Partial<HttpApplicationDependencies> = {},
): HttpApplicationDependencies {
  return {
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
      return {
        flowId: "flow-1",
        status: "queued",
      };
    },
    async setFlowConditions() {
      return {
        conditionCount: 0,
        evidenceCount: 0,
        flowId: "flow-1",
        metadata: {},
        status: "draft",
      };
    },
    async setFlowMetadata() {
      return {
        conditionCount: 0,
        evidenceCount: 0,
        flowId: "flow-1",
        metadata: {},
        status: "draft",
      };
    },
    ...overrides,
  };
}

function createEvidenceForm(): FormData {
  const form = new FormData();

  form.set(
    "file",
    new File(
      [new Uint8Array([1, 2, 3])],
      "Quarterly access review policy.pdf",
      {
        type: "application/pdf",
      },
    ),
  );
  form.set("documentType", "policy_or_contract");
  form.set(
    "metadata",
    JSON.stringify({
      owner: "Internal Audit",
    }),
  );

  return form;
}
