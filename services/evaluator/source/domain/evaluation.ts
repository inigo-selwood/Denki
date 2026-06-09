import { z } from "@hono/zod-openapi";

export const documentTypeSchema = z
  .enum([
    "invoice",
    "spreadsheet",
    "platform_screenshot",
    "policy_or_contract",
    "report_or_statement",
    "generic_document",
  ])
  .openapi("DocumentType");

export const boundingBoxSchema = z
  .object({
    page: z.number().int().min(1),
    left: z.number(),
    top: z.number(),
    width: z.number(),
    height: z.number(),
  })
  .openapi("BoundingBox");

export const evidenceBlockSchema = z
  .object({
    blockId: z.string().min(1),
    type: z.string().min(1),
    content: z.union([
      z.string(),
      z.record(z.string(), z.unknown()),
      z.array(z.unknown()),
    ]),
    page: z.number().int().min(1),
    bbox: boundingBoxSchema,
    confidenceLabel: z.string().min(1).optional(),
    sourceText: z.string().min(1).optional(),
  })
  .openapi("EvidenceBlock");

export const evidenceIngestionSchema = z
  .object({
    provider: z.literal("reducto"),
    providerFileId: z.string().min(1).optional(),
    providerJobId: z.string().min(1).optional(),
    studioLink: z.string().url().optional(),
    durationSeconds: z.number().min(0).optional(),
    usage: z.record(z.string(), z.unknown()).optional(),
    text: z.string(),
    blocks: z.array(evidenceBlockSchema),
  })
  .openapi("EvidenceIngestion");

export const evidenceSchema = z
  .object({
    name: z.string().min(1).openapi({
      description:
        "Human-readable evidence name, such as a filename, email subject, report title, or export name.",
      example: "Quarterly access review policy.pdf",
    }),
    documentType: documentTypeSchema,
    originalFile: z.object({
      filename: z.string().min(1),
      mimeType: z.string().min(1),
      sizeBytes: z.number().int().min(0),
    }),
    metadata: z.record(z.string(), z.unknown()).default({}),
    ingestion: evidenceIngestionSchema,
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
    file: z.unknown().optional().openapi({
      format: "binary",
    }),
    documentType: z.string().optional(),
    metadata: z.string().optional(),
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

export type DocumentType = z.infer<typeof documentTypeSchema>;
export type BoundingBox = z.infer<typeof boundingBoxSchema>;
export type EvidenceBlock = z.infer<typeof evidenceBlockSchema>;
export type EvidenceIngestion = z.infer<typeof evidenceIngestionSchema>;
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
