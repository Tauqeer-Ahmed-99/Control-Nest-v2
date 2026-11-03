import useAccessibilityPreferences from "@/hooks/use-accessibility-preferences";
import Feather from "@expo/vector-icons/Feather";
import { useTheme } from "@rneui/themed";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface SwitchProps {
  /** Current value; external updates are reflected by the control. */
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/**
 * Toggle switch that reflects its current value and animates user changes.
 */
const Switch: React.FC<SwitchProps> = ({
  value,
  onChange,
  disabled = false,
  accessibilityLabel = "Power",
}) => {
  const { theme } = useTheme();
  const { reduceMotion } = useAccessibilityPreferences();

  const [animationValue] = useState(() => new Animated.Value(value ? 1 : 0));

  // The ref tracks a tap while its animation is running. The prop remains the
  // source of truth when data changes elsewhere, such as on another screen.
  const isOnRef = useRef(value);

  const animateTo = useCallback(
    (next: boolean) => {
      if (reduceMotion) animationValue.setValue(next ? 1 : 0);
      else
        Animated.spring(animationValue, {
          toValue: next ? 1 : 0,
          stiffness: 300,
          damping: 32,
          mass: 1,
          useNativeDriver: true,
          isInteraction: false,
          overshootClamping: true,
        }).start();
    },
    [animationValue, reduceMotion],
  );

  useEffect(() => {
    if (!reduceMotion && isOnRef.current === value) return;

    isOnRef.current = value;
    // A tap already started the spring. Only a different external value (such
    // as rollback) should retarget it; an acknowledgement must not restart it.
    animateTo(value);
  }, [animateTo, reduceMotion, value]);

  useEffect(() => () => animationValue.stopAnimation(), [animationValue]);

  const toggleSwitch = useCallback(() => {
    if (disabled) return;

    const next = !isOnRef.current;
    isOnRef.current = next;

    animateTo(next);
    onChange(next);
  }, [animateTo, disabled, onChange]);

  const switchColor = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.grey5, theme.colors.success],
  });

  const circleColor = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.grey3, theme.colors.background],
  });

  const powerIconColor = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.colors.background, theme.colors.success],
  });

  const iconTranslate = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 33],
  });

  return (
    <TouchableWithoutFeedback
      onPress={toggleSwitch}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled }}
    >
      <Animated.View
        style={[
          styles.container,
          { backgroundColor: switchColor, opacity: disabled ? 0.5 : 1 },
        ]}
      >
        <Animated.View
          style={[
            styles.circle,
            {
              backgroundColor: circleColor,
              transform: [{ translateX: iconTranslate }],
            },
          ]}
        >
          <View style={styles.icon}>
            <Animated.Text style={{ color: powerIconColor }}>
              <Feather name="power" size={12} />
            </Animated.Text>
          </View>
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 65,
    height: 32,
    borderRadius: 16,
    padding: 4,
    justifyContent: "center",
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    // Style for the icon inside the circle
  },
});

export default React.memo(Switch);
