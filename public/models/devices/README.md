# public/models/devices/

GLB asset bucket for the device gallery at `/atelier/devices`. Mirrors
the catalogue at `lib/devices/catalogue.ts` — every entry in the
catalogue points at a path under this directory, organised by
category:

```
public/models/devices/
  consoles/<slug>.glb
  controllers/<slug>.glb
  vr-headsets/<slug>.glb
  vr-controllers/<slug>.glb
```

Each GLB carries a sibling `<slug>.attribution.json` with the source,
author, licence, and original URL — the same fields the catalogue
mirrors. The sibling file is the on-disk source of truth so the asset
stays self-describing if the catalogue ever splits out.

## Fall-back behaviour

Entries with `modelPresent: false` in the catalogue render a category-
tinted primitive (flat slab for consoles, pad for controllers, visor
for headsets, twin batons for VR controllers). The placard reads the
same in both cases — the gallery walks before any GLBs land.

Once you drop a real GLB into the right sub-directory, flip
`modelPresent: true` on the catalogue entry. The scene picks it up on
the next reload.

## Hard rules

- **5 MB cap per GLB.** Use `gltfpack` or `glTF-Transform` to compress
  before committing.
- **Upright on Y.** Roughly 0.2–0.4 m maximum dimension — the plinth
  top sits at 1.0 m and devices read smaller than the sculpture wing's
  pieces.
- **CC0 preferred.** CC-BY is accepted when properly attributed in
  both the catalogue's `attribution` block and the sibling
  `.attribution.json`.
- **Verify on the source page.** Don't add a model whose licence you
  can't confirm.

## Authoring guide

See `docs/OSS-DEVICE-MODELS.md` for the full sourcing methodology,
the list of considered-but-rejected candidates, and the honest gaps
the gallery hasn't filled yet (Steam Frame, Samsung Galaxy XR).
