import { Picker } from "@react-native-picker/picker";
import { Text } from "@rneui/themed";
import { StyleSheet, View } from "react-native";

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
  return (
    <View style={styles.mainContainer}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.container}>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedValue ?? {}}
            onValueChange={onValueChange}
            style={styles.picker}
            itemStyle={styles.pickerItem}
            dropdownIconColor="#fff"
          >
            {isLoading ? (
              <Picker.Item
                key={1}
                label={"Loading ..."}
                value={"Loading ..."}
              />
            ) : (
              items.map((item: T, index: number) => (
                <Picker.Item
                  key={index}
                  label={(item as unknown as any)[field]}
                  value={item}
                />
              ))
            )}
          </Picker>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    marginHorizontal: 12,
  },
  container: {
    backgroundColor: "#2e2c49", // Dark background to match the text field
    borderRadius: 10,
  },
  label: {
    color: "#fff", // Grey color for the label to match the text field label
    fontSize: 14,
    marginBottom: 8,
    marginLeft: 8,
  },
  pickerContainer: {
    borderRadius: 10,
    overflow: "hidden",
  },
  picker: {
    color: "#fff", // White color for text inside the picker
    fontSize: 16,
    height: 50, // Ensuring the picker has sufficient height
    width: "100%",
  },
  pickerItem: {
    color: "#000", // White color for the items in the dropdown
    fontSize: 16,
  },
});

export default Select;
