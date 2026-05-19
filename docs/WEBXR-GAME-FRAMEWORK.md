# WebXR Game Framework

The architectural floor of the Holoflow Studio site. Names what's
been shipped, names what's missing, gives the next agent (and the
next-but-one Dimona) a single document to read before adding a
scene.

## Why this exists

Direction, written down so the next agent can quote it:

> blender plugins, webxr game framewoirk is what wre trying to
> build i think
>
> &mdash; Dimona, 2026-05-19

The studio site reads, on the surface, like a magazine. It also
*is* a magazine. But over the last few months it has accumulated
enough spatial primitives &mdash; a dual-mode scene wrapper, a TSL
material library, a TSL post-process pack, mesh text in both
display and body register, an ambient particle field, a multi-modal
viewer-pose tracker, AR/VR chrome, a Web Worker registry, two
fully-wired WebXR reference scenes &mdash; that "magazine that
happens to have 3D bits" is no longer the honest description. The
site is a **WebXR game framework** that happens to publish a
magazine on top of itself.

This doc names that. Once it has a name, three things follow:

- A new scene becomes a *framework* concern, not a one-off. The
  conventions in section 3 are the conventions for every spatial
  thing the studio ships next.
- The missing pieces (section 5) stop being "things we'll bolt on
  when we need them" and start being framework-level work, doable
  in any order, each with a contract that the rest of the system
  can write against today.
- The Blender pipeline (section 4) becomes a thing the studio
  publishes &mdash; a documented author-side path that an
  outside contributor could follow without us at the bench.

The name is **the framework**, lowercase, plural-of-one. We don't
need a brand. The studio is the brand; the framework is the
machinery the studio ships through.

## The framework picture

Read it as a layered diagram, but flat in prose because that's how
the codebase reads.

At the floor is **the renderer**. `lib/xr-scene/dual-renderer.ts`
feature-detects `navigator.gpu`, builds a `WebGPURenderer` against
`three/webgpu` when it can, falls through to a stock
`WebGLRenderer` otherwise. Both paths enable the WebXR binding
(`renderer.xr.enabled = true`) so the same renderer survives an
Enter VR / Enter AR pill. The factory returns a small structural
`SceneRenderer` type plus two capability flags; React never has to
know the branch.

Wrapping that is `<SceneStage>` at
`components/xr-scene/SceneStage.tsx`. It's the **dual-mode scene
shell**: one R3F Canvas that runs in three view modes &mdash; 2D
monitor, WebXR VR, WebXR AR &mdash; without the scene graph
changing between them. The 2D mode reads from `useViewerPose()` so
the camera lerps toward the head-tracked pose (Kinect, Ultraleap,
MediaPipe face/hand, pointer fallback). The XR modes hand the rig
off to `XRCameraRig`, which mounts an `<XROrigin>` with thumbstick
locomotion via `useXRControllerLocomotion`. Pause + resume,
reduced-motion, recentre, GPU pill, tracking pill &mdash; all
toolbar concerns &mdash; live in `SceneToolbar`.

Inside the Canvas the **content** is a handful of conventions:

- Materials come from `lib/tsl-materials/` &mdash; a registry of 12
  TSL presets (chrome, foil, matte, glass, frosted-glass,
  holographic, anodised, waveguide-glow, painted-plastic,
  cel-shaded, skin, stone) each compiled to both WebGPU node and
  WebGL2 backends, each with a cost band, a category, and a
  one-line description.
- Post-processing comes from `lib/tsl-post/` &mdash; eleven shipped
  effects with an `xrSafe` flag the composer reads to gate effects
  that would break stereo (vignette, DoF, chromatic aberration are
  the no-gos).
- Text comes from `components/type3d/` &mdash; `MeshText3D` for
  display register, `MeshProseLayer` for body register, both
  driving troika-three-text under the hood and falling back to
  HTML when WebGPU isn't reachable.
- Backdrop comes from `components/ambient/AmbientField` &mdash; a
  TSL particle field with a WebGL2 fallback, opt-in per scene.
- Spatial chrome (brackets, reticles, depth readouts, axis
  indicators, range bars) comes from `components/ar-chrome/`.

Around the Canvas, the **page layer**:

- Parallax and tilt for the editorial chrome come from
  `hooks/useParallax.ts` and `hooks/useTiltParallax.ts`, both
  reading from a single scroll store under `lib/parallax/`.
