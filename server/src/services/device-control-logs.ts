import tryCatch from "@/utils/try-catch";
import database from "@/database";
import { deviceControlLogs } from "@/database/schema";
import { APIError } from "@/models/api";
import {
  sql,
  and,
  count,
  desc,
  eq,
  ilike,
  or,
  type SQL,
  inArray,
} from "drizzle-orm";
import { authorizeHouse } from "./auth-house";
import { measureRequestTiming } from "./observability-context";

export const createLog = async ({
  deviceId,
  statusFrom,
  statusTo,
  controllerDeviceId,
}: {
  deviceId: string;
  statusFrom: boolean;
  statusTo: boolean;
  controllerDeviceId: string;
}) => {
  const { data: device, error } = await tryCatch(
    database.query.devices.findFirst({
      where: { id: deviceId, controllerDeviceId },
    }),
  );
  if (error)
    throw new APIError({ message: "Unable to verify device ownership." });
  if (!device)
    throw new APIError({
      message: "Device does not belong to this controller.",
      statusCode: 403,
    });

  await measureRequestTiming("db-control-log-insert", () =>
    database.insert(deviceControlLogs).values({
      deviceId,
      statusChangedFrom: statusFrom,
      statusChangedTo: statusTo,
      createdBy: `CD-${controllerDeviceId}`,
    }),
  );
};

interface GetDeviceControlLogsParams {
  page?: number;
  limit?: number;
  search?: string;
  deviceId?: string;
  houseId?: string;
  statusChangedFrom?: boolean;
  statusChangedTo?: boolean;
}

export const searchDeviceControlLogs = async (
  {
    page = 1,
    limit = 10,
    search,
    deviceId,
    houseId,
    statusChangedFrom,
    statusChangedTo,
  }: GetDeviceControlLogsParams,
  userId: string,
) => {
  if (!deviceId && !houseId) {
    throw new APIError({
      message: "Either house or device id is required.",
      statusCode: 400,
    });
  }

  let houseIdToCheck: string;

  if (deviceId) {
    const device = await database.query.devices.findFirst({
      where: { id: deviceId },
      with: { room: true },
    });

    if (!device) {
      throw new APIError({
        message: "Device not found.",
        statusCode: 404,
      });
    }

    if (!device.room) {
      throw new APIError({
        message: "Room not found.",
        statusCode: 404,
      });
    }

    houseIdToCheck = device.room.houseId;
  } else {
    houseIdToCheck = houseId!;
  }

  await authorizeHouse({ houseId: houseIdToCheck, userId });

  const safePage = Math.max(1, Math.floor(page));
  const safeLimit = Math.min(100, Math.max(1, Math.floor(limit)));

  const offset = (safePage - 1) * safeLimit;

  const houseDeviceIds: string[] = [];

  if (houseId) {
    const house = await database.query.houses.findFirst({
      where: { id: houseIdToCheck },
      columns: { id: true },
      with: {
        rooms: {
          with: { devices: { columns: { id: true } } },
          columns: { id: true },
        },
      },
    });

    if (!house) {
      throw new APIError({
        message: "House not found.",
        statusCode: 404,
      });
    }

    for (const room of house.rooms) {
      for (const device of room.devices) {
        houseDeviceIds.push(device.id);
      }
    }
  }

  const conditions: SQL[] = [];

  if (deviceId) {
    conditions.push(eq(deviceControlLogs.deviceId, deviceId));
  }

  if (houseDeviceIds.length > 0) {
    conditions.push(inArray(deviceControlLogs.deviceId, houseDeviceIds));
  }

  if (statusChangedFrom !== undefined) {
    conditions.push(eq(deviceControlLogs.statusChangedFrom, statusChangedFrom));
  }

  if (statusChangedTo !== undefined) {
    conditions.push(eq(deviceControlLogs.statusChangedTo, statusChangedTo));
  }

  if (search?.trim()) {
    const term = `%${search.trim()}%`;

    conditions.push(
      or(
        ilike(deviceControlLogs.createdBy, term),
        ilike(deviceControlLogs.modifiedBy, term),
      )!,
    );
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

  const [logs, totalResult] = await Promise.all([
    database
      .select()
      .from(deviceControlLogs)
      .where(whereClause)
      .orderBy(desc(deviceControlLogs.createdAt), desc(deviceControlLogs.id))
      .limit(safeLimit)
      .offset(offset),

    database
      .select({ total: count() })
      .from(deviceControlLogs)
      .where(whereClause),
  ]);

  const total = totalResult[0]?.total ?? 0;

  return {
    data: logs,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages: Math.ceil(total / safeLimit),
      hasNextPage: safePage * safeLimit < total,
      hasPreviousPage: safePage > 1,
    },
  };
};

