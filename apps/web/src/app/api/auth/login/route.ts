import { NextRequest, NextResponse } from "next/server";



type LoginResponse = {
  access: string;
  refresh: string;
};

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { detail: "Invalid request origin." },
      { status: 403 }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON request." },
      { status: 400 }
    );
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !("email" in body) ||
    !("password" in body) ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json(
      { detail: "Email and password are required." },
      { status: 400 }
    );
  }

  const baseUrl =
    process.env.KILOMETER_API_SERVER_URL ??
    "http://127.0.0.1:8010/api/v1";

  try {
    const backend = await fetch(
      `${baseUrl.replace(/\/$/, "")}/auth/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: body.email,
          password: body.password,
        }),
        cache: "no-store",
      }
    );

    if (!backend.ok) {
      return NextResponse.json(
        {
          detail:
            backend.status === 429
              ? "Too many login attempts. Please try later."
              : "Unable to sign in with those credentials.",
        },
        { status: backend.status }
      );
    }

    const tokens = (await backend.json()) as LoginResponse;

    if (
      typeof tokens.access !== "string" ||
      typeof tokens.refresh !== "string"
    ) {
      throw new Error("Invalid token response");
    }

    const response = NextResponse.json({ success: true });

    const secure = process.env.NODE_ENV === "production";

    response.cookies.set("km_access", tokens.access, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 5 * 60,
    });

    response.cookies.set("km_refresh", tokens.refresh, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60,
    });

    response.headers.set("Cache-Control", "no-store");

    return response;
  } catch {
    return NextResponse.json(
      { detail: "Authentication service unavailable." },
      { status: 503 }
    );
  }
}
