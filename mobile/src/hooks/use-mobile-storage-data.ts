import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery } from "@tanstack/react-query";

export const useGetMobileStorageData = <T = unknown>(
  key: string,
  config?: { enabled?: boolean },
) => {
  return useQuery<T | null>({
    enabled: config?.enabled,
    queryKey: ["mobile-storage", key],
    queryFn: async () => {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : value;
    },
  });
};

export const useSetMobileStorageData = <T>(key: string) => {
  return useMutation({
    mutationKey: ["mobile-storage", key],
    mutationFn: async (value: T) => {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    },
  });
};
