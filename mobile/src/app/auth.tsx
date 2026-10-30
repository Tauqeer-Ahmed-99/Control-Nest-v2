import NMTLogo from "@/assets/svgs/nmt-logo.svg";
import NMTTextLogo from "@/components/nmt-text-logo";
import SignIn from "@/components/signin";
import SignUp from "@/components/signup";
import { Button, useTheme } from "@rneui/themed";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

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
  const styles = useStyles();

  return (
    <View style={styles.container}>
      <View style={[styles.box, styles.shadow]}>
        <ExpoStatusBar animated />
        <NMTLogo height={120} width={120} />
        <NMTTextLogo />
        <Text style={styles.heading}>Home Automation System</Text>
      </View>
      <View style={[styles.bottomSheet, step !== 0 && { height: "auto" }]}>
        <Steps
          activeStep={step}
          nextStep={() => setStep((step) => step + 1)}
          prevStep={() => setStep((step) => step - 1)}
        />
      </View>
    </View>
  );
}

const useStyles = () => {
  const { theme } = useTheme();

  return StyleSheet.create({
    container: {
      height: "100%",
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
      shadowColor: "#3e31ab",
    },
    heading: {
      color: theme.colors.white,
      fontSize: 18,
      fontFamily: "Lexend_400Regular",
    },
    bottomSheet: {
      backgroundColor: theme.colors.secondary,
      height: 120,
      width: "100%",
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      position: "absolute",
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    button: {
      width: 240,
      borderRadius: 25,
      backgroundColor: "#3e31ab",
    },
    buttonContainer: {
      elevation: 20,
      borderRadius: 25,
      shadowColor: "#3e31ab",
    },
    buttonTitle: { fontFamily: "Lexend_400Regular" },
  });
};
