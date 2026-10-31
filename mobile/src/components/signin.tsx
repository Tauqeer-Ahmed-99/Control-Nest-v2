// import tryCatch from "@/utils/try-catch";
// import { useSignIn } from "@clerk/expo";
// import Feather from "@expo/vector-icons/Feather";
// import { Button, Text, useTheme } from "@rneui/themed";
// import { Href, useRouter } from "expo-router";
// import { useCallback, useState } from "react";
// import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
// import InputField from "./input-field";

// const SignIn = ({
//   nextStep,
//   prevStep,
// }: {
//   nextStep: () => void;
//   prevStep: () => void;
// }) => {
//   const {
//     theme: {
//       colors: { grey3 },
//     },
//   } = useTheme();
//   const styles = useStyles();
//   const { signIn } = useSignIn();
//   const [emailAddress, setEmailAddress] = useState("");
//   const [password, setPassword] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const router = useRouter();

//   const onSignInPress = useCallback(async () => {
//     setIsLoading(true);

//     const { data, error } = await tryCatch(
//       signIn.password({ emailAddress, password }),
//     );

//     if (error) {
//       setError(error.message);
//       setIsLoading(false);
//       return;
//     }

//     if (data.error) {
//       setError(data.error.message);
//       setIsLoading(false);
//       return;
//     }

//     if (signIn.status === "complete") {
//       await tryCatch(
//         signIn.finalize({
//           navigate: ({ session, decorateUrl }) => {
//             if (session.currentTask) return;
//             router.replace(decorateUrl("/house-login") as Href);
//           },
//         }),
//       );
//     }

//     setIsLoading(false);
//   }, [emailAddress, password, signIn]);

//   const onForgotPasswordPress = useCallback(() => {}, []);

//   const onSendCodePress = useCallback(() => {}, []);

//   return (
//     <ScrollView style={{ width: "100%" }}>
//       <View style={{ width: "100%", padding: 32, justifyContent: "center" }}>
//         <View style={styles.header}>
//           <Text
//             style={{
//               fontFamily: "Lexend_600SemiBold",
//               fontSize: 24,
//             }}
//           >
//             Sign In
//           </Text>
//           <TouchableOpacity disabled={isLoading} onPress={prevStep}>
//             <Feather name="arrow-left" size={24} color={grey3} />
//           </TouchableOpacity>
//         </View>
//         <InputField
//           value={emailAddress}
//           placeholder="Enter Email..."
//           onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
//           disabled={isLoading}
//         />
//         <InputField
//           value={password}
//           placeholder="Enter Password..."
//           secureTextEntry={true}
//           onChangeText={(password) => setPassword(password)}
//           disabled={isLoading}
//         />
//         <Button
//           title="Sign In"
//           loading={isLoading}
//           buttonStyle={styles.button}
//           containerStyle={styles.buttonContainer}
//           titleStyle={styles.buttonTitle}
//           onPress={!isLoading ? onSignInPress : undefined}
//         />
//         {error && (
//           <Text style={{ textAlign: "center", color: "red", marginTop: 16 }}>
//             {error}
//           </Text>
//         )}

//         <Button
//           buttonStyle={styles.secondaryButton}
//           containerStyle={styles.buttonContainer}
//           titleStyle={styles.secondaryButtonTitle}
//           onPress={!isLoading ? onForgotPasswordPress : undefined}
//         >
//           Forgot Password?
//         </Button>

//         <Button
//           buttonStyle={styles.secondaryButton}
//           containerStyle={styles.buttonContainer}
//           titleStyle={styles.secondaryButtonTitle}
//           onPress={!isLoading ? nextStep : undefined}
//         >
//           Don't have an account? Signup Instead.
//         </Button>
//       </View>
//     </ScrollView>
//   );
// };

// export default SignIn;

