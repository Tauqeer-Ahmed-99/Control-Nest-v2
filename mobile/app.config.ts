import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const linkedProjectId = config.extra?.eas?.projectId;
  const environmentProjectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
  if (
    linkedProjectId &&
    environmentProjectId &&
    linkedProjectId !== environmentProjectId
  )
    throw new Error(
      "EXPO_PUBLIC_EAS_PROJECT_ID must match the linked EAS project in app.json.",
    );
  const projectId = linkedProjectId ?? environmentProjectId;
  if (projectId && !/^[0-9a-f-]{36}$/i.test(projectId))
    throw new Error("Invalid EAS project ID");
  if (process.env.EAS_BUILD && !projectId)
    throw new Error(
      "Set EXPO_PUBLIC_EAS_PROJECT_ID before building the OTA-enabled binary.",
    );
  return {
    ...config,
    name: config.name ?? "Control Nest",
    slug: config.slug ?? "cnm",
    runtimeVersion: "cn-native-1",
    updates: {
      ...config.updates,
      enabled: Boolean(projectId),
      ...(projectId ? { url: `https://u.expo.dev/${projectId}` } : {}),
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0,
    },
    extra: {
      ...config.extra,
      ...(projectId ? { eas: { ...config.extra?.eas, projectId } } : {}),
    },
  };
};
