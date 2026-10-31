import tryCatch from "@/utils/try-catch";
import { useSignUp } from "@clerk/expo";
import Feather from "@expo/vector-icons/Feather";
import { Button, Text, useTheme } from "@rneui/themed";
import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import InputField from "./input-field";

const SignUp = ({ prevStep }: { prevStep: () => void }) => {
  const { theme } = useTheme();
  const { grey3 } = theme.colors;

  const { signUp } = useSignUp();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const onSignUpPress = useCallback(async () => {
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();

    if (!trimmedFirstName || !trimmedLastName) {
      setError("First name and last name are required.");
      return;
    }

    setError("");
    setIsLoading(true);

    const { data, error } = await tryCatch(
      signUp.password({
        emailAddress: emailAddress.trim(),
        password,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
      }),
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
  }, [emailAddress, firstName, lastName, password, signUp]);

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
    <ScrollView
      style={{ width: "100%", flexShrink: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.form}>
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
            <View style={styles.nameFields}>
              <InputField
                containerStyle={styles.nameField}
                label="First name *"
                value={firstName}
                placeholder="First name"
                autoCapitalize="words"
                onChangeText={(value) => {
                  setFirstName(value);
                  setError("");
                }}
                disabled={isLoading}
              />
              <InputField
                containerStyle={styles.nameField}
                label="Last name *"
                value={lastName}
                placeholder="Last name"
                autoCapitalize="words"
                onChangeText={(value) => {
                  setLastName(value);
                  setError("");
                }}
                disabled={isLoading}
              />
            </View>
            <InputField
              containerStyle={styles.inputField}
              label="Email address *"
              autoCapitalize="none"
              value={emailAddress}
              placeholder="you@example.com"
              keyboardType="email-address"
              onChangeText={(email) => setEmailAddress(email)}
              disabled={isLoading}
            />
            <InputField
              containerStyle={styles.inputField}
              label="Password *"
              value={password}
              placeholder="Enter password"
              autoCapitalize="none"
              secureTextEntry={!isPasswordVisible}
              rightIcon={
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={
                    isPasswordVisible ? "Hide password" : "Show password"
                  }
                  onPress={() =>
                    setIsPasswordVisible((isVisible) => !isVisible)
                  }
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Feather
                    name={isPasswordVisible ? "eye-off" : "eye"}
                    size={20}
                    color={theme.colors.grey2}
                  />
                </TouchableOpacity>
              }
              onChangeText={(password) => setPassword(password)}
              disabled={isLoading}
            />
            <Button
              title="Sign Up"
              color="success"
              loading={isLoading}
              buttonStyle={styles.button}
              containerStyle={styles.buttonContainer}
              titleStyle={[
                styles.buttonTitle,
                { color: theme.mode === "dark" ? "#10201A" : "#FFFFFF" },
              ]}
              onPress={!isLoading ? onSignUpPress : undefined}
            />
          </>
        )}

        {isVerifying && (
          <>
            <InputField
              containerStyle={styles.inputField}
              label="Verification code"
              value={code}
              placeholder="Enter code"
              onChangeText={(code) => setCode(code)}
              disabled={isLoading}
            />
            <Button
              title="Verify Email"
              color="success"
              buttonStyle={styles.button}
              containerStyle={styles.buttonContainer}
              titleStyle={[
                styles.buttonTitle,
                { color: theme.mode === "dark" ? "#10201A" : "#FFFFFF" },
              ]}
              onPress={!isLoading ? onPressVerify : undefined}
            />
          </>
        )}

        {error && (
          <Text
            accessibilityRole="alert"
            style={{
              textAlign: "center",
              color: theme.colors.error,
              marginTop: 16,
            }}
          >
            {error}
          </Text>
        )}

        <Button
          type="clear"
          buttonStyle={styles.secondaryButton}
          containerStyle={styles.buttonContainer}
          titleStyle={styles.secondaryButtonTitle}
          onPress={!isLoading ? prevStep : undefined}
        >
          Already have an account? Login Instead.
        </Button>

        <View nativeID="clerk-captcha" />
      </View>
    </ScrollView>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  form: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  nameFields: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  nameField: {
    flex: 1,
    paddingHorizontal: 0,
  },
  inputField: {
    paddingHorizontal: 0,
    marginBottom: 12,
  },
  button: { width: 240, borderRadius: 25 },
  secondaryButton: {
    marginTop: 16,
    width: 240,
    borderRadius: 25,
    backgroundColor: "transparent",
  },
  buttonContainer: {
    borderRadius: 25,
    alignItems: "center",
    marginTop: 4,
  },
  buttonTitle: { fontFamily: "Lexend_600SemiBold" },
  secondaryButtonTitle: { fontFamily: "Lexend_500Medium", fontSize: 13 },
});
