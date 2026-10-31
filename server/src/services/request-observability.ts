import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { recordServerObservabilityEvent } from "./request-observability-store";
import {
  getObservabilityUserId,
  runWithRequestContext,
} from "./observability-context";

const REQUEST_ID_HEADER = "x-request-id";
const SECRET_FIELD = /authorization|cookie|password|token|secret|credential|private.?key|api.?key/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const safeString = (value: string) =>
  value
    .replace(/\b(Bearer|Basic)\s+[^\s"']+/gi, "$1 [REDACTED]")
    .replace(/\beyJ[a-zA-Z0-9_-]{10,}\.[\w-]{10,}\.[\w-]{10,}\b/g, "[REDACTED]")
    .replace(/([?&](?:access_token|token|api_key|key|password|secret)=)[^&\s]+/gi, "$1[REDACTED]")
    .replace(/(https?:\/\/)[^/@\s]+:[^/@\s]+@/gi, "$1[REDACTED]@");

const redact = (value: unknown): unknown => {
  if (typeof value === "string") return safeString(value);
  if (Array.isArray(value)) return value.map(redact);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        SECRET_FIELD.test(key) ? "[REDACTED]" : redact(entry),
      ]),
    );
  }
  return value;
};

const parsePayload = (value: string): unknown => {
  if (!value) return null;
  try {
    return redact(JSON.parse(value));
  } catch {
    return redact(value);
  }
};

const getInput = async (request: NextRequest) => {
  const url = new URL(request.url);
  const query = Object.fromEntries(url.searchParams.entries());
  const headers = Object.fromEntries(
    Array.from(request.headers.entries()).map(([name, value]) => [
      name,
      SECRET_FIELD.test(name) ? "[REDACTED]" : safeString(value),
    ]),
  );
  const body = request.body ? parsePayload(await request.clone().text()) : null;
  return redact({ headers, query, body });
};

const errorFrom = (statusCode: number, output: unknown) => {
  const body =
    output && typeof output === "object" && "body" in output
      ? (output as { body?: unknown }).body
      : output;
  if (statusCode < 400 && !(body && typeof body === "object" && "success" in body && body.success === false)) {
    return null;
  }
  if (body && typeof body === "object") {
    const payload = body as { message?: unknown; errors?: unknown };
    return redact({ message: payload.message, errors: payload.errors });
  }
  return { statusCode };
};

const controllerIdFromInput = (input: unknown) => {
  if (!input || typeof input !== "object") return null;
  const value = input as {
    query?: Record<string, unknown>;
    body?: Record<string, unknown>;
  };
  const candidate =
    value.body?.controllerDeviceId ?? value.query?.controllerDeviceId;
  return typeof candidate === "string" && UUID_PATTERN.test(candidate)
    ? candidate
    : null;
};

export const withRequestObservability = <T extends (request: NextRequest) => Promise<Response> | Response>(
  handler: T,
): T =>
  (async (request: NextRequest) => {
    const suppliedRequestId = request.headers.get(REQUEST_ID_HEADER) ?? "";
    const requestId = UUID_PATTERN.test(suppliedRequestId)
      ? suppliedRequestId
      : randomUUID();
    const startedAt = performance.now();

    return runWithRequestContext({ requestId }, async () => {
      const input = await getInput(request);
      let response: Response;

      try {
        response = await handler(request);
      } catch (error) {
        const message = error instanceof Error ? safeString(error.message) : "Server Error";
        response = Response.json(
          { success: false, message, data: null, errors: null },
          { status: 500 },
        );
      }

      response.headers.set(REQUEST_ID_HEADER, requestId);
      const output = {
        headers: redact(
          Object.fromEntries(
            Array.from(response.headers.entries()).map(([name, value]) => [
              name,
              SECRET_FIELD.test(name) ? "[REDACTED]" : safeString(value),
            ]),
          ),
        ),
        body: parsePayload(await response.clone().text()),
      };
      const event = {
        id: randomUUID(),
        requestId,
        source: "server",
        method: request.method,
        path: new URL(request.url).pathname,
        statusCode: response.status,
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
        input,
        output,
        error: errorFrom(response.status, output),
        userId: getObservabilityUserId() ?? null,
        controllerDeviceId: controllerIdFromInput(input),
      };

      await recordServerObservabilityEvent(event);
      return response;
    });
  }) as T;