// const useStyles = () => {
//   return StyleSheet.create({
//     header: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       marginBottom: 24,
//     },
//     button: {
//       width: 240,
//       borderRadius: 25,
//       backgroundColor: "#3e31ab",
//     },
//     secondaryButton: {
//       marginTop: 16,
//       width: 240,
//       borderRadius: 25,
//       backgroundColor: "transparent",
//     },
//     buttonContainer: {
//       elevation: 20,
//       borderRadius: 25,
//       shadowColor: "#3e31ab",
//       alignItems: "center",
//     },
//     buttonTitle: { fontFamily: "Lexend_400Regular" },
//     secondaryButtonTitle: { fontFamily: "Lexend_400Regular", fontSize: 12 },
//   });
// };

// import tryCatch from "@/utils/try-catch";
// import { useSignIn } from "@clerk/expo";
// import Feather from "@expo/vector-icons/Feather";
// import { Button, Text, useTheme } from "@rneui/themed";
// import { Href, useRouter } from "expo-router";
// import { useCallback, useState } from "react";
// import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
// import InputField from "./input-field";

// type AuthStep = "sign-in" | "forgot-password" | "verify-code" | "new-password";

// const SignIn = ({
//   nextStep,
//   prevStep,
// }: {
//   nextStep: () => void;
//   prevStep: () => void;
// }) => {
//   const {
//     theme: {
//       colors: { grey3 },
//     },
//   } = useTheme();

//   const styles = useStyles();
//   const { signIn } = useSignIn();
//   const router = useRouter();

//   const [step, setStep] = useState<AuthStep>("sign-in");
//   const [emailAddress, setEmailAddress] = useState("");
//   const [password, setPassword] = useState("");
//   const [code, setCode] = useState("");
//   const [newPassword, setNewPassword] = useState("");

//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [message, setMessage] = useState("");

//   const clearFeedback = useCallback(() => {
//     setError("");
//     setMessage("");
//   }, []);

//   const handleError = useCallback((value: unknown) => {
//     if (value instanceof Error) {
//       setError(value.message);
//       return;
//     }

//     setError("Something went wrong. Please try again.");
//   }, []);

//   const onSignInPress = useCallback(async () => {
//     clearFeedback();
//     setIsLoading(true);

//     try {
//       const { data, error: requestError } = await tryCatch(
//         signIn.password({
//           emailAddress: emailAddress.trim(),
//           password,
//         }),
//       );

//       if (requestError) {
//         setError(requestError.message);
//         return;
//       }

//       if (data.error) {
//         setError(data.error.message);
//         return;
//       }

//       if (signIn.status === "complete") {
//         const { error: finalizeError } = await tryCatch(
//           signIn.finalize({
//             navigate: ({ session, decorateUrl }) => {
//               if (session.currentTask) return;

//               router.replace(decorateUrl("/house-login") as Href);
//             },
//           }),
//         );

//         if (finalizeError) {
//           setError(finalizeError.message);
//         }
//       } else if (signIn.status === "needs_second_factor") {
//         setError("Additional authentication is required.");
//       } else {
//         setError("Sign-in requires an additional authentication step.");
//       }
//     } catch (err) {
//       handleError(err);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [clearFeedback, emailAddress, handleError, password, router, signIn]);

//   const onForgotPasswordPress = useCallback(() => {
//     clearFeedback();
//     setCode("");
//     setNewPassword("");
//     setStep("forgot-password");
//   }, [clearFeedback]);

//   const onSendCodePress = useCallback(async () => {
//     clearFeedback();

//     const email = emailAddress.trim();

//     if (!email) {
//       setError("Please enter your email address.");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const { data, error: requestError } = await tryCatch(
//         signIn.create({ identifier: email }),
//       );

//       if (requestError) {
//         setError(requestError.message);
//         return;
//       }

//       if (data.error) {
//         setError(data.error.message);
//         return;
//       }

//       const { data: sendData, error: sendRequestError } = await tryCatch(
//         signIn.resetPasswordEmailCode.sendCode(),
//       );

//       if (sendRequestError) {
//         setError(sendRequestError.message);
//         return;
//       }

//       if (sendData.error) {
//         setError(sendData.error.message);
//         return;
//       }

