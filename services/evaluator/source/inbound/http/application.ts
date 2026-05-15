import { OpenAPIHono } from "@hono/zod-openapi";

import { registerDocumentationRoutes } from "./documentation.js";
import { registerInngestRoutes } from "../inngest/routes.js";
import { registerEvaluationRoutes } from "./routes/evaluations.js";
import { registerHealthRoutes } from "./routes/health.js";

import type { EvaluationRoutesDependencies } from "./routes/evaluations.js";

export type HttpApplicationDependencies = EvaluationRoutesDependencies;

const defaultDependencies: HttpApplicationDependencies = {
  async submitEvaluation() {
    throw new Error("Evaluation submission is not configured.");
  },
};

export function createHttpApplication(
  dependencies: HttpApplicationDependencies = defaultDependencies,
): OpenAPIHono {
  const application = new OpenAPIHono();

  registerHealthRoutes(application);
  registerEvaluationRoutes(application, dependencies);
  registerInngestRoutes(application);
  registerDocumentationRoutes(application);

  return application;
}
