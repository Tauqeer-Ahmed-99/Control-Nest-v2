import useFlowBack from "@/hooks/use-flow-back";
import tryCatch from "@/utils/try-catch";
import { useSignIn } from "@clerk/expo";
import Feather from "@expo/vector-icons/Feather";
import { Button, Text, useTheme } from "@rneui/themed";
import { Href, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import InputField from "./input-field";

type AuthStep =
  | "sign-in"
  | "forgot-password"
  | "verify-code"
  | "new-password"
  | "additional-auth";

type MfaStrategy = "email_code" | "totp" | "backup_code";

const SignIn = ({ nextStep }: { nextStep: () => void }) => {
  const { theme } = useTheme();

  const styles = useStyles();
  const { signIn } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>("sign-in");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showOtherMethods, setShowOtherMethods] = useState(false);
  const [mfaStrategy, setMfaStrategy] = useState<MfaStrategy>("totp");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const clearFeedback = useCallback(() => {
    setError("");
    setMessage("");
  }, []);

  const handleError = useCallback((value: unknown) => {
    setError(
      value instanceof Error
        ? value.message
        : "Something went wrong. Please try again.",
    );
  }, []);

  const finalizeAuthentication = useCallback(async () => {
    const { error: finalizeError } = await tryCatch(
      signIn.finalize({
        navigate: ({ session, decorateUrl }) => {
          if (session?.currentTask) {
            return;
          }

          router.replace(decorateUrl("/house-login") as Href);
        },
      }),
    );

    if (finalizeError) {
      setError(finalizeError.message);
    }
  }, [router, signIn]);

  const startAdditionalAuthentication = useCallback(async () => {
    const factors = signIn.supportedSecondFactors ?? [];

    const hasFactor = (strategy: MfaStrategy) =>
      factors.some((factor) => factor.strategy === strategy);

    // Prefer email verification where Clerk supports it.
    if (hasFactor("email_code")) {
      setMfaStrategy("email_code");

      const { data, error: requestError } = await tryCatch(
        signIn.mfa.sendEmailCode(),
      );

      if (requestError) {
        setError(requestError.message);
        return false;
      }

      if (data.error) {
        setError(data.error.message);
        return false;
      }

      setStep("additional-auth");
      setCode("");
      setMessage(
        `A verification code has been sent to ${emailAddress.trim()}.`,
      );
      return true;
    }

    if (hasFactor("totp")) {
      setMfaStrategy("totp");
      setStep("additional-auth");
      setCode("");
      setMessage("Enter the code from your authenticator app.");
      return true;
    }

    if (hasFactor("backup_code")) {
      setMfaStrategy("backup_code");
      setStep("additional-auth");
      setCode("");
      setMessage("Enter one of your unused backup codes.");
      return true;
    }

    setError(
      "No supported email, authenticator, or backup-code verification method is available for this sign-in.",
    );
    return false;
  }, [emailAddress, signIn]);

  const onSignInPress = useCallback(async () => {
    clearFeedback();
    setIsLoading(true);

    try {
      const { data, error: requestError } = await tryCatch(
        signIn.password({
          emailAddress: emailAddress.trim(),
          password,
        }),
      );

      if (requestError) {
        setError(requestError.message);
        return;
      }

      if (data.error) {
        setError(data.error.message);
        return;
      }

      if (signIn.status === "complete") {
        await finalizeAuthentication();
        return;
      }

      if (
        signIn.status === "needs_second_factor" ||
        signIn.status === "needs_client_trust"
      ) {
        await startAdditionalAuthentication();
        return;
      }

      if (signIn.status === "needs_new_password") {
        setError(
          "Reset your password to continue. Choose Forgot Password below.",
        );
        return;
      }

      if (signIn.status === "needs_protect_check") {
        setError(
          "An extra security check is needed. Complete sign-in on the website, then try again here.",
        );
        return;
      }

      setError("Sign-in couldn't finish. Try again.");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [
    clearFeedback,
    emailAddress,
    finalizeAuthentication,
    handleError,
    password,
    signIn,
    startAdditionalAuthentication,
  ]);

  const onForgotPasswordPress = useCallback(() => {
    clearFeedback();
    setCode("");
    setNewPassword("");
    setStep("forgot-password");
  }, [clearFeedback]);

  const onSendCodePress = useCallback(async () => {
    clearFeedback();

    const email = emailAddress.trim();

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: requestError } = await tryCatch(
        signIn.create({ identifier: email }),
      );

      if (requestError) {
        setError(requestError.message);
        return;
      }

      if (data.error) {
        setError(data.error.message);
        return;
      }

      const { data: sendData, error: sendRequestError } = await tryCatch(
        signIn.resetPasswordEmailCode.sendCode(),
      );

      if (sendRequestError) {
        setError(sendRequestError.message);
        return;
      }

      if (sendData.error) {
        setError(sendData.error.message);
        return;
      }

      setCode("");
      setMessage(`A password reset code has been sent to ${email}.`);
      setStep("verify-code");
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [clearFeedback, emailAddress, handleError, signIn]);

  const onResendResetCodePress = useCallback(async () => {
    clearFeedback();
    setIsLoading(true);

    try {
      const { data, error: requestError } = await tryCatch(
        signIn.resetPasswordEmailCode.sendCode(),
      );

      if (requestError) {
        setError(requestError.message);
        return;
      }

      if (data.error) {
        setError(data.error.message);
        return;
      }

      setMessage(
        `A new password reset code has been sent to ${emailAddress.trim()}.`,
      );
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [clearFeedback, emailAddress, handleError, signIn]);

  const onVerifyCodePress = useCallback(async () => {
    clearFeedback();

    if (!code.trim()) {
      setError("Please enter the verification code.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: requestError } = await tryCatch(
        signIn.resetPasswordEmailCode.verifyCode({
          code: code.trim(),
        }),
      );

      if (requestError) {
        setError(requestError.message);
        return;
      }

      if (data.error) {
        setError(data.error.message);
        return;
      }

      if (signIn.status === "needs_new_password") {
        setStep("new-password");
        setMessage("Code verified. Enter your new password.");
      } else if (signIn.status === "complete") {
        await finalizeAuthentication();
      } else {
        setError(
          "Couldn't verify this code. Request a new code and try again.",
        );
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [clearFeedback, code, finalizeAuthentication, handleError, signIn]);

  const onResetPasswordPress = useCallback(async () => {
    clearFeedback();

    if (!newPassword) {
      setError("Please enter your new password.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error: requestError } = await tryCatch(
        signIn.resetPasswordEmailCode.submitPassword({
          password: newPassword,
          signOutOfOtherSessions: true,
        }),
      );

      if (requestError) {
        setError(requestError.message);
        return;
      }

      if (data.error) {
        setError(data.error.message);
        return;
      }

      if (signIn.status === "complete") {
        await finalizeAuthentication();
      } else if (
        signIn.status === "needs_second_factor" ||
        signIn.status === "needs_client_trust"
      ) {
        await startAdditionalAuthentication();
      } else {
        setError("Your password was updated. Return to Sign In to continue.");
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [
    clearFeedback,
    handleError,
    newPassword,
    signIn,
    finalizeAuthentication,
    startAdditionalAuthentication,
  ]);

  const onVerifyAdditionalAuthPress = useCallback(async () => {
    clearFeedback();

    if (!code.trim()) {
      setError(
        mfaStrategy === "backup_code"
          ? "Please enter a backup code."
          : "Please enter your verification code.",
      );
      return;
    }

    setIsLoading(true);

    try {
      let result: { error: null | { message: string } } | undefined;

      if (mfaStrategy === "email_code") {
        const { data, error: requestError } = await tryCatch(
          signIn.mfa.verifyEmailCode({ code: code.trim() }),
        );

        if (requestError) {
          setError(requestError.message);
          return;
        }

        result = data;
      } else if (mfaStrategy === "totp") {
        const { data, error: requestError } = await tryCatch(
          signIn.mfa.verifyTOTP({ code: code.trim() }),
        );

        if (requestError) {
          setError(requestError.message);
          return;
        }

        result = data;
      } else {
        const { data, error: requestError } = await tryCatch(
          signIn.mfa.verifyBackupCode({ code: code.trim() }),
        );

        if (requestError) {
          setError(requestError.message);
          return;
        }

        result = data;
      }

      if (result?.error) {
        setError(result.error.message);
        return;
      }

      if (signIn.status === "complete") {
        await finalizeAuthentication();
      } else {
        setError("Couldn't finish verification. Try signing in again.");
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [
    clearFeedback,
    code,
    finalizeAuthentication,
    handleError,
    mfaStrategy,
    signIn,
  ]);

  const onResendMfaEmailCodePress = useCallback(async () => {
    clearFeedback();
    setIsLoading(true);

    try {
      const { data, error: requestError } = await tryCatch(
        signIn.mfa.sendEmailCode(),
      );

      if (requestError) {
        setError(requestError.message);
        return;
      }

      if (data.error) {
        setError(data.error.message);
        return;
      }

      setMessage(
        `A new verification code has been sent to ${emailAddress.trim()}.`,
      );
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [clearFeedback, emailAddress, handleError, signIn]);

  const onBackPress = useCallback(() => {
    clearFeedback();

    if (step === "new-password") {
      setStep("verify-code");
      return;
    }

    if (step === "verify-code") {
      setStep("forgot-password");
      return;
    }

    if (step === "additional-auth") {
      // Return to the sign-in form without discarding the Clerk attempt.
      setStep("sign-in");
      setCode("");
      return;
    }

    if (step === "forgot-password") {
      setStep("sign-in");
      return;
    }

    setStep("sign-in");
  }, [clearFeedback, step]);

  useFlowBack(step === "sign-in" ? undefined : onBackPress, isLoading);

  const renderButton = (
    title: string,
    onPress: () => void,
    disabled = false,
  ) => (
    <Button
      title={title}
      loading={isLoading}
      disabled={disabled || isLoading}
      buttonStyle={styles.button}
      containerStyle={styles.buttonContainer}
      titleStyle={styles.buttonTitle}
      onPress={onPress}
    />
  );

  const renderSecondaryButton = (title: string, onPress: () => void) => (
    <Button
      title={title}
      disabled={isLoading}
      type="clear"
      buttonStyle={styles.secondaryButton}
      containerStyle={styles.buttonContainer}
      titleStyle={styles.secondaryButtonTitle}
      onPress={onPress}
    />
  );

  const renderFeedback = () => (
    <>
      {!!message && (
        <Text accessibilityLiveRegion="polite" style={styles.successMessage}>
          {message}
        </Text>
      )}
      {!!error && (
        <Text accessibilityRole="alert" style={styles.errorMessage}>
          {error}
        </Text>
      )}
    </>
  );

  const availableFactors = signIn.supportedSecondFactors ?? [];

  const supportsFactor = (strategy: MfaStrategy) =>
    availableFactors.some((factor) => factor.strategy === strategy);

  return (
    <View>
      <View style={styles.form}>
        <View style={styles.header}>
          {step !== "sign-in" && (
            <TouchableOpacity
              disabled={isLoading}
              onPress={onBackPress}
              accessibilityRole="button"
              accessibilityLabel="Back to previous sign-in step"
              style={{
                minWidth: 48,
                minHeight: 48,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Feather name="arrow-left" size={24} color={theme.colors.black} />
            </TouchableOpacity>
          )}
          <Text style={styles.heading}>
            {step === "sign-in"
              ? "Sign In"
              : step === "forgot-password"
                ? "Forgot Password?"
                : step === "verify-code"
                  ? "Verify Code"
                  : step === "new-password"
                    ? "Reset Password"
                    : "Additional Verification"}
          </Text>
        </View>

        {step === "sign-in" && (
          <>
            <Text style={[styles.description, { color: theme.colors.grey2 }]}>
              Sign in to see your houses.
            </Text>
            <InputField
              containerStyle={styles.inputField}
              label="Email address"
              autoComplete="email"
              autoCorrect={false}
              value={emailAddress}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(value) => {
                setEmailAddress(value);
                clearFeedback();
              }}
              disabled={isLoading}
            />

            <InputField
              containerStyle={styles.inputField}
              label="Password"
              autoComplete="current-password"
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
              onChangeText={(value) => {
                setPassword(value);
                clearFeedback();
              }}
              disabled={isLoading}
            />

            {renderButton(
              "Sign In",
              onSignInPress,
              !emailAddress.trim() || !password,
            )}

            {renderFeedback()}

            {renderSecondaryButton("Forgot Password?", onForgotPasswordPress)}

            {renderSecondaryButton("Create an account", nextStep)}
          </>
        )}

        {step === "forgot-password" && (
          <>
            <Text style={styles.description}>
              Enter your email address and we&apos;ll send you a password reset
              code.
            </Text>

            <InputField
              containerStyle={styles.inputField}
              label="Email address"
              autoComplete="email"
              autoCorrect={false}
              value={emailAddress}
              placeholder="you@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={(value) => {
                setEmailAddress(value);
                clearFeedback();
              }}
              disabled={isLoading}
            />

            {renderButton(
              "Send Reset Code",
              onSendCodePress,
              !emailAddress.trim(),
            )}

            {renderFeedback()}

            {renderSecondaryButton("Back to Sign In", () => {
              clearFeedback();
              setStep("sign-in");
            })}
          </>
        )}

        {step === "verify-code" && (
          <>
            <Text style={styles.description}>
              Enter the password reset code sent to your email address.
            </Text>

            <InputField
              containerStyle={styles.inputField}
              label="Verification code"
              autoComplete="one-time-code"
              keyboardType="number-pad"
              value={code}
              placeholder="Enter code"
              onChangeText={(value) => {
                setCode(value);
                clearFeedback();
              }}
              disabled={isLoading}
            />

            {renderButton("Verify Code", onVerifyCodePress, !code.trim())}

            {renderFeedback()}

            {renderSecondaryButton("Resend Code", onResendResetCodePress)}

            {renderSecondaryButton("Change Email", () => {
              clearFeedback();
              setStep("forgot-password");
            })}
          </>
        )}

        {step === "new-password" && (
          <>
            <Text style={styles.description}>
              Enter a new password for your account.
            </Text>

            <InputField
              containerStyle={styles.inputField}
              label="New password"
              autoComplete="new-password"
              value={newPassword}
              placeholder="Enter new password"
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
              onChangeText={(value) => {
                setNewPassword(value);
                clearFeedback();
              }}
              disabled={isLoading}
            />

            {renderButton("Reset Password", onResetPasswordPress, !newPassword)}

            {renderFeedback()}

            {renderSecondaryButton("Back to Verification", () => {
              clearFeedback();
              setStep("verify-code");
            })}
          </>
        )}

        {step === "additional-auth" && (
          <>
            <Text style={styles.description}>
              {mfaStrategy === "email_code"
                ? "Enter the verification code sent to your email address."
                : mfaStrategy === "totp"
                  ? "Enter the current code from your authenticator app."
                  : "Enter one of your unused backup codes."}
            </Text>

            <InputField
              containerStyle={styles.inputField}
              label={
                mfaStrategy === "backup_code"
                  ? "Backup code"
                  : "Verification code"
              }
              value={code}
              autoComplete={
                mfaStrategy === "backup_code" ? "off" : "one-time-code"
              }
              keyboardType={
                mfaStrategy === "backup_code" ? "default" : "number-pad"
              }
              autoCapitalize="none"
              autoCorrect={false}
              placeholder={
                mfaStrategy === "backup_code"
                  ? "Enter backup code"
                  : "Enter code"
              }
              onChangeText={(value) => {
                setCode(value);
                clearFeedback();
              }}
              disabled={isLoading}
            />

            {renderButton(
              "Verify and Sign In",
              onVerifyAdditionalAuthPress,
              !code.trim(),
            )}

            {renderFeedback()}

            {mfaStrategy === "email_code" &&
              renderSecondaryButton(
                "Resend Email Code",
                onResendMfaEmailCodePress,
              )}

            {availableFactors.length > 1 &&
              renderSecondaryButton(
                showOtherMethods ? "Hide other methods" : "Try another method",
                () => setShowOtherMethods((value) => !value),
              )}
            {showOtherMethods && (
              <>
                {supportsFactor("email_code") &&
                  mfaStrategy !== "email_code" &&
                  renderSecondaryButton("Use Email Code", async () => {
                    clearFeedback();
                    setIsLoading(true);

                    try {
                      const { data, error: requestError } = await tryCatch(
                        signIn.mfa.sendEmailCode(),
                      );

                      if (requestError) {
                        setError(requestError.message);
                        return;
                      }

                      if (data.error) {
                        setError(data.error.message);
                        return;
                      }

                      setMfaStrategy("email_code");
                      setCode("");
                      setMessage(
                        `A verification code has been sent to ${emailAddress.trim()}.`,
                      );
                    } catch (err) {
                      handleError(err);
                    } finally {
                      setIsLoading(false);
                    }
                  })}

                {supportsFactor("totp") &&
                  mfaStrategy !== "totp" &&
                  renderSecondaryButton("Use Authenticator App", () => {
                    clearFeedback();
                    setMfaStrategy("totp");
                    setCode("");
                    setMessage("Enter the code from your authenticator app.");
                  })}

                {supportsFactor("backup_code") &&
                  mfaStrategy !== "backup_code" &&
                  renderSecondaryButton("Use Backup Code", () => {
                    clearFeedback();
                    setMfaStrategy("backup_code");
                    setCode("");
                    setMessage("Enter one of your unused backup codes.");
                  })}
              </>
            )}
          </>
        )}
      </View>
    </View>
  );
};

export default SignIn;

const useStyles = () => {
  const { theme } = useTheme();

  return StyleSheet.create({
    form: {
      width: "100%",
      paddingHorizontal: 0,
      paddingTop: 0,
      paddingBottom: 24,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    inputField: {
      paddingHorizontal: 0,
      marginBottom: 12,
    },
    heading: {
      fontFamily: "Lexend_600SemiBold",
      fontSize: 28,
      flex: 1,
    },
    description: {
      fontFamily: "Lexend_400Regular",
      fontSize: 16,
      lineHeight: 24,
      color: theme.colors.grey2,
      marginBottom: 20,
    },
    button: {
      width: "100%",
      borderRadius: 14,
      marginTop: 4,
      backgroundColor: theme.colors.success,
    },
    secondaryButton: {
      marginTop: 4,
      width: "100%",
      borderRadius: 14,
      backgroundColor: "transparent",
    },
    buttonContainer: {
      borderRadius: 14,
      width: "100%",
    },
    buttonTitle: {
      fontFamily: "Lexend_600SemiBold",
      color: theme.mode === "dark" ? "#10201A" : "#FFFFFF",
    },
    secondaryButtonTitle: {
      fontFamily: "Lexend_500Medium",
      fontSize: 13,
      color: theme.colors.success,
    },
    errorMessage: {
      textAlign: "center",
      color: theme.colors.error,
      marginTop: 16,
      fontFamily: "Lexend_400Regular",
    },
    successMessage: {
      textAlign: "center",
      color: theme.colors.success,
      marginTop: 16,
      fontFamily: "Lexend_400Regular",
    },
  });
};
