# `locations.ts` — purpose twin (sculpt-walk catalogue)

## Role

The typed catalogue of every spot on the outdoor sculpture trail —
the data layer behind the studio's primary AR wedge. Names where
each light-painting was shot, which compass heading the rig was
facing, which photograph it ties to, which attractor engine the AR
session should rebuild on the spot, and Aura's per-spot narration
script.

## Public surface

- `SculptureLocation` — the per-spot record. Discriminates `sculpture`
  on `kind` so future rendering kinds (mesh, volumetric, video) can
  land without a breaking change to v0.1.
- `SculptureSpec` — the v0.1 `attractor` arm of the discriminated
  union (engine + optional particleCount + optional scale).
- `LocationWithDistance` — `SculptureLocation` plus a `distanceMeters`
  field, the shape `locationsNear` returns.
- `listLocations()` — every catalogued spot in commit order.
- `getLocation(id)` — look-up by kebab-case slug; `undefined` if
  unknown.
- `locationsByCity(city)` — filter by city string.
- `locationsNear(lat, lon, radiusMeters)` — haversine query,
  sorted nearest-first, with distance attached.

## Internal

- `LOCATIONS` — the catalogue itself, marked `PLACEHOLDER` on every
  coord pair until the trail's spots are surveyed on foot. Kept as
  module-private `const`; consumers reach it through the helpers.
- `haversineMeters` — inlined great-circle distance. Single caller,
  one function, no new dependency on `lib/math/`.
- `toRadians` / `EARTH_R_M` — local maths constants.

## Depends on

- `lib/state/viz` — `AttractorEngine` type, so the `sculpture.engine`
  field stays in lock-step with the rest of the visualiser stack.
- Nothing else. No React, no DOM, no zustand writes.

## Does not

- **Does not render.** Pure data + queries. The R3F / AR / WebXR
  components consume the catalogue; they don't live here.
- **Does not run the AR session.** The `xr.geospatial` capability
  (future) reads this catalogue to know what to anchor.
- **Does not generate the attractor trajectory.** The
  `viz.light-sculpture` capability composes `viz.attractor` for
  that. This file names which engine to use, no more.
- **Does not own real GPS coords.** Every coord is a placeholder
  until Dimona surveys the spot herself with a calibrated compass.
  The `PLACEHOLDER` comment on each is the audit marker.
- **Does not validate IDs against the photographs Shopify
  collection.** That coupling lives in the route layer if it
  needs to land.
- **Does not handle radius queries off-Earth.** Mean spherical
  Earth is fine for trail distances; geodesic precision is not
  the point of this data layer.

## Bordering files

- `lib/state/viz.ts` — supplies `AttractorEngine`.
- `lib/capabilities/viz/light-sculpture.ts` — consumes
  `SculptureLocation` to turn it into a `RenderFrame`.
- `lib/capabilities/viz/attractor.ts` — composed by
  `light-sculpture`; this file names the engine, `attractor` knows
  how to iterate it.
- `app/photographs/page.tsx` — the bureau's print listing; trail
  locations link back to the matching photograph slug.
- Future `xr.geospatial` capability — the GPS-anchoring brick that
  decides which catalogue entry to render based on the viewer's
  fix.
- Future `app/walk/...` route — the outdoor-trail surface that
  lists the locations as a route on a map.
