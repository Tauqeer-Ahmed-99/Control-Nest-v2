import { ControlLogListSkeleton } from "@/components/loading-placeholders";
import MessageContainer from "@/components/message-container";
import Tile from "@/components/tile";
import useClerkUserName from "@/hooks/use-clerk-user-name";
import useDeviceControlLogs, {
  SearchDeviceControlLogsRequest,
} from "@/hooks/use-device-control-logs";
import { useHouseData } from "@/hooks/use-house";
import { ApiRoutes } from "@/routes/routes";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Text, useTheme } from "@rneui/themed";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  View,
} from "react-native";

const PAGE_SIZE = 15;

type LogEntry = {
  id: string;
  deviceId: string;
  statusChangedFrom: boolean;
  statusChangedTo: boolean;
  resourceStatus: "active" | "inactive";
  createdAt: string | null;
  createdBy: string;
  modifiedAt: string | null;
  modifiedBy: string | null;
};

type ControlLogsPropsType =
  | { logType: "house"; houseId: string; deviceId?: undefined }
  | { logType: "device"; houseId?: undefined; deviceId: string };

const ControlLogs = ({ logType, houseId, deviceId }: ControlLogsPropsType) => {
  const {
    theme: {
      colors: { primary, success, grey3, black },
    },
  } = useTheme();

  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [isLive, setIsLive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const searchRequest: SearchDeviceControlLogsRequest = {
    houseId: logType === "house" ? houseId : undefined,
    deviceId: logType === "device" ? deviceId : undefined,
    page,
    limit: PAGE_SIZE,
  };

  if (logType === "house") {
    delete searchRequest.deviceId;
  } else {
    delete searchRequest.houseId;
  }

  const { data, isLoading, isFetching, refetch } = useDeviceControlLogs(
    searchRequest,
    { refetchInterval: isLive ? 5000 : false },
  );

  // Live polling via setInterval + refetch
  useEffect(() => {
    if (isLive) {
      // Invalidate stale cache and refetch immediately when toggled on
      queryClient.invalidateQueries({
        queryKey: [ApiRoutes.DeviceControlLogs],
      });
      refetch();

      intervalRef.current = setInterval(() => {
        refetch();
      }, 5000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isLive, refetch, queryClient]);

  const logs = data?.data?.data ?? [];
  const pagination = data?.data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setPage(newPage);
      }
    },
    [totalPages],
  );

  // Loading state
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: primary,
          padding: 16,
          paddingBottom: 120,
          gap: 12,
        }}
      >
        <ControlLogListSkeleton count={5} />
      </View>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: primary,
        padding: 16,
        paddingBottom: 120,
      }}
    >
      {/* Live toggle */}
      <TouchableOpacity
        onPress={() => {
          goToPage(1);
          setIsLive((prev) => !prev);
        }}
        style={{
          minHeight: 44,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
          alignSelf: "flex-end",
        }}
        hitSlop={8}
      >
        {isLive && isFetching && (
          <ActivityIndicator size="small" color={success} />
        )}
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: isLive ? success : grey3,
            backgroundColor: isLive ? success : "transparent",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {isLive && <MaterialIcons name="check" size={14} color={primary} />}
        </View>
        <Text style={{ fontSize: 14, color: isLive ? success : grey3 }}>
          Live
        </Text>
      </TouchableOpacity>

      {/* Logs list */}
      {logs.length > 0 ? (
        <FlatList
          data={logs}
          keyExtractor={(item) => item.id}
          renderItem={(logEntry) => (
            <LogItem logType={logType} logEntry={logEntry.item} />
          )}
          contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <MessageContainer message="No control logs found for this device." />
      )}

      {/* Pagination */}
      {!isLive && totalPages > 1 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 16,
            paddingTop: 12,
          }}
        >
          <TouchableOpacity
            disabled={page <= 1}
            onPress={() => goToPage(page - 1)}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              opacity: page <= 1 ? 0.3 : 1,
            }}
          >
            <MaterialIcons name="chevron-left" size={28} color={black} />
          </TouchableOpacity>

          <Text style={{ fontSize: 14, color: black }}>
            {page} / {totalPages}
          </Text>

          <TouchableOpacity
            disabled={page >= totalPages}
            onPress={() => goToPage(page + 1)}
            style={{
              width: 44,
              height: 44,
              alignItems: "center",
              justifyContent: "center",
              opacity: page >= totalPages ? 0.3 : 1,
            }}
          >
            <MaterialIcons name="chevron-right" size={28} color={black} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default ControlLogs;

const LogItem = ({
  logType,
  logEntry,
}: {
  logType: "house" | "device";
  logEntry: LogEntry;
}) => {
  const {
    theme: {
      colors: { success, error, grey2 },
    },
  } = useTheme();

  const { deviceId } = useLocalSearchParams<{
    roomId: string;
    deviceId: string;
  }>();

  const deviceIdToCheck = logType === "house" ? logEntry.deviceId : deviceId;

  const house = useHouseData();

  const device = house?.rooms
    .flatMap((r) => r.devices)
    .find((d) => d.id === deviceIdToCheck);

  const resolveUserName = useClerkUserName();

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "--";
    const d = new Date(dateStr);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  };

  return (
    <Tile>
      <View style={{ gap: 8 }}>
        <Text>
          {logType === "house"
            ? `${house?.name ?? ""} / ${device?.name}`
            : (device?.name ?? "")}
        </Text>

        {/* Status change */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: logEntry.statusChangedTo ? success : error,
              }}
            />
            <Text style={{ fontSize: 14, fontFamily: "Lexend_500Medium" }}>
              {logEntry.statusChangedFrom ? "ON" : "OFF"}
              {"  →  "}
              {logEntry.statusChangedTo ? "ON" : "OFF"}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 11,
              color: grey2,
              fontFamily: "Lexend_300Light",
            }}
          >
            {logEntry.resourceStatus}
          </Text>
        </View>

        {/* User and time */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 12, color: grey2 }}>
            {resolveUserName(logEntry.createdBy)}
          </Text>
          <Text style={{ fontSize: 11, color: grey2 }}>
            {formatDate(logEntry.createdAt)}
          </Text>
        </View>
      </View>
    </Tile>
  );
};
