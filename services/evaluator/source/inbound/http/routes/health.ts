import { createRoute, z } from "@hono/zod-openapi";

import type { OpenAPIHono } from "@hono/zod-openapi";

const healthResponseSchema = z.object({
  status: z.literal("ok"),
});

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["System"],
  responses: {
    200: {
      description: "Service health status",
      content: {
        "application/json": {
          schema: healthResponseSchema,
        },
      },
    },
  },
});

export function registerHealthRoutes(application: OpenAPIHono): void {
  application.openapi(healthRoute, (context) =>
    context.json({
      status: "ok",
    }),
  );
}