- Workers for off-main-thread compute (search index, splat decode,
  font mesh, particle init, MediaPipe face + hand, RSS parsing)
  come from `lib/workers/` with `getWorker(kind)` as the
  singleton-getter and `pagehide` as the auto-teardown trigger.
- The magazine chrome itself sits in `components/luxe/` and the
  global tokens in `app/globals.css`'s `.lux-*` family.

The whole thing serves two viewports at once: a laptop monitor and
a WebXR headset. Neither is the fallback for the other.
`docs/SCENE-STAGE.md` is the long-form note on this. The hard
numbers per device class are in `docs/WEBXR-DEVICE-TARGETS.md` and
get summarised in section 6 below.

## Authoring conventions

What an author writes when adding a thing.

**A new scene.** A React component, client-side, that returns a
`<SceneStage>` wrapping its R3F children. The wrapper owns the
canvas; the scene owns the geometry. Lights and a camera position
go through the `<SceneStage>` props rather than into the scene
children directly so a scene can be moved between SceneStage and
another wrapper without rewriting itself. Filename pattern:
`components/<scene>/<Scene>Scene.tsx`. The route that mounts it
lives under `app/atelier/<scene>/page.tsx` (server entry) +
`app/atelier/<scene>/<scene>-client.tsx` (client mount). Example:
`components/sculpture-gallery/SculptureGalleryScene.tsx` mounted
at `app/atelier/sculpture-gallery/page.tsx`.

**A new TSL material.** Drop a file at
`lib/tsl-materials/presets/<name>.ts` exporting a const typed
`TslMaterialPreset` &mdash; an `id`, a `name`, a `category`, a
`cost`, a `backend`, a CSS `chip` swatch, a one-line
workshop-Dimona `description`, and a `build(overrides?)` factory
that mints a fresh NodeMaterial. Register by importing into
`lib/tsl-materials/index.ts` and pushing into
`ALL_MATERIAL_PRESETS`. The showcase page at
`/atelier/material-library` will pick it up. Honour the palette
tokens from `lib/tsl-materials/palette.ts` &mdash; colour fields
take `PaletteToken` strings rather than raw hex.

**A new post effect.** Drop a file at
`lib/tsl-post/effects/<name>.ts` exporting a const typed
`TslPostEffect` &mdash; a `config` block (`id`, `name`,
`description`, `xrSafe`, `cost`) and an `attach(renderer, scene,
camera, opts?)` function that registers itself and returns its
teardown. Register by importing into `lib/tsl-post/index.ts` and
pushing into `ALL_POST_EFFECTS`. The composer reads `xrSafe` to
gate the effect inside a live WebXR session.

**A new tracking source.** Drop a file at
`lib/tracking/sources/<source>.ts` exporting a const typed
`TrackingTracker` &mdash; a `source` tag, `available()`, `init()`,
`start()`, `stop()`, and `onPose(handler)`. Register by importing
into `lib/tracking/registry.ts` and either inserting into the
`FALLBACK_CHAIN` tuple or wiring the registry to consider it. The
registry walks the chain at boot, picks the first source that
declares itself available, and broadcasts a unified `ViewerPose`
to subscribers.

**A new framework primitive** (one of the missing pieces below).
Drop a file at `lib/game/<name>.ts`. Plain TypeScript, no React or
R3F coupling. Re-export from `lib/game/index.ts`. Document the
contract in this doc's section 5.

The three filename patterns &mdash; `lib/tsl-materials/presets/`,
`lib/tsl-post/effects/`, `lib/tracking/sources/`, plus now
`lib/game/` &mdash; are the surface the framework's *register and
they show up* convention runs across. Adding a thing is one file
plus one import in a barrel.

## The Blender → site pipeline

The framework's content origin point is Blender. The studio's
in-house aesthetic &mdash; faceted, flat-shaded geometry with TSL
materials doing the surface work &mdash; pushes more of the visual
weight onto the renderer than onto the polygon count, which means
the export side is small in scope but strict in its conventions.

**Units.** Blender unit = 1 m. Set the scene units to "metric"
with unit scale 1.0. Three.js reads glTF coordinates as metres
without rescaling.

**Up axis.** Author in Blender's Z-up. The glTF exporter applies
the Y-up convention transform on export when "+Y Up" is ticked.
Three.js consumes Y-up; do not also try to rotate the model on
import or you'll get a 90&deg; tip.

