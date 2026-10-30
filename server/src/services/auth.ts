import { createClerkClient, verifyToken } from "@clerk/backend";

import env from "@/env/vars";
import { APIError } from "@/models/api";
import tryCatch from "@/utils/try-catch";

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

  const { data, error } = await tryCatch(
    verifyToken(token, { secretKey: env.variables.CLERK_SECRET_KEY }),
  );

  if (error) {
    console.log("[Auth]:", error);
    throw new APIError({
      message: "Uanuthorized, invalid session",
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

  const user = await clerk.users.getUser(userId);

  if (!user) {
    throw new APIError({
      message: "Invalid token, user not found",
      statusCode: 400,
    });
  }

  return { user, token };
};

const expectedEncodedAuth = Buffer.from(
  `${env.variables.CONTROLLER_USERNAME}:${env.variables.CONTROLLER_PASSWORD}`,
  "utf-8",
).toString("base64");

export const authenticateControllerDevice = async (req: Request) => {
  const encodedAuth = req.headers.get("Authorization")?.replace("Basic ", "");

  if (encodedAuth !== expectedEncodedAuth) {
    throw new APIError({ message: "Unauthorized", statusCode: 400 });
  }
};
