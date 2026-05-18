/**
 * lib/state/geo.ts — Zustand slice: GPS position, compass heading, permission + tracking state.
 *
 * One-line role: shared state-bus for everything that comes in from the device's geolocation + orientation sensors.
 * Full purpose in geo.PURPOSE.md.
 */

import { create } from "zustand";

export type GeoPosition = {
  /** Latitude in decimal degrees (WGS-84). */
  lat: number;
  /** Longitude in decimal degrees (WGS-84). */
  lon: number;
  /** Reported accuracy radius in metres (1 stddev). */
  accuracy: number;
  /** Altitude in metres above the WGS-84 ellipsoid, when available. */
  altitude?: number;
  /** Ground speed in metres-per-second, when available. */
  speed?: number;
};

export type GeoHeadingSource = "compass" | "gps-velocity" | "unknown";

export type GeoHeading = {
  /** Compass bearing in degrees clockwise from true north (0 = N, 90 = E). */
  degrees: number;
  /** Reported accuracy in degrees; lower is better. */
  accuracy: number;
  /** Where the heading came from — magnetometer compass or derived from GPS velocity. */
  source: GeoHeadingSource;
};

export type GeoPermission = "unknown" | "granted" | "denied" | "prompt";

/**
 * Non-success outcomes from watchPosition that the UI needs to surface.
 * `permission` was already tracked separately; `timeout` and `unavailable`
 * are the new states — previously swallowed by the geo capability's
 * error handler, so a watchPosition that never returned a fix produced
 * silent inaction. Surfacing them lets the AR shell transition from
 * "requesting" into a real overlay instead of spinning forever.
 */
export type GeoErrorCode = "timeout" | "unavailable" | "denied";

export type GeoError = {
  code: GeoErrorCode;
  message: string;
  /** ISO timestamp. */
  at: string;
};

export type GeoState = {
  position: GeoPosition | null;
  heading: GeoHeading | null;
  permission: GeoPermission;
  tracking: boolean;
  /** ISO timestamp of the last position update; null when never received. */
  lastUpdate: string | null;
  /** Last non-success outcome from the geolocation watcher; cleared on fix. */
  lastError: GeoError | null;
};

export type GeoActions = {
  setPosition: (position: GeoPosition) => void;
  setHeading: (heading: GeoHeading) => void;
  setPermission: (permission: GeoPermission) => void;
  setTracking: (tracking: boolean) => void;
  setLastError: (error: GeoError | null) => void;
  clear: () => void;
};

const initial: GeoState = {
  position: null,
  heading: null,
  permission: "unknown",
  tracking: false,
  lastUpdate: null,
  lastError: null,
};

export const useGeoStore = create<GeoState & GeoActions>()((set) => ({
  ...initial,
  setPosition: (position) =>
    set({
      position,
      lastUpdate: new Date().toISOString(),
      // A successful fix clears any prior timeout/unavailable state so
      // UI overlays watching `lastError` don't stick around stale.
      lastError: null,
    }),
  setHeading: (heading) => set({ heading }),
  setPermission: (permission) => set({ permission }),
  setTracking: (tracking) => set({ tracking }),
  setLastError: (lastError) => set({ lastError }),
  clear: () => set({ ...initial }),
}));

export const geoStore = useGeoStore;
