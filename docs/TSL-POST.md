# TSL Post

A small pack of post-process effects authored in TSL, with a
`postprocessing` fallback under each one. One named id, one `attach`
call, a teardown returned so the composer can drop it cleanly.

This exists because every R3F scene on the site wanted bloom and grain,
then someone wanted a vignette on a flat-screen hero, then someone
wanted DoF on a product page, and they all reimplemented the chain
differently. The pack is the single place where the studio's post
chain lives — and the only place where the XR-safety policy is
enforced.

The standing direction is WebXR + WebGPU + TSL first, with 2D and
WebGL2 as honest fallbacks. Every effect attaches to both renderers;
the TSL path runs when the renderer is a `WebGPURenderer`, the
`postprocessing` path runs when it is a plain `WebGLRenderer`.

## Where things live

| File                                          | What                                         |
| --------------------------------------------- | -------------------------------------------- |
| `lib/tsl-post/types.ts`                       | `TslPostEffect`, `TslPostEffectConfig`.       |
| `lib/tsl-post/effects/*.ts`                   | One file per effect, < 200 lines each.        |
| `lib/tsl-post/composer.ts`                    | `attachStack({ stack, renderer, scene, camera, xrActive })`. |
| `lib/tsl-post/index.ts`                       | Barrel, `ALL_POST_EFFECTS`, `XR_SAFE_EFFECTS`, `getPostEffect(id)`. |
| `components/tsl-post/PostStackControls.tsx`   | Chip-row UI for toggling effects.             |
| `app/atelier/postprocess-lab/page.tsx`        | Live showcase.                                |

The palette tokens used for tinting come from `lib/tsl-materials/palette.ts`
— the same hex table the materials pack reads. If a swatch shifts there,
mirror it in the same commit.

## The effects

Thirteen shipped:

**Tonal** — `bloom`, `god-rays`.
**Screen-anchored** — `foil-sheen`, `scan-lines`, `film-grain`, `paper-grain`.
**Grading** — `cel-post`, `dither-bayer`.
**Optical** — `vignette`, `chromatic-aberration`, `dof`.
**Structural** — `outline`, `pixelate`.

| id                     | XR    | Cost      | When to use                                                          |
| ---------------------- | ----- | --------- | -------------------------------------------------------------------- |
| `bloom`                | safe  | moderate  | The waveguide glow on emissive trails.                               |
| `foil-sheen`           | safe  | cheap     | The `.lux-foil` sweep, but in the render.                            |
| `film-grain`           | safe  | cheap     | Break up too-clean plates. Cap at 0.05 amp.                          |
| `paper-grain`          | safe  | cheap     | Print-page texture. Static, warm-tinted. Cap at 0.4 intensity in XR. |
| `dither-bayer`         | safe  | cheap     | Risograph / print-zine quantise. Cap at 8+ levels in XR.             |
| `god-rays`             | safe  | expensive | A single bright source carrying the frame.                           |
| `cel-post`             | caveat| moderate  | Posterise + Sobel — VRM cel look.                                    |
| `scan-lines`           | safe  | cheap     | CRT recovered-footage on archival scenes.                            |
| `pixelate`             | safe  | cheap     | The block-grid wireframe-as-cover look.                              |
| `outline`              | safe  | moderate  | Selection silhouette for a featured mesh.                            |
| `vignette`             | 2D    | cheap     | Focus on centre. Skipped in XR.                                      |
| `chromatic-aberration` | 2D    | cheap     | RGB split for cinematic stills only.                                 |
| `dof`                  | 2D    | expensive | Bokeh blur. XR wants foveation, not this.                            |

Folded in 2026-05-19 (OSS shader survey pass):

- `paper-grain` — static two-octave `mx_noise_float` overlay with a faint warm tint (Three.js examples MIT pattern). Pairs with `dither-bayer` for the printed-page look.
- `dither-bayer` — ordered Bayer-1973 threshold dither (public-domain algorithm). Risograph / print-zine quantise. Cheap, XR-safe at 8+ levels.

`safe` means the composer attaches it inside a WebXR session.
`caveat` means it attaches but the operator should know about
edge-stability drift. `2D` means the composer skips it.

## XR-safety policy

The whole point of XR is that each eye sees a slightly different image,
and the brain fuses them into depth. Post-process effects that break
that fusion cause real, documented discomfort:

