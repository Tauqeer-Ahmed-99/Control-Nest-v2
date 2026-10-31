import database from "@/database";
import { observabilityLogs } from "@/database/schema";
import tryCatch from "@/utils/try-catch";

type ServerObservabilityEvent = {
  id: string;
  requestId: string;
  createdAt: Date;
  source: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  input: unknown;
  output: unknown;
  error: unknown;
  userId: string | null;
  controllerDeviceId: string | null;
};

export const recordServerObservabilityEvent = async (
  event: ServerObservabilityEvent,
) => {
  const result = await tryCatch(() =>
    database.insert(observabilityLogs).values(event),
  );
  if (result.error) {
    console.error("Unable to persist request observability event", event.id);
  }
};
