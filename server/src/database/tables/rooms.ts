import { index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { houses } from "./houses";
import { resourceStatus, timestampDefault } from "../common";

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    houseId: uuid("houseId")
      .notNull()
      .references(() => houses.id),
    name: text("name").notNull(),
    resourceStatus: resourceStatus(),
    createdAt: timestampDefault("createdAt"),
    createdBy: text("createdBy").notNull(),
    modifiedAt: timestampDefault("modifiedAt", { frequent: true }),
    modifiedBy: text("modifiedBy"),
  },
  (table) => [index("room_house_index").on(table.houseId)],
);
