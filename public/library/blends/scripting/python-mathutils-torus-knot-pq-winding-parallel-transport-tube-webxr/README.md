# Torus Knot T(p,q) — Parallel-Transport Tube Mesh for WebXR

**Blender 5.1 · Holoflow Studio · CC0**

Builds a T(p,q) torus knot as a closed tube mesh using parallel-transport
(Bishop) frames.  The trefoil T(2,3) is the default; any coprime (p,q) pair
gives a valid single-component knot.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the tube mesh, assigns an emissive material, exports GLB |
| `record.py` | NURBS curve reveal animation + 360° camera orbit → viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for screen.mp4 |
| `hf_torus_knot.blend` | Saved scene after running blueprint.py |
| `hf_torus_knot.glb` | Draco-compressed WebXR asset (+Y up, WebP textures) |

## Quick start

```
Blender Scripting workspace → Open → blueprint.py → ▶ Run Script
```

The console prints the holonomy angle (should be close to a multiple of 360°)
and the vertex/face counts.  GLB exports to the same directory.

## Parameters

| Name | Default | Effect |
|---|---|---|
| `P` | 2 | Longitudinal wraps; T(2,3) = trefoil, T(2,5) = cinquefoil |
| `Q` | 3 | Meridional wraps.  GCD(P,Q) must equal 1. |
| `TORUS_R` | 1.00 | Major radius — controls how wide the knot sits |
| `TORUS_r` | 0.38 | Minor radius — controls how tight the crossings are |
| `TUBE_RADIUS` | 0.045 | Cross-section radius of the strand |
| `N_LONG` | 240 | Longitudinal ring count (increase for smoother curves) |
| `N_CIRC` | 14 | Vertices per ring (increase for rounder cross-section) |

## Knot families

```
T(2, 3)  → trefoil knot      (3 crossings)
T(2, 5)  → cinquefoil knot   (5 crossings)
T(2, 7)  → septafoil knot    (7 crossings)
T(3, 4)  → knot 8_19         (8 crossings)
T(3, 5)  → torus knot 10_124 (10 crossings)
T(2, 2)  → INVALID: GCD=2, produces a 2-component Hopf link
```

## WebXR use

Load `hf_torus_knot.glb` in Three.js:

```js
const loader = new GLTFLoader();
loader.load('hf_torus_knot.glb', (gltf) => {
  scene.add(gltf.scene);
});
```

The emissive material appears as a glowing strand.  For bloom, enable
`THREE.UnrealBloomPass` in a post-processing pipeline.

## Credit

Blueprint authored by Holoflow Studio (CC0).
Outside references:
- Blender Python API 5.1 — CC-BY-SA-4.0 — https://docs.blender.org/api/5.1/
- njanakiev/blender-scripting — MIT — https://github.com/njanakiev/blender-scripting
