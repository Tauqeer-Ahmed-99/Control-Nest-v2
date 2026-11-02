import useAppEntry from "@/hooks/use-app-entry";
import { router, usePathname, useRootNavigationState } from "expo-router";
import { PropsWithChildren, useEffect } from "react";

export interface TokenCache {
  getToken: (key: string) => Promise<string | undefined | null>;
  saveToken: (key: string, token: string) => Promise<void>;
  clearToken?: (key: string) => void;
}

export default function AuthProvider({ children }: PropsWithChildren) {
  const { isReady, isSignedIn, hasHouse, destination } = useAppEntry();
  const navigation = useRootNavigationState();
  const pathname = usePathname();

  useEffect(() => {
    if (
      !navigation?.key ||
      !isReady ||
      pathname === "/" ||
      pathname === "/app-updates"
    )
      return;
    if (!isSignedIn) {
      if (pathname !== "/auth") router.replace("/auth");
      return;
    }
    if (pathname === "/auth") {
      router.replace(destination);
    } else if (!hasHouse && pathname !== "/house-login") {
      router.replace("/house-login");
    }
  }, [destination, hasHouse, isReady, isSignedIn, navigation?.key, pathname]);

  return children;
}
