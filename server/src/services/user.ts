import { APIError } from "@/models/api";
import tryCatch from "@/utils/try-catch";
import { clerk } from "./auth";

export const getUserById = async ({ userId }: { userId: string }) => {
  const { data: user, error } = await tryCatch(clerk.users.getUser(userId));

  if (error) {
    if ("status" in error && error.status === 404) {
      throw new APIError({ message: "User not found.", statusCode: 404 });
    }
    throw new APIError({ message: "Unable to fetch user.", statusCode: 502 });
  }

  // Return only the profile fields needed to identify an actor in the app.
  return {
    id: user.id,
    fullName: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    username: user.username,
  };
};
