# app/atelier/sprite-designer/

A pixel-art sprite editor brought online as an atelier chamber. Ported
from the Vite bench app at `D:/The_Hangar/apps/sprite-designer/`.
Pairs with `/atelier/pixelify` (drop-an-image pixelator) and
`/atelier/pixeldetector` (find the native grid of an upscaled sprite),
and feeds into the Pixelorama bridge surfaced by `/atelier/mesh-studio`.

## What this is

A small grid, a palette, a frame timeline. The visitor picks a canvas
size (default 32x32), picks a Lospec or Holoflow palette, and draws
with the pen. The timeline below the canvas holds an arbitrary number
of frames; onion-skin draws the prev / next frame faintly under the
current one. Press play to scrub the frames at the chosen fps.

Photo-to-sprite collapses any uploaded image down to the canvas grid
through K-Centroid downsampling, then snaps every output pixel to the
nearest colour in the active palette — useful for turning a reference
photograph into the first frame of a sprite.

Everything runs in the browser. The image never leaves the visitor's
machine.

## Tool palette

- **Brush** — paint a single pixel at the cursor in the active palette
  colour.
- **Eraser** — paint background (`#0e0e14`) at the cursor.
- **Palette** — pick a Lospec or Holoflow curated palette, then a
  swatch from the row.
- **K-Centroid** — re-quantise the current frame in-place (smoother
  edges, fewer stray pixels).
- **Photo to Sprite** — upload an image, get a downsampled and
  palette-snapped first frame.
- **Undo / Redo** — per-stroke history, ctrl+z / ctrl+shift+z.
- **Onion skin** — toggle prev / next frame ghosting.
- **Timeline** — add, duplicate, delete, drag-reorder frames; play
  back at a chosen fps.
- **Export PNG** — single-frame PNG of the current canvas.
- **Export BMP ZIP** — 24-bit BMP sequence (one frame per file) zipped
  for the drone POV firmware at `jbreizh/ImagePainting`.
- **Save / Load .holosprite** — JSON envelope around the frames,
  palette, fps, and dimensions; round-trips so the project saves and
  loads.

## Provenance

- Source app: `D:/The_Hangar/apps/sprite-designer/src/`
- Source `App.tsx` — top-level shell, ported to this client.
- Engine modules: `bmp.ts`, `holosprite.ts`, `kcentroid.ts`,
  `palettes.ts`, `photoToSprite.ts`, `useFrames.ts`, `useHistory.ts`,
  `zip.ts` — live now under `lib/sprite-designer/`.
- Bench dev port: 5174 (Vite).
- Chamber dev port: 3001.

## Output handoff

Every successful export pushes an `AtelierOutput` to the global
recent-outputs state via `pushAtelierOutput`, so the visitor sees the
result in the atelier dock alongside outputs from other chambers.
Kinds emitted: `image` (PNG), `data` (BMP ZIP, .holosprite JSON).

## Logger

All logging goes through `createLogger("atelier:sprite-designer")` per
the holoflow-testing-logging convention. No direct `console.*` calls.

## SSR note

`ImageData` is a browser-only API. The `useFrames` hook in
`lib/sprite-designer/use-frames.ts` defers the initial blank-frame
construction until the client; on the server the frames array starts
empty, then the mount-effect populates it. That keeps the chamber from
500-ing during the RSC pre-render of the client island.
