import useIcon from "@/hooks/use-icons";
import { useTheme } from "@rneui/themed";
import { View } from "react-native";

const Icon = ({ name }: { name: string }) => {
  const { theme } = useTheme();
  const { icon, color } = useIcon(name);
  return (
    <View
      style={{
        height: 50,
        width: 50,
        borderRadius: 16,
        backgroundColor: `${color}1A`,
        borderWidth: 1,
        borderColor: `${color}40`,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {icon}
    </View>
  );
};

export default Icon;
