import { useTheme } from "@rneui/themed";
import React from "react";
import { View } from "react-native";

const Tile = ({ children }: React.PropsWithChildren) => {
  const {
    theme: {
      colors: { secondary },
    },
  } = useTheme();

  return (
    <View
      style={{
        backgroundColor: secondary,
        padding: 16,
        borderRadius: 12,
        gap: 12,
      }}
    >
      {children}
    </View>
  );
};

export default Tile;
