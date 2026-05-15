import { OpenAPIHono } from "@hono/zod-openapi";

import { registerDocumentationRoutes } from "./documentation.js";
import { registerEvaluationRoutes } from "./routes/evaluations.js";
import { registerHealthRoutes } from "./routes/health.js";

export function createHttpApplication(): OpenAPIHono {
  const application = new OpenAPIHono();

  registerHealthRoutes(application);
  registerEvaluationRoutes(application);
  registerDocumentationRoutes(application);

  return application;
}
