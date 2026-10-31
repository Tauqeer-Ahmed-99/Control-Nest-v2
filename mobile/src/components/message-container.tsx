import { Text, useTheme } from "@rneui/themed";
import React from "react";
import { StyleSheet, View } from "react-native";

const MessageContainer = ({
  message,
  children,
}: {
  message: string;
  children?: React.ReactNode;
}) => {
  const styles = useStyles();
  return (
    <View style={styles.container}>
      <Text style={styles.dottedBox}>{message}</Text>
      <View>{children}</View>
    </View>
  );
};

const useStyles = () => {
  const {
    theme: {
      colors: { secondary, grey2, grey5 },
    },
  } = useTheme();

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: secondary,
      borderWidth: 1,
      borderRadius: 18,
      borderColor: grey5,
      minHeight: 142,
      gap: 8,
    },
    dottedBox: {
      paddingHorizontal: 22,
      paddingVertical: 20,
      textAlign: "center",
      color: grey2,
      lineHeight: 21,
    },
  });
};

export default MessageContainer;
