import type { IconNode } from "@rneui/base";
import { Input, useTheme } from "@rneui/themed";
import {
  KeyboardTypeOptions,
  StyleProp,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from "react-native";

const InputField = ({
  label,
  placeholder,
  value,
  defaultValue,
  onChangeText,
  disabled,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
  rightIcon,
  containerStyle,
}: {
  label?: string;
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  onChangeText?: (text: string) => void;
  disabled?: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: TextInputProps["autoCapitalize"];
  keyboardType?: KeyboardTypeOptions;
  rightIcon?: IconNode;
  containerStyle?: StyleProp<ViewStyle>;
}) => {
  const { theme } = useTheme();

  return (
    <Input
      containerStyle={containerStyle}
      label={label}
      labelStyle={[styles.labelStyle, { color: theme.colors.grey2 }]}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.grey3}
      inputStyle={[styles.inputStyle, { color: theme.colors.black }]}
      inputContainerStyle={[
        styles.inputContainerStyle,
        {
          backgroundColor: theme.colors.secondary,
          borderColor: theme.colors.grey5,
        },
      ]}
      rightIcon={rightIcon}
      value={value}
      defaultValue={defaultValue}
      onChangeText={onChangeText}
      disabled={disabled}
      autoCapitalize={autoCapitalize}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
      renderErrorMessage={false}
    />
  );
};

const styles = StyleSheet.create({
  inputContainerStyle: {
    borderRadius: 14,
    borderWidth: 1,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    minHeight: 52,
  },
  labelStyle: {
    marginLeft: 4,
    marginBottom: 7,
    fontSize: 14,
    fontFamily: "Lexend_500Medium",
  },
  inputStyle: {
    fontSize: 16,
  },
});

export default InputField;