//       setMessage(`A verification code has been sent to ${email}.`);
//       setStep("verify-code");
//     } catch (err) {
//       handleError(err);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [clearFeedback, emailAddress, handleError, signIn]);

//   const onVerifyCodePress = useCallback(async () => {
//     clearFeedback();

//     if (!code.trim()) {
//       setError("Please enter the verification code.");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const { data, error: requestError } = await tryCatch(
//         signIn.resetPasswordEmailCode.verifyCode({
//           code: code.trim(),
//         }),
//       );

//       if (requestError) {
//         setError(requestError.message);
//         return;
//       }

//       if (data.error) {
//         setError(data.error.message);
//         return;
//       }

//       if (signIn.status === "needs_new_password") {
//         setStep("new-password");
//         setMessage("Code verified. Enter your new password.");
//       } else if (signIn.status === "complete") {
//         await finalizeAuthentication();
//       } else {
//         setError("The verification flow requires another step.");
//       }
//     } catch (err) {
//       handleError(err);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [clearFeedback, code, handleError, signIn]);

//   const finalizeAuthentication = async () => {
//     const { error: finalizeError } = await tryCatch(
//       signIn.finalize({
//         navigate: ({ session, decorateUrl }) => {
//           if (session.currentTask) return;

//           router.replace(decorateUrl("/house-login") as Href);
//         },
//       }),
//     );

//     if (finalizeError) {
//       setError(finalizeError.message);
//     }
//   };

//   const onResetPasswordPress = useCallback(async () => {
//     clearFeedback();

