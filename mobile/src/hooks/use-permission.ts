import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

export interface UsePermissionOptions<TStatus> {
  requestPermission: () => Promise<TStatus>;
  checkPermission?: () => Promise<TStatus>;
  isGranted: (status: TStatus) => boolean;
  isDenied?: (status: TStatus) => boolean;
  requestOnMount?: boolean;
  checkOnMount?: boolean;
  recheckOnAppActive?: boolean;
}

export function usePermission<TStatus>({
  requestPermission: requestPermissionAction,
  checkPermission: checkPermissionAction,
  isGranted: isGrantedStatus,
  isDenied: isDeniedStatus,
  requestOnMount = false,
  checkOnMount = true,
  recheckOnAppActive = true,
}: UsePermissionOptions<TStatus>) {
  const [data, setData] = useState<TStatus | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const isMounted = useRef(false);
  const currentData = useRef<TStatus | null>(null);
  const inFlightCheck = useRef<{
    request: boolean;
    promise: Promise<TStatus | null>;
  } | null>(null);
  const actions = useRef({
    requestPermission: requestPermissionAction,
    checkPermission: checkPermissionAction,
  });
  const hasCheckPermission = checkPermissionAction !== undefined;

  useEffect(() => {
    actions.current = {
      requestPermission: requestPermissionAction,
      checkPermission: checkPermissionAction,
    };
  }, [checkPermissionAction, requestPermissionAction]);

  const runPermissionCheck = useCallback(function runPermissionCheckImpl(
    request: boolean,
  ): Promise<TStatus | null> {
    if (inFlightCheck.current) {
      if (request && !inFlightCheck.current.request) {
        return inFlightCheck.current.promise.then(() =>
          runPermissionCheckImpl(true),
        );
      }

      return inFlightCheck.current.promise;
    }

    const action = request
      ? actions.current.requestPermission
      : actions.current.checkPermission;

    if (!action) return Promise.resolve(currentData.current);

    setIsFetching(true);
    setError(null);

    const check = Promise.resolve().then(async () => {
      try {
        const status = await action();
        currentData.current = status;
        if (isMounted.current) setData(status);
        return status;
      } catch (cause) {
        const permissionError =
          cause instanceof Error ? cause : new Error(String(cause));

        currentData.current = null;
        if (isMounted.current) {
          setData(null);
          setError(permissionError);
        }

        return null;
      } finally {
        inFlightCheck.current = null;
        if (isMounted.current) setIsFetching(false);
      }
    });

    inFlightCheck.current = { request, promise: check };
    return check;
  }, []);

  const requestPermission = useCallback(
    () => runPermissionCheck(true),
    [runPermissionCheck],
  );
  const checkPermission = useCallback(
    () => runPermissionCheck(false),
    [runPermissionCheck],
  );

  useEffect(() => {
    isMounted.current = true;

    if (requestOnMount) {
      void requestPermission();
    } else if (checkOnMount && actions.current.checkPermission) {
      void checkPermission();
    }

    const subscription =
      recheckOnAppActive && actions.current.checkPermission
        ? AppState.addEventListener("change", (state) => {
            if (state === "active") void checkPermission();
          })
        : null;

    return () => {
      isMounted.current = false;
      subscription?.remove();
    };
  }, [
    checkOnMount,
    checkPermission,
    recheckOnAppActive,
    requestOnMount,
    requestPermission,
    hasCheckPermission,
  ]);

  const isLoading = data === null && error === null;

  return {
    data,
    error,
    isLoading,
    isFetching,
    isSuccess: data !== null && error === null,
    isError: error !== null,
    isGranted: data !== null && isGrantedStatus(data),
    isDenied: data !== null && (isDeniedStatus?.(data) ?? false),
    requestPermission,
    checkPermission,
  };
}
