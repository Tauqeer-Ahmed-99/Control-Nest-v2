import SheetHeader from "./sheet-header";
import useAccessibilityPreferences from "@/hooks/use-accessibility-preferences";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  title: string;
  isVisible: boolean;
  accessibilityLabel: string;
  onClose: () => void;
};

const KeyboardBottomSheet = ({
  children,
  title,
  isVisible,
  accessibilityLabel,
  onClose,
}: KeyboardBottomSheetProps) => {
  const { theme } = useTheme();
  const { reduceMotion } = useAccessibilityPreferences();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType={reduceMotion ? "none" : "slide"}
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
            keyboardDismissMode={
              Platform.OS === "ios" ? "interactive" : "on-drag"
            }
          >
            <View
              accessibilityViewIsModal
              style={{
                backgroundColor: theme.colors.secondary,
                borderTopLeftRadius: 28,
                borderTopRightRadius: 28,
                paddingBottom: 8 + insets.bottom,
              }}
            >
              <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
                <SheetHeader
                  title={title}
                  onClose={onClose}
                  closeLabel={accessibilityLabel}
                />
              </View>
              {children}
            </View>
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
