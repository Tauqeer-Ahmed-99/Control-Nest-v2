import { AccessibilityPreferencesContext } from "@/providers/accessibility-provider";
import { useContext } from "react";

export default function useAccessibilityPreferences() {
  return useContext(AccessibilityPreferencesContext);
}
