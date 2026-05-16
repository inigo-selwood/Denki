import { afterEach, describe, expect, it } from "vitest";

import { loadConfiguration } from "../../source/configuration/environment.js";

const originalEnvironment = { ...process.env };

describe("loadConfiguration", () => {
  afterEach(() => {
    process.env = { ...originalEnvironment };
  });

  it("uses the default HTTP host and evaluator port", () => {
    process.env.EVALUATOR_PORT = "4000";

    expect(loadConfiguration().http).toEqual({
      host: "0.0.0.0",
      port: 4000,
    });
  });

  it("defaults to production environment with inngest queue mode", () => {
    delete process.env.ENVIRONMENT;

    expect(loadConfiguration().environment).toBe("production");
    expect(loadConfiguration().queue.mode).toBe("inngest");
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
    process.env.INNGEST_EVENT_KEY = "event-key";
    process.env.INNGEST_SIGNING_KEY = "signing-key";

    expect(loadConfiguration().inngest).toEqual({
      eventKey: "event-key",
      signingKey: "signing-key",
    });
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

  it("rejects unknown environments", () => {
    process.env.ENVIRONMENT = "mystery";

    expect(() => loadConfiguration()).toThrow(
      "Invalid ENVIRONMENT value: mystery",
    );
  });
});
