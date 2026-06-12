# EEVEE Next — Reflection Plane Probe: Real-Time Specular Mirror Floor

**Blender 5.1 · EEVEE Next · CC0 1.0 Universal**

A polished-floor arch-viz scene demonstrating the **Plane Light Probe**
(`type='PLANAR'`) — the only EEVEE technique that gives dynamic, geometrically-
correct specular reflections on flat surfaces without a bake step.

---

## Why a Plane Probe and not SSR or a Sphere Probe?

| Technique | Dynamic? | Geometrically correct? | Off-screen geometry? | Cost |
|---|---|---|---|---|
| Screen Space Reflections (SSR) | ✓ live | ✗ screen-space only | ✗ misses it | low |
| Sphere Probe | ✗ static bake | ✓ (within parallax) | ✓ | medium (bake time) |
| **Plane Probe** | **✓ live** | **✓ planar** | **✓** | medium (extra draw call) |

Use the Plane Probe whenever the reflecting surface is flat and the dynamic
nature of the content matters — product turntables, character walk-cycles,
real-time arch-viz, or WebXR scenes where lights/objects move.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the full scene: floor, 4 brass columns, 2 coloured spheres, probe, lights, camera |
| `record.py` | 90-frame roughness-reveal animation demonstrating the probe cutoff threshold |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for the screen.mp4 tutorial video |
| `README.md` | This file |
| `.expected-artefacts.json` | CI artefact manifest |

---

## Quickstart

```bash
# Open Blender 5.1, switch to Scripting workspace, open blueprint.py, Run Script.
# Switch 3D Viewport to Rendered mode (Z → Rendered).
# No bake required — the plane probe updates live.

# To run the roughness animation:
# Open record.py in Scripting, Run Script, then Ctrl+F12 to render.
```

---

## Key Parameters

```python
FLOOR_ROUGHNESS    = 0.04   # raise above SSR_MAX_ROUGHNESS (0.45) to see probe disengage
PROBE_CLIP_START   = 0.002  # MUST be > 0 — prevents floor self-reflection in capture
PROBE_FALLOFF      = 0.15   # edge blend; 0 = hard seam, 1 = full-volume blend
SSR_MAX_ROUGHNESS  = 0.45   # roughness above this → probe has no effect
```

---

## GLB Export & WebXR Notes

The Plane Probe is stripped on GLB export — glTF 2.0 has no planar reflection
extension.  For WebXR equivalence:

1. Set a panoramic camera at floor level, render a 2048 × 1024 equirectangular.
2. Load in Three.js: `PMREMGenerator.fromEquirectangular()` → assign to
   `MeshStandardMaterial.envMap`.
3. This bakes the reflected view to a static env-map — accurate for static scenes.

See: [Three.js PMREMGenerator (MIT)](https://github.com/mrdoob/three.js/blob/dev/src/renderers/common/PMREMGenerator.js)

---

## Outside Sources

| Source | Licence | URL |
|---|---|---|
| Three.js PMREMGenerator | MIT | https://github.com/mrdoob/three.js |
| Blender Foundation EEVEE Next 4.2 release notes | CC-BY | https://wiki.blender.org/wiki/Reference/Release_Notes/4.2/EEVEE |

Related upstream projects of Three.js: `@react-three/fiber`, `@react-three/drei`,
`@pmndrs/tunnel-rat` — all MIT.

---

## Tutorial

[→ /tutorials/blender-tutorial-eevee-next-reflection-plane-mirror-floor](https://holoflow.co.uk/tutorials/blender-tutorial-eevee-next-reflection-plane-mirror-floor)
