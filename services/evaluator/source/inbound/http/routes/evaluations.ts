import { createRoute, z } from "@hono/zod-openapi";

import {
  evaluationAcceptedSchema,
  evaluationIdParamsSchema,
  evaluationRequestSchema,
  evaluationResultSchema,
} from "../../../domain/evaluation.js";

import type { OpenAPIHono } from "@hono/zod-openapi";
import type {
  EvaluationAccepted,
  EvaluationRequest,
} from "../../../domain/evaluation.js";

export type SubmitEvaluation = (
  request: EvaluationRequest,
) => Promise<EvaluationAccepted>;

export type EvaluationRoutesDependencies = {
  submitEvaluation: SubmitEvaluation;
};

const evaluationUnavailableSchema = z
  .object({
    error: z.literal("not_implemented"),
  })
  .openapi("EvaluationUnavailable");

const evaluationUnavailableResponse = {
  error: "not_implemented",
} as const;

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
          schema: evaluationResultSchema,
        },
      },
    },
    501: {
      description: "Evaluation lookup is not implemented yet",
      content: {
        "application/json": {
          schema: evaluationUnavailableSchema,
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
    context.json(evaluationUnavailableResponse, 501),
  );
}
