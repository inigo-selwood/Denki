type HttpConfiguration = {
  host: string;
  port: number;
};

type OpenAIConfiguration = {
  apiKey: string | undefined;
};

type ServiceConfiguration = {
  http: HttpConfiguration;
  openai: OpenAIConfiguration;
};

const DEFAULT_HOST = "0.0.0.0";
const DEFAULT_PORT = 3000;

export function loadConfiguration(): ServiceConfiguration {
  return {
    http: {
      host: process.env.HOST ?? DEFAULT_HOST,
      port: parsePort(process.env.PORT),
    },
    openai: {
      apiKey: readOptionalEnvironmentVariable("OPENAI_API_KEY"),
    },
  };
}

function readOptionalEnvironmentVariable(name: string): string | undefined {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  return value;
}

function parsePort(value: string | undefined): number {
  if (value === undefined || value.trim() === "") {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT value: ${value}`);
  }

  return port;
}
