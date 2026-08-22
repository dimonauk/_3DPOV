# Möbius Strip N-Twist Parametric Mesh

**Topic**: Python mathutils — Möbius Strip N-Twist: Non-Orientable Surface, Half-Twist Seam & Solidified WebXR GLB  
**Blender version**: 5.1  
**Licence**: CC0  
**Output**: `hf_mobius.blend`, `hf_mobius.glb`

## What it does

`blueprint.py` constructs a Möbius strip (or N-twist generalisation) directly from
the parametric equations using pure Python + numpy arithmetic, then builds the mesh
via `bpy.data.meshes.from_pydata`.  The seam at θ = 2π is closed with a j-index
reversal for odd N, encoding non-orientability in mesh topology rather than in
vertex positions.

The script optionally solidifies the surface into a print-ready shell
(`THICKNESS = 0.022 m`), applies a two-tone material driven by the `Geometry →
Backfacing` output, verifies the boundary loop count, and exports a Draco-compressed
GLB.

## Topology reference

| N_TWISTS | Orientable? | Boundary loops | Cut along centreline produces… |
|----------|-------------|----------------|-------------------------------|
| 1        | No          | 1              | Single longer strip (2 twists) |
| 2        | Yes         | 2              | Two separate untwisted loops   |
| 3        | No          | 1              | Single strip with 4 twists     |
| 4        | Yes         | 2              | Two loops each with 1 twist    |

## Running

1. Open Blender 5.1.  New General file.
2. Save the `.blend` file to this directory.
3. In the Scripting workspace, open `blueprint.py` → ▶ Run Script.
4. Console confirms `boundary loops = 1  (expected 1 for N=1)  ✓` then exports GLB.
5. Open `record.py` → ▶ Run Script to render `viewport.mp4`.

## Parameters to explore

- `N_TWISTS = 3` — triple twist, still non-orientable but with a longer seam
- `THICKNESS = 0` — thin surface only, shows alternating backface colour directly
- `THETA_SEGS = 240` — smoother ring (useful for animation close-ups)
- `HALF_WIDTH = 0.5` — wider ribbon, more dramatic colour-flip transition

## External attribution

- Paul Bourke "Möbius Strip" — Educational freeware — http://paulbourke.net/geometry/mobius/
- Wikipedia "Möbius strip" — CC BY-SA 4.0 — https://en.wikipedia.org/wiki/M%C3%B6bius_strip
