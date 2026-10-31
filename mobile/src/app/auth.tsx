import AppIcon from "@/assets/icon/icon.png";
import SignIn from "@/components/signin";
import SignUp from "@/components/signup";
import { Button, useTheme } from "@rneui/themed";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";

const Steps = ({
  activeStep,
  nextStep,
  prevStep,
}: {
  activeStep: number;
  nextStep: () => void;
  prevStep: () => void;
}) => {
  const styles = useStyles();
  if (activeStep === 0) {
    return (
      <Button
        size="lg"
        buttonStyle={styles.button}
        titleStyle={styles.buttonTitle}
        containerStyle={styles.buttonContainer}
        onPress={nextStep}
      >
        Get Started
      </Button>
    );
  }
  if (activeStep === 1) {
    return <SignIn nextStep={nextStep} prevStep={prevStep} />;
  }
  if (activeStep === 2) {
    return <SignUp prevStep={prevStep} />;
  }
};

export default function Auth() {
  const [step, setStep] = useState(0);
  const { theme } = useTheme();
  const styles = useStyles();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.box, styles.shadow]}>
        <ExpoStatusBar
          style={theme.mode === "dark" ? "light" : "dark"}
          animated
        />
        {/* <NMTLogo height={120} width={120} /> */}
        <Image
          source={AppIcon}
          resizeMode="contain"
          style={{ width: 144, height: 144 }}
          accessibilityLabel="Control Nest app icon"
        />
        <Text style={styles.appName}>Control Nest</Text>
        <Text style={styles.companyCredit}>Built by NMT Solutions</Text>
        <Text style={styles.heading}>Home Automation System</Text>
      </View>
      <View style={[styles.bottomSheet, step !== 0 && styles.authSheet]}>
        <Steps
          activeStep={step}
          nextStep={() => setStep((step) => step + 1)}
          prevStep={() => setStep((step) => step - 1)}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = () => {
  const { theme } = useTheme();

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.primary,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    box: {
      marginBottom: 120,
      padding: 24,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      gap: 24,
      backgroundColor: theme.colors.secondary,
    },
    shadow: {
      elevation: 100,
      shadowColor: theme.colors.success,
    },
    heading: {
      color: theme.colors.black,
      fontSize: 18,
      fontFamily: "Lexend_400Regular",
    },
    appName: {
      color: theme.colors.black,
      fontSize: 24,
      fontFamily: "Lexend_600SemiBold",
    },
    companyCredit: {
      color: theme.colors.grey2,
      fontSize: 11,
      fontFamily: "Lexend_400Regular",
      marginTop: -16,
    },
    bottomSheet: {
      backgroundColor: theme.colors.secondary,
      height: 120,
      maxHeight: "90%",
      width: "100%",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      position: "absolute",
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    authSheet: {
      height: "auto",
      alignItems: "stretch",
      justifyContent: "flex-start",
    },
    button: {
      width: 240,
      borderRadius: 25,
      backgroundColor: theme.colors.success,
    },
    buttonContainer: {
      borderRadius: 25,
      shadowColor: theme.colors.success,
    },
    buttonTitle: {
      fontFamily: "Lexend_600SemiBold",
      color: theme.mode === "dark" ? "#10201A" : "#FFFFFF",
    },
  });
};
