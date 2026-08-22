# Procedural Woven Fabric — Wave Interlace + Principled BSDF v2 Sheen

**Blender 5.1 · Shading · CC0**

A fully procedural plain-weave textile shader built from Wave Texture nodes,
a Math-chain interlace gate, and the Sheen lobe of Principled BSDF v2.
No image textures, no UV painting — the over/under thread structure emerges
entirely from node arithmetic.

## Quick start

```bash
blender --background --python blueprint.py
```

Produces `woven_fabric.blend` (same directory) and
`public/library/glbs/shading/shader-procedural-woven-fabric/woven_fabric.glb`.

## How it works

### Thread profiles

Two `ShaderNodeTexWave` nodes (both `BANDS`, `SIN` profile) read from the
mesh's UV map.  `Wave_warp` has `bands_direction = 'X'` — its sinusoidal bands
repeat along the U axis, modelling the vertical warp threads.  `Wave_weft`
uses `bands_direction = 'Y'` for the horizontal weft.  `Scale = THREAD_COUNT`
(default 20) places 20 complete thread-and-gap cycles across [0, 1] UV range.

### Interlace gate

```
gate = MODULO( FLOOR(U × N) + FLOOR(V × N),  2 )
     = 0.0  (weft thread on top)
     = 1.0  (warp thread on top)
```

`FLOOR(U × N)` gives the integer column index of the current UV cell;
`FLOOR(V × N)` gives the row index.  Their sum modulo 2 produces a
checkerboard of 0s and 1s across the weave grid — exactly the alternating
over/under structure of a plain weave.

### Bump height

```
height = wave_warp.Fac × gate  +  wave_weft.Fac × (1 − gate)
```

In a gate=1 cell the warp thread carries its full sinusoidal height;
the weft thread is suppressed to 0 (it is passing beneath).  In a gate=0
cell the roles reverse.  The `Bump` node converts this height field into
perturbed normals for the BSDF.

### Sheen

Principled BSDF v2 (Blender 4.0+) exposes `Sheen Weight` and `Sheen Roughness`.
The Sheen lobe is an Ashikhmin retroreflection approximation — it peaks when
the viewing direction grazes the surface at a shallow angle, which is exactly
when real micro-fibres scatter light back toward the camera (retroreflection).
Setting `Sheen Weight = 0.0` makes the shader read as textured plastic.

## Parameters

| Name | Default | Notes |
|------|---------|-------|
| `THREAD_COUNT` | 20 | Thread pairs per UV unit |
| `DISTORTION` | 0.08 | Wave irregularity (handwoven look) |
| `FOLD_AMP` | 0.14 m | Sinusoidal fold depth of the cloth panel |
| `WARP_COLOUR` | off-white | Vertical thread colour |
| `WEFT_COLOUR` | warm tan | Horizontal thread colour |
| `SHEEN_WEIGHT` | 0.88 | Micro-fibre retroreflection intensity |
| `SHEEN_ROUGHNESS` | 0.28 | Fine = tight fibres; coarse = velvet |

## GLB / WebXR notes

The GLB exporter maps `Sheen Weight` → `KHR_materials_sheen.sheenColorFactor`
and `Sheen Roughness` → `sheenRoughnessFactor`.  Three.js r152+ reads both
via `MeshPhysicalMaterial`.

## Licence

Blueprint, record script, and all authored files: **CC0 1.0 Universal**.
