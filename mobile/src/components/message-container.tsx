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
      colors: { primary, secondary, grey3 },
    },
  } = useTheme();

  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: secondary,
      borderWidth: 2,
      borderRadius: 10,
      borderColor: grey3,
      borderStyle: "dotted",
      height: 150,
      gap: 12,
    },
    dottedBox: {
      padding: 20,
      textAlign: "center",
      color: grey3,
    },
  });
};

export default MessageContainer;