**Apply transforms.** Object &rarr; Apply &rarr; All Transforms
on every authored mesh before export. Unapplied scale and rotation
will export but show up at the wrong size or facing in the scene,
and the symptom looks like a "the model has the wrong pivot" bug
when it's actually unbaked scene state.

**Shading.** Flat-shade per face for the faceted look. In Edit
mode select all, Shade Flat, then optionally Shade Smooth on
individual loops you want to round (typical use: keep all crystals
faceted, smooth only the connecting nodes). The studio's
`cel-shaded` and `painted-plastic` presets respond strongly to
this choice.

**Compression.** Enable Draco mesh compression in the glTF
exporter. Default settings (level 6, quantize 14/14/12) cut a
typical scene-asset GLB to a quarter of its uncompressed size.
Three.js's `GLTFLoader` auto-detects and decodes Draco via a
worker, no extra wiring.

**Texturing.** Bake textures to KTX2 (Basis Universal) when the
texture is over 512&times;512. The Blender add-on
`io_scene_gltf2`'s built-in KTX2 path is the floor; outside that,
preprocess with `toktx` from the KTX-Software CLI. KTX2 is the
studio default for XR2+ Gen 2 class devices (Galaxy XR, Quest 3,
Pico 4 Ultra) because the micro-OLED / pancake panels punish
dithered textures &mdash; see the hard-deck doc.

**Drop point.** Save the exported `.gltf` (or `.glb`) under
`public/models/<scene>/<piece>.gltf`. The Vercel deploy serves
`public/*` as static assets at the root URL, so the path
`/models/<scene>/<piece>.gltf` becomes the public URL.

**Catalogue registration.** Each scene with a fleet of pieces
maintains a catalogue. The pattern is `lib/<scene>/catalogue.ts`
exporting an array of entries: id, title, modelUrl, scale,
description. The scene component reads the catalogue, hands each
entry to its mesh component, and a placement function (also
catalogue-side &mdash; see `lib/sculpture-gallery/gallery-layout.ts`)
lays the entries out in world-space. Adding a piece is one entry
in the catalogue plus the GLB on disk.

**Recommended Blender add-ons.** The `OPEN-SOURCE-STACK.md` doc
carries the live list; this section names what the studio has
historically leant on so a new author knows where to start.

- `io_scene_gltf2` &mdash; bundled, the only mainline exporter.
  All exports go through this. Tick "Apply Transforms" and "Use
  Draco" in the export panel.
- The studio's own Blender pipelines (see the agent skill
  `blender-pipelines`) cover the AntiGravity fabrication chain
  + Aura energy trails + Hunyuan text-to-print + Looking Glass
  quilt &mdash; not all of these export to the site, but they're
  the wider context for what Blender does in the studio.
- A studio-specific add-on for the export convention (section
  9.3) is on the roadmap. Until it ships, the convention lives in
  this doc.

## Per-device performance ceilings

The framework's hard numbers per device class. Full citations and
working in `docs/WEBXR-DEVICE-TARGETS.md`; this section is the
**budget every author has to fit inside**.

| Device | Refresh | Draw calls | Triangles | Splats | Post passes | VRAM |
| --- | --- | --- | --- | --- | --- | --- |
| Samsung Galaxy XR | 72 Hz | 300 | 400 k | 350 k | 2 | 1.2 GB |
| Google Android XR (platform-min) | 72 Hz | 300 | 400 k | 350 k | 2 | 1.2 GB |
| Valve Steam Frame (PC-stream) | 90 Hz | 800 | 1.5 M | 2 M | 4 | 4 GB |
| Meta Quest 3 | 90 Hz | 300 | 500 k | 400 k | 2 | 1 GB |
| Meta Quest 3S | 90 Hz | 300 | 500 k | 250 k | 1 | 800 MB |
| Apple Vision Pro | 90 Hz | 400 | 800 k | 600 k | 2 | 2 GB |
| Pico 4 Ultra | 90 Hz | 300 | 500 k | 400 k | 2 | 1.4 GB |

Read this as the floor, not the goal. A scene that fits Galaxy XR
(the tightest bench-relevant deck) ships on every other device.
The 2D monitor view is desktop-class and reads from whatever
budget the desktop GPU has at hand; the hard deck is for the
**WebXR session**.

A few rules that fall out of the deck:

