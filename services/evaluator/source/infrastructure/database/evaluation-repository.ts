import { eq } from "drizzle-orm";

import {
  evaluationResultSchema,
  failedEvaluationSchema,
  queuedEvaluationSchema,
} from "../../domain/evaluation.js";
import { evaluations } from "./schema.js";

import type {
  EvaluationRecord,
  EvaluationRepository,
} from "../../application/submit-evaluation.js";
import type { EvaluationResult } from "../../domain/evaluation.js";
import type { createDatabaseClient } from "./client.js";

type Database = ReturnType<typeof createDatabaseClient>["database"];

export function createDatabaseEvaluationRepository(
  database: Database,
): EvaluationRepository {
  return {
    async createQueuedEvaluation(input) {
      await database.insert(evaluations).values({
        id: input.evaluationId,
        status: "queued",
        request: input.request,
      });
    },
    async getQueuedEvaluation(evaluationId) {
      const [row] = await database
        .select()
        .from(evaluations)
        .where(eq(evaluations.id, evaluationId))
        .limit(1);

      if (row === undefined) {
        return undefined;
      }

      return parseEvaluationRecord(row);
    },
    async markEvaluationRunning(evaluationId) {
      await database
        .update(evaluations)
        .set({
          status: "running",
        })
        .where(eq(evaluations.id, evaluationId));
    },
    async markEvaluationFailed(evaluationId, error) {
      await database
        .update(evaluations)
        .set({
          error,
          status: "failed",
        })
        .where(eq(evaluations.id, evaluationId));
    },
    async completeEvaluation(result: EvaluationResult) {
      await database
        .update(evaluations)
        .set({
          result,
          status: result.status,
        })
        .where(eq(evaluations.id, result.evaluationId));
    },
  };
}

function parseEvaluationRecord(row: typeof evaluations.$inferSelect) {
  if (row.result !== null) {
    return evaluationResultSchema.parse(row.result);
  }

  if (row.status === "failed" && row.error !== null) {
    return failedEvaluationSchema.parse({
      evaluationId: row.id,
      status: row.status,
      error: row.error,
    });
  }

  return queuedEvaluationSchema.parse({
    evaluationId: row.id,
    status: row.status,
    request: row.request,
  }) satisfies EvaluationRecord;
}
