import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Text, useTheme } from "@rneui/themed";
import { useMemo } from "react";
import { View } from "react-native";

const useWeatherIcons = (keyword: string) => {
  const { theme } = useTheme();
  const weatherIcons: { keywords: string; icon: React.ReactNode }[] = useMemo(
    () => [
      {
        keywords: "weather cloudy",
        icon: (
          <MaterialCommunityIcons
            name="weather-cloudy"
            size={24}
            color={theme.colors.success}
          />
        ),
      },
      {
        keywords: "weather cloudy alert",
        icon: (
          <MaterialCommunityIcons
            name="weather-cloudy-alert"
            size={24}
            color={theme.colors.success}
          />
        ),
      },
      {
        keywords: "weather fog",
        icon: (
          <MaterialCommunityIcons
            name="weather-fog"
            size={24}
            color={theme.colors.success}
          />
        ),
      },
      {
        keywords: "weather hazy",
        icon: (
          <MaterialCommunityIcons
            name="weather-fog"
            size={24}
            color={theme.colors.success}
          />
        ),
      },
      {
        keywords: "weather lightning",
        icon: (
          <MaterialCommunityIcons
            name="weather-lightning"
            size={24}
            color={theme.colors.success}
          />
        ),
      },
      {
        keywords: "weather lightning rainy",
        icon: (
          <MaterialCommunityIcons
            name="weather-lightning-rainy"
            size={24}
            color={theme.colors.success}
          />
        ),
      },
      {
        keywords: "weather night",
        icon: (
          <MaterialCommunityIcons
            name="weather-night"
            size={24}
            color={theme.colors.success}
          />
        ),
      },
      {
        keywords: "weather night partly cloudy",
        icon: (
          <MaterialCommunityIcons
            name="weather-night-partly-cloudy"
            size={24}
            color={theme.colors.success}
          />
        ),
      },
      {
        keywords: "weather partly cloudy",
        icon: (
          <MaterialCommunityIcons
            name="weather-partly-cloudy"
            size={24}
            color={theme.colors.success}
          />
        ),
      },
      {
        keywords: "weather partly lightning",
        icon: (
          <MaterialCommunityIcons
            name="weather-partly-lightning"
            size={24}
            color={theme.colors.success}
          />
        ),
      },
      {
        keywords: "weather partly rainy",
        icon: (
          <MaterialCommunityIcons
            name="weather-partly-rainy"
            size={24}
            color={theme.colors.success}
          />
        ),
      },
      {
        keywords: "weather partly snowy",
        icon: (
          <MaterialCommunityIcons
            name="weather-partly-snowy"
            size={24}
            color={theme.colors.success}
          />
        ),
      },
      {
        keywords: "weather rainy",
        icon: (
          <MaterialCommunityIcons
            name="weather-rainy"
            size={24}
            color={theme.colors.success}
          />
        ),
      },
      {
        keywords: "weather sunny",
        icon: (
          <MaterialCommunityIcons
            name="weather-sunny"
            size={24}
            color={theme.colors.success}
          />
        ),
      },
      {
        keywords: "weather windy",
        icon: (
          <MaterialCommunityIcons
            name="weather-windy"
            size={24}
            color={theme.colors.success}
          />
        ),
      },
    ],
    [theme.colors.success],
  );

  const icon = useMemo(() => {
    const words = keyword.toLowerCase().split(" ");
    return (
      weatherIcons.find((item) =>
        words.some((word) => word && item.keywords.includes(word)),
      )?.icon ?? weatherIcons[0].icon
    );
  }, [keyword, weatherIcons]);

  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      {icon}
      <Text
        numberOfLines={1}
        style={{
          color: theme.colors.grey2,
          textAlign: "center",
          fontSize: 11,
          lineHeight: 13,
        }}
      >
        {keyword}
      </Text>
    </View>
  );
};

export default useWeatherIcons;
