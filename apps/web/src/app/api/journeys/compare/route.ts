import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.KILOMETER_API_SERVER_URL ??
  "http://127.0.0.1:8010/api/v1";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin || origin !== request.nextUrl.origin) {
    return NextResponse.json(
      { detail: "Invalid request origin." },
      { status: 403 }
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON." },
      { status: 400 }
    );
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("origin" in payload) ||
    !("destination" in payload)
  ) {
    return NextResponse.json(
      { detail: "Origin and destination are required." },
      { status: 400 }
    );
  }

  function validPoint(value: unknown): boolean {
    if (typeof value !== "object" || value === null) {
      return false;
    }

    if (!("lat" in value) || !("lng" in value)) {
      return false;
    }

    return (
      typeof value.lat === "number" &&
      typeof value.lng === "number" &&
      Number.isFinite(value.lat) &&
      Number.isFinite(value.lng) &&
      Math.abs(value.lat) <= 90 &&
      Math.abs(value.lng) <= 180 &&
      (
        !("label" in value) ||
        (
          typeof value.label === "string" &&
          value.label.length <= 120
        )
      )
    );
  }

  if (
    !validPoint(payload.origin) ||
    !validPoint(payload.destination)
  ) {
    return NextResponse.json(
      { detail: "Invalid location coordinates." },
      { status: 400 }
    );
  }

  const accessToken =
    request.cookies.get("km_access")?.value;

  try {
    const backend = await fetch(
      `${API_BASE.replace(/\/+$/, "")}/journeys/compare`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(accessToken
            ? { Authorization: `Bearer ${accessToken}` }
            : {}),
        },
        body: JSON.stringify(payload),
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    const contentType =
      backend.headers.get("content-type") ?? "";

    const result: unknown = contentType.includes("application/json")
      ? await backend.json()
      : null;

    if (backend.status === 401 || backend.status === 403) {
      return NextResponse.json(
        {
          detail:
            "Guest journey comparison is not yet enabled on the backend.",
        },
        { status: 403 }
      );
    }

    if (!backend.ok) {
      return NextResponse.json(
        {
          detail: "Journey comparison could not be completed.",
          ...(backend.status === 400 && result
            ? { errors: result }
            : {}),
        },
        {
          status:
            [400, 429].includes(backend.status)
              ? backend.status
              : 502,
        }
      );
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { detail: "Journey service unavailable." },
      { status: 503 }
    );
  }
}
