import { api } from "./client";

export function getBackendHealth(
  signal?: AbortSignal
) {
  return api.get<unknown>("health", {
    signal,
  });
}
