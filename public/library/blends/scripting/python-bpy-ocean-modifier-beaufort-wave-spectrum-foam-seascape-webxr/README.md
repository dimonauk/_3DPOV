# Python bpy.types.OceanModifier — Beaufort Scale FFT Wave Spectrum, Foam Attribute & Animated Seascape GLB for WebXR (Blender 5.1)

**Topic:** scripting | **Blender:** 5.1 | **Licence:** CC0

The OceanModifier uses an inverse-FFT pipeline to sum hundreds of wave sinusoids
drawn from a statistical power spectrum.  This blueprint configures a JONSWAP
fetch-limited sea at Beaufort 5, adds foam via a colour attribute, wires a
frame-to-seconds driver on `mod.time`, and bakes a static GLB snapshot for
WebXR runtime use.

## Artefacts

| File | Description |
|------|-------------|
| `blueprint.py` | Full headless Python script — run in Blender Script Editor |
| `record.py` | Viewport animation render → `videos/.../viewport.mp4` |
| `hf_ocean_seascape.glb` | Static GLB snapshot (frame 48 ≈ 2 s of simulation) |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |

## Key concepts

- **GENERATE vs DISPLACE** — GENERATE builds the entire ocean mesh from scratch
  (base plane topology is irrelevant); DISPLACE moves existing vertices
- **JONSWAP spectrum** — fetch-limited model; wind direction and alignment change
  the dominant wave direction; PHILLIPS is omnidirectional deep-ocean
- **Choppiness** — adds a horizontal Gerstner displacement; at 0 the surface is
  sinusoidal, at ≥1 wave peaks steepen and crests become asymmetric
- **Foam attribute** — a per-vertex colour attribute (0=no foam, 1=full foam)
  that the material reads via a Named Attribute node
- **Driver pattern** — `frame / 24.0` expression drives `mod.time`; no simulation
  cache needed, animation is deterministic and loopable
- **GLB bake** — `export_apply=True` evaluates the modifier stack at the chosen
  frame without permanently applying it to the .blend

## Running

1. Open Blender 5.1 → Scripting workspace
2. Open `blueprint.py` → Run Script
3. Inspect the ocean in the 3D Viewport; scrub the timeline to see it animate
4. Open `record.py` → Run Script to render `viewport.mp4`