- **Vergence-accommodation conflict** — the eyes converge at the
  rendered depth of an object but accommodate (focus) at the headset's
  fixed focal plane. Software DoF that forces a second focus on top
  worsens this. (Hoffman, Girshick, Akeley & Banks 2008,
  _"Vergence–accommodation conflicts hinder visual performance and
  cause visual fatigue"_, J. Vision 8(3):33.)
- **RGB channel split** — chromatic aberration in a flat-screen
  cinematic still reads as a lens artefact; in stereo, the extra
  per-channel displacement breaks the fusion cue. The Stanford VHIL
  guidance (2019) lists this among the high-incidence fatigue
  triggers in a 30-minute session.
- **Edge-anchored frame masks** — vignettes that pull the corners in
  cause partial-FOV tunnel vision; reports of vertigo in subjects with
  vestibular sensitivity are common on sessions longer than 5 minutes.

The composer enforces this by checking `config.xrSafe` against the
caller's `xrActive` flag and silently skipping the unsafe effects.
The chips in `PostStackControls` show a "2D ONLY" pill so the operator
can see which ones were dropped.

`cel-post` is the one caveated effect — the Sobel kernel reads
neighbouring pixels in screen space, so the outlines drift between
eyes by a few pixels on near objects. Most users do not notice; a
minority report eye strain on long sessions. The composer attaches it
in XR by default; the operator can opt out from the chip UI.

## WebGL2 fallback policy

Every effect ships a `postprocessing` fallback. The fallback is not
expected to match the TSL path pixel-perfectly — postprocessing's
bloom uses a Kawase blur where TSL uses a mipmap chain, and the
spectra differ at the highlights. The fallback is the honest substitute
for browsers without WebGPU, not a parity contract.

When the TSL path fails (renderer shape check fails, dynamic require
throws, the bloom symbol is missing on the active three build), the
effect falls forward to the `postprocessing` path. When both fail, the
effect logs a warning and the `attach` returns a no-op teardown so the
composer keeps moving.

`dof`, `outline` and `god-rays` are `postprocessing`-only — the TSL
nodes for depth-of-field, outline and god-rays have been unstable
across the 0.169 → 0.171 window the site sits on, and the battle-
tested WebGL implementations cover both backends because the
`postprocessing` composer only needs the renderer's `.render` method
which both backends implement.

## Composition order

`ALL_POST_EFFECTS` is frozen in the recommended order:

1. **Grading** (`cel-post`) — quantise first, before bloom widens the
   highlights and ruins the bands.
2. **Tonal** (`bloom`, `god-rays`) — operate on the graded frame.
3. **Screen-anchored** (`foil-sheen`, `scan-lines`, `film-grain`) —
   overlay on the tonally-graded frame.
4. **Optical artefacts** (`chromatic-aberration`, `vignette`, `dof`) —
   simulate the lens, last.
5. **Structural** (`outline`, `pixelate`) — applied at the very end
   when the operator wants a hard treatment over the whole stack.

Effects stacked outside this order still work; this is the default
the showcase mounts with.

## Perf budgets

- A typical desktop GPU running WebXR at 90Hz has roughly 11ms per
  frame to ship a stereo pair. Each pass on a 1440×1600-per-eye target
  costs roughly 0.4–0.6ms for the cheap band, 1.5–2.0ms for moderate,
  and 3–5ms for expensive.
- Budget: aim to keep the stacked post under 4ms in XR. That is
  comfortably one `bloom` plus one screen-anchored effect, or one
  `god-rays` alone, with headroom for the scene's own draw.
- The `cost` band on each chip in the controls UI is the early-warning
  signal. Three expensive chips on at once will drop frames on most
  laptops.

## Authoring template

Each effect is a single file under `lib/tsl-post/effects/`. The shape:

```ts
import { createLogger } from "lib/log";
import type { TslPostEffect } from "../types";

const log = createLogger("tsl-post:your-effect");

export const yourEffect: TslPostEffect = {
  config: {
    id: "your-effect",
    name: "Your effect",
    description: "One workshop-Dimona sentence.",
    xrSafe: true,
    cost: "cheap",
  },
  attach: (rawRenderer, rawScene, rawCamera, opts) => {
    return tryTsl(rawRenderer, rawScene, rawCamera, opts)
        ?? tryPp(rawRenderer, rawScene, rawCamera, opts)
        ?? (() => undefined);
  },
};
```

`tryTsl` returns `null` when the renderer is not a WebGPURenderer or
when the dynamic require throws; the composer then walks to `tryPp`.
Both return a teardown. The composer runs teardowns in reverse so
partial state cleans up predictably.

Register the new effect in `lib/tsl-post/index.ts` — import, push into
`ALL_POST_EFFECTS` at the right ordering slot, re-export.

Add it to the table above.
