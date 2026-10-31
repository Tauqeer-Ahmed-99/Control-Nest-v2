import { useTheme } from "@rneui/themed";
import React from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

type KeyboardBottomSheetProps = {
  children: React.ReactNode;
  isVisible: boolean;
  accessibilityLabel: string;
  onClose: () => void;
};

const KeyboardBottomSheet = ({
  children,
  isVisible,
  accessibilityLabel,
  onClose,
}: KeyboardBottomSheetProps) => {
  const { theme } = useTheme();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          onPress={onClose}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.colors.black, opacity: 0.35 },
          ]}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  scrollView: {
    flex: 1,
    width: "100%",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },
});

export default KeyboardBottomSheet;
