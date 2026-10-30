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
}

/**
 * Toggle switch that reflects its current value and animates user changes.
 */
const Switch: React.FC<SwitchProps> = ({ value, onChange }) => {
  const {
    theme: {
      colors: { primary, secondary },
    },
  } = useTheme();

  const [animationValue] = useState(
    () => new Animated.Value(value ? 1 : 0),
  );

  // The ref tracks a tap while its animation is running. The prop remains the
  // source of truth when data changes elsewhere, such as on another screen.
  const isOnRef = useRef(value);

  useEffect(() => {
    isOnRef.current = value;
    animationValue.setValue(value ? 1 : 0);
  }, [animationValue, value]);

  const toggleSwitch = useCallback(() => {
    const next = !isOnRef.current;
    isOnRef.current = next;

    Animated.timing(animationValue, {
      toValue: next ? 1 : 0,
      duration: 100,
      useNativeDriver: false,
    }).start(() => {
      onChange(next);
    });
  }, [animationValue, onChange]);

  const switchColor = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [secondary, "#52E2C7"],
  });

  const circleColor = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [primary, "#3eb9a2"],
  });

  const powerIconColor = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["#a3a3a3", "#ffffff"],
  });

  const iconTranslate = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 33],
  });

  return (
    <TouchableWithoutFeedback onPress={toggleSwitch}>
      <Animated.View
        style={[styles.container, { backgroundColor: switchColor }]}
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
