import { getTypedRoute, Routes } from "@/routes/routes";
import { useUser } from "@clerk/expo";
import { router, useNavigationContainerRef, usePathname } from "expo-router";

import React, { PropsWithChildren, useEffect, useState } from "react";

export interface TokenCache {
  getToken: (key: string) => Promise<string | undefined | null>;
  saveToken: (key: string, token: string) => Promise<void>;
  clearToken?: (key: string) => void;
}

export default function AuthProvider({ children }: PropsWithChildren) {
  const { isSignedIn } = useUser();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const rootNavigation = useNavigationContainerRef();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = rootNavigation.addListener("state", () => {
      setIsNavigationReady(true);
    });
    return function cleanup() {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [rootNavigation]);

  useEffect(() => {
    if (isNavigationReady) {
      if (isSignedIn) {
        if (router.canDismiss()) router.dismissAll();

        router.replace(getTypedRoute(Routes.HouseLogin));
      } else {
        if (router.canDismiss()) router.dismissAll();
        router.replace(getTypedRoute(Routes.Auth));
      }
    }
  }, [isSignedIn, isNavigationReady]);

  useEffect(() => {
    if (isNavigationReady) {
      const isEntryRoute = pathname === "/" || pathname === "/index";
      const isSignedInAuthRoute = isSignedIn && pathname === "/auth";

      if (isEntryRoute || isSignedInAuthRoute) {
        if (router.canDismiss()) router.dismissAll();
        if (isSignedIn) {
          router.replace(getTypedRoute(Routes.HouseLogin));
        } else {
          router.replace(getTypedRoute(Routes.Auth));
        }
      }
    }
  }, [isNavigationReady, isSignedIn, pathname]);

  return <React.Fragment>{children}</React.Fragment>;
}
