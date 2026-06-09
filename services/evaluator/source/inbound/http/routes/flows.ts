import { createRoute, z } from "@hono/zod-openapi";

import {
  documentTypeSchema,
  evaluationNotFoundSchema,
  evaluationResultSchema,
  failedEvaluationSchema,
  flowClientErrorSchema,
  flowConditionsInputSchema,
  flowCreatedSchema,
  flowDraftSchema,
  flowEvidenceAddedSchema,
  flowEvidenceInputSchema,
  flowIdParamsSchema,
  flowMetadataInputSchema,
  flowProgressSchema,
  flowQueuedSchema,
} from "../../../domain/evaluation.js";
import { FlowClientError } from "../../../application/flows.js";

import type { OpenAPIHono } from "@hono/zod-openapi";
import type {
  Condition,
  FlowCreated,
  FlowDraft,
  FlowEvidenceAdded,
  FlowQueued,
} from "../../../domain/evaluation.js";
import type {
  FlowEvidenceUpload,
  FlowResponse,
} from "../../../application/flows.js";

export type CreateFlow = () => Promise<FlowCreated>;

export type SetFlowMetadata = (
  flowId: string,
  metadata: Record<string, unknown>,
) => Promise<FlowDraft>;

export type SetFlowConditions = (
  flowId: string,
  conditions: Condition[],
) => Promise<FlowDraft>;

export type AddFlowEvidence = (
  flowId: string,
  upload: FlowEvidenceUpload,
) => Promise<FlowEvidenceAdded>;

export type RunFlow = (flowId: string) => Promise<FlowQueued>;

export type GetFlow = (flowId: string) => Promise<FlowResponse | undefined>;

export type FlowRoutesDependencies = {
  addFlowEvidence: AddFlowEvidence;
  createFlow: CreateFlow;
  getFlow: GetFlow;
  runFlow: RunFlow;
  setFlowConditions: SetFlowConditions;
  setFlowMetadata: SetFlowMetadata;
};

const createFlowRoute = createRoute({
  method: "post",
  path: "/flows",
  tags: ["Flows"],
  responses: {
    201: {
      description: "Flow created",
      content: {
        "application/json": {
          schema: flowCreatedSchema,
        },
      },
    },
  },
});

const setFlowMetadataRoute = createRoute({
  method: "put",
  path: "/flows/{id}/metadata",
  tags: ["Flows"],
  request: {
    params: flowIdParamsSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: flowMetadataInputSchema,
        },
      },
    },
  },
  responses: flowMutationResponses(),
});

const setFlowConditionsRoute = createRoute({
  method: "put",
  path: "/flows/{id}/conditions",
  tags: ["Flows"],
  request: {
    params: flowIdParamsSchema,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: flowConditionsInputSchema,
        },
      },
    },
  },
  responses: flowMutationResponses(),
});

const addFlowEvidenceRoute = createRoute({
  method: "post",
  path: "/flows/{id}/evidence",
  tags: ["Flows"],
  request: {
    params: flowIdParamsSchema,
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: flowEvidenceInputSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Evidence added",
      content: {
        "application/json": {
          schema: flowEvidenceAddedSchema,
        },
      },
    },
    ...flowErrorResponses(),
  },
});

const runFlowRoute = createRoute({
  method: "post",
  path: "/flows/{id}/run",
  tags: ["Flows"],
  request: {
    params: flowIdParamsSchema,
  },
  responses: {
    202: {
      description: "Flow queued",
      content: {
        "application/json": {
          schema: flowQueuedSchema,
        },
      },
    },
    ...flowErrorResponses(),
  },
});

const getFlowRoute = createRoute({
  method: "get",
  path: "/flows/{id}",
  tags: ["Flows"],
  request: {
    params: flowIdParamsSchema,
  },
  responses: {
    200: {
      description: "Flow state and result",
      content: {
        "application/json": {
          schema: z.union([
            failedEvaluationSchema,
            flowDraftSchema,
            flowProgressSchema,
            evaluationResultSchema,
          ]),
        },
      },
    },
    404: {
      description: "Flow was not found",
      content: {
        "application/json": {
          schema: evaluationNotFoundSchema,
        },
      },
    },
  },
});

