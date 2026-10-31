-- Run once against each existing database before deploying the new server schema.
-- Existing pinNumber values are BCM GPIO numbers. Preserve them in gpioPinNumber
-- and replace pinNumber with the corresponding physical Raspberry Pi header pin.

BEGIN;

ALTER TABLE "devices" ADD COLUMN "gpioPinNumber" integer;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "devices"
    WHERE "pinNumber" NOT IN (
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
      15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27
    )
  ) THEN
    RAISE EXCEPTION 'Cannot migrate devices: an existing GPIO pin number is not in the Raspberry Pi header configuration.';
  END IF;
END $$;

UPDATE "devices"
SET
  "gpioPinNumber" = "pinNumber",
  "pinNumber" = CASE "pinNumber"
    WHEN 0 THEN 27
    WHEN 1 THEN 28
    WHEN 2 THEN 3
    WHEN 3 THEN 5
    WHEN 4 THEN 7
    WHEN 5 THEN 29
    WHEN 6 THEN 31
    WHEN 7 THEN 26
    WHEN 8 THEN 24
    WHEN 9 THEN 21
    WHEN 10 THEN 19
    WHEN 11 THEN 23
    WHEN 12 THEN 32
    WHEN 13 THEN 33
    WHEN 14 THEN 8
    WHEN 15 THEN 10
    WHEN 16 THEN 36
    WHEN 17 THEN 11
    WHEN 18 THEN 12
    WHEN 19 THEN 35
    WHEN 20 THEN 38
    WHEN 21 THEN 40
    WHEN 22 THEN 15
    WHEN 23 THEN 16
    WHEN 24 THEN 18
    WHEN 25 THEN 22
    WHEN 26 THEN 37
    WHEN 27 THEN 13
  END;

ALTER TABLE "devices" ALTER COLUMN "gpioPinNumber" SET NOT NULL;

COMMIT;
