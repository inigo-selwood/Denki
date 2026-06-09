import { createRoute, z } from "@hono/zod-openapi";

import {
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

import type { OpenAPIHono } from "@hono/zod-openapi";
import type {
  Condition,
  Evidence,
  FlowCreated,
  FlowDraft,
  FlowEvidenceAdded,
  FlowQueued,
} from "../../../domain/evaluation.js";
import type { FlowResponse } from "../../../application/flows.js";

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
  evidence: Evidence[],
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
        "application/json": {
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
        context.req.valid("json").evidence,
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

    throw error;
  }
}
