import request, { ApiConfig, HTTPStatus } from "@/utils/network";
import { useAuth } from "@clerk/expo";
import { UseQueryResult, useQuery } from "@tanstack/react-query";
import useRemoteUrl from "./use-remote-url";

const useApiQuery = <T>(
  url: string,
  config?: ApiConfig<T>,
): UseQueryResult<T, Error> => {
  const { isSignedIn, getToken, userId } = useAuth();
  const remoteUrl = useRemoteUrl();
  const baseUrl = config?.baseUrl ?? remoteUrl ?? "";
  return useQuery({
    queryKey: [url, config?.searchParams, config?.body, userId],
    queryFn: async () => {
      const token = await getToken();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(config?.headers as Record<string, string> | undefined),
      };
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const response = await request(baseUrl, url, { ...config, headers });
      if (!response.ok) {
        const parsedRes = await response.json();
        let errorMessage =
          response.status + " : " + (parsedRes.message ?? response.statusText);
        if (response.status === HTTPStatus.UnprocessableEntity) {
          errorMessage = `${parsedRes?.detail?.[0]?.msg ?? response.status} : ${
            parsedRes?.detail?.[0]?.loc?.[1] ?? response.statusText
          }`;
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },
    staleTime: config?.queryConfig?.staleTime ?? 1000 * 60 * 5, // 5 minutes stale time or the given one
    placeholderData: config?.queryConfig?.placeholderData,
    enabled:
      !!baseUrl &&
      isSignedIn &&
      Boolean(
        config?.queryConfig?.enabled == null || config?.queryConfig?.enabled,
      ),
  });
};

export default useApiQuery;
