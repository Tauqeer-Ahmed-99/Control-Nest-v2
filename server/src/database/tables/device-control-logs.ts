import { boolean, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { devices } from "./devices";
import { resourceStatus, timestampDefault } from "../common";

export const deviceControlLogs = pgTable("device_control_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  deviceId: uuid("deviceId")
    .notNull()
    .references(() => devices.id, { onDelete: "cascade" }),
  statusChangedFrom: boolean("statusChangedFrom").notNull(),
  statusChangedTo: boolean("statusChangedTo").notNull(),
  resourceStatus: resourceStatus(),
  createdAt: timestampDefault("createdAt"),
  createdBy: text("createdBy").notNull(),
  modifiedAt: timestampDefault("modifiedAt", { frequent: true }),
  modifiedBy: text("modifiedBy"),
});
