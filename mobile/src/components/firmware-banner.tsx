import useFirmware from "@/hooks/use-firmware";
import useHouseControllers from "@/hooks/use-house-controllers";
import { useHouseId } from "@/hooks/use-house";
import { compareVersions } from "@/constants/release";
import { router } from "expo-router";
import { View } from "react-native";
import { useRelease } from "@/providers/release-provider";
import ChoiceRow from "./choice-row";
function ControllerBanner({ id, name }: { id: string; name: string }) {
  const query = useFirmware(id);
  const result = query.data?.success ? query.data.data : null;
  if (query.isLoading) return null;
  if (!result)
    return query.isError ? (
      <ChoiceRow
        icon="download-cloud"
        title="Firmware status unavailable"
        detail={`${name} · Open Firmware updates to retry`}
        onPress={() => router.push("/(tabs)/firmware-updates")}
      />
    ) : null;
  const available = Boolean(
    result.available &&
    (!result.status?.installedRelease ||
      compareVersions(
        result.available.version,
        result.status.installedRelease,
      ) > 0),
  );
  if (
    !query.isError &&
    result.connection === "online" &&
    !available &&
    !result.required &&
    !result.status?.recoveryRequired
  )
    return null;
  const title = query.isError
    ? "Firmware status unavailable"
    : result.status?.recoveryRequired
      ? "Recovery required"
      : result.required
        ? "Firmware update required"
        : result.connection === "bootstrap_required"
          ? "Bootstrap required"
          : result.connection === "offline" || query.isError
            ? "Controller offline"
            : "Firmware update available";
  return (
    <ChoiceRow
      icon="download-cloud"
      title={title}
      detail={`${name} · Open Firmware updates${result.stale && result.observedAt ? ` · Last seen ${new Date(result.observedAt).toLocaleString()}` : ""}`}
      onPress={() => router.push("/(tabs)/firmware-updates")}
    />
  );
}
export default function FirmwareBanner() {
  const controllers = useHouseControllers(useHouseId() ?? "");
  const { pending } = useRelease();
  return (
    <View style={{ gap: 10, marginBottom: 16 }}>
      {pending && (
        <ChoiceRow
          icon="download-cloud"
          title="App update ready"
          detail="Restart when you're ready to apply it"
          onPress={() => router.push("/app-updates")}
        />
      )}
      {controllers.data?.success &&
        controllers.data.data
          .filter((item) => item.paired)
          .map((item) => (
            <ControllerBanner key={item.id} id={item.id} name={item.name} />
          ))}
    </View>
  );
}
