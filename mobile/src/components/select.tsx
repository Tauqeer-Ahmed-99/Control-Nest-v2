import { Picker } from "@react-native-picker/picker";
import { Text, useTheme } from "@rneui/themed";
import { StyleSheet, View } from "react-native";
import LoadingSkeleton from "./loading-skeleton";

function Select<T>({
  label,
  field,
  selectedValue,
  onValueChange,
  items,
  isLoading,
}: {
  label: string;
  field: string;
  selectedValue: T;
  onValueChange: (itemValue: any, itemIndex: number) => void;
  items: T[];
  isLoading?: boolean;
}) {
  const { theme } = useTheme();

  return (
    <View style={styles.mainContainer}>
      {label ? (
        <Text style={[styles.label, { color: theme.colors.grey2 }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.secondary,
            borderColor: theme.colors.grey5,
          },
        ]}
      >
        <View style={styles.pickerContainer}>
          {isLoading ? (
            <LoadingSkeleton height={22} width="58%" borderRadius={6} />
          ) : (
            <Picker
              selectedValue={selectedValue ?? {}}
              onValueChange={onValueChange}
              style={[styles.picker, { color: theme.colors.black }]}
              itemStyle={[styles.pickerItem, { color: theme.colors.black }]}
              dropdownIconColor={theme.colors.grey2}
            >
              {items.map((item: T, index: number) => (
                <Picker.Item
                  key={index}
                  label={(item as any)[field]}
                  value={item}
                />
              ))}
            </Picker>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    width: "100%",
    paddingHorizontal: 10,
  },
  container: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 14,
    fontFamily: "Lexend_500Medium",
    marginBottom: 7,
    marginLeft: 4,
  },
  pickerContainer: {
    height: 50,
    borderRadius: 14,
    overflow: "hidden",
    justifyContent: "center",
  },
  picker: {
    fontSize: 16,
    height: 50,
    width: "100%",
    marginVertical: 0,
    paddingVertical: 0,
  },
  pickerItem: {
    fontSize: 16,
  },
});

export default Select;
