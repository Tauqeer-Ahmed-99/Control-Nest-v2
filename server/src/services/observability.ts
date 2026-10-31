import database from "@/database";
import { controllerDevices, houseMembers, observabilityLogs } from "@/database/schema";
import type { ControllerObservabilityEvent } from "@/models/observability";
import tryCatch from "@/utils/try-catch";
import { and, desc, eq, inArray, isNotNull, or } from "drizzle-orm";

export const recordControllerObservabilityEvent = async (
  event: ControllerObservabilityEvent,
) =>
  tryCatch(async () => {
    const ownerRows = event.controllerDeviceId
      ? []
      : await database
          .select({ userId: observabilityLogs.userId })
          .from(observabilityLogs)
          .where(
            and(
              eq(observabilityLogs.requestId, event.requestId),
              eq(observabilityLogs.source, "server"),
              isNotNull(observabilityLogs.userId),
            ),
          )
          .limit(1);

    return database
      .insert(observabilityLogs)
      .values({
        id: event.id,
        requestId: event.requestId,
        createdAt: event.createdAt ? new Date(event.createdAt) : undefined,
        source: event.source,
        method: event.method,
        path: event.path,
        statusCode: event.statusCode,
        durationMs: event.durationMs,
        input: event.input,
        output: event.output,
        error: event.error,
        userId: ownerRows[0]?.userId ?? null,
        controllerDeviceId: event.controllerDeviceId ?? null,
      })
      .onConflictDoNothing();
  });

export const getObservabilityLogs = async ({
  userId,
  requestId,
  limit,
}: {
  userId: string;
  requestId?: string;
  limit: number;
}) => {
  const result = await tryCatch(async () => {
    const memberships = await database
      .select({ houseId: houseMembers.houseId })
      .from(houseMembers)
      .where(
        and(
          eq(houseMembers.userId, userId),
          eq(houseMembers.resourceStatus, "active"),
        ),
      );
    const houseIds = memberships.map(({ houseId }) => houseId);
    const controllerRows = houseIds.length
      ? await database
          .select({ id: controllerDevices.id })
          .from(controllerDevices)
          .where(
            and(
              inArray(controllerDevices.houseId, houseIds),
              eq(controllerDevices.resourceStatus, "active"),
            ),
          )
      : [];
    const controllerIds = controllerRows.map(({ id }) => id);
    const accessConditions = [eq(observabilityLogs.userId, userId)];

    if (controllerIds.length) {
      accessConditions.push(inArray(observabilityLogs.controllerDeviceId, controllerIds));
    }

    const conditions = [or(...accessConditions)!];
    if (requestId) conditions.push(eq(observabilityLogs.requestId, requestId));

    return database
      .select()
      .from(observabilityLogs)
      .where(and(...conditions))
      .orderBy(desc(observabilityLogs.createdAt))
      .limit(limit);
  });

  if (result.error) throw result.error;
  return result.data;
};
