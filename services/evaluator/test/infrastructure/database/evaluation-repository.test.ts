import { eq } from "drizzle-orm";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";

import { createDatabaseClient } from "../../../source/infrastructure/database/client.js";
import { createDatabaseEvaluationRepository } from "../../../source/infrastructure/database/evaluation-repository.js";
import { evaluations } from "../../../source/infrastructure/database/schema.js";

import type {
  EvaluationRequest,
  EvaluationResult,
} from "../../../source/domain/evaluation.js";

const databaseUrl = createDatabaseUrl();
const describeDatabase = databaseUrl === undefined ? describe.skip : describe;
const client =
  databaseUrl === undefined ? undefined : createDatabaseClient(databaseUrl);
const repository =
  client === undefined
    ? undefined
    : createDatabaseEvaluationRepository(client.database);
const evaluationId = "evaluation-repository-test";

const request: EvaluationRequest = {
  evidence: [
    {
      name: "Quarterly access review policy.pdf",
      content: "Access reviews are performed quarterly.",
    },
  ],
  conditions: [
    {
      statement: "Access reviews are performed quarterly.",
      criteria: ["Evidence shows a quarterly access review."],
    },
  ],
};

const result: EvaluationResult = {
  evaluationId,
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
          evidenceIds: ["evidence:0"],
        },
      ],
    },
  ],
};

describeDatabase("createDatabaseEvaluationRepository", () => {
  beforeEach(async () => {
    await deleteEvaluation();
  });

  afterEach(async () => {
    await deleteEvaluation();
  });

  afterAll(async () => {
    await client?.close();
  });

  it("persists queued evaluations", async () => {
    await repository?.createQueuedEvaluation({
      evaluationId,
      request,
    });

    await expect(
      repository?.getQueuedEvaluation(evaluationId),
    ).resolves.toEqual({
      evaluationId,
      status: "queued",
      request,
    });
  });

  it("persists completed evaluation results", async () => {
    await repository?.createQueuedEvaluation({
      evaluationId,
      request,
    });

    await repository?.completeEvaluation(result);

    await expect(
      repository?.getQueuedEvaluation(evaluationId),
    ).resolves.toEqual(result);
  });

  it("persists running evaluations", async () => {
    await repository?.createQueuedEvaluation({
      evaluationId,
      request,
    });

    await repository?.markEvaluationRunning(evaluationId);

    await expect(
      repository?.getQueuedEvaluation(evaluationId),
    ).resolves.toEqual({
      evaluationId,
      status: "running",
      request,
    });
  });

  it("persists failed evaluations", async () => {
    await repository?.createQueuedEvaluation({
      evaluationId,
      request,
    });

    await repository?.markEvaluationFailed(evaluationId, {
      message: "Could not evaluate evidence.",
    });

    await expect(
      repository?.getQueuedEvaluation(evaluationId),
    ).resolves.toEqual({
      evaluationId,
      status: "failed",
      error: {
        message: "Could not evaluate evidence.",
      },
    });
  });
});

async function deleteEvaluation() {
  await client?.database
    .delete(evaluations)
    .where(eq(evaluations.id, evaluationId));
}

function createDatabaseUrl() {
  const port = process.env.DATABASE_PORT ?? "54322";
  const user = process.env.DATABASE_USER ?? "postgres";
  const password = process.env.DATABASE_PASSWORD ?? "postgres";

  return `postgres://${user}:${password}@127.0.0.1:${port}/postgres`;
}
