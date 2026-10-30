import Feather from "@expo/vector-icons/Feather";
import type { IconNode } from "@rneui/base";
import { Input, useTheme } from "@rneui/themed";
import { KeyboardTypeOptions, StyleSheet, TextInputProps } from "react-native";

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
}) => {
  const {
    theme: {
      colors: { white },
    },
  } = useTheme();

  return (
    <Input
      label={label}
      labelStyle={[styles.labelStyle, { color: white }]}
      placeholder={placeholder}
      placeholderTextColor="#6e6b8c"
      inputStyle={styles.inputStyle}
      inputContainerStyle={styles.inputContainerStyle}
      leftIcon={<Feather name="edit-3" color="#6e6b8c" size={20} />}
      rightIcon={rightIcon}
      value={value}
      defaultValue={defaultValue}
      onChangeText={onChangeText}
      disabled={disabled}
      autoCapitalize={autoCapitalize}
      secureTextEntry={secureTextEntry}
      keyboardType={keyboardType}
    />
  );
};

const styles = StyleSheet.create({
  inputContainerStyle: {
    backgroundColor: "#2e2c49",
    borderRadius: 10,
    borderBottomWidth: 0, // Removes the underline by default
    paddingHorizontal: 10,
  },
  labelStyle: {
    marginLeft: 8,
    marginBottom: 8,
    fontSize: 14,
  },
  inputStyle: {
    color: "#fff",
    fontSize: 16,
  },
});

export default InputField;