export function registerFlowRoutes(
  application: OpenAPIHono,
  dependencies: FlowRoutesDependencies,
): void {
  application.openapi(createFlowRoute, (context) =>
    dependencies.createFlow().then((result) => context.json(result, 201)),
  );

  application.openapi(setFlowMetadataRoute, async (context) =>
    handleFlowError(context, async () => {
      const result = await dependencies.setFlowMetadata(
        context.req.valid("param").id,
        context.req.valid("json").metadata,
      );

      return context.json(result, 200);
    }),
  );

  application.openapi(setFlowConditionsRoute, async (context) =>
    handleFlowError(context, async () => {
      const result = await dependencies.setFlowConditions(
        context.req.valid("param").id,
        context.req.valid("json").conditions,
      );

      return context.json(result, 200);
    }),
  );

  application.openapi(addFlowEvidenceRoute, async (context) =>
    handleFlowError(context, async () => {
      const result = await dependencies.addFlowEvidence(
        context.req.valid("param").id,
        await parseEvidenceUpload(
          context.req.valid("form") as Record<
            string,
            FormDataEntryValue | FormDataEntryValue[]
          >,
        ),
      );

      return context.json(result, 200);
    }),
  );

  application.openapi(runFlowRoute, async (context) =>
    handleFlowError(context, async () => {
      const result = await dependencies.runFlow(context.req.valid("param").id);

      return context.json(result, 202);
    }),
  );

  application.openapi(getFlowRoute, (context) =>
    dependencies
      .getFlow(context.req.valid("param").id)
      .then((result) =>
        result === undefined
          ? context.json({ error: "not_found" } as const, 404)
          : context.json(result, 200),
      ),
  );
}

function flowMutationResponses() {
  return {
    200: {
      description: "Flow draft updated",
      content: {
        "application/json": {
          schema: flowDraftSchema,
        },
      },
    },
    ...flowErrorResponses(),
  };
}

function flowErrorResponses() {
  return {
    400: {
      description: "Flow cannot be changed as requested",
      content: {
        "application/json": {
          schema: flowClientErrorSchema,
        },
      },
    },
    404: {
      description: "Flow was not found",
      content: {
        "application/json": {
          schema: evaluationNotFoundSchema,
        },
      },
    },
    415: {
      description: "Evidence file type is not supported",
      content: {
        "application/json": {
          schema: flowClientErrorSchema,
        },
      },
    },
  };
}

async function handleFlowError<T>(
  context: Parameters<Parameters<OpenAPIHono["openapi"]>[1]>[0],
  mutate: () => Promise<T>,
) {
  try {
    return await mutate();
  } catch (error) {
    if (error instanceof Error && error.name === "FlowNotFoundError") {
      return context.json({ error: "not_found" } as const, 404);
    }

    if (error instanceof Error && error.name === "FlowClientError") {
      return context.json({ error: error.message }, 400);
    }

    if (
      error instanceof Error &&
      error.name === "FlowUnsupportedMediaTypeError"
    ) {
      return context.json({ error: error.message }, 415);
    }

    throw error;
  }
}

async function parseEvidenceUpload(
  form: Record<string, FormDataEntryValue | FormDataEntryValue[]>,
): Promise<FlowEvidenceUpload> {
  const file = firstFormValue(form.file);
  const documentType = firstFormValue(form.documentType);
  const metadata = firstFormValue(form.metadata);

  if (!(file instanceof File)) {
    throw new FlowClientError("Evidence upload requires a file.");
  }

  if (typeof documentType !== "string") {
    throw new FlowClientError("Evidence upload requires a documentType.");
  }

  const parsedDocumentType = documentTypeSchema.safeParse(documentType);

  if (!parsedDocumentType.success) {
    throw new FlowClientError("Unsupported documentType.");
  }

  return {
    content: new Uint8Array(await file.arrayBuffer()),
    documentType: parsedDocumentType.data,
    filename: file.name,
    metadata: parseEvidenceMetadata(metadata),
    mimeType: file.type,
    sizeBytes: file.size,
  };
}

function parseEvidenceMetadata(value: FormDataEntryValue | null) {
  if (value === null || value === "") {
    return {};
  }

  if (typeof value !== "string") {
    throw new FlowClientError("Evidence metadata must be a JSON object.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    throw new FlowClientError("Evidence metadata must be valid JSON.");
  }

  if (parsed === null || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new FlowClientError("Evidence metadata must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

function firstFormValue(
  value: FormDataEntryValue | FormDataEntryValue[] | undefined,
): FormDataEntryValue | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}
