import { useTheme } from "@rneui/themed";
import { View } from "react-native";
import LoadingSkeleton from "./loading-skeleton";
import Tile from "./tile";

const DeviceSettingsSkeletonTile = ({
  rows = 1,
  showControl = true,
}: {
  rows?: number;
  showControl?: boolean;
}) => (
  <Tile>
    {Array.from({ length: rows }, (_, index) => (
      <View
        key={index}
        style={{
          minHeight: showControl ? 45 : undefined,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <LoadingSkeleton height={13} width={index % 2 ? "35%" : "46%"} />
        {showControl ? (
          <LoadingSkeleton height={40} width={76} borderRadius={20} />
        ) : (
          <LoadingSkeleton height={12} width="38%" />
        )}
      </View>
    ))}
  </Tile>
);

export const RoomListSkeleton = ({ count = 4 }: { count?: number }) => {
  const { theme } = useTheme();

  return (
    <View style={{ gap: 16 }} accessible={false} accessibilityElementsHidden>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{
            minHeight: 78,
            alignItems: "center",
            backgroundColor: theme.colors.secondary,
            borderColor: theme.colors.grey5,
            borderRadius: 18,
            borderWidth: 1,
            flexDirection: "row",
            gap: 14,
            padding: 16,
          }}
        >
          <LoadingSkeleton height={44} width={44} borderRadius={14} />
          <View style={{ flex: 1, gap: 8 }}>
            <LoadingSkeleton height={13} width={index % 2 ? "43%" : "56%"} />
            <LoadingSkeleton height={10} width="28%" />
          </View>
          <LoadingSkeleton height={18} width={18} borderRadius={9} />
        </View>
      ))}
    </View>
  );
};

export const HouseMemberListSkeleton = ({
  count = 3,
}: {
  count?: number;
}) => {
  const { theme } = useTheme();

  return (
    <View style={{ gap: 12 }} accessible={false} accessibilityElementsHidden>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{
            backgroundColor: theme.colors.secondary,
            borderColor: theme.colors.greyOutline,
            borderRadius: 18,
            borderWidth: 1,
            gap: 12,
            padding: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <LoadingSkeleton height={48} width={48} borderRadius={24} />
            <View style={{ flex: 1, gap: 8 }}>
              <LoadingSkeleton height={13} width={index % 2 ? "48%" : "58%"} />
              <LoadingSkeleton height={10} width="72%" />
            </View>
            <LoadingSkeleton height={25} width={62} borderRadius={99} />
          </View>
        </View>
      ))}
    </View>
  );
};

export const SearchResultsSkeleton = ({ count = 3 }: { count?: number }) => {
  const { theme } = useTheme();

  return (
    <View style={{ gap: 10 }} accessible={false} accessibilityElementsHidden>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{
            alignItems: "center",
            backgroundColor: theme.colors.secondary,
            borderColor: theme.colors.grey5,
            borderRadius: 14,
            borderWidth: 1,
            flexDirection: "row",
            gap: 12,
            minHeight: 66,
            padding: 14,
          }}
        >
          <View style={{ flex: 1, gap: 8 }}>
            <LoadingSkeleton height={12} width={index % 2 ? "44%" : "55%"} />
            <LoadingSkeleton height={10} width="69%" />
          </View>
          <LoadingSkeleton height={36} width={66} borderRadius={12} />
        </View>
      ))}
    </View>
  );
};

export const ControlLogListSkeleton = ({ count = 5 }: { count?: number }) => {
  const { theme } = useTheme();

  return (
    <View style={{ gap: 10 }} accessible={false} accessibilityElementsHidden>
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          style={{
            backgroundColor: theme.colors.secondary,
            borderColor: theme.colors.grey5,
            borderRadius: 18,
            borderWidth: 1,
            gap: 13,
            padding: 16,
          }}
        >
          <LoadingSkeleton height={13} width={index % 2 ? "44%" : "58%"} />
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <LoadingSkeleton height={12} width="38%" />
            <LoadingSkeleton height={10} width="22%" />
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <LoadingSkeleton height={10} width="27%" />
            <LoadingSkeleton height={10} width="40%" />
          </View>
        </View>
      ))}
    </View>
  );
};

export const FormSkeleton = ({
  fields = 3,
  showActions = false,
}: {
  fields?: number;
  showActions?: boolean;
}) => (
  <View style={{ gap: 16 }} accessible={false} accessibilityElementsHidden>
    {Array.from({ length: fields }, (_, index) => (
      <View key={index} style={{ gap: 8 }}>
        <LoadingSkeleton height={12} width={index % 2 ? "40%" : "52%"} />
        <LoadingSkeleton height={52} borderRadius={14} />
      </View>
    ))}
    {showActions ? (
      <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 12 }}>
        <LoadingSkeleton height={44} width={84} borderRadius={14} />
        <LoadingSkeleton height={44} width={92} borderRadius={14} />
      </View>
    ) : null}
  </View>
);

export const DeviceDetailsSkeleton = () => {
  const { theme } = useTheme();

  return (
    <View style={{ gap: 16 }} accessible={false} accessibilityElementsHidden>
      <Tile>
        <FormSkeleton fields={3} />
      </Tile>
      <DeviceSettingsSkeletonTile />
      <DeviceSettingsSkeletonTile />
      <Tile>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <LoadingSkeleton height={14} width="29%" />
          <LoadingSkeleton height={40} width={76} borderRadius={20} />
        </View>
      </Tile>
      <Tile>
        <LoadingSkeleton height={44} borderRadius={14} />
      </Tile>
      <Tile>
        <View style={{ gap: 14 }}>
          <LoadingSkeleton height={12} width="46%" />
          <LoadingSkeleton height={12} width="39%" />
        </View>
      </Tile>
      <Tile>
        <LoadingSkeleton height={15} width="42%" />
      </Tile>
      <LoadingSkeleton
        height={48}
        borderRadius={14}
        style={{ borderWidth: 1, borderColor: theme.colors.error }}
      />
    </View>
  );
};
