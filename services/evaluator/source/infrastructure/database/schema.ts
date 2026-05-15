import { bigint, inet, pgTable, timestamp } from "drizzle-orm/pg-core";

export const requestLogs = pgTable("request_logs", {
  id: bigint("id", { mode: "number" })
    .generatedAlwaysAsIdentity()
    .primaryKey(),
  requestedAt: timestamp("requested_at", {
    withTimezone: true,
  })
    .notNull()
    .defaultNow(),
  ipAddress: inet("ip_address").notNull(),
});
