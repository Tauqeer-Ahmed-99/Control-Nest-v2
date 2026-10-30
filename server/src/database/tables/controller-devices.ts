import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { resourceStatus, timestampDefault } from "../common";

export const controllerDevices = pgTable(
  "controller_devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    houseId: uuid("houseId").notNull(),
    name: text("name").notNull(),
    passwordHash: text("passwordHash"),
    resourceStatus: resourceStatus(),
    createdAt: timestampDefault("createdAt"),
    createdBy: text("createdBy").notNull(),
    modifiedAt: timestampDefault("modifiedAt", { frequent: true }),
    modifiedBy: text("modifiedBy"),
  },
  (table) => [index("house_controller_index").on(table.houseId)],
);
