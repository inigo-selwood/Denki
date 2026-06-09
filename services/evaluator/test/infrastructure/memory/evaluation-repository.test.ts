import { describe, expect, it } from "vitest";

import { createMemoryFlowRepository } from "../../../source/infrastructure/memory/evaluation-repository.js";

const condition = {
  statement: "Access reviews are performed quarterly.",
  criteria: ["Evidence shows a quarterly access review."],
};

const evidence = {
  evidenceId: "evidence-1",
  name: "Quarterly access review policy.pdf",
  content: "Access reviews are performed quarterly.",
};

describe("memory flow repository", () => {
  it("stores and returns draft flows", async () => {
    const repository = createMemoryFlowRepository();

    await repository.createDraftFlow("flow-1");

    await expect(repository.getFlow("flow-1")).resolves.toEqual({
      conditions: [],
      evidence: [],
      flowId: "flow-1",
      metadata: {},
      status: "draft",
    });
  });

  it("returns undefined for missing flows", async () => {
    const repository = createMemoryFlowRepository();

    await expect(repository.getFlow("missing-flow")).resolves.toBeUndefined();
  });

  it("replaces metadata and conditions on draft flows", async () => {
    const repository = createMemoryFlowRepository();

    await repository.createDraftFlow("flow-1");
    await repository.setFlowMetadata("flow-1", {
      owner: "Internal Audit",
    });
    await repository.setFlowConditions("flow-1", [condition]);

    await expect(repository.getFlow("flow-1")).resolves.toEqual({
      conditions: [condition],
      evidence: [],
      flowId: "flow-1",
      metadata: {
        owner: "Internal Audit",
      },
      status: "draft",
    });
  });

  it("appends evidence on draft flows", async () => {
    const repository = createMemoryFlowRepository();

    await repository.createDraftFlow("flow-1");
    await repository.addFlowEvidence("flow-1", [evidence]);

    await expect(repository.getFlow("flow-1")).resolves.toMatchObject({
      evidence: [evidence],
    });
  });

  it("stores and returns queued and running flows", async () => {
    const repository = createMemoryFlowRepository();

    await repository.createDraftFlow("flow-1");
    await repository.markFlowQueued("flow-1");

    await expect(repository.getFlow("flow-1")).resolves.toEqual({
      flowId: "flow-1",
      status: "queued",
    });

    await repository.markFlowRunning("flow-1");

    await expect(repository.getFlow("flow-1")).resolves.toEqual({
      flowId: "flow-1",
      status: "running",
    });
  });

  it("stores and returns completed flows", async () => {
    const repository = createMemoryFlowRepository();
    const result = {
      flowId: "flow-1",
      status: "completed_with_review" as const,
      conditions: [
        {
          conditionId: "condition:0",
          verdict: "requires_manual_review" as const,
          criteria: [
            {
              criterionId: "condition:0:criterion:0",
              verdict: "requires_manual_review" as const,
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

    await repository.completeFlow(result);

    await expect(repository.getFlow("flow-1")).resolves.toEqual(result);
  });

  it("stores and returns failed flows", async () => {
    const repository = createMemoryFlowRepository();

    await repository.markFlowFailed("flow-1", {
      message: "Could not evaluate evidence.",
    });

    await expect(repository.getFlow("flow-1")).resolves.toEqual({
      flowId: "flow-1",
      status: "failed",
      error: {
        message: "Could not evaluate evidence.",
      },
    });
  });
});