- **Authoring rule:** Quest 3 is the daily-test target. If a scene
  doesn't sit at 90 Hz on Quest 3, it doesn't ship.
- **Post pack rule:** two passes by default. Bloom + one of the
  TSL pack. The composer reads `xrSafe` to gate stereo-hostile
  effects; do not override the gate.
- **Splat rule:** the splat walker maxes at 400 k splats inside an
  XR session on Quest-class hardware. Above that, the
  `SplatWalkScene` should swap to a lower-density variant or fall
  back to mesh proxies. The Spark loader at
  `lib/splat-walker/spark-loader.ts` is the right place to
  decide.
- **Sculpture-gallery rule:** three hero pieces in view at once
  on Quest 3. Off-screen geometry stays in the catalogue and
  pages in as the visitor walks toward it.

## The missing pieces

Honest accounting. The framework currently does not have:

**Entity / scene management.** Scenes are React-tree-local. There's
no global "current scene id" or "currently active entities"
store the way an engine like Unity or Godot has. Each scene
component owns its own state via `useState` / `useReducer` /
zustand-by-the-scene. This is fine for one-shot scenes; it bites
the moment two scenes want to share a player object, or a scene
wants to persist its world across a route navigation.

```ts
// Sketch contract for a future `lib/game/scene-manager.ts`:
type EntityId = string;
type EntityComponent = Record<string, unknown>;
type Entity = { id: EntityId; components: EntityComponent };

type SceneDef = {
  id: string;
  entities: Entity[];
  systems: Array<(world: World, dt: number) => void>;
};

type World = {
  add(entity: Entity): void;
  remove(id: EntityId): void;
  get(id: EntityId): Entity | undefined;
  query(componentKeys: string[]): Entity[];
};

function createSceneManager(): {
  load(def: SceneDef): Promise<World>;
  unload(id: string): void;
  current(): World | null;
};
```

**Input router.** Shipped today as `lib/game/input-router.ts`. See
section 7.

**Audio bus.** Shipped today as `lib/game/audio-bus.ts`. See
section 7.

**Save / load.** Game state has no first-class persistence. Today's
shipped `lib/game/game-state.ts` (see section 7) gives the per-
scene primitive; the framework still lacks a **save manifest**
&mdash; one store that knows which scenes have saves, which slot
is which, and which player owns the cloud copy.

```ts
// Sketch contract for a future `lib/game/save-manifest.ts`:
type SaveSlot = {
  id: string;
  sceneId: string;
  playerId: string;
  savedAt: number;
  /** Free-form metadata for the slot's UI (preview, summary). */
  meta: Record<string, unknown>;
};

function createSaveManifest(): {
  list(): SaveSlot[];
  get(slotId: string): SaveSlot | null;
  put(slot: SaveSlot, snapshot: unknown): Promise<void>;
  restore(slotId: string): Promise<unknown | null>;
  drop(slotId: string): void;
};
```

**State machines.** No XState, no finite-state machinery for scene
flow (intro &rarr; play &rarr; pause &rarr; menu). Today's
scenes encode their flow as React state booleans; the moment a
scene grows past three modes, that pattern stops scaling. A
small `lib/game/state-machine.ts` would carry the load without
the bundle weight of XState.

```ts
type StateName = string;
type EventName = string;

function createStateMachine<S extends StateName, E extends EventName>(def: {
  initial: S;
  transitions: Partial<Record<S, Partial<Record<E, S>>>>;
  onEnter?: Partial<Record<S, () => void>>;
  onExit?: Partial<Record<S, () => void>>;
}): {
  current(): S;
  send(event: E): boolean;
  subscribe(handler: (s: S, prev: S) => void): () => void;
};
```

**Asset preloading + LOD swap.** The framework lazy-loads on first
sight today. There's no preload manifest, no LOD swap on
visibility-with-distance, no defrag pass to reclaim VRAM when a
scene unmounts. Each scene currently handles this ad-hoc &mdash;
the splat walker disposes splats by ref, the sculpture gallery
trusts the GLB loader's reference counting, and so on.

```ts
type AssetSpec = {
  id: string;
  url: string;
  /** Mesh, texture, audio, splat. Drives the loader choice. */
  kind: "mesh" | "texture" | "audio" | "splat";
  /** Optional LOD level. Higher = lower detail. */
  lod?: number;
};

function createAssetRegistry(): {
  preload(specs: AssetSpec[]): Promise<void>;
  resolve(id: string, lod?: number): Promise<unknown>;
  release(id: string): void;
  budget(): { textureMb: number; meshMb: number; splatMb: number };
};
```

