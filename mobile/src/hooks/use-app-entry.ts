import { CONTROLLER_DEVICE_CONFIG } from "@/constants/storage";
import { ControllerConfig } from "@/models/controller-config";
import { canRestoreHouse } from "@/utils/onboarding";
import { useUser } from "@clerk/expo";
import { useGetMobileStorageData } from "./use-mobile-storage-data";

/** Keep splash readiness and entry navigation based on the same saved state. */
export default function useAppEntry() {
  const { isLoaded, isSignedIn, user } = useUser();
  const configQuery = useGetMobileStorageData<ControllerConfig>(
    CONTROLLER_DEVICE_CONFIG,
  );
  const hasHouse = canRestoreHouse(configQuery.data, user?.id);
  const destination: "/auth" | "/(tabs)/home" | "/house-login" = !isSignedIn
    ? "/auth"
    : hasHouse
      ? "/(tabs)/home"
      : "/house-login";

  return {
    isReady: isLoaded && !configQuery.isLoading,
    isSignedIn,
    hasHouse,
    destination,
  };
}
