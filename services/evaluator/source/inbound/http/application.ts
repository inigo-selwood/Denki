import { Hono } from "hono";

import { registerHealthRoutes } from "./routes/health.js";

export function createHttpApplication(): Hono {
  const application = new Hono();

  registerHealthRoutes(application);

  return application;
}