**Networking.** No WebRTC, no WebTransport, no multiplayer surface.
A multiplayer-capable scene would have to roll its own peer
connection wiring per scene, which is realistic for a one-off
experiment but not for a framework. The contract sketch:

```ts
type PeerId = string;
type Topic = string;

function createPeerBus(opts: {
  signallingUrl: string;
  topics: Topic[];
}): {
  join(peerId: PeerId): Promise<void>;
  leave(): Promise<void>;
  publish(topic: Topic, payload: ArrayBuffer): void;
  subscribe(topic: Topic, handler: (peer: PeerId, payload: ArrayBuffer) => void): () => void;
  peers(): PeerId[];
};
```

The studio's bench has a Tailscale tailnet; the realistic v1 here
is WebRTC over a small signalling broker on Vercel + a STUN
fallback. WebTransport gets the same shape once browser support
crosses the Vision Pro / Quest line.

Section 9 of this doc carries the roadmap that puts dates against
those.

## How to use the framework today

The eight-step recipe for a sculpture-gallery-style scene from
scratch. Pulls from the existing
`components/sculpture-gallery/SculptureGalleryScene.tsx` as
reference; what's below is the *minimum* the framework asks of an
author.

1. **Decide the floor + walls + lighting.** Stay inside the
   Quest-3 budget (500 k tris, 300 draw calls, 2 post passes).
2. **Author the meshes in Blender.** Apply transforms, flat-shade
   the faces you want faceted, export glTF with Draco. Drop under
   `public/models/<scene>/`.
3. **Write the catalogue.** A `lib/<scene>/catalogue.ts` exporting
   an array of `{ id, title, modelUrl, scale, description }`.
4. **Write the layout.** A pure function that takes the catalogue
   and returns world-space placements. Easy to unit-test, easy to
   reason about &mdash; see `lib/sculpture-gallery/gallery-layout.ts`.
5. **Write the scene component.** A React client component that
   reads the catalogue + layout and renders one mesh per entry
   inside `<SceneStage>`.
6. **Mount the route.** `app/atelier/<scene>/page.tsx` is the
   server entry with the magazine chrome;
   `app/atelier/<scene>/<scene>-client.tsx` mounts the scene.
7. **Wire interaction.** Construct an `InputRouter` from
   `lib/game/` for keyboard / pointer / gamepad / XR-controller
   bindings; construct an `AudioBus` for sound; construct a
   `GameState` for any persistent flags.
8. **Profile on Quest 3.** Daily-test target. ADB + remote
   debugger over USB; check the SceneStage toolbar's GPU pill +
   the frametime overlay; fix what's outside budget before
   merging.

A 12-line sketch (TypeScript pseudo-code, abridged from the
sculpture-gallery scene):

```tsx
"use client";
import SceneStage from "components/xr-scene/SceneStage";
import { CATALOGUE } from "lib/my-scene/catalogue";
import { layout } from "lib/my-scene/layout";
import { createAudioBus, createGameState, createInputRouter, DEFAULT_ACTION_MAP } from "lib/game";

export function MyScene() {
  const slots = layout(CATALOGUE);
  return (
    <SceneStage label="My scene" webxr ambient camera={{ fov: 45 }}>
      {slots.map((slot) => <Piece key={slot.id} {...slot} />)}
    </SceneStage>
  );
}
```

`Piece` is the per-entry mesh component; it loads the GLB, attaches
a TSL material preset, and registers pointer-over handlers that
the input router can read.

## The OSS catalogue

The framework leans on, in order of weight:

- **Three.js** (`^0.171`) &mdash; the WebGL/WebGPU base. Every scene
  is a Three scene; every renderer is one of Three's renderers.
- **@react-three/fiber** (`^9.0`) &mdash; the React renderer for
  Three. SceneStage is an R3F Canvas under the hood.
- **@react-three/xr** (`^6.6`) &mdash; the WebXR session helpers.
  `createXRStore`, `XR`, `useXR`, `XROrigin`,
  `useXRControllerLocomotion`, `TeleportTarget`.
- **@react-three/drei** (`^10.0`) &mdash; OrbitControls, helpers,
  preload utilities.