//     if (!newPassword) {
//       setError("Please enter your new password.");
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const { data, error: requestError } = await tryCatch(
//         signIn.resetPasswordEmailCode.submitPassword({
//           password: newPassword,
//           signOutOfOtherSessions: true,
//         }),
//       );

//       if (requestError) {
//         setError(requestError.message);
//         return;
//       }

//       if (data.error) {
//         setError(data.error.message);
//         return;
//       }

//       if (signIn.status === "complete") {
//         await finalizeAuthentication();
//       } else if (signIn.status === "needs_second_factor") {
//         setError("Additional authentication is required.");
//       } else {
//         setError("Your password was submitted, but sign-in is not complete.");
//       }
//     } catch (err) {
//       handleError(err);
//     } finally {
//       setIsLoading(false);
//     }
//   }, [clearFeedback, handleError, newPassword, signIn]);

//   const onBackPress = useCallback(() => {
//     clearFeedback();

//     if (step === "new-password") {
//       setStep("verify-code");
//       return;
//     }

//     if (step === "verify-code") {
//       setStep("forgot-password");
//       return;
//     }

//     if (step === "forgot-password") {
//       setStep("sign-in");
//       return;
//     }

//     prevStep();
//   }, [clearFeedback, prevStep, step]);

//   const renderButton = (
//     title: string,
//     onPress: () => void,
//     disabled = false,
//   ) => (
//     <Button
//       title={title}
//       loading={isLoading}
//       disabled={disabled || isLoading}
//       buttonStyle={styles.button}
//       containerStyle={styles.buttonContainer}
//       titleStyle={styles.buttonTitle}
//       onPress={onPress}
//     />
//   );

//   const renderSecondaryButton = (title: string, onPress: () => void) => (
//     <Button
//       title={title}
//       disabled={isLoading}
//       buttonStyle={styles.secondaryButton}
//       containerStyle={styles.buttonContainer}
//       titleStyle={styles.secondaryButtonTitle}
//       onPress={onPress}
//     />
//   );

//   const renderFeedback = () => (
//     <>
//       {!!message && <Text style={styles.successMessage}>{message}</Text>}

//       {!!error && (
//         <Text accessibilityRole="alert" style={styles.errorMessage}>
//           {error}
//         </Text>
//       )}
//     </>
//   );

//   return (
//     <ScrollView style={{ width: "100%" }} keyboardShouldPersistTaps="handled">
//       <View style={{ width: "100%", padding: 32, justifyContent: "center" }}>
//         <View style={styles.header}>
//           <Text style={styles.heading}>
//             {step === "sign-in"
//               ? "Sign In"
//               : step === "forgot-password"
//                 ? "Forgot Password?"
//                 : step === "verify-code"
//                   ? "Verify Code"
//                   : "Reset Password"}
//           </Text>

//           <TouchableOpacity disabled={isLoading} onPress={onBackPress}>
//             <Feather name="arrow-left" size={24} color={grey3} />
//           </TouchableOpacity>
//         </View>

//         {step === "sign-in" && (
//           <>
//             <InputField
//               value={emailAddress}
//               placeholder="Enter Email..."
//               onChangeText={(value) => {
//                 setEmailAddress(value);
//                 clearFeedback();
//               }}
//               disabled={isLoading}
//             />

//             <InputField
//               value={password}
//               placeholder="Enter Password..."
//               secureTextEntry
//               onChangeText={(value) => {
//                 setPassword(value);
//                 clearFeedback();
//               }}
//               disabled={isLoading}
//             />

//             {renderButton("Sign In", onSignInPress)}

//             {renderFeedback()}

//             {renderSecondaryButton("Forgot Password?", onForgotPasswordPress)}

//             {renderSecondaryButton(
//               "Don't have an account? Signup Instead.",
//               nextStep,
//             )}
//           </>
//         )}

//         {step === "forgot-password" && (
//           <>
//             <Text style={styles.description}>
//               Enter your email address and we'll send you a password reset code.
//             </Text>

//             <InputField
//               value={emailAddress}
//               placeholder="Enter Email..."
//               onChangeText={(value) => {
//                 setEmailAddress(value);
//                 clearFeedback();
//               }}
//               disabled={isLoading}
//             />

//             {renderButton(
//               "Send Reset Code",
//               onSendCodePress,
//               !emailAddress.trim(),
//             )}

//             {renderFeedback()}

//             {renderSecondaryButton("Back to Sign In", () => setStep("sign-in"))}
//           </>
//         )}

//         {step === "verify-code" && (
//           <>
//             <Text style={styles.description}>
//               Enter the verification code sent to your email address.
//             </Text>

//             <InputField
//               value={code}
//               placeholder="Enter Verification Code..."
//               onChangeText={(value) => {
//                 setCode(value);
//                 clearFeedback();
//               }}
//               disabled={isLoading}
//             />

//             {renderButton("Verify Code", onVerifyCodePress, !code.trim())}

//             {renderFeedback()}

//             {renderSecondaryButton("Resend Code", onSendCodePress)}

//             {renderSecondaryButton("Change Email", () => {
//               clearFeedback();
//               setStep("forgot-password");
//             })}
//           </>
//         )}

//         {step === "new-password" && (
//           <>
//             <Text style={styles.description}>
//               Enter a new password for your account.
//             </Text>

//             <InputField
//               value={newPassword}
//               placeholder="Enter New Password..."
//               secureTextEntry
//               onChangeText={(value) => {
//                 setNewPassword(value);
//                 clearFeedback();
//               }}
//               disabled={isLoading}
//             />

//             {renderButton("Reset Password", onResetPasswordPress, !newPassword)}

//             {renderFeedback()}

//             {renderSecondaryButton("Back to Verification", () => {
//               clearFeedback();
//               setStep("verify-code");
//             })}
//           </>
//         )}
//       </View>
//     </ScrollView>
//   );
// };

// export default SignIn;

// const useStyles = () => {
//   return StyleSheet.create({
//     header: {
//       flexDirection: "row",
//       justifyContent: "space-between",
//       alignItems: "center",
//       marginBottom: 24,
//     },
//     heading: {
//       fontFamily: "Lexend_600SemiBold",
//       fontSize: 24,
//     },
//     description: {
//       fontFamily: "Lexend_400Regular",
//       fontSize: 14,
//       marginBottom: 16,
//     },
//     button: {
//       width: 240,
//       borderRadius: 25,
//       backgroundColor: "#3e31ab",
//     },
//     secondaryButton: {
//       marginTop: 16,
//       width: 240,
//       borderRadius: 25,
//       backgroundColor: "transparent",
//     },
//     buttonContainer: {
//       elevation: 20,
//       borderRadius: 25,
//       shadowColor: "#3e31ab",
//       alignItems: "center",
//     },
//     buttonTitle: {
//       fontFamily: "Lexend_400Regular",
//     },
//     secondaryButtonTitle: {
//       fontFamily: "Lexend_400Regular",
//       fontSize: 12,
//     },
//     errorMessage: {
//       textAlign: "center",
//       color: "red",
//       marginTop: 16,
//       fontFamily: "Lexend_400Regular",
//     },
//     successMessage: {
//       textAlign: "center",
//       color: "green",
//       marginTop: 16,
//       fontFamily: "Lexend_400Regular",
//     },
//   });
// };

import tryCatch from "@/utils/try-catch";
import { useSignIn } from "@clerk/expo";
import Feather from "@expo/vector-icons/Feather";
import { Button, Text, useTheme } from "@rneui/themed";
import { Href, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import InputField from "./input-field";

type AuthStep =
  | "sign-in"
  | "forgot-password"
  | "verify-code"
  | "new-password"
  | "additional-auth";

type MfaStrategy = "email_code" | "totp" | "backup_code";

const SignIn = ({
  nextStep,
  prevStep,
}: {
  nextStep: () => void;
  prevStep: () => void;
}) => {
  const { theme } = useTheme();
  const { grey3 } = theme.colors;

  const styles = useStyles();
  const { signIn } = useSignIn();
  const router = useRouter();

  const [step, setStep] = useState<AuthStep>("sign-in");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
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
          "Clerk requires a password update for this sign-in. Use Forgot Password to reset your password, then sign in again.",
        );
        return;
      }

      if (signIn.status === "needs_protect_check") {
        setError(
          "An additional security check is required. This component needs a Protect challenge handler to complete it.",
        );
        return;
      }

      setError(
        `Sign-in is not complete. Current authentication status: ${signIn.status}.`,
      );
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
          `Password reset is not ready for the next step. Current status: ${signIn.status}.`,
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
        setError(
          `Your password was submitted, but authentication is not complete. Current status: ${signIn.status}.`,
        );
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
        setError(
          `Verification was accepted, but authentication is not complete. Current status: ${signIn.status}.`,
        );
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

    prevStep();
  }, [clearFeedback, prevStep, step]);

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
      {!!message && <Text style={styles.successMessage}>{message}</Text>}
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
    <ScrollView
      style={{ width: "100%", flexShrink: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.form}>
        <View style={styles.header}>
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

          <TouchableOpacity disabled={isLoading} onPress={onBackPress}>
            <Feather name="arrow-left" size={24} color={grey3} />
          </TouchableOpacity>
        </View>

        {step === "sign-in" && (
          <>
            <InputField
              containerStyle={styles.inputField}
              label="Email address *"
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

            {renderSecondaryButton(
              "Don't have an account? Signup Instead.",
              nextStep,
            )}
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
      </View>
    </ScrollView>
  );
};

export default SignIn;

const useStyles = () => {
  const { theme } = useTheme();

  return StyleSheet.create({
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
    inputField: {
      paddingHorizontal: 0,
      marginBottom: 12,
    },
    heading: {
      fontFamily: "Lexend_600SemiBold",
      fontSize: 24,
    },
    description: {
      fontFamily: "Lexend_400Regular",
      fontSize: 14,
      marginBottom: 16,
    },
    button: {
      width: 240,
      borderRadius: 25,
      marginTop: 4,
      backgroundColor: theme.colors.success,
    },
    secondaryButton: {
      marginTop: 16,
      width: 240,
      borderRadius: 25,
      backgroundColor: "transparent",
    },
    buttonContainer: {
      borderRadius: 25,
      alignItems: "center",
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
