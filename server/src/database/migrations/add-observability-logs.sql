CREATE TABLE IF NOT EXISTS observability_logs (
  id uuid PRIMARY KEY,
  "requestId" uuid NOT NULL,
  source text NOT NULL,
  method text NOT NULL,
  path text NOT NULL,
  "statusCode" integer NOT NULL,
  "durationMs" integer NOT NULL,
  input jsonb,
  output jsonb,
  error jsonb,
  "userId" text,
  "controllerDeviceId" uuid,
  "createdAt" timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS observability_request_created_index
  ON observability_logs ("requestId", "createdAt");
CREATE INDEX IF NOT EXISTS observability_user_created_index
  ON observability_logs ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS observability_controller_created_index
  ON observability_logs ("controllerDeviceId", "createdAt");
