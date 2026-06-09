import { describe, expect, it } from "vitest";

import {
  addFlowEvidence,
  createFlow,
  evaluateFlow,
  FlowClientError,
  FlowNotFoundError,
  getFlow,
  runFlow,
  setFlowConditions,
  setFlowMetadata,
} from "../../source/application/flows.js";
import { createMemoryFlowRepository } from "../../source/infrastructure/memory/evaluation-repository.js";

import type {
  FlowQueue,
  FlowRepository,
  FlowRun,
} from "../../source/application/flows.js";

const condition = {
  statement: "Access reviews are performed quarterly.",
  criteria: ["Evidence shows a quarterly access review."],
};

const evidence = {
  name: "Quarterly access review policy.pdf",
  content: "Access reviews are performed quarterly.",
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

  it("adds evidence with generated evidence IDs", async () => {
    const repository = createMemoryFlowRepository();

    await repository.createDraftFlow("flow-1");

    await expect(
      addFlowEvidence("flow-1", [evidence], {
        createEvidenceId: () => "evidence-1",
        repository,
      }),
    ).resolves.toEqual({
      evidenceIds: ["evidence-1"],
      flowId: "flow-1",
    });

    await expect(getFlow("flow-1", { repository })).resolves.toMatchObject({
      evidenceCount: 1,
    });
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
    await repository.addFlowEvidence("flow-1", [
      {
        ...evidence,
        evidenceId: "evidence-1",
      },
    ]);

    await expect(runFlow("flow-1", { queue, repository })).resolves.toEqual({
      flowId: "flow-1",
      status: "queued",
    });
    expect(queue.enqueued).toEqual([
      {
        flowId: "flow-1",
        request: {
          conditions: [condition],
          evidence: [
            {
              ...evidence,
              evidenceId: "evidence-1",
            },
          ],
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
        evidence: [
          {
            ...evidence,
            evidenceId: "evidence-1",
          },
        ],
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
            evidence: [{ ...evidence, evidenceId: "evidence-1" }],
            metadata: {},
          },
        },
        { repository },
      ),
    ).rejects.toThrow(error);
  });
});

function createQueue(): FlowQueue & { enqueued: FlowRun[] } {
  const enqueued: FlowRun[] = [];

  return {
    enqueued,
    async enqueueFlow(input) {
      enqueued.push(input);
    },
  };
}
