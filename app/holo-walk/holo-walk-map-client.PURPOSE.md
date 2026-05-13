# `holo-walk-map-client.tsx` — purpose twin

## Role

The client map for `/holo-walk`. Renders the typed sculpture
catalogue as pink-edged pins on a MapLibre basemap with the
studio's chrome-on-midnight aesthetic. Hover surfaces a card;
click navigates to the detail page.

## Public surface

- Default export `HoloWalkMapClient({ locations })`.

## Internal

- `containerRef` / `mapRef` for the MapLibre instance + lifecycle.
- `hovered` state for the hover-card.
- `DEFAULT_STYLE` is `tiles.openfreemap.org/styles/positron` — free
  community-maintained tiles, no API key. Override via
  `NEXT_PUBLIC_MAPLIBRE_TILES_URL` when a paid tile provider is
  wired.
- `FALLBACK_STYLE` is plain OSM raster tiles — used if the style
  URL fails to load. Sub-optimal aesthetic but guarantees the
  map renders.

## Depends on

- `maplibre-gl` (npm). Browser-side only — `"use client"`.
- `lib/holo-walk/locations` for the `SculptureLocation` type.

## Does not

- **Does not own the catalogue.** Caller passes locations as a
  prop; this component renders.
- **Does not request the user's location.** The HoloWalk index
  shows where the sculptures ARE; the `geo.position` capability
  is invoked on the per-sculpture AR view, not here.
- **Does not handle the AR view.** That's `/holo-walk/<id>/ar` and
  its own client component (future wave).
- **Does not load tiles with credentials.** Public tiles only at
  this stage. When the studio runs its own tile server (per
  `docs/LOCAL_SERVICES.md` future entries) point
  `NEXT_PUBLIC_MAPLIBRE_TILES_URL` at it.

## Bordering files

- `app/holo-walk/page.tsx` — the server-component shell that
  embeds this.
- `lib/holo-walk/locations.ts` — catalogue source.
- `lib/state/geo.ts` — read by the future AR view, not here.
- Future `app/holo-walk/<id>/page.tsx` + `<id>/ar/page.tsx` —
  the detail + AR routes the pins link to.
