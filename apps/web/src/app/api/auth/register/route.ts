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

  const configuredUrl = process.env.KILOMETER_API_SERVER_URL;
  const baseUrl = configuredUrl ??
    (process.env.NODE_ENV === "production"
      ? ""
      : "http://127.0.0.1:8010/api/v1");

  if (!baseUrl || (process.env.NODE_ENV === "production" && !baseUrl.startsWith("https://"))) {
    return NextResponse.json(
      { detail: "Registration is temporarily unavailable: backend configuration is missing." },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

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
        signal: AbortSignal.timeout(90000),
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
      let errors: Record<string, unknown> = {};

      try {
        const data: unknown = await response.json();

        if (data && typeof data === "object" && !Array.isArray(data)) {
          errors = data as Record<string, unknown>;
        }
      } catch {
        // Use the generic validation message below.
      }

      const messages: string[] = [];

      for (const field of ["email", "password", "non_field_errors"]) {
        const value = errors[field];

        if (typeof value === "string") {
          messages.push(value);
        } else if (Array.isArray(value)) {
          messages.push(
            ...value.filter((item): item is string =>
              typeof item === "string"
            )
          );
        } else if (value && typeof value === "object") {
          for (const nested of Object.values(value)) {
            if (typeof nested === "string") {
              messages.push(nested);
            } else if (Array.isArray(nested)) {
              messages.push(
                ...nested.filter((item): item is string =>
                  typeof item === "string"
                )
              );
            }
          }
        }
      }

      return NextResponse.json(
        {
          detail:
            messages.join(" ") ||
            "Registration was not accepted. Check your details.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { detail: "Unable to create account." },
      { status: 502 }
    );
  } catch (error) {
    const timedOut = error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError");
    return NextResponse.json(
      {
        detail: timedOut
          ? "The authentication service is waking up or responding slowly. Please retry."
          : "Unable to connect to the authentication service.",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
