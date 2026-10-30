import { timestamp as pgTimeStamp } from "drizzle-orm/pg-core";
import { resourceStatus as resourceStatusEnum } from "./enums";

export const resourceStatus = (name = "resourceStatus") =>
  resourceStatusEnum(name).notNull().default("active");

export const timestamp = (name: string) =>
  pgTimeStamp(name, { withTimezone: true });

export const timestampDefault = (
  name: string,
  params?: { frequent?: boolean },
) => {
  const baseTimestamp = timestamp(name).defaultNow();

  const { frequent } = params ?? {};

  if (frequent) {
    return baseTimestamp.$onUpdateFn(() => new Date());
  }

  return baseTimestamp.notNull();
};
