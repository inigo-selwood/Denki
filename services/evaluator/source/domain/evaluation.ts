import { z } from "@hono/zod-openapi";

export const evidenceSchema = z
  .object({
    name: z.string().min(1).openapi({
      description:
        "Human-readable evidence name, such as a filename, email subject, report title, or export name.",
      example: "Quarterly access review policy.pdf",
    }),
    content: z.union([
      z.string().min(1),
      z.record(z.string(), z.unknown()),
      z.array(z.unknown()),
    ]),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .openapi("Evidence");

export const conditionSchema = z
  .object({
    statement: z.string().min(1),
    criteria: z.array(z.string().min(1)).min(1),
  })
  .openapi("Condition");

export const evaluationRequestSchema = z
  .object({
    evidence: z.array(evidenceSchema).min(1),
    conditions: z.array(conditionSchema).min(1),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .openapi("EvaluationRequest");

export const criterionVerdictSchema = z.enum([
  "met",
  "failed",
  "requires_manual_review",
]);

export const confidenceSchema = z
  .object({
    score: z.number().min(0).max(1),
    factors: z.array(z.string().min(1)).default([]),
  })
  .openapi("Confidence");

export const criterionResultSchema = z
  .object({
    criterionId: z.string().min(1),
    verdict: criterionVerdictSchema,
    confidence: confidenceSchema,
    rationale: z.string().min(1),
    evidenceIds: z.array(z.string().min(1)).default([]),
  })
  .openapi("CriterionResult");

export const conditionVerdictSchema = criterionVerdictSchema;

export const conditionResultSchema = z
  .object({
    conditionId: z.string().min(1),
    verdict: conditionVerdictSchema,
    criteria: z.array(criterionResultSchema).min(1),
  })
  .openapi("ConditionResult");

export const evaluationStatusSchema = z.enum([
  "queued",
  "running",
  "completed",
  "completed_with_review",
  "failed",
]);

export const evaluationResultSchema = z
  .object({
    evaluationId: z.string().min(1),
    status: evaluationStatusSchema,
    conditions: z.array(conditionResultSchema),
  })
  .openapi("EvaluationResult");

export const evaluationAcceptedSchema = z
  .object({
    evaluationId: z.string().min(1),
    status: z.literal("queued"),
  })
  .openapi("EvaluationAccepted");

export const queuedEvaluationSchema = z
  .object({
    evaluationId: z.string().min(1),
    status: z.literal("queued"),
    request: evaluationRequestSchema,
  })
  .openapi("QueuedEvaluation");

export const evaluationNotFoundSchema = z
  .object({
    error: z.literal("not_found"),
  })
  .openapi("EvaluationNotFound");

export const evaluationIdParamsSchema = z.object({
  id: z
    .string()
    .min(1)
    .openapi({
      param: {
        name: "id",
        in: "path",
      },
    }),
});

export type Evidence = z.infer<typeof evidenceSchema>;
export type Condition = z.infer<typeof conditionSchema>;
export type EvaluationRequest = z.infer<typeof evaluationRequestSchema>;
export type CriterionVerdict = z.infer<typeof criterionVerdictSchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type CriterionResult = z.infer<typeof criterionResultSchema>;
export type ConditionVerdict = z.infer<typeof conditionVerdictSchema>;
export type ConditionResult = z.infer<typeof conditionResultSchema>;
export type EvaluationStatus = z.infer<typeof evaluationStatusSchema>;
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
export type EvaluationAccepted = z.infer<typeof evaluationAcceptedSchema>;
export type QueuedEvaluation = z.infer<typeof queuedEvaluationSchema>;
