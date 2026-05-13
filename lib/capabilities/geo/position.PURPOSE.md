# `position.ts` — purpose twin (capability `geo.position`)

## Role

Geolocation + heading entry-point. Attaches
`navigator.geolocation.watchPosition` and a `DeviceOrientationEvent`
listener, then writes `position` / `heading` / `permission` /
`tracking` to the `geo` slice so downstream AR capabilities (the
outdoor-sculpture-trail anchor placer, in particular) can react.

Permission handling is exposed as a separate `requestPermissions()`
call so callers can fire it from a user-gesture context — iOS
Safari refuses the `DeviceOrientationEvent.requestPermission()`
prompt outside a click handler.

## Public surface

- `startGeoTracking(options?)` — attach the watcher + listener.
  Idempotent. Defaults to `enableHighAccuracy: true`, no cached
  fixes, 15-second per-fix timeout.
- `stopGeoTracking()` — detach everything. No-op when idle.
- `isTracking()` — predicate, true while the watcher is attached.
- `requestPermissions()` — runs the iOS orientation-permission
  dance plus the Permissions API geolocation query. Returns a
  `{ geolocation, orientation }` boolean pair. Must be called from
  a user-gesture context for the orientation half to succeed on iOS.
- Type exports: `StartGeoOptions`.

## Internal

- `watchId: number | null` — module-scope handle on the active
  `watchPosition` watcher. Single-source by design: a second
  `startGeoTracking` call tears down the previous watch first.
- `orientationHandler: ((e: DeviceOrientationEvent) => void) | null`
  — paired module-scope slot for the orientation listener.
- `readCompassHeading(e)` — the heading-source split. Reads
  `webkitCompassHeading` first (iOS, the only trustworthy Apple
  compass), falls back to `360 - alpha` (Android, anticlockwise from
  initial orientation converted to clockwise-from-north).
- `attachOrientationListener` / `detachOrientationListener` —
  subscribes to both `deviceorientationabsolute` (Android true-north)
  and `deviceorientation` (iOS surface for `webkitCompassHeading`).
- `writePosition(pos)` — writes the slice + opportunistically
  surfaces `coords.heading` as a `gps-velocity` source when the
  compass hasn't reported yet (only useful when actually moving).
- `handleGeolocationError(err)` — flips the permission state to
  `denied` and stops tracking on `PERMISSION_DENIED`.
- `DeviceOrientationEventCtor` / `IOSDeviceOrientationEvent` —
  type-augmentations for the two iOS-only surfaces. Type-guarded
  before use; the cast is local, not a global declaration.

## Depends on

- `lib/state/geo` — writes `position`, `heading`, `permission`,
  `tracking` via the slice's actions. Reads `heading.source` once
  inside `writePosition` to decide whether to upgrade to a GPS-velocity
  heading.
- Browser globals: `window`, `navigator.geolocation`,
  `navigator.permissions`, `DeviceOrientationEvent`. SSR-safe via
  `hasWindow()` / `hasGeolocation()` guards.

## Does not

- **Does not place AR anchors.** That's a future
  `lib/capabilities/xr/geospatial.ts` brick that reads this slice
  and writes to the XR slice.
- **Does not compute bearing to a target.** Distance-and-bearing
  maths against the trail catalogue live in the consumer that owns
  the catalogue, not here.
- **Does not smooth or Kalman-filter the GPS fix.** Raw watcher
  readings flow straight through. Smoothing is the consumer's call
  (different anchor types want different smoothing).
- **Does not resolve true-north when only `alpha` is available.**
  On Android with `e.absolute === false`, the slice still receives
  the converted value but downstream consumers should treat the
  `compass` source label with suspicion. A future capability may
  augment with magnetometer calibration; out of scope here.
- **Does not auto-request permission inside `startGeoTracking`.**
  Permission requests must originate from a user gesture; the
  caller decides when to fire `requestPermissions()`.

## Plug surface

- **State plugs (write):** `geo.position`, `geo.heading`,
  `geo.permission`, `geo.tracking`, `geo.lastUpdate` (via
  `setPosition`).
- **State plugs (read):** `geo.heading.source` (one read inside
  `writePosition` to gate the GPS-velocity upgrade).
- **Type plugs:** input `StartGeoOptions`; returns void / boolean
  pair.
- **Dependency plugs:** none — entry-point capability. Composes
  with anything that reads the `geo` slice.

## Bordering files

- `lib/state/geo.ts` — the slice this writes. Owns the heading-source
  union (`compass`, `gps-velocity`, `unknown`).
- `lib/capabilities/input/headpose.ts` — sibling sensor capability
  on a different slice. Both are user-body-input entry points.
- Future `lib/capabilities/xr/geospatial.ts` — the AR-anchor placer
  for the outdoor sculpture trail; consumes this slice.
- Future `lib/state/trail.ts` — the per-location catalogue (GPS
  coords + capture heading + narration script). Resolves the
  nearest waypoint against `geo.position`.
- `lib/capabilities/index.ts` — registry stub (flipped separately
  when the brick is registered).
