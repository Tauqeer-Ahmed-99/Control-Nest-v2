import useAccessibilityPreferences from "@/hooks/use-accessibility-preferences";
import { useTheme } from "@rneui/themed";
import { useEffect, useState } from "react";
import {
  Animated,
  type DimensionValue,
  Easing,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from "react-native";

const LoadingSkeleton = ({
  height,
  width,
  borderRadius,
  startOpacity,
  style,
}: {
  height?: number;
  width?: DimensionValue;
  borderRadius?: number;
  startOpacity?: number;
  style?: StyleProp<ViewStyle>;
}) => {
  const {
    theme: {
      colors: { grey5 },
    },
  } = useTheme();

  const { reduceMotion } = useAccessibilityPreferences();
  const lowOpacity = startOpacity ?? 0.72;
  const [fadeAnim] = useState(() => new Animated.Value(lowOpacity));

  useEffect(() => {
    if (reduceMotion) {
      fadeAnim.setValue(lowOpacity);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0.82,
          duration: 2500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: lowOpacity,
          duration: 2500,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();

    return () => animation.stop();
  }, [fadeAnim, lowOpacity, reduceMotion]);

  const styles = StyleSheet.create({
    skeleton: {
      backgroundColor: grey5,
      borderRadius: 4,
    },
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          height: height ?? 100,
          width: width ?? "100%",
          borderRadius: borderRadius ?? 8,
        },
        style,
        { opacity: fadeAnim },
      ]}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
};

export default LoadingSkeleton;
