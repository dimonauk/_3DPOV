"use client";

/**
 * app/holo-walk/holo-walk-map-client.tsx — Client map for the HoloWalk index.
 *
 * One-line role: render the catalogue of sculpture locations on a MapLibre map with chrome-on-midnight aesthetic.
 * Full purpose in holo-walk-map-client.PURPOSE.md.
 */

import maplibregl, { Map as MapLibreMap, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { SculptureLocation } from "lib/holo-walk/locations";
import { createLogger } from "lib/log";

const log = createLogger("holo-walk.map-client");

const DEFAULT_STYLE =
  "https://tiles.openfreemap.org/styles/positron";
const FALLBACK_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

export default function HoloWalkMapClient({
  locations,
}: {
  locations: readonly SculptureLocation[];
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || mapRef.current) return;

    const styleUrl =
      process.env.NEXT_PUBLIC_MAPLIBRE_TILES_URL ?? DEFAULT_STYLE;

    const map = new maplibregl.Map({
      container,
      style: styleUrl,
      center: [-2.5, 53.0],
      zoom: 5.4,
      attributionControl: { compact: true },
    });

    map.on("error", (e) => {
      // Tile-host outage triggers this — we fall back to OSM raster
      // tiles. The original failure is interesting if the fallback
      // ALSO fails, so log both attempts.
      log.warn("map style error, swapping to fallback", {
        url: styleUrl,
        err:
          e && typeof e === "object" && "error" in e
            ? String((e as { error?: unknown }).error)
            : null,
      });
      try {
        map.setStyle(FALLBACK_STYLE);
      } catch (err) {
        log.error("fallback style also failed", {
          err: err instanceof Error ? err.message : String(err),
        });
      }
    });

    // Track markers so cleanup can remove them deterministically.
    // MapLibre's map.remove() drops the canvas but doesn't always
    // tear down marker DOM + their listeners; explicit .remove() on
    // each marker is the documented disposal path.
    const markers: Marker[] = [];

    map.on("load", () => {
      for (const loc of locations) {
        const el = document.createElement("button");
        el.className = "holo-walk-pin";
        el.setAttribute("aria-label", loc.name);
        el.style.cssText = [
          "width: 18px",
          "height: 18px",
          "border-radius: 9999px",
          "border: 2px solid #ff66cc",
          "background: rgba(10,10,15,0.85)",
          "cursor: pointer",
          "display: block",
        ].join(";");
        el.addEventListener("mouseenter", () => setHovered(loc.id));
        el.addEventListener("mouseleave", () => setHovered(null));
        el.addEventListener("click", () => {
          // Client-side navigation — preserves the App Router cache
          // and avoids the hard reload that window.location.href
          // would force.
          router.push(`/holo-walk/${loc.id}`);
        });
        const marker = new Marker({ element: el })
          .setLngLat([loc.coords.lon, loc.coords.lat])
          .addTo(map);
        markers.push(marker);
      }
    });

    mapRef.current = map;
    return () => {
      for (const m of markers) {
        m.remove();
      }
      map.remove();
      mapRef.current = null;
    };
  }, [locations, router]);

  const hoveredLoc = hovered
    ? locations.find((l) => l.id === hovered) ?? null
    : null;

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />
      {hoveredLoc && (
        <div className="pointer-events-none absolute left-3 top-3 max-w-xs rounded-sm border border-warm-black-800 bg-warm-black-950/90 p-3 text-xs text-chrome-200 backdrop-blur">
          <div className="font-mono text-[10px] text-chrome-400">
            {hoveredLoc.city}
          </div>
          <div className="mt-1 text-sm text-chrome-100">
            {hoveredLoc.name}
          </div>
          <div className="mt-2 line-clamp-3 text-chrome-300">
            {hoveredLoc.description}
          </div>
        </div>
      )}
      <Link
        href="/holo-walk"
        className="absolute bottom-3 right-3 rounded-sm border border-warm-black-800 bg-warm-black-950/90 px-3 py-1 text-[10px] text-chrome-300 hover:border-pink-200/60 hover:text-pink-200"
      >
        full list &darr;
      </Link>
    </div>
  );
}
