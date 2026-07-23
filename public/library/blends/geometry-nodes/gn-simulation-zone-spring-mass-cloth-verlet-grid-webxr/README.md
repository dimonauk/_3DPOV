# GN Simulation Zone — 2-D Spring-Mass Cloth: Verlet + Laplacian Springs

**Blender 5.1 · CC0 · Holoflow Studio**

Implements a 20×16 vertex spring-mass cloth entirely inside a Blender 5.1
Geometry Nodes Simulation Zone.  The top edge is pinned; all other vertices
are evolved each frame by Verlet position integration, with spring forces
approximated through two `BlurAttribute` passes acting as a discrete graph
Laplacian over the mesh's edge connectivity.

## Physics model

| Quantity | Value |
|---|---|
| Grid | 20 × 16 vertices in XZ plane |
| Structural springs | `BlurAttribute` iter=1 × `K_STRUCT=250` |
| Bending springs | `BlurAttribute` iter=3 × `K_BEND=18` |
| Damping | 1.8 % velocity loss per frame |
| Gravity | −9.81 m s⁻² in Z |
| Wind | +1.4 m s⁻² in X |
| Integration | Verlet, DT = 1/24 s |

## Simulation Zone state

Three named attributes on the POINT domain carry state between frames:

| Attribute | Type | Description |
|---|---|---|
| `pos_prev` | FLOAT\_VECTOR | Vertex position at t−1 |
| `pos_curr` | FLOAT\_VECTOR | Vertex position at t |
| `is_pinned` | FLOAT | 1.0 = anchored, 0.0 = free |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full scene + GN Simulation Zone builder (run in Blender) |
| `record.py` | Side-view EEVEE render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS capture guide for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Quick start

```
blender --background --python blueprint.py
```

Open `hf_cloth_verlet.blend`, go to **Object → Geometry Nodes Cache → Bake All**,
then scrub the timeline to watch the cloth sag and oscillate.

## Key technique

`GeometryNodeBlurAttribute` with `data_type='FLOAT_VECTOR'` and `iterations=1`
computes the mean of each vertex's edge-adjacent neighbours.  Subtracting the
current position gives a quantity proportional to the discrete graph Laplacian,
which equals the net spring force from structural springs (Hooke's law).

Running a second `BlurAttribute` with `iterations=3` couples vertices three
hops apart and resists bending curvature — a cheap approximation to explicit
bending springs without needing to enumerate second-neighbour pairs.

Stability bound: `K × DT² < 1`.  With `K_STRUCT=250` and `DT=1/24`,
`K × DT² ≈ 0.434` — comfortably stable.

Contrast with the sibling rope tutorial (1-D Verlet chain) and the native
cloth modifier tutorial (Blender physics engine, not GN): this is entirely
deterministic, bake-free in geometry sense, and exports correctly to GLB.

## Tutorial

`/tutorials/blender-tutorial-gn-simulation-zone-spring-mass-cloth-verlet-grid-webxr`

## External references

- Thomas Jakobsen — *Advanced Character Physics*, GDC 2001 (public domain)
- David Baraff & Andrew Witkin — *Large Steps in Cloth Simulation*, SIGGRAPH 1998 (public domain)
- Blender Manual — Simulation Zone: CC-BY-SA 4.0, Blender Foundation