- **TSL** (Three's Shading Language, in `three/webgpu`) &mdash; the
  language all 12 material presets and 11 post effects are
  authored in.
- **troika-three-text** (`^0.52`) &mdash; SDF text in a Three scene.
  Powers `components/type3d/MeshProseLayer.tsx` and the body
  register of `MeshText3D`.
- **@mediapipe/tasks-vision** (`^0.10.35`) &mdash; face + hand
  landmark inference for the webcam-side tracking sources.
- **@sparkjsdev/spark** (`^0.1.10`) &mdash; the Gaussian-splat
  renderer the splat walker mounts.

`docs/OPEN-SOURCE-STACK.md` is the canonical, append-only roll
call. Update that doc in the same commit that adds a dependency to
`package.json`.

## The reference implementations

Five routes that demonstrate the framework end-to-end. Read in
this order &mdash; minimal &rarr; rich.

**`/atelier/scene-stage-demo`** &mdash; the minimal SceneStage
tour. Four objects, four TSL presets, the ambient particle field
on, all three view modes wired. This is the canonical "what does
SceneStage give me" page; the source is at
`app/atelier/scene-stage-demo/scene-stage-demo-client.tsx` and is
deliberately short.

**`/atelier/material-library`** &mdash; every TSL preset rendered
on a shared geometry under shared lighting. The page reads
`ALL_MATERIAL_PRESETS` and emits one card per preset. Good for
comparing presets and for spotting a regression after a TSL
upgrade.

**`/atelier/postprocess-lab`** &mdash; every TSL post effect with
a toggle and a parameter strip. Reads `ALL_POST_EFFECTS`. The
`xrSafe` chip on the disabled effects is the framework's honesty
chip &mdash; the gate is there because stereo comfort matters,
not because the effect can't render.

**`/atelier/splat-walk`** &mdash; the WebXR splat walker. Mounts a
Spark `SplatMesh`, a teleport target on an invisible ground
plane, and the SceneStage chrome. The splat is loaded via the
`splat-decode.worker.ts` so the main thread keeps the frame loop
ticking. Source at `components/splat-walker/SplatWalkScene.tsx`.

**`/atelier/sculpture-gallery`** &mdash; the multi-piece gallery
with teleport, hover popovers, the Bloom post pass gated on the
non-XR path, and the catalogue + layout pattern. The richest end-
to-end example; the source is the closest the framework has to a
"full game" reference.

## Roadmap

In rough order. Each line is a framework-level body of work, not a
single PR.

- **Ship the missing primitives in `lib/game/`.** Today: input-
  router, audio-bus, game-state. Next: scene-manager (with a
  minimal world / entity / component shape; not a full ECS),
  state-machine, save-manifest, asset-registry, peer-bus.
- **A scene authoring template.** `pnpm create holoflow-webxr-game`
  style. Scaffolds a new scene with the conventions baked in &mdash;
  catalogue, layout, scene component, route, README. The same
  conventions section 3 documents, automated.
- **A Blender add-on for the studio's export conventions.** The
  add-on enforces apply-transforms, sets the gltf2 exporter
  preset to Draco + KTX2, validates the model is inside the per-
  device budget before it lets you export, and writes the
  catalogue entry directly into the right `lib/<scene>/`
  directory. Names the file pattern instead of relying on the
  author to remember.
- **A formal entity-component plug-in path.** Either R3F + zustand
  in the shape of `lib/game/scene-manager.ts` above, or a small
  custom ECS in plain TypeScript. The choice waits until two more
  scenes demand multi-entity bookkeeping &mdash; until then, the
  cost outweighs the simplicity.
- **A spatial audio bus over Web Audio + HRTF.** Shipped today as
  `lib/game/audio-bus.ts`. Next: a per-scene mixer with named
  buses (sfx, music, ambience), and a Loudness Equivalent Mean
  (LUFS) meter for the publish-side compliance check.
- **A networking layer.** WebRTC for the first multiplayer scene
  (peer-to-peer through a small signalling broker on Vercel),
  WebTransport once browser support crosses the Vision Pro /
  Quest line.

The roadmap is intentionally short. Each item has a contract in
section 5; the contract is the thing to commit to first.

---

This doc dates 2026-05-19. Update it the day a primitive ships,
the day a scene becomes a reference, the day a device's hard deck
moves. The framework is the studio's spatial infrastructure; this
doc is how the rest of the team finds out what it is.
