import { describe, expect, it } from "vitest";

import {
  addFlowEvidence,
  createFlow,
  evaluateFlow,
  FlowClientError,
  FlowNotFoundError,
  FlowUnsupportedMediaTypeError,
  getFlow,
  runFlow,
  setFlowConditions,
  setFlowMetadata,
} from "../../source/application/flows.js";
import { createMemoryFlowRepository } from "../../source/infrastructure/memory/evaluation-repository.js";

import type {
  DocumentIngestionProvider,
  FlowQueue,
  FlowRepository,
  FlowRun,
} from "../../source/application/flows.js";
import type { FlowEvidence } from "../../source/domain/evaluation.js";

const condition = {
  statement: "Access reviews are performed quarterly.",
  criteria: ["Evidence shows a quarterly access review."],
};

describe("flow application", () => {
  it("creates draft flows", async () => {
    const repository = createMemoryFlowRepository();

    await expect(
      createFlow({
        createFlowId: () => "flow-1",
        repository,
      }),
    ).resolves.toEqual({
      flowId: "flow-1",
      status: "draft",
    });

    await expect(getFlow("flow-1", { repository })).resolves.toEqual({
      conditionCount: 0,
      evidenceCount: 0,
      flowId: "flow-1",
      metadata: {},
      status: "draft",
    });
  });

  it("sets metadata and conditions while draft", async () => {
    const repository = createMemoryFlowRepository();

    await repository.createDraftFlow("flow-1");

    await expect(
      setFlowMetadata("flow-1", { owner: "Internal Audit" }, { repository }),
    ).resolves.toEqual({
      conditionCount: 0,
      evidenceCount: 0,
      flowId: "flow-1",
      metadata: {
        owner: "Internal Audit",
      },
      status: "draft",
    });

    await expect(
      setFlowConditions("flow-1", [condition], { repository }),
    ).resolves.toEqual({
      conditionCount: 1,
      evidenceCount: 0,
      flowId: "flow-1",
      metadata: {
        owner: "Internal Audit",
      },
      status: "draft",
    });
  });

  it("ingests evidence with generated evidence IDs before persisting", async () => {
    const repository = createMemoryFlowRepository();
    const ingested: string[] = [];

    await repository.createDraftFlow("flow-1");

    await expect(
      addFlowEvidence("flow-1", createUpload(), {
        createEvidenceId: () => "evidence-1",
        ingestionProvider: {
          async ingest(input) {
            ingested.push(input.evidenceId);

            return createEvidence(input.evidenceId);
          },
        },
        repository,
      }),
    ).resolves.toEqual({
      evidenceIds: ["evidence-1"],
      flowId: "flow-1",
    });
    expect(ingested).toEqual(["evidence-1"]);

    await expect(getFlow("flow-1", { repository })).resolves.toMatchObject({
      evidenceCount: 1,
    });
  });

  it("does not persist evidence when ingestion fails", async () => {
    const repository = createMemoryFlowRepository();

    await repository.createDraftFlow("flow-1");

    await expect(
      addFlowEvidence("flow-1", createUpload(), {
        createEvidenceId: () => "evidence-1",
        ingestionProvider: {
          async ingest() {
            throw new Error("Reducto parse failed.");
          },
        },
        repository,
      }),
    ).rejects.toThrow("Reducto parse failed.");

    await expect(getFlow("flow-1", { repository })).resolves.toMatchObject({
      evidenceCount: 0,
    });
  });

  it("rejects unsupported evidence file formats", async () => {
    const repository = createMemoryFlowRepository();

    await repository.createDraftFlow("flow-1");

    await expect(
      addFlowEvidence(
        "flow-1",
        {
          ...createUpload(),
          filename: "notes.exe",
          mimeType: "application/x-msdownload",
        },
        {
          createEvidenceId: () => "evidence-1",
          ingestionProvider: createIngestionProvider(),
          repository,
        },
      ),
    ).rejects.toThrow(FlowUnsupportedMediaTypeError);
  });

  it("rejects running flows without evidence and conditions", async () => {
    const repository = createMemoryFlowRepository();
    const queue = createQueue();

    await repository.createDraftFlow("flow-1");

    await expect(runFlow("flow-1", { queue, repository })).rejects.toThrow(
      FlowClientError,
    );
  });

  it("queues assembled draft flows", async () => {
    const repository = createMemoryFlowRepository();
    const queue = createQueue();

    await repository.createDraftFlow("flow-1");
    await repository.setFlowConditions("flow-1", [condition]);
    await repository.addFlowEvidence("flow-1", [createEvidence("evidence-1")]);

    await expect(runFlow("flow-1", { queue, repository })).resolves.toEqual({
      flowId: "flow-1",
      status: "queued",
    });
    expect(queue.enqueued).toEqual([
      {
        flowId: "flow-1",
        request: {
          conditions: [condition],
          evidence: [createEvidence("evidence-1")],
          metadata: {},
        },
      },
    ]);
    await expect(getFlow("flow-1", { repository })).resolves.toEqual({
      flowId: "flow-1",
      status: "queued",
    });
  });

  it("rejects changing flows after run", async () => {
    const repository = createMemoryFlowRepository();

    await repository.createDraftFlow("flow-1");
    await repository.markFlowQueued("flow-1");

    await expect(
      setFlowMetadata("flow-1", { owner: "Internal Audit" }, { repository }),
    ).rejects.toThrow(FlowClientError);
  });

  it("throws not found for missing mutable flows", async () => {
    const repository = createMemoryFlowRepository();

    await expect(
      setFlowConditions("missing-flow", [condition], { repository }),
    ).rejects.toThrow(FlowNotFoundError);
  });

  it("evaluates queued flow runs and persists completed results", async () => {
    const repository = createMemoryFlowRepository();
    const run = {
      flowId: "flow-1",
      request: {
        conditions: [condition],
        evidence: [createEvidence("evidence-1")],
        metadata: {},
      },
    };

    await repository.createDraftFlow("flow-1");
    await repository.markFlowQueued("flow-1");

    const result = await evaluateFlow(run, { repository });

    expect(result.flowId).toBe("flow-1");
    expect(result.status).toBe("completed_with_review");
    expect(result.conditions[0]?.criteria[0]?.evidenceIds).toEqual([
      "evidence-1",
    ]);
    await expect(getFlow("flow-1", { repository })).resolves.toEqual(result);
  });

  it("marks flow failed before propagating execution errors", async () => {
    const error = new Error("Could not persist result.");
    const repository: FlowRepository = {
      async addFlowEvidence() {},
      async completeFlow() {
        throw error;
      },
      async createDraftFlow() {},
      async getFlow() {
        return undefined;
      },
      async markFlowFailed(flowId, failure) {
        expect(flowId).toBe("flow-1");
        expect(failure.message).toBe("Could not persist result.");
      },
      async markFlowQueued() {},
      async markFlowRunning(flowId) {
        expect(flowId).toBe("flow-1");
      },
      async setFlowConditions() {},
      async setFlowMetadata() {},
    };

    await expect(
      evaluateFlow(
        {
          flowId: "flow-1",
          request: {
            conditions: [condition],
            evidence: [createEvidence("evidence-1")],
            metadata: {},
          },
        },
        { repository },
      ),
    ).rejects.toThrow(error);
  });
});

