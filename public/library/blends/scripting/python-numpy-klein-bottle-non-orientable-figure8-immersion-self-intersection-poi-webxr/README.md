# Klein Bottle — Non-Orientable Surface Immersed in ℝ³
**Figure-8 Parameterisation · Self-Intersection Seam · Poi Head for WebXR**  
Blender 5.1 | Python + numpy | CC0

---

## What this is

A Klein bottle is a closed surface with no inside or outside — it is *non-orientable*, like a Möbius strip but without a boundary.  In four-dimensional space it embeds cleanly; in three-dimensional space any immersion must cross itself.

This blueprint builds the **figure-8 immersion** of the Klein bottle as a Blender mesh, detects the self-intersection circle analytically, marks it with an emission material (glowing seam), and morphs between three distinct immersions via shape keys.

The result exports as a WebXR-ready GLB with Draco level-6 compression, suitable as a poi head prop.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy scene build: mesh, materials, shape keys, GLB export |
| `record.py` | Viewport animation render (360° orbit + saddled morph) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |

---

## Topology primer

| Property | Klein bottle | Torus |
|----------|-------------|-------|
| Euler characteristic χ | 0 | 0 |
| Orientable | No | Yes |
| Genus (non-orientable) | 2 | — |
| Fundamental class H₂(ℤ) | None | ℤ |
| Self-intersection in ℝ³ | Required | Not required |

The Klein bottle can be cut along one longitude to yield **two Möbius strips** glued along their shared boundary — a key topological fact exploited in the cross-references below.

---

## The figure-8 parameterisation

```
u, v ∈ [0, 2π]

cos_u2 = cos(u/2),  sin_u2 = sin(u/2)

radial(u,v) = R + r · (cos(v) · cos_u2  −  sin(2v) · sin_u2)

x = radial · cos(u)  −  r · sin(2v) · sin(u)
y = radial · sin(u)  +  r · sin(2v) · cos(u)
z = r · (cos(v) · sin_u2  +  sin(2v) · cos_u2)
```

The `sin(2v)` (double-frequency) term creates a figure-8 cross-section.  Without it you get a torus.  The half-angle `u/2` is what causes the frame to rotate by π per loop — the essential Klein bottle twist.

---

## Shape keys

| Key | Description |
|-----|-------------|
| `Basis` | Figure-8 immersion (default) |
| `saddled` | Three-pronged saddle cross-section using sin(3v/2) |
| `pinched` | Classical bottle silhouette with pinched neck |

---

## Artefacts produced

- `hf_klein_bottle.blend` — Blender scene
- `hf_klein_bottle.glb` — Draco-6 compressed, WebP textures, +Y up
- `viewport.mp4` — rendered orbit (via `record.py`)
- `screen.mp4` — OBS screen capture of the scripting session

---

## Licence

Blueprint code: **CC0** (public domain dedication).  
Mathematical content: public domain (topology; Apéry 1994, Weeks 2002).

---

## Outside sources

1. Apéry, François (1994). *Models of the Real Projective Plane*. Vieweg. PD mathematical content.  
   https://link.springer.com/book/9783322895691

2. Weeks, Jeffrey (2002). *The Shape of Space*. CRC Press. CC0 concept description.  
   https://www.geometrygames.org/

3. NumPy contributors. NumPy Reference Documentation. BSD-3-Clause.  
   https://numpy.org/doc/stable/
