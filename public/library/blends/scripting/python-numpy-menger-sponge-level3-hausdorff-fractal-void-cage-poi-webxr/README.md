# Menger Sponge — Level-3 Fractal Void Cage Poi Head (Blender 5.1)

**Slug**: `python-numpy-menger-sponge-level3-hausdorff-fractal-void-cage-poi-webxr`  
**Category**: scripting  
**Blender version**: 5.1  
**Licence**: CC0  
**Date**: 2026-08-15  

## What this is

A level-3 Menger sponge built entirely from Blender's Python API, then
exported as a WebXR-ready GLB poi head.  The sponge has 8 000 occupied
sub-cubes (20³), each face rendered only when it is adjacent to empty space
or the bounding boundary — giving the exact visible surface without hidden
internal geometry.

## Mathematical background

Karl Menger (1926) constructed the sponge to answer a foundational question in
dimension theory: what is a 1-dimensional compact space?  His answer was the
sponge itself, which is *universal*: every compact 1-dimensional metric space
embeds homeomorphically in M³.  Paradoxically the sponge appears 3-dimensional
but its topological dimension is 1.

| Property | Value |
|---|---|
| Recursion level | 3 |
| Occupied sub-cubes | 8 000 = 20³ |
| Hausdorff dimension | log(20)/log(3) ≈ **2.7268** |
| Topological dimension | **1** |
| Volume at level N | (20/27)ᴺ → 0 |
| Surface area | → ∞ |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full build script — run in Blender's Script Editor |
| `record.py` | Viewport animation render (run after blueprint.py) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | CI artefact manifest |

## How to run

1. Open Blender 5.1.  Switch to the **Scripting** workspace.
2. Open `blueprint.py` in the text editor.
3. Click **Run Script** (or press Alt-P).
4. The script will build the mesh, add vertex colours and a shape key, then
   export `hf_menger_poi.glb` next to the blend file.
5. Open `record.py` and run it to generate `viewport.mp4`.

## Shape keys

| Key | Description |
|---|---|
| Basis | Level-3 sponge as built |
| SK_Exploded | Each sub-cube scaled 1.35× from its centre — reveals fractal structure |

## Vertex colour encoding

| Colour | Meaning |
|---|---|
| Red | Faces whose normal is parallel to X — X-axis tunnels |
| Green | Faces whose normal is parallel to Y — Y-axis tunnels |
| Blue | Faces whose normal is parallel to Z — Z-axis tunnels |

## External sources

- Menger, K. (1926). *Allgemeine Räume und kartesische Räume.*  
  Proceedings of the Royal Academy of Sciences Amsterdam 29: 1125–1128.  
  **Public Domain.**

- Wikipedia contributors, "Menger sponge," Wikipedia.  
  <https://en.wikipedia.org/wiki/Menger_sponge>  
  **CC BY-SA 4.0** (mathematical formulation and dimension derivation).

- NumPy contributors. *NumPy Reference Documentation.*  
  <https://numpy.org/doc/stable/>  
  **BSD-3-Clause.**
