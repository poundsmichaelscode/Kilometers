import { NextRequest, NextResponse } from "next/server";
import {
  clearTokenCookies,
  fetchUser,
  refreshTokens,
  setTokenCookies,
  type KilometerUser,
} from "@/lib/auth/server";

const headers = { "Cache-Control": "no-store" };

function guestResponse() {
  const response = NextResponse.json(
    { authenticated: false, user: null },
    { headers }
  );
  clearTokenCookies(response);
  return response;
}

export async function GET(request: NextRequest) {
  const access = request.cookies.get("km_access")?.value;
  const refresh = request.cookies.get("km_refresh")?.value;

  if (!access && !refresh) {
    return guestResponse();
  }

  try {
    let currentAccess = access;
    let rotated: { access: string; refresh: string } | null = null;

    if (currentAccess) {
      const initial = await fetchUser(currentAccess);

      if (initial.ok) {
        const user = (await initial.json()) as KilometerUser;
        return NextResponse.json(
          { authenticated: true, user },
          { headers }
        );
      }

      if (initial.status !== 401) {
        return NextResponse.json(
          { detail: "Unable to retrieve account information." },
          { status: 502, headers }
        );
      }
    }

    if (!refresh) {
      return guestResponse();
    }

    rotated = await refreshTokens(refresh);

    if (!rotated) {
      return guestResponse();
    }

    currentAccess = rotated.access;

    const userResponse = await fetchUser(currentAccess);

    if (!userResponse.ok) {
      return NextResponse.json(
        { detail: "Unable to retrieve refreshed session." },
        { status: 502, headers }
      );
    }

    const user = (await userResponse.json()) as KilometerUser;

    const response = NextResponse.json(
      { authenticated: true, user },
      { headers }
    );

    setTokenCookies(response, rotated);
    return response;
  } catch {
    return NextResponse.json(
      { detail: "Authentication service unavailable." },
      { status: 503, headers }
    );
  }
}
