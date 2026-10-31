import { useTheme } from "@rneui/themed";
import React from "react";
import { View } from "react-native";

const Tile = ({ children }: React.PropsWithChildren) => {
  const {
    theme: {
      colors: { secondary, grey5 },
    },
  } = useTheme();

  return (
    <View
      style={{
        backgroundColor: secondary,
        borderColor: grey5,
        borderWidth: 1,
        padding: 18,
        borderRadius: 18,
        gap: 14,
      }}
    >
      {children}
    </View>
  );
};

export default Tile;
