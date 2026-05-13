/**
 * lib/capabilities/geo/position.ts — Capability `geo.position`: GPS watch + compass heading writer.
 *
 * One-line role: attach `navigator.geolocation.watchPosition` plus a `DeviceOrientationEvent` listener and pipe the readings into the `geo` slice.
 * Full purpose in position.PURPOSE.md.
 *
 * The outdoor sculpture trail's foundational sensor brick. AR anchors
 * in Manchester / London resolve against the values written here.
 */

import { geoStore, type GeoHeadingSource } from "lib/state/geo";

export type StartGeoOptions = {
  /** Pass through to `watchPosition`; defaults to `true` for AR placement. */
  enableHighAccuracy?: boolean;
  /** Maximum acceptable fix age in ms; defaults to 0 (no cached fix). */
  maximumAge?: number;
  /** Per-fix timeout in ms; defaults to 15s. */
  timeout?: number;
};

/**
 * iOS Safari quirk: `DeviceOrientationEvent.requestPermission` is a
 * static method that only exists on iOS 13+. Type-guard before calling.
 */
type RequestPermissionFn = () => Promise<"granted" | "denied">;
type DeviceOrientationEventCtor = typeof DeviceOrientationEvent & {
  requestPermission?: RequestPermissionFn;
};

/**
 * iOS Safari quirk: `webkitCompassHeading` is non-standard, gives true-north
 * bearing directly, and is the only trustworthy compass on Apple devices.
 */
type IOSDeviceOrientationEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
  webkitCompassAccuracy?: number;
};

let watchId: number | null = null;
let orientationHandler: ((e: DeviceOrientationEvent) => void) | null = null;

function hasWindow(): boolean {
  return typeof window !== "undefined";
}

function hasGeolocation(): boolean {
  return hasWindow() && typeof navigator !== "undefined" && "geolocation" in navigator;
}

function readCompassHeading(
  e: DeviceOrientationEvent,
): { degrees: number; accuracy: number; source: GeoHeadingSource } | null {
  const iosEvent = e as IOSDeviceOrientationEvent;
  if (typeof iosEvent.webkitCompassHeading === "number") {
    // iOS: webkitCompassHeading is degrees clockwise from true north.
    return {
      degrees: iosEvent.webkitCompassHeading,
      accuracy: iosEvent.webkitCompassAccuracy ?? -1,
      source: "compass",
    };
  }
  if (typeof e.alpha === "number") {
    // Android: alpha is anticlockwise from the device's initial orientation.
    // Convert to clockwise-from-north by negating and normalising. This is
    // only a true-north bearing when the device reports absolute orientation
    // (`e.absolute === true`); when relative, callers should treat it with
    // suspicion — the source label stays `compass` so the slice consumer
    // can decide.
    const degrees = (360 - e.alpha) % 360;
    return { degrees, accuracy: -1, source: "compass" };
  }
  return null;
}

function attachOrientationListener(): void {
  if (!hasWindow()) return;
  if (orientationHandler !== null) return;
  const handler = (e: DeviceOrientationEvent): void => {
    const reading = readCompassHeading(e);
    if (reading === null) return;
    geoStore.getState().setHeading(reading);
  };
  // `deviceorientationabsolute` gives true-north on Android when supported;
  // fall back to `deviceorientation` for iOS (webkitCompassHeading lives on
  // the standard event there).
  window.addEventListener("deviceorientationabsolute", handler as EventListener);
  window.addEventListener("deviceorientation", handler);
  orientationHandler = handler;
}

function detachOrientationListener(): void {
  if (!hasWindow()) return;
  if (orientationHandler === null) return;
  window.removeEventListener(
    "deviceorientationabsolute",
    orientationHandler as EventListener,
  );
  window.removeEventListener("deviceorientation", orientationHandler);
  orientationHandler = null;
}

function writePosition(pos: GeolocationPosition): void {
  const coords = pos.coords;
  geoStore.getState().setPosition({
    lat: coords.latitude,
    lon: coords.longitude,
    accuracy: coords.accuracy,
    altitude: coords.altitude ?? undefined,
    speed: coords.speed ?? undefined,
  });
  // If we have a non-trivial ground speed and no compass-sourced heading
  // yet, surface the GPS-velocity heading so the slice has something useful.
  const current = geoStore.getState().heading;
  if (
    typeof coords.heading === "number" &&
    !Number.isNaN(coords.heading) &&
    (current === null || current.source === "unknown")
  ) {
    geoStore.getState().setHeading({
      degrees: coords.heading,
      accuracy: -1,
      source: "gps-velocity",
    });
  }
}

function handleGeolocationError(err: GeolocationPositionError): void {
  if (err.code === err.PERMISSION_DENIED) {
    geoStore.getState().setPermission("denied");
    geoStore.getState().setTracking(false);
  }
}

/**
 * Request permission for geolocation + device orientation. Must be called
 * from a user-gesture context (button click): iOS Safari rejects the
 * orientation prompt otherwise. Geolocation permission resolves on the
 * first successful fix attempt — we resolve eagerly via the Permissions
 * API where available, and treat any non-`denied` outcome as "prompt".
 */
export async function requestPermissions(): Promise<{
  geolocation: boolean;
  orientation: boolean;
}> {
  let geolocation = false;
  let orientation = false;

  if (hasWindow() && typeof navigator !== "undefined" && "permissions" in navigator) {
    try {
      const status = await navigator.permissions.query({
        name: "geolocation" as PermissionName,
      });
      geolocation = status.state === "granted";
      geoStore.getState().setPermission(status.state as never);
    } catch {
      // Permissions API not supported for this name on this browser.
    }
  }

  if (hasWindow()) {
    const ctor = window.DeviceOrientationEvent as
      | DeviceOrientationEventCtor
      | undefined;
    if (ctor && typeof ctor.requestPermission === "function") {
      try {
        const result = await ctor.requestPermission();
        orientation = result === "granted";
      } catch {
        orientation = false;
      }
    } else if (typeof window.DeviceOrientationEvent !== "undefined") {
      // Non-iOS platforms grant orientation implicitly.
      orientation = true;
    }
  }

  return { geolocation, orientation };
}

/**
 * Start GPS tracking and attach the orientation listener. Idempotent —
 * calling twice tears down the previous watcher before starting again.
 * SSR-safe: a no-op when `window` / `navigator.geolocation` are absent.
 */
export async function startGeoTracking(
  options: StartGeoOptions = {},
): Promise<void> {
  stopGeoTracking();

  if (!hasGeolocation()) return;

  const watchOptions: PositionOptions = {
    enableHighAccuracy: options.enableHighAccuracy ?? true,
    maximumAge: options.maximumAge ?? 0,
    timeout: options.timeout ?? 15000,
  };

  watchId = navigator.geolocation.watchPosition(
    (pos) => {
      geoStore.getState().setPermission("granted");
      writePosition(pos);
    },
    handleGeolocationError,
    watchOptions,
  );

  attachOrientationListener();
  geoStore.getState().setTracking(true);
}

/** Stop GPS tracking + detach orientation listener. No-op when idle. */
export function stopGeoTracking(): void {
  if (watchId !== null && hasGeolocation()) {
    navigator.geolocation.clearWatch(watchId);
  }
  watchId = null;
  detachOrientationListener();
  geoStore.getState().setTracking(false);
}

/** Whether the GPS watcher is currently attached. */
export function isTracking(): boolean {
  return watchId !== null;
}
