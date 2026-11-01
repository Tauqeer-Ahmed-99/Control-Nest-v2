import useAddRoom from "@/hooks/use-add-room";
import useHouse from "@/hooks/use-house";
import { ApiRoutes } from "@/routes/routes";
import { Button, Text, useTheme } from "@rneui/themed";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { View } from "react-native";
import InputField from "./input-field";
import { FormSkeleton } from "./loading-placeholders";

export default function AddRoomForm({ closeForm }: { closeForm: () => void }) {
  const { theme } = useTheme();
  const houseQuery = useHouse();
  const house = houseQuery.data?.success ? houseQuery.data.data : null;
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const mutation = useAddRoom();
  const queryClient = useQueryClient();
  return (
    <View style={{ padding: 20, gap: 20 }}>
      {houseQuery.isLoading ? (
        <FormSkeleton fields={1} showActions />
      ) : houseQuery.error || !house ? (
        <>
          <Text accessibilityRole="alert" style={{ color: theme.colors.error }}>
            Couldn&apos;t load this house.
          </Text>
          <Button type="outline" onPress={() => void houseQuery.refetch()}>
            Try again
          </Button>
        </>
      ) : (
        <>
          <Text style={{ color: theme.colors.grey2, fontSize: 16 }}>
            In {house.name}
          </Text>
          <InputField
            label="Room name"
            placeholder="e.g. Living room"
            value={name}
            onChangeText={(value) => {
              setName(value);
              setError("");
            }}
            disabled={mutation.isPending}
            containerStyle={{ paddingHorizontal: 0 }}
          />
          {!!error && (
            <Text
              accessibilityRole="alert"
              style={{ color: theme.colors.error }}
            >
              {error}
            </Text>
          )}
          <Button
            loading={mutation.isPending}
            disabled={mutation.isPending || !name.trim()}
            onPress={() => {
              setError("");
              mutation.mutate(
                { houseId: house.id, roomName: name.trim() },
                {
                  onSuccess: (result) => {
                    if (!result.success) {
                      setError(result.message);
                      return;
                    }
                    void queryClient.invalidateQueries({
                      queryKey: [ApiRoutes.UserHouse],
                    });
                    closeForm();
                  },
                  onError: (cause) => setError(cause.message),
                },
              );
            }}
          >
            Add room
          </Button>
        </>
      )}
    </View>
  );
}
