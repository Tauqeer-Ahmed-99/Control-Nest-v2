import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const observabilityLogs = pgTable(
  "observability_logs",
  {
    id: uuid("id").primaryKey(),
    requestId: uuid("requestId").notNull(),
    source: text("source").notNull(),
    method: text("method").notNull(),
    path: text("path").notNull(),
    statusCode: integer("statusCode").notNull(),
    durationMs: integer("durationMs").notNull(),
    input: jsonb("input").$type<unknown>(),
    output: jsonb("output").$type<unknown>(),
    error: jsonb("error").$type<unknown>(),
    userId: text("userId"),
    controllerDeviceId: uuid("controllerDeviceId"),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("observability_request_created_index").on(
      table.requestId,
      table.createdAt,
    ),
    index("observability_user_created_index").on(table.userId, table.createdAt),
    index("observability_controller_created_index").on(
      table.controllerDeviceId,
      table.createdAt,
    ),
  ],
);
