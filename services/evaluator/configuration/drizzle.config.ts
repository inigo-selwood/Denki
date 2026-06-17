import { defineConfig } from "drizzle-kit";

const databasePort = process.env.DATABASE_PORT ?? "54322";
const databaseUser = process.env.DATABASE_USER ?? "postgres";
const databasePassword = process.env.DATABASE_PASSWORD ?? "postgres";

const databaseConnectionString =
  `postgres://${databaseUser}:${databasePassword}` +
  `@127.0.0.1:${databasePort}/postgres`;

export default defineConfig({
  dialect: "postgresql",
  schema: "../source/infrastructure/database/schema.ts",
  dbCredentials: {
    url: databaseConnectionString,
  },
});
