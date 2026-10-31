import { AsyncLocalStorage } from "node:async_hooks";

type RequestContext = {
  requestId: string;
  userId?: string;
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
