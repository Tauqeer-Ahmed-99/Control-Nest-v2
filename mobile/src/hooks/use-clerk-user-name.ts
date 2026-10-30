import { useUser } from "@clerk/expo";

/**
 * Returns a function that resolves a Clerk userId to a display name.
 *
 * - If the userId matches the current signed-in user, returns their full/first name.
 * - Otherwise falls back to a truncated ID so the UI never shows a raw UUID.
 */
const useClerkUserName = () => {
  const { user } = useUser();

  const resolve = (userId: string | null | undefined): string => {
    if (!userId) return "Unknown";

    if (user && user.id === userId) {
      return (
        user.fullName ??
        user.firstName ??
        user.emailAddresses[0]?.emailAddress?.split("@")[0] ??
        userId.slice(0, 8)
      );
    }

    // For other house members we don't have their Clerk profile client-side,
    // so show a short identifier.
    return userId.slice(0, 8) + "…";
  };

  return resolve;
};

export default useClerkUserName;
