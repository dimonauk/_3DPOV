# `page.tsx` — purpose twin (route `/capabilities`)

## Role

The discovery surface for the entire capability registry. A
visitor arriving at `/capabilities` sees every brick the studio
knows about — registered or stub — grouped by kind, with its
plugs (state slices + dependencies) and source attribution.

This is the human-readable counterpart to
`lib/capabilities/index.ts`. The registry is the data; this page
is the lens.

## Public surface

- Route `/capabilities`.
- Default export `CapabilitiesIndexPage` (RSC).
- `metadata` export for SEO.

## Internal

- `KIND_ORDER` — explicit kind display order. Kinds not in the
  list are omitted (current renderer renders only listed kinds).
- `KIND_LABEL` — display label per kind.
- `statusClass` / `statusLabel` — render helpers for the status
  badge.
- `CapabilityCard` — the per-brick card. Inline component
  (under 50 lines); splits to its own file if it grows.

## Depends on

- `lib/capabilities` — re-exports `listCapabilities` and types
  from `_base`. Importing this module *populates* the registry
  via the side-effect `.forEach(register)` at the bottom of
  `index.ts`. Without this import, the page would render an empty
  registry.
- `components/layout/footer` — site footer.
- `next/link` — for cross-links to atelier / stack / photographs.

## Does not

- **Does not invoke capabilities.** It only *lists* them. A future
  `/run` or `/pipelines` route owns invocation.
- **Does not edit the registry.** No write path. To add or change
  a capability, edit `lib/capabilities/index.ts`.
- **Does not show pipelines / compositions.** That's the future
  `/pipelines` route — `/capabilities` is the atoms, `/pipelines`
  is the molecules.
- **Does not render the brick meshes.** The Duplo-scale 3D brick
  visualisation is a future component
  (`components/bricks/brick.tsx`); this page is the 2D index.

## Bordering files

- `lib/capabilities/index.ts` — data source.
- `lib/capabilities/_base.ts` — types.
- `docs/CAPABILITY_REGISTRY_PLAN.md` — work-order doc the
  introductory paragraph cross-links to.
- `docs/BRICK_LANGUAGE.md` — visual language doc.
- `docs/ARCHITECTURE.md` — substrate canon.
- Future: `app/pipelines/page.tsx` — composition discovery.
- Future: `components/bricks/brick.tsx` — the 3D brick renderer
  that will replace these 2D cards in VR.
