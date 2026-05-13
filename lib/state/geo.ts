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

export type GeoState = {
  position: GeoPosition | null;
  heading: GeoHeading | null;
  permission: GeoPermission;
  tracking: boolean;
  /** ISO timestamp of the last position update; null when never received. */
  lastUpdate: string | null;
};

export type GeoActions = {
  setPosition: (position: GeoPosition) => void;
  setHeading: (heading: GeoHeading) => void;
  setPermission: (permission: GeoPermission) => void;
  setTracking: (tracking: boolean) => void;
  clear: () => void;
};

const initial: GeoState = {
  position: null,
  heading: null,
  permission: "unknown",
  tracking: false,
  lastUpdate: null,
};

export const useGeoStore = create<GeoState & GeoActions>()((set) => ({
  ...initial,
  setPosition: (position) =>
    set({ position, lastUpdate: new Date().toISOString() }),
  setHeading: (heading) => set({ heading }),
  setPermission: (permission) => set({ permission }),
  setTracking: (tracking) => set({ tracking }),
  clear: () => set({ ...initial }),
}));

export const geoStore = useGeoStore;
