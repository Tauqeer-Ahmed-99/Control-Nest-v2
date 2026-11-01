import { canRestoreHouse } from "@/utils/onboarding";
import { CONTROLLER_DEVICE_CONFIG } from "@/constants/storage";
import { useGetMobileStorageData } from "@/hooks/use-mobile-storage-data";
import { ControllerConfig } from "@/models/controller-config";
import { useUser } from "@clerk/expo";
import { router, usePathname, useRootNavigationState } from "expo-router";
import { PropsWithChildren, useEffect } from "react";

export interface TokenCache {
  getToken: (key: string) => Promise<string | undefined | null>;
  saveToken: (key: string, token: string) => Promise<void>;
  clearToken?: (key: string) => void;
}

export default function AuthProvider({ children }: PropsWithChildren) {
  const { isLoaded, isSignedIn, user } = useUser();
  const navigation = useRootNavigationState();
  const pathname = usePathname();
  const configQuery = useGetMobileStorageData<ControllerConfig>(
    CONTROLLER_DEVICE_CONFIG,
  );
  const hasHouse = canRestoreHouse(configQuery.data, user?.id);

  useEffect(() => {
    if (!navigation?.key || !isLoaded || configQuery.isLoading) return;
    if (!isSignedIn) {
      if (pathname !== "/auth") router.replace("/auth");
      return;
    }
    if (pathname === "/" || pathname === "/index" || pathname === "/auth") {
      router.replace(hasHouse ? "/(tabs)/home" : "/house-login");
    } else if (!hasHouse && pathname !== "/house-login") {
      router.replace("/house-login");
    }
  }, [
    configQuery.isLoading,
    hasHouse,
    isLoaded,
    isSignedIn,
    navigation?.key,
    pathname,
  ]);

  return children;
}
