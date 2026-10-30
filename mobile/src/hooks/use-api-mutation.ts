import { APIResponse } from "@/models/api";
import request, { ApiConfig, HTTPMethod } from "@/utils/network";
import { useAuth } from "@clerk/expo";
import {
  UseMutationOptions,
  UseMutationResult,
  useMutation,
} from "@tanstack/react-query";
import useRemoteUrl from "./use-remote-url";

const useApiMutation = <R = unknown, T = unknown, C = unknown>(
  url: string,
  config?: ApiConfig,
  options?: UseMutationOptions<T, Error, R, C>,
): UseMutationResult<T, Error, R, C> => {
  const { getToken } = useAuth();
  const remoteUrl = useRemoteUrl();
  const baseUrl = config?.baseUrl ?? remoteUrl ?? "";
  return useMutation({
    mutationKey: [url],
    mutationFn: async (body: R) => {
      const token = await getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(config?.headers as Record<string, string> | undefined),
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await request(baseUrl, url, {
        method: HTTPMethod.POST,
        ...config,
        headers,
        body: body as any,
        searchParams: { ...(body as any).searchParams },
      });

      if (!response.ok) {
        const parsedRes: APIResponse = await response.json();
        throw new Error(response.status + " : " + parsedRes.message);
      }

      return response.json();
    },
    ...options,
  });
};

export default useApiMutation;
