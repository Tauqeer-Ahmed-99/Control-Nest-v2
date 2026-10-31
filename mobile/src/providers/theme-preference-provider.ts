import { THEME_PREFERENCE } from "@/constants/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Appearance } from "react-native";

export type ThemeMode = "system" | "light" | "dark";

interface ThemePreferenceContextValue {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | null>(
  null,
);

const isThemeMode = (value: string | null): value is ThemeMode =>
  value === "system" || value === "light" || value === "dark";

export function ThemePreferenceProvider({
  children,
}: PropsWithChildren) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isLoaded, setIsLoaded] = useState(false);
  const hasUserSelectedMode = useRef(false);

  useEffect(() => {
    let isMounted = true;

    void AsyncStorage.getItem(THEME_PREFERENCE)
      .then((storedMode) => {
        if (isMounted && !hasUserSelectedMode.current && isThemeMode(storedMode)) {
          setThemeModeState(storedMode);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    Appearance.setColorScheme(
      themeMode === "system" ? "unspecified" : themeMode,
    );
    void AsyncStorage.setItem(THEME_PREFERENCE, themeMode).catch(() => {});
  }, [isLoaded, themeMode]);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    hasUserSelectedMode.current = true;
    setThemeModeState(mode);
  }, []);

  return React.createElement(
    ThemePreferenceContext.Provider,
    { value: { themeMode, setThemeMode } },
    children,
  );
}

export const useThemePreference = () => {
  const context = useContext(ThemePreferenceContext);
  if (!context) {
    throw new Error(
      "useThemePreference must be used within ThemePreferenceProvider",
    );
  }

  return context;
};
