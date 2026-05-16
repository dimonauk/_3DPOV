# app/play/pixel-academy/

The Pixel Academy chamber on the public site. Ported from the Vite
bench app at `D:/The_Hangar/apps/pixel-academy/` (workspace name
`@hanger/pixel-academy`), which is itself a thin React shell around
the in-house pixel renderer at `D:/The_Hangar/packages/pixel-engine/`
(workspace name `@hanger/pixel-engine`).

## What this is

A pixel-art office, rendered tile-by-tile on a 2D canvas, with the
Headmistress (Aura) seated at her desk on the right. Two rooms divided
by a wall with a doorway; a desk on each side; chairs around each
desk; a bookshelf, a couple of plants, a cooler, and a whiteboard for
furniture. Aura sits at the right-room top chair (head-of-table,
facing the desk) and types continuously. She is the only agent in the
public version of the chamber.

The bench version of this app connects to a local WebSocket service
called the Scribe Bridge (`ws://localhost:9001`), which streams agent
events from the desktop Hangar shell: new agents arrive with a Matrix-
style rain animation, claim a seat, type when they are working,
wander when they are idle. On the public site the Scribe Bridge is
not reachable, so the hook is intentionally not wired in &mdash; the
chamber stands as a single-occupant tableau.

The renderer is a 4-connected tile grid with BFS pathfinding, sprite-
cache-backed canvas blits, depth sorting on the bottom edge, and the
HSL "colorize" trick from `colorize.ts` for tinting floors / walls /
furniture from greyscale source sprites. Characters are a small FSM
&mdash; type, walk, idle &mdash; with palette-swapped sprite sheets
generated at runtime.

## Tool labels

- **Click an agent** &mdash; selects them; the camera follows.
- **Click a chair** while an agent is selected &mdash; reassigns the
  agent to the new seat (BFS path drawn through the room).
- **Click the same chair again** &mdash; sends the agent back to sit.
- **Click empty floor** &mdash; clears the selection.
- **Middle-mouse drag** &mdash; pan the camera.
- **Ctrl / Cmd + scroll** &mdash; zoom in / out (zoom range 1&ndash;8).
- **Hover an agent** &mdash; floats their role label above their head;
  the &times; on the label dismisses a normal agent (the Headmistress
  cannot be dismissed).

## Pairs with

- `/atelier/sprite-designer` &mdash; the pixel-art editor that draws
  the kind of sprite the academy renders.
- `/atelier/pixelify` &mdash; the drop-an-image pixelator.
- `/atelier/pixeldetector` &mdash; finds the native grid of an
  upscaled sprite.

## Provenance

- Source app: `D:/The_Hangar/apps/pixel-academy/src/` &mdash;
  `App.tsx`, `OfficeCanvas.tsx`, `ToolOverlay.tsx`,
  `hooks/useScribeLink.ts`.
- Source engine: `D:/The_Hangar/packages/pixel-engine/src/` &mdash;
  vendored under `lib/pixel-academy/` because the Holoflow site is a
  standalone Next.js project outside the Hangar pnpm workspace.
- Engine edits during vendoring: (a) fixed two broken relative paths
  in the original package (`'./office/types.js'` in
  `constants.ts` &rarr; `'./types'`; `'../constants.js'` in sibling
  files &rarr; `'./constants'`), (b) dropped `.js` extensions so the
  Next.js bundler can resolve the imports, (c) replaced two
  `console.*` calls inside `buildDynamicCatalog` with the holoflow
  logger.
- Editor surface (`packages/pixel-engine/src/editor/*`) was not
  vendored &mdash; the chamber does not surface furniture editing.

## Logger

All logging goes through `createLogger("play:pixel-academy")` per the
holoflow-testing-logging convention. The vendored engine's two
`console.*` calls were migrated to the same logger under
`createLogger("play:pixel-academy:furniture-catalog")`.

## SSR note

`OfficeState` mutates module-level canvas sprite caches via
`document.createElement('canvas')`, which is browser-only. The client
constructs the state lazily inside `useState(() => ...)`, guarded by
`typeof window === "undefined" ? null : createOfficeWithAura()`, so
the chamber renders an empty dark panel during the RSC pre-render and
mounts the canvas only after hydration.
