import { jsonb, pgTable, text } from "drizzle-orm/pg-core";

import type {
  Condition,
  EvaluationRequest,
  EvaluationResult,
  EvaluationStatus,
  FailedEvaluation,
  FlowEvidence,
} from "../../domain/evaluation.js";

export const flows = pgTable("flows", {
  id: text("id").primaryKey(),
  status: text("status").$type<EvaluationStatus>().notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull(),
  conditions: jsonb("conditions").$type<Condition[]>().notNull(),
  evidence: jsonb("evidence").$type<FlowEvidence[]>().notNull(),
  request: jsonb("request").$type<EvaluationRequest>(),
  result: jsonb("result").$type<EvaluationResult>(),
  error: jsonb("error").$type<FailedEvaluation["error"]>(),
});
