import { loadConfiguration } from "./configuration/environment.js";
import { createHttpApplication } from "./inbound/http/application.js";
import { createRuntimeSubmitEvaluation } from "./runtime/evaluation-dependencies.js";
import { startHttpServer } from "./runtime/http-server.js";

const configuration = loadConfiguration();
const application = createHttpApplication({
  submitEvaluation: createRuntimeSubmitEvaluation(),
});

startHttpServer(application, configuration.http);
