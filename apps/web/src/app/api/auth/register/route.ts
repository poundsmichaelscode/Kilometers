import { NextRequest, NextResponse } from "next/server";

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

  const email = body.email.trim().toLowerCase();
  const password = body.password;

  if (
    email.length === 0 ||
    email.length > 254 ||
    password.length < 8 ||
    password.length > 128
  ) {
    return NextResponse.json(
      { detail: "Check your email and password." },
      { status: 400 }
    );
  }

  const baseUrl =
    process.env.KILOMETER_API_SERVER_URL ??
    "http://127.0.0.1:8010/api/v1";

  try {
    const response = await fetch(
      `${baseUrl.replace(/\/+$/, "")}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    if (response.ok) {
      return NextResponse.json(
        { success: true },
        {
          status: 201,
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    if (response.status === 429) {
      return NextResponse.json(
        { detail: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    if (response.status === 400) {
      return NextResponse.json(
        {
          detail:
            "Registration was not accepted. Check your email and password, including password strength.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { detail: "Unable to create account." },
      { status: 502 }
    );
  } catch {
    return NextResponse.json(
      { detail: "Unable to connect to the authentication service." },
      { status: 503 }
    );
  }
}
