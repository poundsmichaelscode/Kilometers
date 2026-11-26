import { NextResponse } from "next/server";

export const API_BASE =
  process.env.KILOMETER_API_SERVER_URL ??
  "http://127.0.0.1:8010/api/v1";

export const ACCESS_AGE = 5 * 60;
export const REFRESH_AGE = 24 * 60 * 60;

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type KilometerUser = {
  id: string | number;
  email: string;
  first_name: string;
  last_name: string;
};

export function setTokenCookies(
  response: NextResponse,
  tokens: AuthTokens
) {
  const secure = process.env.NODE_ENV === "production";

  response.cookies.set("km_access", tokens.access, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_AGE,
  });

  response.cookies.set("km_refresh", tokens.refresh, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_AGE,
  });
}

export function clearTokenCookies(response: NextResponse) {
  response.cookies.delete("km_access");
  response.cookies.delete("km_refresh");
}

export async function refreshTokens(
  refresh: string
): Promise<AuthTokens | null> {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });

  if (response.status === 400 || response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Unable to refresh authentication session.");
  }

  const data: unknown = await response.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("access" in data) ||
    !("refresh" in data) ||
    typeof data.access !== "string" ||
    typeof data.refresh !== "string"
  ) {
    throw new Error("Invalid authentication response.");
  }

  return {
    access: data.access,
    refresh: data.refresh,
  };
}

export async function fetchUser(access: string) {
  return fetch(`${API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${access}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
}
