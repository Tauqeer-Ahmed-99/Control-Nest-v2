import {
  boolean,
  decimal,
  integer,
  pgTable,
  text,
  uuid,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { rooms } from "./rooms";
import { controllerDevices } from "./controller-devices";
import { resourceStatus, timestampDefault } from "../common";

export const devices = pgTable(
  "devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    controllerDeviceId: uuid("controllerDeviceId")
      .notNull()
      .references(() => controllerDevices.id),
    roomId: uuid("roomId")
      .notNull()
      .references(() => rooms.id),
    name: text("name").notNull(),
    pinNumber: integer("pinNumber").notNull(),
    gpioPinNumber: integer("gpioPinNumber").notNull(),
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
  },
  (table) => [
    uniqueIndex("device_controller_pin_unique").on(
      table.controllerDeviceId,
      table.pinNumber,
    ),
  ],
);
