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

export const flowEvidenceSchema = evidenceSchema
  .extend({
    evidenceId: z.string().min(1),
  })
  .openapi("FlowEvidence");

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
  "draft",
  "queued",
  "running",
  "completed",
  "completed_with_review",
  "failed",
]);

export const evaluationResultSchema = z
  .object({
    flowId: z.string().min(1),
    status: z.enum(["completed", "completed_with_review"]),
    conditions: z.array(conditionResultSchema),
  })
  .openapi("FlowResult");

export const flowCreatedSchema = z
  .object({
    flowId: z.string().min(1),
    status: z.literal("draft"),
  })
  .openapi("FlowCreated");

export const flowQueuedSchema = z
  .object({
    flowId: z.string().min(1),
    status: z.literal("queued"),
  })
  .openapi("FlowQueued");

export const flowDraftSchema = z
  .object({
    flowId: z.string().min(1),
    status: z.literal("draft"),
    metadata: z.record(z.string(), z.unknown()).default({}),
    evidenceCount: z.number().int().min(0),
    conditionCount: z.number().int().min(0),
  })
  .openapi("FlowDraft");

export const flowProgressSchema = z
  .object({
    flowId: z.string().min(1),
    status: z.enum(["queued", "running"]),
  })
  .openapi("FlowProgress");

export const failedEvaluationSchema = z
  .object({
    flowId: z.string().min(1),
    status: z.literal("failed"),
    error: z.object({
      message: z.string().min(1),
    }),
  })
  .openapi("FailedFlow");

export const flowMetadataInputSchema = z
  .object({
    metadata: z.record(z.string(), z.unknown()),
  })
  .openapi("FlowMetadataInput");

export const flowConditionsInputSchema = z
  .object({
    conditions: z.array(conditionSchema).min(1),
  })
  .openapi("FlowConditionsInput");

export const flowEvidenceInputSchema = z
  .object({
    evidence: z.array(evidenceSchema).min(1),
  })
  .openapi("FlowEvidenceInput");

export const flowEvidenceAddedSchema = z
  .object({
    flowId: z.string().min(1),
    evidenceIds: z.array(z.string().min(1)),
  })
  .openapi("FlowEvidenceAdded");

export const flowClientErrorSchema = z
  .object({
    error: z.string().min(1),
  })
  .openapi("FlowClientError");

export const evaluationNotFoundSchema = z
  .object({
    error: z.literal("not_found"),
  })
  .openapi("EvaluationNotFound");

export const flowIdParamsSchema = z.object({
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
export type FlowEvidence = z.infer<typeof flowEvidenceSchema>;
export type Condition = z.infer<typeof conditionSchema>;
export type EvaluationRequest = z.infer<typeof evaluationRequestSchema>;
export type CriterionVerdict = z.infer<typeof criterionVerdictSchema>;
export type Confidence = z.infer<typeof confidenceSchema>;
export type CriterionResult = z.infer<typeof criterionResultSchema>;
export type ConditionVerdict = z.infer<typeof conditionVerdictSchema>;
export type ConditionResult = z.infer<typeof conditionResultSchema>;
export type EvaluationStatus = z.infer<typeof evaluationStatusSchema>;
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;
export type FlowCreated = z.infer<typeof flowCreatedSchema>;
export type FlowQueued = z.infer<typeof flowQueuedSchema>;
export type FlowDraft = z.infer<typeof flowDraftSchema>;
export type FlowProgress = z.infer<typeof flowProgressSchema>;
export type FailedEvaluation = z.infer<typeof failedEvaluationSchema>;
export type FlowEvidenceAdded = z.infer<typeof flowEvidenceAddedSchema>;
export type FlowClientError = z.infer<typeof flowClientErrorSchema>;
