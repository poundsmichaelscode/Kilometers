"use client";

import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

const locations = [
  {
    name: "Lekki Phase 1",
    coordinates: [3.4723, 6.4478] as [number, number],
    color: "#22c55e",
  },
  {
    name: "Ikeja",
    coordinates: [3.3515, 6.6018] as [number, number],
    color: "#f59e0b",
  },
];

export default function MapPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    maplibregl.setWorkerUrl(
      "/vendor/maplibre/maplibre-gl-worker.mjs"
    );

    const map = new maplibregl.Map({
      container: containerRef.current,
      center: [3.41, 6.52],
      zoom: 10.5,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: [
              "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
            tileSize: 256,
            attribution:
              "© OpenStreetMap contributors",
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

    for (const location of locations) {
      new maplibregl.Marker({
        color: location.color,
      })
        .setLngLat(location.coordinates)
        .setPopup(
          new maplibregl.Popup().setText(location.name)
        )
        .addTo(map);
    }

    map.once("load", () => {
      const bounds = new maplibregl.LngLatBounds();

      locations.forEach((location) => {
        bounds.extend(location.coordinates);
      });

      map.fitBounds(bounds, {
        padding: 70,
        maxZoom: 12,
        duration: 0,
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-[55vh] min-h-[420px] overflow-hidden rounded-2xl border border-emerald-900/50 lg:h-[calc(100vh-125px)]">
      <div ref={containerRef} className="km-map-canvas h-full w-full" />

      <div className="absolute bottom-4 left-4 z-10 rounded-lg bg-slate-950/90 px-3 py-2 text-xs text-white">
        Illustrative location markers — live routes pending
      </div>
    </div>
  );
}
