import { jsonb, pgTable, text } from "drizzle-orm/pg-core";

import type {
  EvaluationRequest,
  EvaluationResult,
  EvaluationStatus,
  FailedEvaluation,
} from "../../domain/evaluation.js";

export const evaluations = pgTable("evaluations", {
  id: text("id").primaryKey(),
  status: text("status").$type<EvaluationStatus>().notNull(),
  request: jsonb("request").$type<EvaluationRequest>().notNull(),
  result: jsonb("result").$type<EvaluationResult>(),
  error: jsonb("error").$type<FailedEvaluation["error"]>(),
});
