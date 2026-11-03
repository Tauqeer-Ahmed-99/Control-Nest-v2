import * as Crypto from "expo-crypto";
import { releaseMetadata } from "@/constants/release";
import type { Query, UseQueryOptions } from "@tanstack/react-query";

export interface ApiConfig<T = unknown> {
  publicRequest?: boolean;
  baseUrl?: string;
  searchParams?: { [key: string]: any };
  body?: BodyInit;
  method?: HTTPMethod;
  headers?: HeadersInit;
  queryConfig?: {
    enabled?: boolean;
    staleTime?: number;
    placeholderData?: UseQueryOptions<T, Error>["placeholderData"];
    refetchInterval?:
      number | false | ((query: Query<T, Error>) => number | false);
  };
}

export enum HTTPMethod {
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  PUT = "PUT",
  DELETE = "DELETE",
}

export enum HTTPStatus {
  OK = 200,
  Created = 201,
  NotFound = 400,
  Forbidden = 403,
  BadRequest = 404,
  UnprocessableEntity = 422,
  ServerError = 500,
  ServiceUnavailable = 503,
}

export const ExpectedHTTPStatuses: HTTPStatus[] = [
  HTTPStatus.OK,
  HTTPStatus.Created,
  HTTPStatus.NotFound,
  HTTPStatus.Forbidden,
  HTTPStatus.BadRequest,
  HTTPStatus.UnprocessableEntity,
  HTTPStatus.ServerError,
  HTTPStatus.ServiceUnavailable,
];

const request = <T = unknown>(
  baseUrl: string,
  url: string,
  config?: ApiConfig<T>,
) => {
  const fullUrl = new URL(url, baseUrl);

  const { searchParams, body, method = HTTPMethod.GET, headers } = config ?? {};

  if (searchParams) {
    for (const searchParam in searchParams) {
      fullUrl.searchParams.append(searchParam, searchParams[searchParam]);
    }
  }

  const requestHeaders = new Headers({ "Content-Type": "application/json" });
  new Headers(headers).forEach((value, key) => requestHeaders.set(key, value));
  requestHeaders.set("X-Mobile-Release", releaseMetadata.release);
  requestHeaders.set("X-Mobile-Binary-Version", releaseMetadata.binaryVersion);
  requestHeaders.set("X-Mobile-Build", releaseMetadata.build);
  requestHeaders.set("X-Mobile-Runtime", releaseMetadata.runtime);
  requestHeaders.set("X-Mobile-Update-ID", releaseMetadata.updateId);
  requestHeaders.set("X-Mobile-Platform", releaseMetadata.platform);
  requestHeaders.set(
    "X-Controller-Contract",
    String(releaseMetadata.apiContract),
  );
  if (!requestHeaders.has("X-Request-ID")) {
    requestHeaders.set("X-Request-ID", Crypto.randomUUID());
  }

  return fetch(fullUrl.toString(), {
    method,
    headers: requestHeaders,
    signal: AbortSignal.timeout(25000),
    ...(body !== undefined && method !== HTTPMethod.GET
      ? { body: JSON.stringify(body) }
      : {}),
  });
};

export default request;
