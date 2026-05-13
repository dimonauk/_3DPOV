# `geo.ts` — purpose twin

## Role

The shared state-bus for everything entering from the device's
location and orientation sensors — GPS fix, compass heading,
permission status, and tracking lifecycle. The outdoor sculpture
trail's primary input surface: every AR anchor in Manchester or
London resolves against the values held here.

## Public surface

- `useGeoStore` / `geoStore`.
- Types: `GeoPosition`, `GeoHeading`, `GeoHeadingSource`,
  `GeoPermission`, `GeoState`, `GeoActions`.

## Internal

- `initial` — position + heading null, permission `unknown`,
  tracking false, `lastUpdate` null. Reset state for `clear()`.
- `setPosition` stamps `lastUpdate` with the current ISO timestamp
  on every write so consumers can age-out a stale fix without
  needing a second action.

## Depends on

- `zustand`. No other slice.

## Does not

- **Does not run any sensor.** `navigator.geolocation.watchPosition`
  and `DeviceOrientationEvent` listening live in capabilities under
  `lib/capabilities/geo/`. The slice holds the current values + the
  source label for the heading.
- **Does not request permission.** Permission prompts (especially
  the iOS `DeviceOrientationEvent.requestPermission()` dance) must
  fire from a user-gesture context, so they live in the capability.
  The slice only mirrors the final outcome via `setPermission`.
- **Does not resolve the heading-source split.** When both compass
  and GPS-velocity headings are available, the capability decides
  which one to write; the slice trusts what's written and exposes
  the source label so downstream consumers can decide whether to
  trust it (compass tends to be jittery indoors, GPS-velocity needs
  motion to be meaningful).
- **Does not derive bearing from two positions.** Bearing-to-target
  maths is a downstream concern — capabilities consuming `position`
  + a target waypoint do that calculation.

## Bordering files

- `lib/capabilities/geo/position.ts` — writes `position`, `heading`,
  `permission`, `tracking` while the watcher + orientation listener
  are attached.
- `lib/state/input.ts` — sibling sensor slice (head pose, gestures).
  The two slices are deliberately separate: head-pose is local body
  motion, geo is world-anchored placement; mixing them would
  conflate frames of reference.
- Future `lib/capabilities/xr/geospatial.ts` — places AR anchors at
  the per-location GPS coords from the outdoor-sculpture-trail
  catalogue, reading from this slice.
- Future `lib/state/trail.ts` — the per-location catalogue (GPS
  coords, capture heading, narration script, model reference).
  Consumes this slice's `position` to decide which anchor is closest.
