import { defineConfig } from "drizzle-kit";

const databaseHost = process.env.DATABASE_URL ?? "127.0.0.1";
const databasePort = process.env.DATABASE_PORT ?? "54322";
const databaseTestUser = process.env.DATABASE_TEST_USER ?? "postgres";
const databaseTestPassword = process.env.DATABASE_TEST_PASSWORD ?? "postgres";

const databaseConnectionUrl =
  `postgres://${databaseTestUser}:${databaseTestPassword}` +
  `@${databaseHost}:${databasePort}/postgres`;

export default defineConfig({
  dialect: "postgresql",
  schema: "./source/infrastructure/database/schema.ts",
  dbCredentials: {
    url: databaseConnectionUrl,
  },
});
