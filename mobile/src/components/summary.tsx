import useEnergyConsumption from "@/hooks/use-energy-consumption";
import useHouse, { useDevicesData, useHouseId } from "@/hooks/use-house";
import useWeather from "@/hooks/use-weather";
import useWeatherIcons from "@/hooks/use-weather-icon";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { Text, useTheme } from "@rneui/themed";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import BorderContainer from "./border-container";
import LoadingSkeleton from "./loading-skeleton";

interface ISummaryItem {
  name: string;
  icon: React.ReactNode;
  primaryText: React.ReactNode;
  secondaryText: string;
  isLoading?: boolean;
  isDisabled?: boolean;
}

const SUMMARY_GAP = 10;

const SummaryView = ({
  summaryItem,
  calculateEnergyConsumption,
}: {
  summaryItem: ISummaryItem;
  calculateEnergyConsumption?: () => void;
}) => {
  const { theme } = useTheme();
  const primaryTextContent =
    typeof summaryItem.primaryText === "string" ||
    typeof summaryItem.primaryText === "number" ? (
      <Text
        numberOfLines={2}
        style={{
          textAlign: "center",
          fontSize: summaryItem.primaryText === "Calculate Now" ? 12 : 18,
          lineHeight: 22,
          fontFamily: "Lexend_600SemiBold",
        }}
      >
        {summaryItem.primaryText}
      </Text>
    ) : (
      summaryItem.primaryText
    );

  const content = (
    <View
      style={{
        height: "100%",
        width: "100%",
        padding: 10,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {summaryItem.icon}
      {summaryItem.isLoading ? (
        <LoadingSkeleton height={22} width="54%" borderRadius={6} />
      ) : (
        primaryTextContent
      )}
      {summaryItem.isLoading ? (
        <LoadingSkeleton height={12} width="72%" borderRadius={5} />
      ) : (
        <Text
          numberOfLines={2}
          style={{
            textAlign: "center",
            color: theme.colors.grey2,
            fontSize: 11,
            lineHeight: 14,
          }}
        >
          {summaryItem.secondaryText}
        </Text>
      )}
    </View>
  );

  return calculateEnergyConsumption ? (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={
        summaryItem.primaryText === "Try Again"
          ? "Retry monthly energy usage calculation"
          : summaryItem.primaryText === "Calculate Now"
            ? "Calculate monthly energy usage"
            : "Recalculate monthly energy usage"
      }
      accessibilityState={{ disabled: summaryItem.isDisabled }}
      disabled={summaryItem.isDisabled}
      onPress={() => calculateEnergyConsumption?.()}
      activeOpacity={0.75}
      style={{ width: "100%", height: "100%" }}
    >
      {content}
    </TouchableOpacity>
  ) : (
    content
  );
};

const SummaryCard = ({
  summaryItem,
  calculateEnergyConsumption,
}: {
  summaryItem: ISummaryItem;
  calculateEnergyConsumption?: () => void;
}) => {
  const { width, fontScale } = useWindowDimensions();
  const cardWidth =
    fontScale > 1.3 || width < 360
      ? width - 36
      : (width - 36 - SUMMARY_GAP * 2) / 3;

  return (
    <BorderContainer
      borderWidth={1}
      style={{
        height: 136 * Math.max(1, fontScale),
        width: cardWidth,
        borderRadius: 18,
      }}
    >
      <SummaryView
        summaryItem={summaryItem}
        calculateEnergyConsumption={calculateEnergyConsumption}
      />
    </BorderContainer>
  );
};

const Summary = () => {
  const { theme } = useTheme();
  const houseId = useHouseId();
  const houseQuery = useHouse();
  const devices = useDevicesData();
  const { data: weather, isLoading: isWeatherLoading } = useWeather();
  const weatherIcon = useWeatherIcons(
    weather?.data?.current?.condition?.text ?? "",
  );
  const [isEnergyConsumptionEnabled, setIsEnergyConsumptionEnabled] =
    useState(false);
  const {
    data: energyConsumptionData,
    isFetching: isEnergyConsumptionFetching,
    isError: isEnergyConsumptionError,
    refetch: recalculateEnergyConsumption,
  } = useEnergyConsumption(
    { houseId: houseId ?? "" },
    { enabled: isEnergyConsumptionEnabled && Boolean(houseId) },
  );

  const energyConsumption = energyConsumptionData?.success
    ? energyConsumptionData.data
    : null;
  const hasEnergyConsumptionError =
    isEnergyConsumptionError || energyConsumptionData?.success === false;

  const handleEnergyConsumptionPress = useCallback(() => {
    if (!houseId || isEnergyConsumptionFetching) {
      return;
    }

    if (!isEnergyConsumptionEnabled) {
      setIsEnergyConsumptionEnabled(true);
      return;
    }

    void recalculateEnergyConsumption();
  }, [
    houseId,
    isEnergyConsumptionEnabled,
    isEnergyConsumptionFetching,
    recalculateEnergyConsumption,
  ]);

  const summaryItems: ISummaryItem[] = [
    {
      name: "weather",
      icon: isWeatherLoading ? (
        <LoadingSkeleton height={24} width={24} borderRadius={12} />
      ) : (
        weatherIcon
      ),
      primaryText: `${weather?.data?.current?.temp_c ?? ""}°C`,
      secondaryText: weather?.data?.location?.name ?? "Local weather",
      isLoading: isWeatherLoading,
    },
    {
      name: "devices",
      icon: (
        <MaterialCommunityIcons
          name="connection"
          size={23}
          color={theme.colors.success}
        />
      ),
      primaryText: devices
        ? devices.filter((device) => device.status).length.toString()
        : "0",
      secondaryText: "Devices on",
      isLoading: houseQuery.isLoading,
    },
    {
      name: "energy",
      icon: <FontAwesome6 name="bolt" size={22} color={theme.colors.warning} />,
      primaryText: hasEnergyConsumptionError ? (
        "Try Again"
      ) : isEnergyConsumptionFetching ? (
        <ActivityIndicator color={theme.colors.success} />
      ) : energyConsumption ? (
        `${energyConsumption.totalConsumption} ${energyConsumption.unit}`
      ) : (
        "Calculate Now"
      ),
      secondaryText: isEnergyConsumptionFetching
        ? "Updating monthly usage"
        : energyConsumption
          ? "Tap to recalculate"
          : hasEnergyConsumptionError
            ? "Tap to retry"
            : "Monthly usage",
      isDisabled: !houseId || isEnergyConsumptionFetching,
    },
  ];

  return (
    <View
      style={{
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
        gap: SUMMARY_GAP,
        marginTop: 16,
      }}
    >
      {summaryItems.map((summaryItem) => (
        <SummaryCard
          key={summaryItem.name}
          summaryItem={summaryItem}
          calculateEnergyConsumption={
            summaryItem.name === "energy"
              ? handleEnergyConsumptionPress
              : undefined
          }
        />
      ))}
    </View>
  );
};

export default Summary;
