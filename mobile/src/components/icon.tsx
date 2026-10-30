import useIcon from "@/hooks/use-icons";
import { useTheme } from "@rneui/themed";
import { View } from "react-native";

const Icon = ({ name }: { name: string }) => {
  const { theme } = useTheme();
  const { icon, color } = useIcon(name);
  return (
    <View
      style={{
        height: 60,
        width: 60,
        borderRadius: 30,
        backgroundColor: "rgba(236, 236, 236, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        elevation: 50,
        shadowColor: color,
      }}
    >
      <View
        style={{
          height: 50,
          width: 50,
          borderRadius: 25,
          backgroundColor: theme.colors.primary,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {icon}
      </View>
    </View>
  );
};

export default Icon;
