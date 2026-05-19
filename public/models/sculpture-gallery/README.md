# public/models/sculpture-gallery/

GLB asset bucket for the sculpture gallery at
`/atelier/sculpture-gallery`. Drop a `<slug>.glb` here and reference
it from `lib/sculpture-gallery/catalogue.ts` as
`modelUrl: "/models/sculpture-gallery/<slug>.glb"`.

Until the GLB lands, the entry's `primitive` field carries the
fallback shape (`icosphere`, `torus`, `knot`, or `waveguide`) so the
scene still walks.

See `docs/SCULPTURE-GALLERY.md` for authoring conventions (upright on
y, 0.5–0.7 m maximum dimension, baked materials).
