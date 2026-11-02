import * as Application from "expo-application";
import * as Updates from "expo-updates";
import { Platform } from "react-native";
import { version } from "../../package.json";

// Bundled JavaScript version is independent of the installed native binary.
export const releaseMetadata = {
  release: version,
  binaryVersion: Application.nativeApplicationVersion ?? "development",
  build: Application.nativeBuildVersion ?? "0",
  runtime: Updates.runtimeVersion ?? "development",
  updateId: Updates.updateId ?? "embedded",
  platform: Platform.OS,
  apiContract: 1,
};

export function compareVersions(left: string, right: string) {
  const a = left.split(".").map(Number),
    b = right.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const difference = (a[i] ?? 0) - (b[i] ?? 0);
    if (difference) return Math.sign(difference);
  }
  return 0;
}
