import {
  createContext,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AccessibilityInfo, Platform } from "react-native";

export const AccessibilityPreferencesContext = createContext({
  reduceMotion: true,
  reduceTransparency: true,
  highContrast: true,
});

/** Read system settings once for all controls and materials. */
export function AccessibilityPreferencesProvider({
  children,
}: PropsWithChildren) {
  const [reduceMotion, setReduceMotion] = useState(true);
  const [reduceTransparency, setReduceTransparency] = useState(true);
  const [highContrast, setHighContrast] = useState(true);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (active) setReduceMotion(value);
      })
      .catch(() => {});
    const motion = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );
    if (Platform.OS === "ios") {
      void AccessibilityInfo.isReduceTransparencyEnabled()
        .then((value) => {
          if (active) setReduceTransparency(value);
        })
        .catch(() => {});
      void AccessibilityInfo.isDarkerSystemColorsEnabled()
        .then((value) => {
          if (active) setHighContrast(value);
        })
        .catch(() => {});
      const transparency = AccessibilityInfo.addEventListener(
        "reduceTransparencyChanged",
        setReduceTransparency,
      );
      const contrast = AccessibilityInfo.addEventListener(
        "darkerSystemColorsChanged",
        setHighContrast,
      );
      return () => {
        active = false;
        motion.remove();
        transparency.remove();
        contrast.remove();
      };
    }
    if (Platform.OS === "android") {
      void AccessibilityInfo.isHighTextContrastEnabled()
        .then((value) => {
          if (active) setHighContrast(value);
        })
        .catch(() => {});
      const contrast = AccessibilityInfo.addEventListener(
        "highTextContrastChanged",
        setHighContrast,
      );
      return () => {
        active = false;
        motion.remove();
        contrast.remove();
      };
    }
    return () => {
      active = false;
      motion.remove();
    };
  }, []);
  const value = useMemo(
    () => ({ reduceMotion, reduceTransparency, highContrast }),
    [reduceMotion, reduceTransparency, highContrast],
  );
  return (
    <AccessibilityPreferencesContext.Provider value={value}>
      {children}
    </AccessibilityPreferencesContext.Provider>
  );
}
