import {
  createConditionResult,
  createEvaluationResult,
} from "../domain/results.js";

import type {
  Condition,
  CriterionResult,
  DocumentType,
  EvaluationRequest,
  EvaluationResult,
  FailedEvaluation,
  FlowCreated,
  FlowDraft,
  FlowEvidence,
  FlowEvidenceAdded,
  FlowProgress,
  FlowQueued,
} from "../domain/evaluation.js";

export type FlowTerminalRecord = FailedEvaluation | EvaluationResult;

export type FlowRecord = FlowDraftRecord | FlowProgress | FlowTerminalRecord;

export type FlowResponse = FlowDraft | FlowProgress | FlowTerminalRecord;

export type FlowDraftRecord = {
  flowId: string;
  status: "draft";
  metadata: Record<string, unknown>;
  conditions: Condition[];
  evidence: FlowEvidence[];
};

export type FlowRun = {
  flowId: string;
  request: EvaluationRequest & {
    evidence: FlowEvidence[];
  };
};

export type FlowRepository = {
  addFlowEvidence(flowId: string, evidence: FlowEvidence[]): Promise<void>;
  completeFlow(result: EvaluationResult): Promise<void>;
  createDraftFlow(flowId: string): Promise<void>;
  getFlow(flowId: string): Promise<FlowRecord | undefined>;
  markFlowFailed(
    flowId: string,
    error: FailedEvaluation["error"],
  ): Promise<void>;
  markFlowQueued(flowId: string): Promise<void>;
  markFlowRunning(flowId: string): Promise<void>;
  setFlowConditions(flowId: string, conditions: Condition[]): Promise<void>;
  setFlowMetadata(
    flowId: string,
    metadata: Record<string, unknown>,
  ): Promise<void>;
};

export type FlowQueue = {
  enqueueFlow(input: FlowRun): Promise<void>;
};

export type FlowEvidenceUpload = {
  content: Uint8Array;
  documentType: DocumentType;
  filename: string;
  metadata: Record<string, unknown>;
  mimeType: string;
  sizeBytes: number;
};

export type DocumentIngestionProvider = {
  ingest(
    input: FlowEvidenceUpload & { evidenceId: string },
  ): Promise<FlowEvidence>;
};

export type CreateFlowDependencies = {
  createFlowId: () => string;
  repository: FlowRepository;
};

export type AddFlowEvidenceDependencies = {
  createEvidenceId: () => string;
  ingestionProvider: DocumentIngestionProvider;
  repository: FlowRepository;
};

export type RunFlowDependencies = {
  queue: FlowQueue;
  repository: FlowRepository;
};

export type EvaluateFlowDependencies = {
  repository: Pick<
    FlowRepository,
    "completeFlow" | "markFlowFailed" | "markFlowRunning"
  >;
};

export async function createFlow(
  dependencies: CreateFlowDependencies,
): Promise<FlowCreated> {
  const flowId = dependencies.createFlowId();

  await dependencies.repository.createDraftFlow(flowId);

  return {
    flowId,
    status: "draft",
  };
}

export async function setFlowMetadata(
  flowId: string,
  metadata: Record<string, unknown>,
  dependencies: Pick<CreateFlowDependencies, "repository">,
): Promise<FlowDraft> {
  const flow = await getMutableDraftFlow(flowId, dependencies.repository);

  await dependencies.repository.setFlowMetadata(flowId, metadata);

  return toDraftResponse({
    ...flow,
    metadata,
  });
}

export async function setFlowConditions(
  flowId: string,
  conditions: Condition[],
  dependencies: Pick<CreateFlowDependencies, "repository">,
): Promise<FlowDraft> {
  const flow = await getMutableDraftFlow(flowId, dependencies.repository);

  await dependencies.repository.setFlowConditions(flowId, conditions);

  return toDraftResponse({
    ...flow,
    conditions,
  });
}

export async function addFlowEvidence(
  flowId: string,
  upload: FlowEvidenceUpload,
  dependencies: AddFlowEvidenceDependencies,
): Promise<FlowEvidenceAdded> {
  await getMutableDraftFlow(flowId, dependencies.repository);

  if (!isSupportedEvidenceFile(upload)) {
    throw new FlowUnsupportedMediaTypeError(upload.mimeType, upload.filename);
  }

  const evidenceId = dependencies.createEvidenceId();
  const evidence = await dependencies.ingestionProvider.ingest({
    ...upload,
    evidenceId,
  });

  await dependencies.repository.addFlowEvidence(flowId, [evidence]);

  return {
    flowId,
    evidenceIds: [evidence.evidenceId],
  };
}

