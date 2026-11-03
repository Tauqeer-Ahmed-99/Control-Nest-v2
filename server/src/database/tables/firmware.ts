import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type { Signed, FirmwareStatus } from "@/models/firmware";
import { controllerDevices } from "./controller-devices";
import { sql } from "drizzle-orm";

export const releases = pgTable("releases", {
  version: text("version").primaryKey(),
  commit: text("commit").notNull(),
  githubUrl: text("githubUrl").notNull(),
  published: boolean("published").notNull().default(false),
  verified: boolean("verified").notNull().default(false),
  revoked: boolean("revoked").notNull().default(false),
  manifests: jsonb("manifests").$type<Signed[]>().notNull(),
  mobile: jsonb("mobile").$type<Record<string, string>>().notNull().default({}),
});
export const releasePolicies = pgTable("release_policies", {
  revision: integer("revision").primaryKey(),
  envelope: jsonb("envelope").$type<Signed>().notNull(),
  effectiveAt: timestamp("effectiveAt", { withTimezone: true }).notNull(),
  controllerIds: jsonb("controllerIds").$type<string[]>().notNull().default([]),
});
export const controllerFirmware = pgTable("controller_firmware", {
  controllerDeviceId: uuid("controllerDeviceId")
    .primaryKey()
    .references(() => controllerDevices.id),
  installationId: uuid("installationId").notNull(),
  status: jsonb("status").$type<FirmwareStatus>().notNull(),
  observedAt: timestamp("observedAt", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
export const firmwareJobs = pgTable(
  "firmware_jobs",
  {
    id: uuid("id").primaryKey(),
    controllerDeviceId: uuid("controllerDeviceId")
      .notNull()
      .references(() => controllerDevices.id),
    installationId: uuid("installationId").notNull(),
    requestedBy: text("requestedBy").notNull(),
    idempotencyKey: uuid("idempotencyKey").notNull(),
    operation: text("operation").notNull(),
    sourceVersion: text("sourceVersion").notNull(),
    targetVersion: text("targetVersion")
      .notNull()
      .references(() => releases.version),
    manifestDigest: text("manifestDigest").notNull(),
    manifest: jsonb("manifest").$type<Signed>().notNull(),
    nonce: uuid("nonce").notNull(),
    expiresAt: timestamp("expiresAt", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("acceptedAt", { withTimezone: true }),
    phase: text("phase").notNull().default("queued"),
    sequence: integer("sequence").notNull().default(0),
    progress: jsonb("progress")
      .$type<{
        runningVersion: string | null;
        failureCode?: string | null;
        bytes?: number;
        totalBytes?: number;
      }>()
      .notNull(),
    createdAt: timestamp("createdAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updatedAt", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("firmware_job_idempotency").on(
      t.controllerDeviceId,
      t.idempotencyKey,
    ),
    uniqueIndex("firmware_job_active")
      .on(t.controllerDeviceId)
      .where(
        sql`${t.phase} not in ('completed','failed','rolled_back','recovery_required')`,
      ),
  ],
);
