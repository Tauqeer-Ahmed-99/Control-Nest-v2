import { useTheme } from "@rneui/themed";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";

const LoadingSkeleton = ({
  height,
  width,
  borderRadius,
  startOpacity,
}: {
  height?: number;
  width?: number;
  borderRadius?: number;
  startOpacity?: number;
}) => {
  const {
    theme: {
      colors: { secondary },
    },
  } = useTheme();

  const fadeAnim = useRef(new Animated.Value(startOpacity ?? 0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: startOpacity ?? 0.3,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [fadeAnim]);

  const styles = StyleSheet.create({
    skeleton: {
      backgroundColor: secondary,
      borderRadius: 4,
    },
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { height: height ?? 100, width: width ?? "100%", borderRadius },
        { opacity: fadeAnim },
      ]}
    />
  );
};

export default LoadingSkeleton;
