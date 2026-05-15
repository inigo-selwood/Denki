import { serve } from "inngest/hono";

import { evaluateSubmittedEvaluation } from "./functions/evaluate-submitted-evaluation.js";
import { inngest } from "../../infrastructure/inngest/client.js";

import type { OpenAPIHono } from "@hono/zod-openapi";

const inngestHandler = serve({
  client: inngest,
  functions: [evaluateSubmittedEvaluation],
});

export function registerInngestRoutes(application: OpenAPIHono): void {
  application.use("/api/inngest", (context) => inngestHandler(context));
}
