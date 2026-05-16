# app/atelier/mesh-studio/

The studio's bench-side mesh workshop, brought online as an atelier
chamber. Mirrors the Toolbox shell from
`D:/The_Hangar/apps/holoflow-mesh-studio/` so a visitor sees the same
sub-tabs, the same generator forms, the same inventory of installed
tools, whether the sidecar is reachable or not.

## What this is

The bench machine runs a FastAPI sidecar at `127.0.0.1:8765` that
fronts the studio's Python mesh / image / Ollama / Pixelorama
toolchain. This chamber is the public face of that surface — a
read-only catalogue when the sidecar is asleep, a live remote when
it's up.

## Sub-tabs

All sub-tabs are React state inside `mesh-studio-client.tsx`, not
separate routes. The Toolbox is a single chamber surface, not a
sub-tree.

- **Overview** — plain-English map of what each sub-tab does and how
  to bring the sidecar online if a visitor is on the bench.
- **Pixel Art** — ported form of the text-to-spritesheet generator
  (subject, frames, canvas size, GIF fps, palette, optional Pixelorama
  hand-off). Generate button gated on sidecar reachability.
- **Palette** — ported Pixelorama bridge surface. Status grid, two
  primary action buttons (Launch / Send sprite), featured-extensions
  list with Voxelorama + Skeletor + LospecPaletteImporter highlighted.
- **Gallery** — the full bench inventory: pixel pipeline / 3D mesh /
  image AI / audio reactivity / drone show / POV firmware / ComfyUI
  3D nodes. Filter input narrows by name, description, or path.
- **Live Tools** — preview of the `/tools` registry the sidecar
  exposes (lithophane, voxelize, mesh-repair, audio-beats, raw-decode,
  segment-bg, light-trails). Each row is the same one-button runner
  layout as the bench app.
- **Captures** — placeholder for the recent-shoots listing
  (`/captures`). Server-side wiring exists; the UI grid lands in a
  follow-up.
- **POV firmware** — five firmware shelves the bench tracks under
  `firmware/drone_pov/`.

## Sidecar probe

On mount the client hits `GET http://127.0.0.1:8765/status` with a
1.5s timeout. The top status bar reports online / offline / probing.
Action buttons (Generate, Launch Pixelorama, Send sprite) are
disabled when offline. Read-only catalogue content (Gallery, the
inventory cards, the firmware list) stays visible regardless.

## What this isn't

- Not a port of Light Forge, Density Calculator, ComfyUI Guide,
  Compute Lab, or the Studio genome evolution loop. Those are
  separate surfaces on the bench app and would each be their own
  chamber if brought online.
- Not a sidecar-required surface. The chamber renders fully without
  the sidecar; only the action buttons need it.
- Not a Vite mount. The source is Vite + React 19 + Zustand; this
  port collapses the global store into local React state because the
  chamber doesn't need cross-tab state.

## Provenance

- Source app: `D:/The_Hangar/apps/holoflow-mesh-studio/src/`
- Source Toolbox: `src/features/toolbox/Toolbox.tsx`
- Sub-tab sources: `PixelartTab.tsx`, `PixeloramaTab.tsx`, others
- Sidecar route base: `http://127.0.0.1:8765` (bench-local only)
- Bench dev port: 5138 (Vite)

## Logger

All logging goes through `createLogger("atelier:mesh-studio")` per the
holoflow-testing-logging convention. No direct `console.*` calls.
