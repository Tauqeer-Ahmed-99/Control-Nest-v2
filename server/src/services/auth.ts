import { createClerkClient, verifyToken } from "@clerk/backend";

import env from "@/env/vars";
import database from "@/database";
import {
  controllerIdFromKey,
  matchesControllerKey,
} from "./controller-credentials";
import { APIError } from "@/models/api";
import tryCatch from "@/utils/try-catch";
import {
  measureRequestTiming,
  setObservabilityUserId,
  setObservabilityControllerId,
} from "./observability-context";

export const clerk = createClerkClient({
  secretKey: env.variables.CLERK_SECRET_KEY,
});

type TokenString = string;

export const authenticate = async (payload: Request | TokenString) => {
  const token = (
    typeof payload === "string" ? payload : payload.headers.get("authorization")
  )?.replace("Bearer ", "");

  if (!token) {
    throw new APIError({
      message: "Missing authorization header",
      statusCode: 400,
    });
  }

  const { data, error } = await measureRequestTiming("auth-verify-token", () =>
    tryCatch(verifyToken(token, { secretKey: env.variables.CLERK_SECRET_KEY })),
  );

  if (error) {
    throw new APIError({
      message: "Unauthorized, invalid session",
      statusCode: 401,
    });
  }

  const userId = data.sub;

  if (!userId) {
    throw new APIError({
      message: "Invalid token, no user id in session token",
      statusCode: 400,
    });
  }

  const user = await measureRequestTiming("auth-user-lookup", () =>
    clerk.users.getUser(userId),
  );

  if (!user) {
    throw new APIError({
      message: "Invalid token, user not found",
      statusCode: 400,
    });
  }

  setObservabilityUserId(user.id);

  return { user, token };
};

export const authenticateControllerDevice = async (
  req: Request,
  { allowUnpaired = false } = {},
) => {
  const key =
    req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1] ?? "";
  const id = controllerIdFromKey(key);
  const { data: controller, error } = await tryCatch(async () =>
    id
      ? database.query.controllerDevices.findFirst({
          where: { id, resourceStatus: "active" },
        })
      : undefined,
  );
  if (error)
    throw new APIError({ message: "Unable to verify controller credentials." });
  if (
    !controller?.apiKeyHash ||
    !matchesControllerKey(key, controller.apiKeyHash)
  ) {
    throw new APIError({
      message: "Invalid or revoked controller API key.",
      statusCode: 401,
    });
  }
  if (
    (!allowUnpaired && !controller.installationId) ||
    (controller.installationId &&
      controller.installationId !==
        req.headers.get("x-controller-installation-id"))
  ) {
    throw new APIError({
      message:
        "This key belongs to another installation. Pair this controller first.",
      statusCode: 403,
    });
  }
  setObservabilityControllerId(controller.id);
  return controller;
};
