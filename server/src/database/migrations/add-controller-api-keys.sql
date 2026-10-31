BEGIN;
ALTER TABLE controller_devices ADD COLUMN IF NOT EXISTS "apiKeyHash" text;
ALTER TABLE controller_devices ADD COLUMN IF NOT EXISTS "apiKeyLastFour" text;
ALTER TABLE controller_devices ADD COLUMN IF NOT EXISTS "installationId" uuid;
ALTER TABLE devices ADD COLUMN IF NOT EXISTS "controllerDeviceId" uuid REFERENCES controller_devices(id);

-- Only infer ownership when a house has exactly one controller. Never guess.
UPDATE devices d SET "controllerDeviceId" = assignments.id
FROM rooms r JOIN (
  SELECT "houseId", (array_agg(id))[1] AS id
  FROM controller_devices GROUP BY "houseId" HAVING count(*) = 1
) assignments ON assignments."houseId" = r."houseId"
WHERE d."roomId" = r.id AND d."controllerDeviceId" IS NULL;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM devices WHERE "controllerDeviceId" IS NULL) THEN
    RAISE EXCEPTION 'Assign devices.controllerDeviceId explicitly for houses with zero or multiple controllers, then rerun migration.';
  END IF;
END $$;
ALTER TABLE devices ALTER COLUMN "controllerDeviceId" SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS device_controller_pin_unique ON devices ("controllerDeviceId", "pinNumber");
COMMIT;
