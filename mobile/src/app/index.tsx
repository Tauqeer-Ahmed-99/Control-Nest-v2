import useAppEntry from "@/hooks/use-app-entry";
import { Redirect } from "expo-router";

export default function Index() {
  const { isReady, destination } = useAppEntry();

  if (!isReady) return null;

  return <Redirect href={destination} />;
}
