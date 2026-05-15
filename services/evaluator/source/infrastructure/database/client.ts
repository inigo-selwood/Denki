import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema.js";

export function createDatabaseClient(databaseUrl: string) {
  const connection = postgres(databaseUrl);
  const database = drizzle(connection, {
    schema,
  });

  return {
    database,
    close: () => connection.end(),
  };
}
