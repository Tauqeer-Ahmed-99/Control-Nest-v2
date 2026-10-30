import { pgTable, text, uuid } from "drizzle-orm/pg-core";
import { controllerDevices } from "./controller-devices";
import { resourceStatus, timestampDefault } from "../common";

export const tunnels = pgTable("tunnels", {
  id: uuid("id").primaryKey().notNull(),
  controllerDeviceId: uuid("controllerId")
    .notNull()
    .references(() => controllerDevices.id)
    .unique(),
  name: text("name").notNull(),
  hostname: text("hostname").notNull(),
  token: text("token").notNull(),
  dnsRecordId: uuid("dnsRecordId").notNull(),
  resourceStatus: resourceStatus(),
  createdAt: timestampDefault("createdAt"),
  createdBy: text("createdBy").notNull(),
  modifiedAt: timestampDefault("modifiedAt", { frequent: true }),
  modifiedBy: text("modifiedBy"),
});
