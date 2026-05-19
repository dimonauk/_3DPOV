# Holoflow WebXR Game Framework — Blender exporter

A Blender 4.0+ add-on that codifies the studio's glTF export
conventions for the WebXR Game Framework. The framework's pipeline runs
Blender → glTF → `public/models/` on the holoflow.co.uk site; this
add-on stops the author having to remember the canonical settings every
time.

## Install

1. Zip the folder `holoflow_webxr_exporter/` (the folder, not its
   parent) — Blender wants the package directory as a single archive.
2. Blender → Edit → Preferences → Add-ons → Install... → pick the zip.
3. Enable the box next to "Holoflow WebXR Game Framework Exporter".
4. The panel appears in the 3D viewport's N-panel under a new
   **Holoflow** tab.

If you're developing the add-on, symlink the folder into Blender's
`scripts/addons/` and use Blender's Reload Scripts (F3 → "reload
scripts") instead of reinstalling each iteration.

## The N-panel

Four sections, top to bottom:

### Scene preset

A dropdown that picks one of five scene types. Each preset feeds
different export overrides and a different per-object tri-count budget.

- **Sculpture gallery piece** — floor sculpture for
  `/atelier/sculpture-gallery`. Per-object cap 80 k triangles. Draco
  level 6. No animation track. Three pieces are visible at once in the
  gallery, which is why the per-object number sits where it does.
- **Sculpture gallery wall relief** — belt-printed wall relief. Per-
  object cap 20 k triangles, Draco level 7 (smaller is better; depth is
  shallow), no animation.
- **Splat-walker prop** — hero prop for the splat-walker scenes that
  run on desktop-class hardware (Steam Frame PC streaming path). Per-
  object cap 250 k triangles. Draco level 5 keeps the detail.
  Animation on.
- **SceneStage demo prop** — generic demo prop. Per-object cap 60 k.
  Animation on. Use this for everything the other presets don't cover.
- **Generic glTF** — no preset overrides, canonical defaults only. The
  fallback when the asset doesn't belong to a specific scene yet.

### Facet mode

The high-facet aesthetic the studio uses for the resin-printed
sculptures depends on every face having its own normal. Smooth shading
plus glTF round-trip collapses the look. Two controls:

- **Force flat normals on export** — scene-wide switch. On by default.
  When set, the exporter runs the flat-normal trick on every object
  marked as a facet object below.
- **Mark '<active>' as facet object** — per-object toggle. Sets the
  Blender custom property `holoflow:facet = True` on the active mesh.
  Combined with the scene-wide switch above, the exporter runs Shade
  Flat plus a custom-split-normals add pass before export, so the look
  survives the round-trip through glTF and back into Three.js.

### Mesh validation

The **Validate for Holoflow** button walks the scene and runs four
checks. Results print to the Blender info bar (the strip at the bottom)
and to the message panel.

Each message has a severity:

- `INFO` — informational, no action needed.
- `WARNING` — exporter will still run, but the author should look.
- `ERROR` — fix before export. The exporter does not block the export
  on errors (that's the human's call), but the message bar will say
  "N error(s) — fix before export".

The checks are:

- **Tri-count** — per-object count against the preset's budget. Hard
  fail at 100% of budget, soft warning at 80%.
- **UVs** — every mesh with a material slot has at least one UV layer.
- **N-gons and zero-area faces** — n-gons trigger a warning (glTF
  triangulates on export; the artist should do it explicitly).
  Zero-area faces are an error.
- **Naming** — root object names must be snake_case. The exporter
  auto-renames on export, but a manual rename lands a cleaner git diff.

### Export

The output path field defaults to a smart suggestion:
`<repo>/public/models/<scene>/<object>.glb`, where `<repo>` is found by
walking up from the .blend file looking for a sibling `public/models/`
directory. If your .blend lives outside the repo, the field stays empty
and you set it yourself.

The **Export to .glb** button runs the canonical settings:

- Binary `.glb` output.
- +Y up axis (glTF standard; Blender is +Z up and the exporter does
  the conversion).
- Apply transforms (location, rotation, scale baked into the mesh).
- Draco mesh compression at the preset's level (5–7).
- Texture format WebP.
- Tangents exported (needed for normal-mapped materials).
- Animation export when the preset allows it; sampling baked at 30 fps
  to match the site's render loop budget.
- Snake_case slug names enforced on every root object.
- Modifiers applied at export time.
- Cameras and lights *not* exported (the scene owns the lighting).

## Where exported files belong in the repo

```
public/
  models/
    sculpture-piece/
      filament_bloom_i.glb
      lattice_knot_iii.glb
      ...
    sculpture-wall/
      wall_relief_strata.glb
      ...
    splat-prop/
      ...
    scenestage-prop/
      ...
```

The folder name matches the preset slug (hyphenated). The file name
matches the object's snake_case slug plus `.glb`.

## Register a new model in the catalogue

After exporting a sculpture-piece or wall-relief, register it in
`lib/sculpture-gallery/catalogue.ts`:

```ts
{
  slug: "filament-bloom-ii",
  title: "Filament bloom II",
  year: 2026,
  edition: { number: 1, of: 8 },
  modelUrl: "/models/sculpture-piece/filament_bloom_ii.glb",
  accent: "#ffb3df",
  blurb: "...",
  note: "...",
},
```

The `modelUrl` is the public path — strip `public/` from the file path
and prefix `/`. The catalogue's `findEntry` and `listCatalogue` helpers
pick it up automatically; the gallery layout function plinths it
without further wiring.

## Voice and conventions

The add-on writes to Blender's info bar in workshop-Dimona register —
plain prose, no buzzwords, no exclamation marks. If you add a new
operator or message string, hold the line.

British spelling throughout: `metres`, `colour`, `catalogue`,
`tessellate`.