function createUpload() {
  return {
    content: new Uint8Array([1, 2, 3]),
    documentType: "policy_or_contract" as const,
    filename: "Quarterly access review policy.pdf",
    metadata: {
      owner: "Internal Audit",
    },
    mimeType: "application/pdf",
    sizeBytes: 3,
  };
}

function createEvidence(evidenceId: string): FlowEvidence {
  return {
    evidenceId,
    documentType: "policy_or_contract",
    name: "Quarterly access review policy.pdf",
    originalFile: {
      filename: "Quarterly access review policy.pdf",
      mimeType: "application/pdf",
      sizeBytes: 3,
    },
    metadata: {
      owner: "Internal Audit",
    },
    ingestion: {
      provider: "reducto",
      providerFileId: "reducto://file-1",
      providerJobId: "job-1",
      text: "Access reviews are performed quarterly.",
      blocks: [
        {
          blockId: "chunk:0:block:0",
          type: "Text",
          content: "Access reviews are performed quarterly.",
          page: 1,
          bbox: {
            page: 1,
            left: 0.1,
            top: 0.2,
            width: 0.3,
            height: 0.4,
          },
          confidenceLabel: "high",
        },
      ],
    },
  };
}

function createIngestionProvider(): DocumentIngestionProvider {
  return {
    async ingest(input) {
      return createEvidence(input.evidenceId);
    },
  };
}

function createQueue(): FlowQueue & { enqueued: FlowRun[] } {
  const enqueued: FlowRun[] = [];

  return {
    enqueued,
    async enqueueFlow(input) {
      enqueued.push(input);
    },
  };
}
