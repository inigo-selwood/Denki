import { afterEach, describe, expect, it } from "vitest";

import { loadConfiguration } from "../../source/configuration/environment.js";

const originalEnvironment = { ...process.env };

describe("loadConfiguration", () => {
  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it("uses the default HTTP host and evaluator port", () => {
    process.env.ENVIRONMENT = "development";
    process.env.EVALUATOR_PORT = "4000";

    expect(loadConfiguration().http).toEqual({
      host: "0.0.0.0",
      port: 4000,
    });
  });

  it("requires production-only configuration by default", () => {
    delete process.env.ENVIRONMENT;

    expect(() => loadConfiguration()).toThrow(
      "Missing production configuration: production database connection routing, INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY, REDUCTO_API_KEY",
    );
  });

  it("uses immediate queue mode in development environment", () => {
    process.env.ENVIRONMENT = "development";

    expect(loadConfiguration().queue.mode).toBe("immediate");
  });

  it("uses immediate queue mode in local environment", () => {
    process.env.ENVIRONMENT = "local";

    expect(loadConfiguration().queue.mode).toBe("immediate");
  });

  it("reads Inngest credentials from the environment", () => {
    process.env.ENVIRONMENT = "development";
    process.env.INNGEST_EVENT_KEY = "event-key";
    process.env.INNGEST_SIGNING_KEY = "signing-key";

    expect(loadConfiguration().inngest).toEqual({
      eventKey: "event-key",
      signingKey: "signing-key",
    });
  });

  it("reads Reducto configuration from the environment", () => {
    process.env.ENVIRONMENT = "development";
    process.env.REDUCTO_API_KEY = "reducto-key";
    process.env.REDUCTO_ENVIRONMENT = "eu";

    expect(loadConfiguration().reducto).toEqual({
      apiKey: "reducto-key",
      environment: "eu",
    });
  });

  it("reads ingestor configuration from the environment", () => {
    process.env.ENVIRONMENT = "development";
    process.env.INGESTOR_URL = "http://127.0.0.1:8000";

    expect(loadConfiguration().ingestor).toEqual({
      url: "http://127.0.0.1:8000",
    });
  });

  it("defaults Reducto environment to production", () => {
    process.env.ENVIRONMENT = "development";

    expect(loadConfiguration().reducto.environment).toBe("production");
  });

  it("defaults the database host for development environment", () => {
    process.env.ENVIRONMENT = "development";

    expect(loadConfiguration().database.connectionUrl).toBe(
      "postgres://postgres:postgres@127.0.0.1:54322/postgres",
    );
  });

  it("defaults the database host for local environment", () => {
    process.env.ENVIRONMENT = "local";

    expect(loadConfiguration().database.connectionUrl).toBe(
      "postgres://postgres:postgres@host.docker.internal:54322/postgres",
    );
  });

  it("constructs database connection URL from database credentials", () => {
    process.env.ENVIRONMENT = "development";
    process.env.DATABASE_PORT = "5433";
    process.env.DATABASE_USER = "user";
    process.env.DATABASE_PASSWORD = "password";

    expect(loadConfiguration().database.connectionUrl).toBe(
      "postgres://user:password@127.0.0.1:5433/postgres",
    );
  });

  it("requires Inngest credentials in production", () => {
    process.env.ENVIRONMENT = "production";

    expect(() => loadConfiguration()).toThrow(
      "Missing production configuration: production database connection routing, INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY, REDUCTO_API_KEY",
    );
  });

  it("does not require Reducto credentials in production when ingestor is configured", () => {
    process.env.ENVIRONMENT = "production";
    process.env.INGESTOR_URL = "http://ingestor:8000";

    expect(() => loadConfiguration()).toThrow(
      "Missing production configuration: production database connection routing, INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY",
    );
  });

  it("rejects unknown Reducto environments", () => {
    process.env.ENVIRONMENT = "development";
    process.env.REDUCTO_ENVIRONMENT = "moon";

    expect(() => loadConfiguration()).toThrow(
      "Invalid REDUCTO_ENVIRONMENT value: moon",
    );
  });

  it("rejects unknown environments", () => {
    process.env.ENVIRONMENT = "mystery";

    expect(() => loadConfiguration()).toThrow(
      "Invalid ENVIRONMENT value: mystery",
    );
  });
});
