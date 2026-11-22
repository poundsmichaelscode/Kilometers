"use client";

import { useEffect, useState } from "react";
import { getBackendHealth } from "@/lib/api/health";

type Status = "checking" | "online" | "offline";

export default function BackendStatus() {
  const [status, setStatus] =
    useState<Status>("checking");

  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;

    async function checkHealth() {
      controller?.abort();

      const request = new AbortController();
      controller = request;

      const timeout = window.setTimeout(
        () => request.abort(),
        8000
      );

      try {
        await getBackendHealth(request.signal);

        if (active && controller === request) {
          setStatus("online");
        }
      } catch {
        if (active && controller === request) {
          setStatus("offline");
        }
      } finally {
        window.clearTimeout(timeout);
      }
    }

    void checkHealth();

    const interval = window.setInterval(
      checkHealth,
      30000
    );

    return () => {
      active = false;
      controller?.abort();
      window.clearInterval(interval);
    };
  }, []);

  const appearance = {
    checking: {
      color: "bg-amber-500",
      label: "Connecting",
    },
    online: {
      color: "bg-emerald-500",
      label: "API connected",
    },
    offline: {
      color: "bg-red-500",
      label: "API unavailable",
    },
  }[status];

  return (
    <div
      role="status"
      className="flex items-center gap-2 text-xs"
    >
      <span
        className={`size-2 rounded-full ${appearance.color}`}
      />

      <span className="km-muted">
        {appearance.label}
      </span>
    </div>
  );
}
