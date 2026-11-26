import { NextRequest, NextResponse } from "next/server";
import {
  API_BASE,
  clearTokenCookies,
  refreshTokens,
} from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { detail: "Invalid request origin." },
      { status: 403 }
    );
  }

  let access = request.cookies.get("km_access")?.value;
  let refresh = request.cookies.get("km_refresh")?.value;
  let revoked = false;

  try {
    if (refresh) {
      if (!access) {
        const rotated = await refreshTokens(refresh);

        if (rotated) {
          access = rotated.access;
          refresh = rotated.refresh;
        }
      }

      if (access) {
        const response = await fetch(`${API_BASE}/auth/logout`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${access}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refresh }),
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        });

        revoked = response.ok;
      }
    }
  } catch {
    // Local logout still clears cookies.
    // Backend revocation cannot be guaranteed in this case.
  }

  const response = NextResponse.json(
    { success: true, revoked },
    { headers: { "Cache-Control": "no-store" } }
  );

  clearTokenCookies(response);
  return response;
}
