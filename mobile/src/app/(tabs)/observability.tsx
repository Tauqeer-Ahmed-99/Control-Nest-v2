import Tile from "@/components/tile";
import { ApiRoutes } from "@/routes/routes";
import { APIResponse } from "@/models/api";
import { ObservabilityLog } from "@/models/observability";
import useApiQuery from "@/hooks/use-api-query";
import { ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity, View } from "react-native";
import { Text, useTheme } from "@rneui/themed";
import { useState } from "react";

const formatDate = (createdAt: string) =>
  new Date(createdAt).toLocaleString();

const formatPayload = (value: unknown) =>
  value == null ? "No data" : JSON.stringify(value, null, 2);

const Observability = () => {
  const { theme } = useTheme();
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const { data, error, isLoading, isFetching, refetch } = useApiQuery<
    APIResponse<ObservabilityLog[]>
  >(ApiRoutes.Observability, {
    searchParams: { limit: 100 },
    queryConfig: { staleTime: 0 },
  });

  const logs = data?.success ? data.data : [];
  const traces = new Map<string, ObservabilityLog[]>();
  for (const log of logs) {
    const trace = traces.get(log.requestId) ?? [];
    trace.push(log);
    traces.set(log.requestId, trace);
  }
  for (const events of traces.values()) {
    events.sort(
      (left, right) =>
        new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.colors.primary }}
      contentContainerStyle={{ padding: 16, paddingBottom: 120, gap: 14 }}
      refreshControl={
        <RefreshControl
          refreshing={isFetching && !isLoading}
          onRefresh={() => void refetch()}
          tintColor={theme.colors.success}
        />
      }
    >
      <Tile>
        <Text style={{ fontFamily: "Lexend_600SemiBold", fontSize: 17 }}>
          Request traces
        </Text>
        <Text style={{ color: theme.colors.grey2, lineHeight: 20 }}>
          Each ID groups the mobile request, server response, and controller
          activity. Pull down to refresh. Credentials are redacted from details.
        </Text>
      </Tile>

      {isLoading ? (
        <View style={{ padding: 28, alignItems: "center" }}>
          <ActivityIndicator color={theme.colors.success} />
        </View>
      ) : error || (data && !data.success) ? (
        <Tile>
          <Text style={{ color: theme.colors.error }}>
            {error?.message ?? (data && !data.success ? data.message : "Unable to load request history.")}
          </Text>
        </Tile>
      ) : traces.size === 0 ? (
        <Tile>
          <Text style={{ color: theme.colors.grey2 }}>
            No request traces have been recorded yet.
          </Text>
        </Tile>
      ) : (
        Array.from(traces.entries()).map(([requestId, events]) => (
          <Tile key={requestId}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontFamily: "Lexend_600SemiBold", fontSize: 13 }}>
                Trace ID
              </Text>
              <Text selectable style={{ color: theme.colors.grey2, fontSize: 12 }}>
                {requestId}
              </Text>
            </View>

            {events.map((event) => {
              const expanded = expandedEventId === event.id;
              const failed = event.statusCode >= 400 || event.error != null;
              const statusColor = failed ? theme.colors.error : theme.colors.success;

              return (
                <View
                  key={event.id}
                  style={{
                    borderTopWidth: 1,
                    borderTopColor: theme.colors.greyOutline,
                    paddingTop: 12,
                    gap: 9,
                  }}
                >
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`${expanded ? "Hide" : "Show"} ${event.source} ${event.method} ${event.path} details`}
                    accessibilityState={{ expanded }}
                    activeOpacity={0.75}
                    onPress={() =>
                      setExpandedEventId(expanded ? null : event.id)
                    }
                    style={{ gap: 7 }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text style={{ fontFamily: "Lexend_600SemiBold" }}>
                        {event.source} · {event.method}
                      </Text>
                      <Text style={{ color: statusColor, fontSize: 12 }}>
                        {event.statusCode} · {event.durationMs} ms
                      </Text>
                    </View>
                    <Text style={{ color: theme.colors.grey2 }} numberOfLines={2}>
                      {event.path}
                    </Text>
                    <Text style={{ color: theme.colors.grey3, fontSize: 11 }}>
                      {formatDate(event.createdAt)} · {expanded ? "Hide details" : "View details"}
                    </Text>
                  </TouchableOpacity>

                  {expanded && (
                    <View style={{ gap: 10 }}>
                      {event.error != null && (
                        <PayloadBlock label="Error" value={event.error} />
                      )}
                      <PayloadBlock label="Input" value={event.input} />
                      <PayloadBlock label="Response" value={event.output} />
                    </View>
                  )}
                </View>
              );
            })}
          </Tile>
        ))
      )}
    </ScrollView>
  );
};

const PayloadBlock = ({ label, value }: { label: string; value: unknown }) => {
  const { theme } = useTheme();
  return (
    <View style={{ gap: 5 }}>
      <Text style={{ fontFamily: "Lexend_600SemiBold", fontSize: 12 }}>
        {label}
      </Text>
      <Text
        selectable
        style={{
          backgroundColor: theme.colors.primary,
          borderColor: theme.colors.greyOutline,
          borderRadius: 10,
          borderWidth: 1,
          color: theme.colors.grey1,
          fontFamily: "monospace",
          fontSize: 10,
          lineHeight: 15,
          padding: 10,
        }}
      >
        {formatPayload(value)}
      </Text>
    </View>
  );
};

export default Observability;