export async function runFlow(
  flowId: string,
  dependencies: RunFlowDependencies,
): Promise<FlowQueued> {
  const flow = await getMutableDraftFlow(flowId, dependencies.repository);

  if (flow.evidence.length === 0 || flow.conditions.length === 0) {
    throw new FlowClientError(
      "Flow requires at least one evidence item and one condition before running.",
    );
  }

  const run = {
    flowId,
    request: {
      conditions: flow.conditions,
      evidence: flow.evidence,
      metadata: flow.metadata,
    },
  };

  await dependencies.repository.markFlowQueued(flowId);
  await dependencies.queue.enqueueFlow(run);

  return {
    flowId,
    status: "queued",
  };
}

export async function getFlow(
  flowId: string,
  dependencies: Pick<CreateFlowDependencies, "repository">,
): Promise<FlowResponse | undefined> {
  const flow = await dependencies.repository.getFlow(flowId);

  if (flow === undefined) {
    return undefined;
  }

  if (flow.status === "draft") {
    return toDraftResponse(flow);
  }

  return flow;
}

export async function evaluateFlow(
  run: FlowRun,
  dependencies: EvaluateFlowDependencies,
): Promise<EvaluationResult> {
  await dependencies.repository.markFlowRunning(run.flowId);

  try {
    const result = createPlaceholderFlowResult(run);

    await dependencies.repository.completeFlow(result);

    return result;
  } catch (error) {
    await dependencies.repository.markFlowFailed(run.flowId, {
      message: getErrorMessage(error),
    });

    throw error;
  }
}

function createPlaceholderFlowResult(run: FlowRun): EvaluationResult {
  const conditions = run.request.conditions.map((condition, conditionIndex) =>
    createConditionResult({
      conditionId: `condition:${conditionIndex}`,
      criteria: condition.criteria.map((criterion, criterionIndex) =>
        createPlaceholderCriterionResult({
          conditionIndex,
          criterion,
          criterionIndex,
          evidenceIds: run.request.evidence.map((item, evidenceIndex) =>
            "evidenceId" in item
              ? String(item.evidenceId)
              : `evidence:${evidenceIndex}`,
          ),
        }),
      ),
    }),
  );

  return createEvaluationResult({
    flowId: run.flowId,
    conditions,
  });
}

function createPlaceholderCriterionResult(input: {
  conditionIndex: number;
  criterion: string;
  criterionIndex: number;
  evidenceIds: string[];
}): CriterionResult {
  return {
    criterionId: `condition:${input.conditionIndex}:criterion:${input.criterionIndex}`,
    verdict: "requires_manual_review",
    confidence: {
      score: 0,
      factors: ["Placeholder evaluator has not performed evidence analysis."],
    },
    rationale: `Manual review required for criterion: ${input.criterion}`,
    evidenceIds: input.evidenceIds,
  };
}

async function getMutableDraftFlow(
  flowId: string,
  repository: FlowRepository,
): Promise<FlowDraftRecord> {
  const flow = await repository.getFlow(flowId);

  if (flow === undefined) {
    throw new FlowNotFoundError(flowId);
  }

  if (flow.status !== "draft") {
    throw new FlowClientError("Flow can only be changed while it is draft.");
  }

  return flow;
}

function toDraftResponse(flow: FlowDraftRecord): FlowDraft {
  return {
    flowId: flow.flowId,
    status: "draft",
    metadata: flow.metadata,
    evidenceCount: flow.evidence.length,
    conditionCount: flow.conditions.length,
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim() !== "") {
    return error.message;
  }

  return "Evaluation failed.";
}

function isSupportedEvidenceFile(upload: FlowEvidenceUpload): boolean {
  const mimeType = upload.mimeType.toLowerCase();
  const filename = upload.filename.toLowerCase();

  if (SUPPORTED_EVIDENCE_MIME_TYPES.has(mimeType)) {
    return true;
  }

  return SUPPORTED_EVIDENCE_EXTENSIONS.some((extension) =>
    filename.endsWith(extension),
  );
}

const SUPPORTED_EVIDENCE_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.ms-excel.sheet.macroenabled.12",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/bmp",
  "image/gif",
  "image/heic",
  "image/jpeg",
  "image/png",
  "image/tiff",
  "text/csv",
]);

const SUPPORTED_EVIDENCE_EXTENSIONS = [
  ".pdf",
  ".xls",
  ".xlsm",
  ".xlsx",
  ".csv",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".bmp",
  ".tif",
  ".tiff",
  ".heic",
];

export class FlowClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlowClientError";
  }
}

export class FlowUnsupportedMediaTypeError extends Error {
  constructor(
    readonly mimeType: string,
    readonly filename: string,
  ) {
    super(`Unsupported evidence file type: ${mimeType || filename}`);
    this.name = "FlowUnsupportedMediaTypeError";
  }
}

export class FlowNotFoundError extends Error {
  constructor(readonly flowId: string) {
    super(`Flow not found: ${flowId}`);
    this.name = "FlowNotFoundError";
  }
}
