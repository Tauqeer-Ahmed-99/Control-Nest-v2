import { AsyncLocalStorage } from "node:async_hooks";

type RequestContext = {
  requestId: string;
  userId?: string;
  timings: RequestTiming[];
};

export type RequestTiming = {
  name: string;
  durationMs: number;
};

const requestContext = new AsyncLocalStorage<RequestContext>();

export const runWithRequestContext = <T>(
  context: RequestContext,
  callback: () => T,
) => requestContext.run(context, callback);

export const getRequestId = () => requestContext.getStore()?.requestId;

export const setObservabilityUserId = (userId: string) => {
  const context = requestContext.getStore();
  if (context) context.userId = userId;
};

export const getObservabilityUserId = () =>
  requestContext.getStore()?.userId;

export const getRequestTimings = () =>
  requestContext.getStore()?.timings ?? [];

export const measureRequestTiming = async <T>(
  name: string,
  operation: () => Promise<T> | PromiseLike<T>,
): Promise<T> => {
  const startedAt = performance.now();

  try {
    return await operation();
  } finally {
    const context = requestContext.getStore();
    if (context) {
      context.timings.push({
        name,
        durationMs: Math.max(0, performance.now() - startedAt),
      });
    }
  }
};
