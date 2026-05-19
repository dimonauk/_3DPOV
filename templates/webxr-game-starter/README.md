# WebXR Game Starter

Minimal scaffold for a WebXR game built on the Holoflow Studio
framework primitives. A 4&times;4 m room, three pickups, a HUD that
counts them and a timer that stops when the run is in. Fork it, edit
it, ship a game.

This is the smallest thing that demonstrates the studio's WebXR game
shape without pretending to be a game. Replace the meshes, change the
pickup logic, add an audio bus, deploy.

## What it leans on

Framework primitives the starter consumes:

- `lib/game/input-router.ts` &mdash; rising-edge action router that
  merges pointer / keyboard / gamepad / XR-controller input into one
  named-action stream. Used here for `interact` and `menu`.
- `lib/game/game-state.ts` &mdash; vanilla-TS store with a tiny API
  (`get` / `set` / `subscribe` / `save` / `load` / `reset`) and a
  localStorage save handle. The starter constructs one instance in
  `state.ts` and exposes the typed `GameStateShape`.
- `lib/game/audio-bus.ts` &mdash; Web Audio + HRTF spatial-audio bus.
  Not imported by the starter today; the in-template README documents
  the one-line wiring when you add a pickup sound effect.
- `components/xr-scene/SceneStage.tsx` &mdash; the dual-mode
  (WebXR + 2D) scene wrapper. Auto-detects WebGPU, falls back to
  WebGL2, opens VR / AR sessions from its toolbar.

Architectural notes for the framework live in
`docs/WEBXR-GAME-FRAMEWORK.md`.

## How to fork

1. Copy the directory:

   ```bash
   cp -R templates/webxr-game-starter apps/<your-slug>
   ```

   The starter intentionally has no `package.json` of its own &mdash;
   it inherits the main one. When this template gets cut as a
   standalone `pnpm create holoflow-webxr-game` scaffolder, a
   `package.json` with explicit dependency pins will land then. Until
   that day, your fork lives inside this monorepo and uses its
   dependency tree.

2. Rename the metadata and the route slug:
   - `templates/webxr-game-starter/page.tsx` &rarr; replace the
     `metadata.title`, the `<h1>`, and the intro paragraph.
   - `templates/webxr-game-starter/route.ts` &rarr; replace
     `TEMPLATE_ROUTE` with your route.
   - Create `app/<your-slug>/page.tsx` that re-exports your forked
     `page.tsx` (see step 1 in `route.ts` for why this dance).

3. Replace the floor and pickups in `scene.tsx`. Wire your win
   condition. Ship.

## File map

```text
templates/webxr-game-starter/
  README.md         What you are reading.
  README-INSIDE.md  "How to author your first level" once you fork.
  page.tsx          Server component &mdash; chrome, intro, mounts the shell.
  client-shell.tsx  Client component &mdash; mounts SceneStage + HUD + Restart.
  scene.tsx         The R3F scene graph &mdash; floor, props, pickups, win check.
  state.ts          Game state &mdash; pickup count, start / finish timestamps.
  inputs.ts         Action bindings &mdash; interact, menu.
  route.ts          Route-registration notes (NOT a Next route handler).
```

And the routing stub that makes the template reachable from the dev
server:

```text
app/templates/webxr-game-starter/page.tsx
  Five-line server component that re-exports templates/.../page.tsx
```

## Run it inside the repo

From the repo root:

```bash
pnpm dev
```

Then open <http://localhost:3000/templates/webxr-game-starter>.

WASD does nothing in the 2D view (no first-person controller is
mounted in the starter &mdash; that is a level-authoring choice your
fork makes). Use the canvas's orbit controls to fly the camera near a
pickup, then hit the `Space` key to collect. In VR, the controller
trigger is `interact` and the thumbstick-press is `menu`.

The HUD updates each tick. The Restart button resets the store and
re-mounts the scene.

## Future

When this template matures and stabilises:

- Cut as a `pnpm create holoflow-webxr-game <slug>` scaffolder with
  its own `package.json` (pinned deps), a `gitignore`, and a CLI
  prompt for the slug, title, and pickup count.
- Bundle a Vercel deploy button that takes the fork live in one
  click, with the env vars left empty for the operator to fill in.
- Ship a sibling template &mdash; `webxr-game-multiplayer-starter`
  &mdash; that wraps the same primitives with a Yjs-or-PartyKit
  session-shared state layer.

Each of those is a follow-up. The starter itself stays small.
