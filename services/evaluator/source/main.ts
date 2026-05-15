import { loadConfiguration } from "./configuration/environment.js";
import { createHttpApplication } from "./inbound/http/application.js";
import { startHttpServer } from "./runtime/http-server.js";

const configuration = loadConfiguration();
const application = createHttpApplication();

startHttpServer(application, configuration.http);
