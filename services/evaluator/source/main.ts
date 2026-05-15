import { loadConfiguration } from "./configuration/environment.js";
import { createHttpApplication } from "./inbound/http/application.js";
import { createRuntimeEvaluationDependencies } from "./runtime/evaluation-dependencies.js";
import { startHttpServer } from "./runtime/http-server.js";

const configuration = loadConfiguration();
const application = createHttpApplication(
  createRuntimeEvaluationDependencies(),
);

startHttpServer(application, configuration.http);
