import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../source/infrastructure/database/client.js";
import { createDatabaseFlowRepository } from "../../../source/infrastructure/database/evaluation-repository.js";
import { flows } from "../../../source/infrastructure/database/schema.js";
import { createFlowEvidence } from "../../fixtures/evidence.js";

import type { EvaluationResult } from "../../../source/domain/evaluation.js";

const databaseUrl = createDatabaseUrl();
const describeDatabase = databaseUrl === undefined ? describe.skip : describe;
const client =
  databaseUrl === undefined ? undefined : createDatabaseClient(databaseUrl);
const repository =
  client === undefined
    ? undefined
    : createDatabaseFlowRepository(client.database);
const flowId = "flow-repository-test";

const condition = {
  statement: "Access reviews are performed quarterly.",
  criteria: ["Evidence shows a quarterly access review."],
};

const evidence = createFlowEvidence();

const result: EvaluationResult = {
  flowId,
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

describeDatabase("createDatabaseFlowRepository", () => {
  beforeEach(async () => {
    await deleteFlow();
  });

  afterEach(async () => {
    await deleteFlow();
  });

  afterAll(async () => {
    await client?.close();
  });

  it("persists draft flows", async () => {
    await repository?.createDraftFlow(flowId);

    await expect(repository?.getFlow(flowId)).resolves.toEqual({
      conditions: [],
      evidence: [],
      flowId,
      metadata: {},
      status: "draft",
    });
  });

  it("persists metadata, conditions, and evidence", async () => {
    await repository?.createDraftFlow(flowId);
    await repository?.setFlowMetadata(flowId, {
      owner: "Internal Audit",
    });
    await repository?.setFlowConditions(flowId, [condition]);
    await repository?.addFlowEvidence(flowId, [evidence]);

    await expect(repository?.getFlow(flowId)).resolves.toEqual({
      conditions: [condition],
      evidence: [evidence],
      flowId,
      metadata: {
        owner: "Internal Audit",
      },
      status: "draft",
    });
  });

  it("persists queued and running flows", async () => {
    await repository?.createDraftFlow(flowId);
    await repository?.markFlowQueued(flowId);

    await expect(repository?.getFlow(flowId)).resolves.toEqual({
      flowId,
      status: "queued",
    });

    await repository?.markFlowRunning(flowId);

    await expect(repository?.getFlow(flowId)).resolves.toEqual({
      flowId,
      status: "running",
    });
  });

  it("persists completed flow results", async () => {
    await repository?.createDraftFlow(flowId);
    await repository?.completeFlow(result);

    await expect(repository?.getFlow(flowId)).resolves.toEqual(result);
  });

  it("persists failed flows", async () => {
    await repository?.createDraftFlow(flowId);
    await repository?.markFlowFailed(flowId, {
      message: "Could not evaluate evidence.",
    });

    await expect(repository?.getFlow(flowId)).resolves.toEqual({
      flowId,
      status: "failed",
      error: {
        message: "Could not evaluate evidence.",
      },
    });
  });
});

async function deleteFlow() {
  await client?.database.delete(flows).where(eq(flows.id, flowId));
}

function createDatabaseUrl() {
  const port = process.env.DATABASE_PORT ?? "54322";
  const user = process.env.DATABASE_USER ?? "postgres";
  const password = process.env.DATABASE_PASSWORD ?? "postgres";

  return `postgres://${user}:${password}@127.0.0.1:${port}/postgres`;
}
