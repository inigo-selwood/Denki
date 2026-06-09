import { eq } from "drizzle-orm";

import {
  evaluationResultSchema,
  failedEvaluationSchema,
} from "../../domain/evaluation.js";
import { flows } from "./schema.js";

import type {
  FlowDraftRecord,
  FlowRecord,
  FlowRepository,
} from "../../application/flows.js";
import type { EvaluationResult } from "../../domain/evaluation.js";
import type { createDatabaseClient } from "./client.js";

type Database = ReturnType<typeof createDatabaseClient>["database"];

export function createDatabaseFlowRepository(
  database: Database,
): FlowRepository {
  return {
    async addFlowEvidence(flowId, evidence) {
      const flow = await getDraftFlow(database, flowId);

      await database
        .update(flows)
        .set({
          evidence: [...flow.evidence, ...evidence],
        })
        .where(eq(flows.id, flowId));
    },
    async completeFlow(result: EvaluationResult) {
      await database
        .update(flows)
        .set({
          result,
          status: result.status,
        })
        .where(eq(flows.id, result.flowId));
    },
    async createDraftFlow(flowId) {
      await database.insert(flows).values({
        conditions: [],
        evidence: [],
        id: flowId,
        metadata: {},
        status: "draft",
      });
    },
    async getFlow(flowId) {
      const [row] = await database
        .select()
        .from(flows)
        .where(eq(flows.id, flowId))
        .limit(1);

      if (row === undefined) {
        return undefined;
      }

      return parseFlowRecord(row);
    },
    async markFlowFailed(flowId, error) {
      await database
        .update(flows)
        .set({
          error,
          status: "failed",
        })
        .where(eq(flows.id, flowId));
    },
    async markFlowQueued(flowId) {
      await database
        .update(flows)
        .set({
          status: "queued",
        })
        .where(eq(flows.id, flowId));
    },
    async markFlowRunning(flowId) {
      await database
        .update(flows)
        .set({
          status: "running",
        })
        .where(eq(flows.id, flowId));
    },
    async setFlowConditions(flowId, conditions) {
      await database
        .update(flows)
        .set({
          conditions,
        })
        .where(eq(flows.id, flowId));
    },
    async setFlowMetadata(flowId, metadata) {
      await database
        .update(flows)
        .set({
          metadata,
        })
        .where(eq(flows.id, flowId));
    },
  };
}

async function getDraftFlow(
  database: Database,
  flowId: string,
): Promise<FlowDraftRecord> {
  const [row] = await database
    .select()
    .from(flows)
    .where(eq(flows.id, flowId))
    .limit(1);

  const flow = row === undefined ? undefined : parseFlowRecord(row);

  if (flow === undefined || flow.status !== "draft") {
    throw new Error(`Draft flow not found: ${flowId}`);
  }

  return flow;
}

function parseFlowRecord(row: typeof flows.$inferSelect): FlowRecord {
  if (row.result !== null) {
    return evaluationResultSchema.parse(row.result);
  }

  if (row.status === "failed" && row.error !== null) {
    return failedEvaluationSchema.parse({
      error: row.error,
      flowId: row.id,
      status: row.status,
    });
  }

  if (row.status === "queued" || row.status === "running") {
    return {
      flowId: row.id,
      status: row.status,
    };
  }

  return {
    conditions: row.conditions,
    evidence: row.evidence,
    flowId: row.id,
    metadata: row.metadata,
    status: "draft",
  };
}
