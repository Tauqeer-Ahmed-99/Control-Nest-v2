import tryCatch from "@/utils/try-catch";
import { useSignUp } from "@clerk/expo";
import Feather from "@expo/vector-icons/Feather";
import { Button, Text, useTheme } from "@rneui/themed";
import React, { useCallback, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import InputField from "./input-field";

const SignUp = ({ prevStep }: { prevStep: () => void }) => {
  const {
    theme: {
      colors: { grey3 },
    },
  } = useTheme();

  const { signUp } = useSignUp();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const onSignUpPress = useCallback(async () => {
    setIsLoading(true);

    const { data, error } = await tryCatch(
      signUp.password({ emailAddress, password }),
    );

    if (error) {
      setError(error.message);
      setIsLoading(false);
      return;
    }

    if (data.error) {
      setError(data.error.message);
      setIsLoading(false);
      return;
    }

    const { data: sendData, error: sendError } = await tryCatch(
      signUp.verifications.sendEmailCode(),
    );

    if (sendError) {
      setError(sendError.message);
      setIsLoading(false);
      return;
    }

    if (sendData.error) {
      setError(sendData.error.message);
      setIsLoading(false);
      return;
    }

    setIsVerifying(true);
    setIsLoading(false);
  }, [emailAddress, password, signUp]);

  const onPressVerify = async () => {
    setIsLoading(true);

    const { data, error } = await tryCatch(
      signUp.verifications.verifyEmailCode({ code }),
    );

    if (error) {
      setIsLoading(false);
      setError(error.message);
      return;
    }

    if (data.error) {
      setIsLoading(false);
      setError(data.error.message);
      return;
    }

    await tryCatch(signUp.finalize());

    setIsLoading(false);
    setIsVerifying(false);
  };

  return (
    <View style={{ width: "100%", padding: 32, justifyContent: "center" }}>
      <View style={styles.header}>
        <Text
          style={{
            fontFamily: "Lexend_600SemiBold",
            fontSize: 24,
          }}
        >
          Sign Up
        </Text>
        <TouchableOpacity disabled={isLoading} onPress={prevStep}>
          <Feather name="arrow-left" size={24} color={grey3} />
        </TouchableOpacity>
      </View>

      {!isVerifying && (
        <>
          <InputField
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Email..."
            onChangeText={(email) => setEmailAddress(email)}
            disabled={isLoading}
          />
          <InputField
            value={password}
            placeholder="Password..."
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
            disabled={isLoading}
          />
          <Button
            title="Sign Up"
            loading={isLoading}
            buttonStyle={styles.button}
            containerStyle={styles.buttonContainer}
            titleStyle={styles.buttonTitle}
            onPress={!isLoading ? onSignUpPress : undefined}
          />
        </>
      )}

      {isVerifying && (
        <>
          <InputField
            value={code}
            placeholder="Code..."
            onChangeText={(code) => setCode(code)}
            disabled={isLoading}
          />
          <Button
            title="Verify Email"
            buttonStyle={styles.button}
            containerStyle={styles.buttonContainer}
            titleStyle={styles.buttonTitle}
            onPress={!isLoading ? onPressVerify : undefined}
          />
        </>
      )}

      {error && (
        <Text style={{ textAlign: "center", color: "red", marginTop: 16 }}>
          {error}
        </Text>
      )}

      <Button
        buttonStyle={styles.secondaryButton}
        containerStyle={styles.buttonContainer}
        titleStyle={styles.secondaryButtonTitle}
        onPress={!isLoading ? prevStep : undefined}
      >
        Already have an account? Login Instead.
      </Button>

      <View nativeID="clerk-captcha" />
    </View>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  button: {
    width: 240,
    borderRadius: 25,
    backgroundColor: "#3e31ab",
  },
  secondaryButton: {
    marginTop: 16,
    width: 240,
    borderRadius: 25,
    backgroundColor: "transparent",
  },
  buttonContainer: {
    elevation: 20,
    borderRadius: 25,
    shadowColor: "#3e31ab",
    alignItems: "center",
  },
  buttonTitle: { fontFamily: "Lexend_400Regular" },
  secondaryButtonTitle: { fontFamily: "Lexend_400Regular", fontSize: 12 },
});
