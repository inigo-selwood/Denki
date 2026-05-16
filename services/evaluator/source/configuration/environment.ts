type HttpConfiguration = {
  host: string;
  port: number;
};

type OpenAIConfiguration = {
  apiKey: string | undefined;
};

type InngestConfiguration = {
  eventKey: string | undefined;
  signingKey: string | undefined;
};

type DatabaseConfiguration = {
  connectionUrl: string | undefined;
};

type Environment = "development" | "local" | "production";
type QueueMode = "immediate" | "inngest";

type ServiceConfiguration = {
  environment: Environment;
  http: HttpConfiguration;
  openai: OpenAIConfiguration;
  inngest: InngestConfiguration;
  database: DatabaseConfiguration;
  queue: {
    mode: QueueMode;
  };
};

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 3000;

export function loadConfiguration(): ServiceConfiguration {
  const environment = parseEnvironment(process.env.ENVIRONMENT);
  const configuration = {
    environment,
    http: {
      host: DEFAULT_HOST,
      port: parsePort(process.env.EVALUATOR_PORT, "EVALUATOR_PORT"),
    },
    openai: {
      apiKey: readOptionalEnvironmentVariable("OPENAI_API_KEY"),
    },
    inngest: {
      eventKey: readOptionalEnvironmentVariable("INNGEST_EVENT_KEY"),
      signingKey: readOptionalEnvironmentVariable("INNGEST_SIGNING_KEY"),
    },
    database: {
      connectionUrl: createDatabaseConnectionUrl(environment),
    },
    queue: {
      mode: createQueueMode(environment),
    },
  };

  validateConfiguration(configuration);

  return configuration;
}

function createDatabaseConnectionUrl(
  environment: Environment,
): string | undefined {
  const host = getDefaultDatabaseHost(environment);

  if (host === undefined) {
    return undefined;
  }

  const port = process.env.DATABASE_PORT ?? "54322";
  const user = process.env.DATABASE_USER ?? "postgres";
  const password = process.env.DATABASE_PASSWORD ?? "postgres";

  return `postgres://${user}:${password}@${host}:${port}/postgres`;
}

function getDefaultDatabaseHost(environment: Environment): string | undefined {
  if (environment === "development") {
    return "127.0.0.1";
  }

  if (environment === "local") {
    return "host.docker.internal";
  }

  return undefined;
}

function readOptionalEnvironmentVariable(name: string): string | undefined {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  return value;
}

function parsePort(value: string | undefined, name: string): number {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid ${name} value: ${value}`);
  }

  return port;
}

function parseEnvironment(value: string | undefined): Environment {
  if (value === undefined || value.trim() === "") {
    return "production";
  }

  if (value === "development" || value === "local" || value === "production") {
    return value;
  }

  throw new Error(`Invalid ENVIRONMENT value: ${value}`);
}

function createQueueMode(environment: Environment): QueueMode {
  if (environment === "development" || environment === "local") {
    return "immediate";
  }

  return "inngest";
}

function validateConfiguration(configuration: ServiceConfiguration): void {
  if (configuration.environment !== "production") {
    return;
  }

  const missing: string[] = [];

  if (configuration.database.connectionUrl === undefined) {
    missing.push("production database connection routing");
  }

  if (configuration.inngest.eventKey === undefined) {
    missing.push("INNGEST_EVENT_KEY");
  }

  if (configuration.inngest.signingKey === undefined) {
    missing.push("INNGEST_SIGNING_KEY");
  }

  if (missing.length > 0) {
    throw new Error(`Missing production configuration: ${missing.join(", ")}`);
  }
}
