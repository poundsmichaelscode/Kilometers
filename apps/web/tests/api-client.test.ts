import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  api,
  ApiError,
} from "../src/lib/api/client";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("KILOMETER API client", () => {
  it("returns successful JSON responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ status: "ok" }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    const result = await api.get<{ status: string }>(
      "health"
    );

    expect(result.status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("sends JWT authorization headers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("{}", {
        status: 200,
        headers: {
          "content-type": "application/json",
        },
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    await api.get("me", {
      token: "example-test-token",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer example-test-token",
        }),
      })
    );
  });

  it("sends JSON request bodies", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response("{}", {
        status: 201,
        headers: {
          "content-type": "application/json",
        },
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const body = {
      email: "test@example.com",
      password: "example-password",
    };

    await api.post("auth/register", body);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(body),
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
      })
    );
  });

  it("handles unauthorized requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            detail: "Authentication required",
          }),
          {
            status: 401,
            headers: {
              "content-type": "application/json",
            },
          }
        )
      )
    );

    await expect(api.get("me")).rejects.toMatchObject({
      status: 401,
      message: "Authentication required",
    });
  });

  it("handles network failures", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(
        new TypeError("Failed to fetch")
      )
    );

    await expect(api.get("health")).rejects.toBeInstanceOf(
      ApiError
    );
  });

  it("handles empty 204 responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(null, { status: 204 })
      )
    );

    await expect(
      api.delete("example")
    ).resolves.toBeUndefined();
  });
});