type EnergyUnit = "kWh" | "Wh";

interface EnergyConsumptionOptions {
  houseId: string;
  userId: string;
  startDate?: Date;
  endDate?: Date;
  unit?: EnergyUnit;
}

export const getEnergyConsumption = async ({
  houseId,
  userId,
  startDate,
  endDate,
  unit = "kWh",
}: EnergyConsumptionOptions) => {
  await authorizeHouse({ houseId, userId });

  const now = new Date();

  // Default to the previous calendar month (UTC).
  const defaultEnd = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );

  const defaultStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );

  const start = startDate ?? defaultStart;
  const end = endDate ?? defaultEnd;

  if (
    !houseId ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start >= end
  ) {
    throw new Error("Invalid house ID or date range.");
  }

  if (unit !== "kWh" && unit !== "Wh") {
    throw new Error("Unit must be either kWh or Wh.");
  }

  const result = await database.execute(sql`
    WITH house_devices AS (
      SELECT
        d.id AS device_id,
        d.wattage::numeric AS wattage
      FROM houses h
      INNER JOIN rooms r
        ON r."houseId" = h.id
      INNER JOIN devices d
        ON d."roomId" = r.id
      WHERE h.id = ${houseId}::uuid
    ),

    device_baselines AS (
      SELECT
        hd.device_id,
        hd.wattage,
        COALESCE(
          previous_log."statusChangedTo",
          first_log."statusChangedFrom"
        ) AS initial_status
      FROM house_devices hd

      LEFT JOIN LATERAL (
        SELECT
          l.id,
          l."statusChangedTo"
        FROM device_control_logs l
        WHERE l."deviceId" = hd.device_id
          AND l."createdAt" <= ${start}
        ORDER BY l."createdAt" DESC, l.id DESC
        LIMIT 1
      ) previous_log ON TRUE

      LEFT JOIN LATERAL (
        SELECT
          l.id,
          l."statusChangedFrom"
        FROM device_control_logs l
        WHERE l."deviceId" = hd.device_id
          AND l."createdAt" >= ${start}
          AND l."createdAt" < ${end}
        ORDER BY l."createdAt" ASC, l.id ASC
        LIMIT 1
      ) first_log ON TRUE

      WHERE previous_log.id IS NOT NULL
         OR first_log.id IS NOT NULL
    ),

    events AS (
      -- State at the beginning of the period.
      SELECT
        b.device_id,
        b.wattage,
        ${start}::timestamp AS event_time,
        b.initial_status AS is_on,
        0 AS event_order
      FROM device_baselines b

      UNION ALL

      -- State transitions during the period.
      SELECT
        l."deviceId" AS device_id,
        b.wattage,
        l."createdAt" AS event_time,
        l."statusChangedTo" AS is_on,
        1 AS event_order
      FROM device_control_logs l
      INNER JOIN device_baselines b
        ON b.device_id = l."deviceId"
      WHERE l."createdAt" > ${start}
        AND l."createdAt" < ${end}
    ),

    intervals AS (
      SELECT
        device_id,
        wattage,
        is_on,
        event_time,
        LEAD(
          event_time,
          1,
          ${end}::timestamp
        ) OVER (
          PARTITION BY device_id
          ORDER BY event_time, event_order
        ) AS next_event_time
      FROM events
    ),

    device_consumption AS (
      SELECT
        device_id AS "deviceId",
        COALESCE(
          SUM(
            CASE
              WHEN is_on IS TRUE THEN
                wattage * EXTRACT(
                  EPOCH FROM (
                    next_event_time - event_time
                  )
                ) / 3600.0
              ELSE 0
            END
          ),
          0
        ) AS "energyWh"
      FROM intervals
      GROUP BY device_id
    )

    SELECT
      "deviceId",
      "energyWh",
      "energyWh" / 1000.0 AS "energyKwh"
    FROM device_consumption
    ORDER BY "deviceId"
  `);

  const devices = (
    result.rows as {
      deviceId: string;
      energyWh: string | number;
      energyKwh: string | number;
    }[]
  ).map((row) => {
    const energyWh = Number(row.energyWh);
    const energyKwh = Number(row.energyKwh);

    return {
      deviceId: row.deviceId,
      energyWh,
      energyKwh,
      consumption: unit === "kWh" ? energyKwh : energyWh,
    };
  });

  const totalWh = devices.reduce((total, device) => total + device.energyWh, 0);

  return {
    houseId,
    period: {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      endExclusive: true,
    },
    unit,
    totalConsumption: unit === "kWh" ? totalWh / 1000 : totalWh,
    totalWh,
    totalKwh: totalWh / 1000,
    devices,
  };
};
