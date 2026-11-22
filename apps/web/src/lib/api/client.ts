const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8010/api/v1";

export class ApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(
    message: string,
    status: number,
    details?: unknown
  ) {
    super(message);

    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url =
    `${API_BASE_URL.replace(/\/+$/, "")}/` +
    endpoint.replace(/^\/+/, "");

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...options.headers,
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers,
      body:
        options.body !== undefined
          ? JSON.stringify(options.body)
          : undefined,
      signal: options.signal,
      cache: "no-store",
    });
  } catch (error) {
    if (options.signal?.aborted) {
      throw error;
    }

    throw new ApiError(
      "Unable to connect to the KILOMETER server.",
      0,
      error
    );
  }

  const contentType =
    response.headers.get("content-type") ?? "";

  const data: unknown =
    response.status === 204
      ? undefined
      : contentType.includes("application/json")
        ? await response.json()
        : await response.text();

  if (!response.ok) {
    const message =
      typeof data === "object" &&
      data !== null &&
      "detail" in data &&
      typeof data.detail === "string"
        ? data.detail
        : `Request failed with status ${response.status}`;

    throw new ApiError(
      message,
      response.status,
      data
    );
  }

  return data as T;
}

export const api = {
  get: <T>(
    endpoint: string,
    options?: RequestOptions
  ) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "GET",
    }),

  post: <T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions
  ) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "POST",
      body,
    }),

  put: <T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions
  ) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PUT",
      body,
    }),

  patch: <T>(
    endpoint: string,
    body: unknown,
    options?: RequestOptions
  ) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "PATCH",
      body,
    }),

  delete: <T>(
    endpoint: string,
    options?: RequestOptions
  ) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: "DELETE",
    }),
};
