import type { Hono } from "hono";

export function registerHealthRoutes(application: Hono): void {
  application.get("/health", (context) =>
    context.json({
      status: "ok",
    }),
  );
}
