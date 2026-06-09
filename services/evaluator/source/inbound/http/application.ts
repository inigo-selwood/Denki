import { OpenAPIHono } from "@hono/zod-openapi";

import { registerDocumentationRoutes } from "./documentation.js";
import { registerInngestRoutes } from "../inngest/routes.js";
import { registerFlowRoutes } from "./routes/flows.js";
import { registerHealthRoutes } from "./routes/health.js";

import type { FlowRoutesDependencies } from "./routes/flows.js";

export type HttpApplicationDependencies = FlowRoutesDependencies;

const defaultDependencies: HttpApplicationDependencies = {
  async addFlowEvidence() {
    throw new Error("Flow evidence upload is not configured.");
  },
  async createFlow() {
    throw new Error("Flow creation is not configured.");
  },
  async getFlow() {
    return undefined;
  },
  async runFlow() {
    throw new Error("Flow execution is not configured.");
  },
  async setFlowConditions() {
    throw new Error("Flow condition updates are not configured.");
  },
  async setFlowMetadata() {
    throw new Error("Flow metadata updates are not configured.");
  },
};

export function createHttpApplication(
  dependencies: HttpApplicationDependencies = defaultDependencies,
): OpenAPIHono {
  const application = new OpenAPIHono();

  registerHealthRoutes(application);
  registerFlowRoutes(application, dependencies);
  registerInngestRoutes(application);
  registerDocumentationRoutes(application);

  return application;
}
