import useFlowBack from "@/hooks/use-flow-back";
import tryCatch from "@/utils/try-catch";
import { useSignUp } from "@clerk/expo";
import Feather from "@expo/vector-icons/Feather";
import { Button, Text, useTheme } from "@rneui/themed";
import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { FlowHeading } from "./flow-screen";
import InputField from "./input-field";

type Step = "account" | "name" | "verify";

export default function SignUp({ prevStep }: { prevStep: () => void }) {
  const { theme } = useTheme();
  const { signUp } = useSignUp();
  const [step, setStep] = useState<Step>("account");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fieldStyle = { paddingHorizontal: 0 };
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailAddress.trim());

  function back() {
    setError("");
    setNotice("");
    if (step === "name") setStep("account");
    else if (step === "verify") void restartAccount();
    else prevStep();
  }

  useFlowBack(back, busy);

  async function restartAccount() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await signUp.reset();
      if (result.error) throw new Error(result.error.message);
      setCode("");
      setStep("account");
    } catch {
      setError("Couldn't restart signup. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendCode() {
    const result = await signUp.verifications.sendEmailCode();
    if (result.error) throw new Error(result.error.message);
  }

  async function createAccount() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await signUp.password({
        emailAddress: emailAddress.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      if (result.error) throw new Error(result.error.message);
      setStep("verify");
      await sendCode();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Couldn't create your account. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function verify() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });
      if (result.error) throw new Error(result.error.message);
      const { data, error: finalizeError } = await tryCatch(signUp.finalize());
      if (finalizeError) throw finalizeError;
      if (data?.error) throw new Error(data.error.message);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Couldn't verify this code. Try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <TouchableOpacity
          onPress={back}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Previous signup step"
          style={{
            minHeight: 48,
            minWidth: 48,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Feather name="arrow-left" size={22} color={theme.colors.black} />
        </TouchableOpacity>
        <Text style={{ color: theme.colors.grey2, fontSize: 14 }}>
          Step {step === "account" ? 1 : step === "name" ? 2 : 3} of 3
        </Text>
      </View>
      <FlowHeading
        title={
          step === "account"
            ? "Create your account"
            : step === "name"
              ? "What's your name?"
              : "Check your email"
        }
        description={
          step === "account"
            ? "Use one account for all your houses."
            : step === "name"
              ? "Help people in your house recognize you."
              : `Enter the code sent to ${emailAddress.trim()}.`
        }
      />
      {step === "account" ? (
        <>
          <InputField
            containerStyle={fieldStyle}
            label="Email address"
            value={emailAddress}
            onChangeText={(value) => {
              setEmailAddress(value);
              setError("");
            }}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            disabled={busy}
          />
          <InputField
            containerStyle={fieldStyle}
            label="Password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError("");
            }}
            placeholder="Create a password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            disabled={busy}
            rightIcon={
              <TouchableOpacity
                onPress={() => setShowPassword((value) => !value)}
                accessibilityRole="button"
                accessibilityLabel={
                  showPassword ? "Hide password" : "Show password"
                }
                style={{
                  minWidth: 44,
                  minHeight: 44,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={theme.colors.grey2}
                />
              </TouchableOpacity>
            }
          />
          <Button
            disabled={!validEmail || !password}
            onPress={() => {
              setError("");
              setStep("name");
            }}
          >
            Continue
          </Button>
          <Button type="clear" onPress={prevStep}>
            Already have an account? Sign In
          </Button>
        </>
      ) : step === "name" ? (
        <>
          <InputField
            containerStyle={fieldStyle}
            label="First name"
            value={firstName}
            onChangeText={(value) => {
              setFirstName(value);
              setError("");
            }}
            placeholder="First name"
            autoCapitalize="words"
            autoComplete="given-name"
            disabled={busy}
          />
          <InputField
            containerStyle={fieldStyle}
            label="Last name"
            value={lastName}
            onChangeText={(value) => {
              setLastName(value);
              setError("");
            }}
            placeholder="Last name"
            autoCapitalize="words"
            autoComplete="family-name"
            disabled={busy}
          />
          <Button
            loading={busy}
            disabled={busy || !firstName.trim() || !lastName.trim()}
            onPress={() => void createAccount()}
          >
            Create account
          </Button>
        </>
      ) : (
        <>
          <InputField
            containerStyle={fieldStyle}
            label="Verification code"
            value={code}
            onChangeText={(value) => {
              setCode(value);
              setError("");
            }}
            placeholder="Enter code"
            autoComplete="one-time-code"
            keyboardType="number-pad"
            disabled={busy}
          />
          <Button
            loading={busy}
            disabled={busy || !code.trim()}
            onPress={() => void verify()}
          >
            Verify email
          </Button>
          <Button
            type="clear"
            disabled={busy}
            onPress={async () => {
              setBusy(true);
              setError("");
              setNotice("");
              try {
                await sendCode();
                setNotice("A new code is on its way.");
              } catch {
                setError("Couldn't send a code. Try again.");
              } finally {
                setBusy(false);
              }
            }}
          >
            Resend code
          </Button>
          <Button
            type="clear"
            disabled={busy}
            onPress={() => void restartAccount()}
          >
            Change email
          </Button>
        </>
      )}
      {!!error && (
        <Text
          accessibilityRole="alert"
          style={{ color: theme.colors.error, fontSize: 14, lineHeight: 22 }}
        >
          {error}
        </Text>
      )}
      {!!notice && (
        <Text
          accessibilityLiveRegion="polite"
          style={{ color: theme.colors.grey2 }}
        >
          {notice}
        </Text>
      )}
      <View nativeID="clerk-captcha" />
    </View>
  );
}
