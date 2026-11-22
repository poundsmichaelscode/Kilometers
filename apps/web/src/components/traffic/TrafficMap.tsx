"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const incidents = [
  {
    id: "demo-1",
    type: "Flooding",
    location: "Ozumba Mbadiwe Avenue",
    coordinates: [3.4295, 6.4368] as [number, number],
    color: "#2563eb",
  },
  {
    id: "demo-2",
    type: "Accident",
    location: "Lekki–Epe Expressway",
    coordinates: [3.4920, 6.4380] as [number, number],
    color: "#ef4444",
  },
  {
    id: "demo-3",
    type: "Road obstruction",
    location: "Admiralty Way",
    coordinates: [3.4760, 6.4490] as [number, number],
    color: "#f59e0b",
  },
];

export default function TrafficMap({
  selectedId,
}: {
  selectedId: string | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    maplibregl.setWorkerUrl(
      "/vendor/maplibre/maplibre-gl-worker.mjs"
    );

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [3.465, 6.445],
      zoom: 12,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution: "© OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
    });

    map.addControl(
      new maplibregl.NavigationControl(),
      "top-right"
    );

    const bounds = new maplibregl.LngLatBounds();

    for (const incident of incidents) {
      const marker = document.createElement("button");

      marker.type = "button";
      marker.className = "km-incident-marker";
      marker.style.backgroundColor = incident.color;
      marker.textContent = "!";
      marker.setAttribute(
        "aria-label",
        `${incident.type}: ${incident.location}`
      );

      const popup = new maplibregl.Popup({
        offset: 25,
      }).setText(
        `${incident.type} — ${incident.location} (Demo)`
      );

      new maplibregl.Marker({ element: marker })
        .setLngLat(incident.coordinates)
        .setPopup(popup)
        .addTo(map);

      bounds.extend(incident.coordinates);
    }

    map.once("load", () => {
      map.resize();

      map.fitBounds(bounds, {
        padding: 90,
        maxZoom: 13,
        duration: 0,
      });
    });

    const observer = new ResizeObserver(() => {
      map.resize();
    });

    observer.observe(containerRef.current);

    mapRef.current = map;

    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const incident = incidents.find(
      (item) => item.id === selectedId
    );

    if (!incident || !mapRef.current) return;

    mapRef.current.flyTo({
      center: incident.coordinates,
      zoom: 14,
      duration: 800,
    });
  }, [selectedId]);

  return (
    <div className="km-surface relative h-[450px] overflow-hidden rounded-xl border lg:h-[calc(100dvh-100px)]">
      <div
        ref={containerRef}
        className="km-map-canvas h-full w-full"
      />

      <div className="km-surface absolute bottom-8 left-3 z-10 rounded-xl border p-3 shadow-lg">
        <p className="mb-3 text-xs font-bold">
          Incident types
        </p>

        <div className="space-y-2">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="flex items-center gap-2 text-xs"
            >
              <span
                className="size-3 rounded-full"
                style={{
                  backgroundColor: incident.color,
                }}
              />
              {incident.type}
            </div>
          ))}
        </div>

        <p className="km-muted mt-3 text-[10px]">
          Demonstration locations
        </p>
      </div>
    </div>
  );
}
