import { useTheme } from "@rneui/themed";
import { useWindowDimensions, View } from "react-native";
import LoadingSkeleton from "./loading-skeleton";

const CardSkeleton = ({ width }: { width: number }) => {
  const { theme } = useTheme();

  return (
    <View
      style={{
        height: 188,
        width,
        backgroundColor: theme.colors.secondary,
        borderColor: theme.colors.grey5,
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 9,
      }}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={{ flex: 1, paddingBottom: 12, gap: 9 }}>
        <LoadingSkeleton height={42} width={42} borderRadius={14} />
        <LoadingSkeleton height={13} width="74%" borderRadius={5} />
        <LoadingSkeleton height={10} width="53%" borderRadius={5} />
      </View>
      <View
        style={{
          height: 48,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          borderTopWidth: 1,
          borderTopColor: theme.colors.grey5,
        }}
      >
        <LoadingSkeleton height={10} width={38} borderRadius={5} />
        <LoadingSkeleton height={24} width={42} borderRadius={99} />
      </View>
    </View>
  );
};

const CardGridSkeleton = ({ count = 4 }: { count?: number }) => {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = (screenWidth - 52) / 2;
  const rows: number[][] = [];

  for (let i = 0; i < count; i += 2) {
    rows.push(Array.from({ length: Math.min(2, count - i) }, (_, index) => i + index));
  }

  return (
    <View style={{ gap: 16 }}>
      {rows.map((row) => (
        <View
          key={row[0]}
          style={{ flexDirection: "row", justifyContent: "space-between" }}
        >
          {row.map((item) => (
            <CardSkeleton key={item} width={cardWidth} />
          ))}
        </View>
      ))}
    </View>
  );
};

export default CardGridSkeleton;
