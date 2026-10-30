import { getRandomItem } from "@/utils/helpers";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Text } from "@rneui/themed";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";

const useWeatherIcons = (keyword: string) => {
  const [icon, setIcon] = useState<React.ReactNode>();
  const weatherIcons: { keywords: string; icon: React.ReactNode }[] = useMemo(
    () => [
      {
        keywords: "weather cloudy",
        icon: (
          <MaterialCommunityIcons
            name="weather-cloudy"
            size={24}
            color="#6BE7FF"
          />
        ),
      },
      {
        keywords: "weather cloudy alert",
        icon: (
          <MaterialCommunityIcons
            name="weather-cloudy-alert"
            size={24}
            color="#6BE7FF"
          />
        ),
      },
      {
        keywords: "weather fog",
        icon: (
          <MaterialCommunityIcons
            name="weather-fog"
            size={24}
            color="#6BE7FF"
          />
        ),
      },
      {
        keywords: "weather hazy",
        icon: (
          <MaterialCommunityIcons
            name="weather-fog"
            size={24}
            color="#6BE7FF"
          />
        ),
      },
      {
        keywords: "weather lightning",
        icon: (
          <MaterialCommunityIcons
            name="weather-lightning"
            size={24}
            color="#6BE7FF"
          />
        ),
      },
      {
        keywords: "weather lightning rainy",
        icon: (
          <MaterialCommunityIcons
            name="weather-lightning-rainy"
            size={24}
            color="#6BE7FF"
          />
        ),
      },
      {
        keywords: "weather night",
        icon: (
          <MaterialCommunityIcons
            name="weather-night"
            size={24}
            color="#6BE7FF"
          />
        ),
      },
      {
        keywords: "weather night partly cloudy",
        icon: (
          <MaterialCommunityIcons
            name="weather-night-partly-cloudy"
            size={24}
            color="#6BE7FF"
          />
        ),
      },
      {
        keywords: "weather partly cloudy",
        icon: (
          <MaterialCommunityIcons
            name="weather-partly-cloudy"
            size={24}
            color="#6BE7FF"
          />
        ),
      },
      {
        keywords: "weather partly lightning",
        icon: (
          <MaterialCommunityIcons
            name="weather-partly-lightning"
            size={24}
            color="#6BE7FF"
          />
        ),
      },
      {
        keywords: "weather partly rainy",
        icon: (
          <MaterialCommunityIcons
            name="weather-partly-rainy"
            size={24}
            color="#6BE7FF"
          />
        ),
      },
      {
        keywords: "weather partly snowy",
        icon: (
          <MaterialCommunityIcons
            name="weather-partly-snowy"
            size={24}
            color="#6BE7FF"
          />
        ),
      },
      {
        keywords: "weather rainy",
        icon: (
          <MaterialCommunityIcons
            name="weather-rainy"
            size={24}
            color="#6BE7FF"
          />
        ),
      },
      {
        keywords: "weather sunny",
        icon: (
          <MaterialCommunityIcons
            name="weather-sunny"
            size={24}
            color="#6BE7FF"
          />
        ),
      },
      {
        keywords: "weather windy",
        icon: (
          <MaterialCommunityIcons
            name="weather-windy"
            size={24}
            color="#6BE7FF"
          />
        ),
      },
    ],
    [],
  );

  useEffect(() => {
    if (keyword) {
      const icons = weatherIcons.filter((icon) =>
        keyword.split(" ").some((key) => icon.keywords.includes(key)),
      );

      if (icons.length === 0) {
        setIcon(weatherIcons[0].icon);
      } else if (icons.length === 1) {
        setIcon(icons[0].icon);
      } else {
        setIcon(getRandomItem(icons).icon);
      }
    }
  }, [keyword]);

  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      {icon}
      <Text style={{ color: "grey", textAlign: "center", fontSize: 8 }}>
        {keyword}
      </Text>
    </View>
  );
};

export default useWeatherIcons;
