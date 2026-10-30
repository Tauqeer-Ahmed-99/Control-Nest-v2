import {
  boolean,
  decimal,
  integer,
  pgTable,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { rooms } from "./rooms";
import { resourceStatus, timestampDefault } from "../common";

export const devices = pgTable("devices", {
  id: uuid("id").defaultRandom().primaryKey(),
  roomId: uuid("roomId")
    .notNull()
    .references(() => rooms.id),
  name: text("name").notNull(),
  pinNumber: integer("pinNumber").notNull(),
  status: boolean("status").notNull().default(false),
  isDefault: boolean("isDefault").notNull().default(false),
  isScheduled: boolean("isScheduled").notNull().default(false),
  daysScheduled: text("daysScheduled"),
  startTime: text("startTime"),
  offTime: text("offTime"),
  scheduledBy: text("scheduledBy"),
  wattage: decimal({ mode: "number", precision: 10, scale: 2 }).notNull(),
  resourceStatus: resourceStatus(),
  createdAt: timestampDefault("createdAt").notNull(),
  createdBy: text("createdBy").notNull(),
  modifiedAt: timestampDefault("modifiedAt", { frequent: true }),
  modifiedBy: text("modifiedBy"),
});
