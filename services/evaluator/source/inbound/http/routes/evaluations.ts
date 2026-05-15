import { createRoute, z } from "@hono/zod-openapi";

import {
  evaluationAcceptedSchema,
  evaluationIdParamsSchema,
  evaluationNotFoundSchema,
  evaluationRequestSchema,
  evaluationResultSchema,
  queuedEvaluationSchema,
} from "../../../domain/evaluation.js";

import type { OpenAPIHono } from "@hono/zod-openapi";
import type {
  EvaluationAccepted,
  EvaluationResult,
  EvaluationRequest,
  QueuedEvaluation,
} from "../../../domain/evaluation.js";

export type SubmitEvaluation = (
  request: EvaluationRequest,
) => Promise<EvaluationAccepted>;

export type GetEvaluation = (
  evaluationId: string,
) => Promise<QueuedEvaluation | EvaluationResult | undefined>;

export type EvaluationRoutesDependencies = {
  getEvaluation: GetEvaluation;
  submitEvaluation: SubmitEvaluation;
};

const createEvaluationRoute = createRoute({
  method: "post",
  path: "/evaluations",
  tags: ["Evaluations"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: evaluationRequestSchema,
        },
      },
    },
  },
  responses: {
    202: {
      description: "Evaluation job accepted",
      content: {
        "application/json": {
          schema: evaluationAcceptedSchema,
        },
      },
    },
  },
});

const getEvaluationRoute = createRoute({
  method: "get",
  path: "/evaluations/{id}",
  tags: ["Evaluations"],
  request: {
    params: evaluationIdParamsSchema,
  },
  responses: {
    200: {
      description: "Evaluation job status and result",
      content: {
        "application/json": {
          schema: z.union([queuedEvaluationSchema, evaluationResultSchema]),
        },
      },
    },
    404: {
      description: "Evaluation was not found",
      content: {
        "application/json": {
          schema: evaluationNotFoundSchema,
        },
      },
    },
  },
});

export function registerEvaluationRoutes(
  application: OpenAPIHono,
  dependencies: EvaluationRoutesDependencies,
): void {
  application.openapi(createEvaluationRoute, (context) =>
    dependencies
      .submitEvaluation(context.req.valid("json"))
      .then((result) => context.json(result, 202)),
  );

  application.openapi(getEvaluationRoute, (context) =>
    dependencies
      .getEvaluation(context.req.valid("param").id)
      .then((result) =>
        result === undefined
          ? context.json({ error: "not_found" } as const, 404)
          : context.json(result, 200),
      ),
  );
}
