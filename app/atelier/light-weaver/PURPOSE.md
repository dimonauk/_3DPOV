# `/atelier/light-weaver` — Light Weaver chamber

## What this is

A live composer for woven light. The visitor's mouse drives a
luminous head; the head leaves a camera-facing ribbon trail through
3D space; the ribbon is shaded by a pickable trail shader (flame,
plasma, aurora, mycelium, ink, neon). With autoplay on, the head
describes a figure-8 — the fundamental weave — and the trail draws
itself. Pick a tip geometry. Pick a shader. Watch the weave.

Twelve years of poi practice, lifted out of the prop and into the
browser as a draw tool.

## Where it sits

Sibling to:

- **[Lightpainting Forge](/atelier/lightpainting-forge)** — a long-
  exposure light trail becomes a printable mesh. Forge takes a
  trail-as-photograph and lifts it to mass.
- **[Poi Sculptor](/atelier/poi-sculptor)** — twenty-one parametric
  poi-flow moves rendered as printable GPU sculpture. Sculptor is the
  parametric solid; Weaver is the live composer.

Weaver is the lightest of the three: no segmenter, no mesh export, no
parametric library. Just the trail vocabulary, live, in the browser.

## Source

Ported from `D:/The_Hangar/apps/Light_Weiver/` — the bench app that
hosts the full game (zones, kata, sister system, agents). For this
chamber the game systems are dropped; only the trail composer
remains. The shader library was lifted from
`apps/Light_Weiver/src/input/TrailShaders.ts` (six of twenty-five
shaders ported; rest available to graduate in if visitors ask for
them).

Note on the source folder name: the bench app folder is misspelled
"Light_Weiver". The chamber here uses the correct "Light Weaver"
spelling in slug, metadata, and all user-facing labels.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | Next.js 15 App Router | site standard |
| 3D | React Three Fiber + three.js | already in package.json |
| Trail material | `THREE.ShaderMaterial` (vanilla GLSL) | source app's shaders are GLSL, not TSL |
| Trail geometry | `BufferGeometry` quad strip, camera-facing | ported `TrailRibbon` from source |
| State | React local state | no Zustand needed; nothing crosses chamber boundary |
| Logger | `createLogger("atelier:light-weaver")` | site convention |

No new dependencies. `three.meshline` from the bench app is not
ported — the ribbon class alone gives a clean look and avoids
adding a dep that's not already in the site.

## File map

| File | Role |
|---|---|
| `page.tsx` | Server component, metadata, hero copy, footer |
| `light-weaver-client.tsx` | `"use client"` — Canvas, controls, shader library, TrailRibbon |

## What it ISN'T

- **Not a mesh exporter** — that's Lightpainting Forge's job.
- **Not WebGPU / TSL** — the source shaders are WebGL fragment
  shaders. Keeping them as ShaderMaterial avoids a TSL rewrite for
  no visual gain.
- **Not the game** — no zones, no kata recogniser, no sister system,
  no agents. Those stay in the bench app.
- **Not a poi move library** — that's Poi Sculptor's job. Autoplay
  here is a single figure-8 path; the chamber is the composer, not
  the catalogue.

## Verify

Dev: `pnpm dev` from `D:/.github/_3DPOV/`; chamber lives at
`/atelier/light-weaver`.
