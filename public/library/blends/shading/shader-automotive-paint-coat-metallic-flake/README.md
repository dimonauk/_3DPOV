# Automotive Paint — Principled BSDF v2 Three-Layer Coat + Metallic Flake

**Blender**: 5.1  
**Engine**: Cycles (primary) / EEVEE Next (with caveats — see below)  
**Topic**: Shading  
**Difficulty**: Intermediate–Advanced  
**Time**: 1.5–2.5 hours

## What this builds

A procedural automotive paint material replicating the optical behaviour
of real metallic car paint: a pigmented base coat, a suspended metallic
flake layer, and a glass-like clear coat lacquer — all within a single
Principled BSDF v2 node.

The material is resolution-independent (no image textures) and exports
correctly to GLB via the `KHR_materials_clearcoat` extension, which Three.js
and all modern WebXR runtimes understand.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full Blender Python build script — mesh + shader + lights + export |
| `record.py` | Orbiting camera viewport animation (outputs `viewport.mp4`) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the tutorial screen capture |
| `.expected-artefacts.json` | CI-style artefact manifest |

**Outputs produced** (after running scripts):

- `automotive_paint.blend` — the complete Blender file
- `automotive_paint.glb` — WebXR-ready export with KHR_materials_clearcoat
- `viewport.mp4` → `public/library/videos/shading/.../viewport.mp4`

## How to run

```bash
# Open Blender 5.1, then in the Scripting workspace:
# 1. Open blueprint.py → Run Script
# 2. Open record.py    → Run Script  (requires blueprint.py to have run first)
```

## Key concepts

### Why three layers instead of one Principled BSDF?

Physically, automotive paint IS three optical layers stacked. Blender's
Principled BSDF v2 models them all within one node:

- **Base Color + Roughness** → the pigment base coat (high roughness, no metal)
- **Metallic socket** (driven by a thresholded Noise Texture) → the flake layer
- **Coat Weight / IOR / Roughness** sockets → the clear coat lacquer

The Coat layer is evaluated *after* the base + flake sub-surface, matching
the physical light path: photons enter through the coat, scatter at the base,
and the coat reflects its own specular lobe on top.

### The CONSTANT Color Ramp

Setting the Color Ramp interpolation to `CONSTANT` (instead of `LINEAR`)
produces a hard threshold: pixels are either 100 % metallic (flake) or 0 %
(base coat). This is physically correct — in reality each flake is a discrete
particle, not a soft gradient.

### Bump node for sparkle

A second, independent Noise Texture feeds a Bump node wired to the Normal
socket. Each flake's surface normal is tilted by a different random amount,
so each flake reflects the key light toward a different camera angle.
Orbiting the camera causes individual flakes to ignite and extinguish —
the defining visual character of metallic automotive paint.

The two noise textures share the same scale (88) but differ in `W` offset
(0.27 on the orientation noise). This decouples coverage from orientation:
a visible flake (coverage = 1) does not necessarily have the maximum tilt,
which prevents aliasing artefacts at the flake boundaries.

## EEVEE Next caveats

The coat + flake interaction relies on multi-bounce specular. EEVEE Next with
Screen-Space Ray Tracing enabled approximates it acceptably, but the flake
micro-highlights in the sub-coat layer are suppressed because SSR only traces
a single screen-space bounce. For hero renders use Cycles. For real-time WebXR
previews EEVEE is fine — the coat highlight dominates at typical viewing distances.

## WebXR / Three.js export

The GLB exporter writes `KHR_materials_clearcoat` when Coat Weight > 0.
In Three.js, this maps to:

```js
material.clearcoat          = 1.0
material.clearcoatRoughness = 0.018
// KHR_materials_clearcoat_ior (draft extension — IOR not yet in core)
// Falls back to IOR 1.5 by default in THREE.MeshPhysicalMaterial.
```

The metallic flake mask is NOT automatically baked into a texture on export.
To get per-texel metallic variation in Three.js, bake the shader to a
`MetallicRoughness` texture (see the Texture Baking Normal/AO tutorial).

## Licence

CC0 1.0 Universal — Holoflow Studio. No rights reserved.

## Outside sources

- **Google Filament BRDF Reference** (Apache 2.0)
  — https://google.github.io/filament/Materials.md.html
  — Layered materials section (clearcoat model definition)
- **PBR Book 4th Ed. — Chapter 9: Reflection Models**
  — https://www.pbr-book.org/4ed/Reflection_Models
  — Conductor + dielectric Fresnel equations underlying the coat/flake model
