import { pgEnum } from "drizzle-orm/pg-core";

export const resourceStatus = pgEnum("resourceStatus", ["active", "inactive"]);
