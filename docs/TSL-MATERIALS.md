# TSL Materials

A catalogue of TSL (Three Shading Language) material presets in the
studio palette. One named id, one `build()` call, a NodeMaterial you
can hang on a mesh.

This exists because every WebGPU scene on the site wanted the same
twelve materials, kept reimplementing them in slightly different
ways, and drifted off-palette every time. The library is the single
place where "the studio chrome look", "the foil sweep", "the glow
ring on a gyroid" actually lives.

The standing direction is WebXR + WebGPU + TSL first, with 2D and
WebGL2 as honest fallbacks. Every preset compiles to both backends
unless the `backend` field says otherwise.

## Where things live

| File                                          | What                                         |
| --------------------------------------------- | -------------------------------------------- |
| `lib/tsl-materials/palette.ts`                | Hex map + `paletteColor(token)`. Source of truth. |
| `lib/tsl-materials/types.ts`                  | `TslMaterialPreset` shape.                    |
| `lib/tsl-materials/internal.ts`               | Shared loaders for three / three/webgpu / three/tsl. |
| `lib/tsl-materials/presets/*.ts`              | One file per preset, < 200 lines each.        |
| `lib/tsl-materials/index.ts`                  | Barrel + `getMaterialPreset(id)` + `ALL_MATERIAL_PRESETS`. |
| `components/tsl-materials/MaterialChip.tsx`   | CSS-only swatch for editorial.                |
| `app/atelier/material-library/page.tsx`       | Live spinning-sphere showcase.                |

The palette mirrors the tokens in `app/globals.css`. If a swatch
shifts there, mirror the change in `palette.ts` in the same commit.

## The presets

Twelve presets, four categories:

**Metal** — `chrome`, `foil`, `anodised`.
**Glass** — `glass`, `frosted-glass`.
**Glow** — `holographic`, `waveguide-glow`.
**Plastic** — `painted-plastic`, `cel-shaded`.
**Fabric** — `matte`.
**Skin** — `skin`.
**Stone** — `stone`.

The cost band on each (`cheap` / `moderate` / `expensive`) tells you
how many you can scatter through a scene before frame budget bites.
Roughly:

- `cheap` — fine in any quantity. Constant uniforms, no fragment-side
  TSL graph.
- `moderate` — handful per scene. Has a small TSL colour graph
  (foil sweep, cel ramp, stone noise).
- `expensive` — one or two hero meshes. Transmission, fresnel +
  tonemap, full PBR with clearcoat.

## Authoring template

A new preset is one file in `lib/tsl-materials/presets/` plus one
import + push in `index.ts`. Stay under 200 lines.

```ts
import { paletteColor, type PaletteToken } from "../palette";
import type { TslMaterialPreset, TslMaterialOverrides } from "../types";
import { loadNodeMaterials, loadThree } from "../internal";

const DEFAULT_COLOR: PaletteToken = "pink-200";

function build(overrides?: TslMaterialOverrides): unknown {
  const THREE = loadThree();
  const NM = loadNodeMaterials();
  const params = {
    color: new THREE.Color(paletteColor(overrides?.color ?? DEFAULT_COLOR)),
    metalness: overrides?.metalness ?? 0.5,
    roughness: overrides?.roughness ?? 0.3,
  };
  if (NM?.MeshStandardNodeMaterial) {
    return new NM.MeshStandardNodeMaterial(params);
  }
  return new THREE.MeshStandardMaterial(params);
}

export const yourPreset: TslMaterialPreset = {
  id: "your-preset",
  name: "Your Preset",
  category: "metal",
  description: "One sentence in workshop voice.",
  cost: "moderate",
  backend: "dual",
  chip: "linear-gradient(135deg, #ffc4d9, #cfb7ff)",
  build,
};
```

Header comment names the inspiration / canonical reference. If the
preset uses an animated uniform, expose it as `phaseUniform` on the
returned material so the SceneStage wrapper (and the showcase page)
can tick it.

## WebGL fallback policy

TSL mostly compiles to both backends through Three's node-material
backend, and you should aim for `backend: "dual"` whenever the visual
holds up on WebGL2 at sub-millisecond cost.

Flag a preset `webgpu-only` when:

1. The fragment graph needs `mx_noise_float` at high octaves, or
   multi-stage fresnel + tonemap. Compiles on WebGL2, but the shader
   cost is non-trivial on integrated GPUs.
2. The look depends on a transmission / volumetric node not yet on
   the WebGL2 node backend.

For both cases write a static-uniform fallback into `build()` that
runs through vanilla `MeshStandardMaterial` / `MeshPhysicalMaterial`.
Same intent, different mechanism. The scene shouldn't fall apart on a
Quest 2 just because the iridescence isn't moving.

## Perf budgets

Targets for a 12-preset showcase grid running at 60 fps in Chrome on
a mid-range laptop:

- `cheap` preset, 1 sphere, 1 light → < 0.4 ms / frame.
- `moderate` preset, same → < 0.9 ms / frame.
- `expensive` preset (glass, holographic, waveguide-glow) → < 1.8 ms
  / frame each. Two on screen at once is the sensible ceiling for
  XR.

The showcase page (`/atelier/material-library`) is the canary. If a
preset misses budget, profile in the Three.js Inspector — usually
either a redundant fresnel node or an unbounded `pow` exponent.

## Composing with SceneStage

`SceneStage` (in `components/xr-scene/SceneStage.tsx`) ships a
preset wrapper at `lib/xr-scene/tsl-presets.ts` covering the original
four (`chrome`, `foil`, `matte`, `glass`) with a
`{ material, tick, dispose }` envelope and reduced-motion handling.
That stays — extends with the same id space as this library, so a
`buildPreset("chrome")` and `getMaterialPreset("chrome")` return the
same look.

For anything beyond the four (holographic, anodised, etc.), call
`getMaterialPreset(id)?.build(overrides)` directly. You own the
disposal — call `material.dispose()` in the cleanup arm of the
effect that mounted the mesh.

Reduced-motion: animated presets (`foil`, `holographic`) expose a
`phaseUniform` field. Don't tick it when
`matchMedia("(prefers-reduced-motion: reduce)").matches` is true.
The showcase page is the reference implementation.

## Adding a colour token

If you need a colour that's not already in `palette.ts`:

1. Add the CSS token to `app/globals.css` (`@theme` block).
2. Mirror it in `paletteHex` in `lib/tsl-materials/palette.ts`.
3. Update `PaletteToken` will widen automatically.
4. Reference by token name, never by raw hex, in your preset.

This keeps the swatches in the showcase and the materials in the
scene reading the same numbers.

## What this library is not

Not a shader playground — for that, see `app/atelier/shape-of-it/`.
Not a VRM material library — VRM uses MToon which has its own
character-rig–aware lighting. The `cel-shaded` preset here matches
MToon's main-light-direction convention so a cel-shaded prop in
front of an Aura VRM holds together, but the avatar itself stays on
MToon.
