# `/atelier/quilt-designer` — Quilt Designer

## What this is

A pattern composer for quilts. You set a grid (rows × columns), pick a
traditional quilt block from the library, set three fabric colours
(primary, secondary, background), then click cells to drop the block
into the grid. When the pattern looks right, export it as SVG or PNG
for printing onto cutting templates.

The chamber is browser-only — no AI, no server call, no upload. The
image you make stays on your machine until you click download.

## Why this chamber exists

Wall-art that wants to land as **fabric** rather than as a print. The
print bureau handles flat photographs and prints-on-paper; quilts read
at room scale where a flat print reads at hand scale. The two pair —
a sequence at /photographs lands well as a print; the same composition
abstracted to blocks lands well as a quilt above the sofa.

The yardage calculator is a back-of-envelope estimate, not a cut
plan. Round up if you're fussy-cutting.

## What's in the library (canon)

Ten public-domain blocks. Each is a function `(primary, secondary,
background) → SVG fragment` in a 1×1 box; the grid scales it. Adding
a new block is one entry in the `BLOCKS` array in
`quilt-designer-client.tsx`.

| Block | Notes |
|---|---|
| Solid | One fabric across the whole cell |
| Half-square triangle | The atomic quilt unit |
| Quarter-square triangle | Two-colour pinwheel of triangles |
| Pinwheel | Classic Amish four-blade |
| Nine-patch | 3×3 alternation |
| Rail fence | Three horizontal bars |
| Log cabin | Concentric rings, traditional warm/cool |
| Churn dash | Corner HSTs + edge bars + centre square |
| Flying geese | Three stacked triangles |
| Bear's paw | Simplified pad + four claws |

## How export works

- **SVG** — serialises the live `<svg>` minus the click-target overlay.
  Vector, scales to any cutting size, opens in Inkscape / Illustrator
  / a browser. The grid lines are kept so you can mark cuts.
- **PNG** — rasterises the SVG at 4× the on-screen size for
  print-friendly resolution. Useful when the long-arm shop only takes
  bitmap input.

Both routes push an entry to the atelier's `RecentOutputsDrawer` via
`pushAtelierOutput()`.

## API keys

None. No env vars needed. No external service.

## Future wires

- **Print bureau integration** — a "send to bureau" button that POSTs
  the SVG + colour map + dimensions as a fabric-print order. Waits on
  the fabric-calculator service.
- **PrintBar (fabric variant).** Quilt output is flat textile, not a
  3D printable. The site-wide `<PrintBar>` only takes `stl|glb|ply`
  and quotes resin / FDM / SLS at a 3D-print vendor. To get a quilt
  commerce strip we need a sibling fabric-vendor variant (different
  scale bands — measured in inches square, different finishes — long-
  arm vs hand-quilted, different materials — quilting cotton, linen).
  v0 skips the bar here; document and revisit when the fabric vendor
  ships.
- **Upload-image-to-recolour** — sample the dominant palette from an
  uploaded inspiration image, snap it to the closest swatches in
  `PALETTE`. Browser-only via canvas pixel sampling; no AI needed.
- **AI block suggestions** — optional. Would call Gemini Vision with
  an uploaded image; key surfaced via `GOOGLE_AI_KEY` env var; same
  BYO-key pattern as Imagen / image-edit. Not built yet.
- **Cutting-plan export** — per-shape geometry → PDF cut sheets with
  rotary-cutter dimensions per fabric. Needs a PDF dep we don't have
  yet (lithophane-style: ship later if demand appears).

## File map

| File | Role |
|---|---|
| `page.tsx` | Server component, metadata, intro copy |
| `quilt-designer-client.tsx` | All state, block library, SVG canvas, export |
| `PURPOSE.md` | This file |

## Source

Originally a stub at
`D:/The_Hangar/apps/prototypes/ai-quilting-designer/` — README +
design-system spec + idea.md only, no actual React code. The chamber
here is a from-scratch build that delivers on the spec's "modern
pattern designer" promise without depending on the Gemini Vision
roadmap the original sketch leaned on.
