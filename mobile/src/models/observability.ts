export type ObservabilityLog = {
  id: string;
  requestId: string;
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
  createdAt: string;
};
