import type { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";

export function registerDocumentationRoutes(application: OpenAPIHono): void {
  application.doc("/openapi.json", {
    openapi: "3.0.0",
    info: {
      title: "Denki Evaluator API",
      version: "0.0.0",
    },
  });

  application.get(
    "/docs",
    swaggerUI({
      url: "/openapi.json",
      displayRequestDuration: true,
      persistAuthorization: true,
    }),
  );
}
