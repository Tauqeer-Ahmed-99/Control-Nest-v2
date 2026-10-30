import {
  boolean,
  index,
  pgTable,
  primaryKey,
  text,
  uuid,
} from "drizzle-orm/pg-core";
import { resourceStatus, timestampDefault } from "../common";

export const houses = pgTable("houses", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  resourceStatus: resourceStatus(),
  createdAt: timestampDefault("createdAt"),
  createdBy: text("createdBy").notNull(),
  modifiedAt: timestampDefault("modifiedAt", { frequent: true }),
  modifiedBy: text("modifiedBy"),
});

export const houseMembers = pgTable(
  "house_members",
  {
    houseId: uuid("houseId")
      .notNull()
      .references(() => houses.id),
    userId: text("userId").notNull(),
    isAdmin: boolean("isAdmin").notNull().default(false),
    resourceStatus: resourceStatus(),
    createdAt: timestampDefault("createdAt"),
    createdBy: text("createdBy").notNull(),
    modifiedAt: timestampDefault("modifiedAt", { frequent: true }),
    modifiedBy: text("modifiedBy"),
  },
  (table) => [
    primaryKey({ columns: [table.houseId, table.userId] }),
    index("house_member_user_index").on(table.userId),
  ],
);
