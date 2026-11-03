BEGIN;
CREATE TABLE IF NOT EXISTS releases (
 "version" text PRIMARY KEY, "commit" text NOT NULL, "githubUrl" text NOT NULL,
 published boolean NOT NULL DEFAULT false, verified boolean NOT NULL DEFAULT false, revoked boolean NOT NULL DEFAULT false,
 manifests jsonb NOT NULL, mobile jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS release_policies (
 revision integer PRIMARY KEY, envelope jsonb NOT NULL, "effectiveAt" timestamptz NOT NULL, "controllerIds" jsonb NOT NULL DEFAULT '[]'
);
CREATE TABLE IF NOT EXISTS controller_firmware (
 "controllerDeviceId" uuid PRIMARY KEY REFERENCES controller_devices(id), "installationId" uuid NOT NULL,
 status jsonb NOT NULL, "observedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS firmware_jobs (
 id uuid PRIMARY KEY, "controllerDeviceId" uuid NOT NULL REFERENCES controller_devices(id), "installationId" uuid NOT NULL,
 "requestedBy" text NOT NULL, "idempotencyKey" uuid NOT NULL, operation text NOT NULL,
 "sourceVersion" text NOT NULL, "targetVersion" text NOT NULL REFERENCES releases(version),
 "manifestDigest" text NOT NULL, manifest jsonb NOT NULL, nonce uuid NOT NULL, "expiresAt" timestamptz NOT NULL, "acceptedAt" timestamptz,
 phase text NOT NULL DEFAULT 'queued', sequence integer NOT NULL DEFAULT 0, progress jsonb NOT NULL,
 "createdAt" timestamptz NOT NULL DEFAULT now(), "updatedAt" timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS firmware_job_idempotency ON firmware_jobs ("controllerDeviceId", "idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS firmware_job_active ON firmware_jobs ("controllerDeviceId") WHERE phase NOT IN ('completed','failed','rolled_back','recovery_required');
COMMIT;
