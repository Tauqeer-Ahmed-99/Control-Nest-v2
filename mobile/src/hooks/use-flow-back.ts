import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { BackHandler } from "react-native";

export default function useFlowBack(
  onBack: (() => void) | undefined,
  busy = false,
) {
  useFocusEffect(
    useCallback(() => {
      if (!onBack) return;
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        () => {
          if (!busy) onBack();
          return true;
        },
      );
      return () => subscription.remove();
    }, [busy, onBack]),
  );
}
