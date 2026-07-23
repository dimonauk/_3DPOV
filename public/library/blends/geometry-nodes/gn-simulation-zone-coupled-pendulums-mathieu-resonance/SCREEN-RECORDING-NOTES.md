# Screen Recording Notes — Coupled Pendulums: Mathieu Resonance

**Target file:** `public/library/videos/geometry-nodes/gn-simulation-zone-coupled-pendulums-mathieu-resonance/screen.mp4`

## Software

| Tool | Setting |
|------|---------|
| OBS Studio ≥ 30 | Window Capture → `Blender` |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (no microphone track) |
| Encoder | x264, CRF 18 (or NVENC H.264 if available) |

## Scene preparation (before hitting Record)

1. Open `hf_pendulums.blend` (produced by `blueprint.py`).
2. Bake the simulation: **Properties > Object Data Properties > Geometry Nodes Cache > Bake All**. Wait for all 300 frames to bake (~10–30 s depending on hardware).
3. Switch to **Shading** workspace → confirm bobs are visible and material applied.
4. Set playback range: frame 1 → 240.
5. Switch to **Layout** workspace — front orthographic view (`Numpad 1`).
6. Hide the overlay grid: **Viewport Overlays ▾ > Grid ✗**.
7. Enable **Workbench Studio Lights** with a cool-white light for clear shape contrast.
8. Set viewport display to **Solid, Flat** shading for crisp faceted look.
9. Press `N` → close any side panels.
10. Set **Timeline** to frame 1.

## What to record (suggested 60-second sequence)

| Time | Action |
|------|--------|
| 0–5 s | Pan camera to show all 20 bobs in the rest position |
| 5–20 s | Hit **Spacebar** — play from frame 1; camera watches the half-sine initial mode decay and couple into higher harmonics |
| 20–35 s | Pause, scrub to frame 80; resume — show the energy spreading as a transverse wave packet |
| 35–50 s | Switch to **Rendered** mode (Z key); show the icy-blue glow of the bobs oscillating |
| 50–60 s | Open the GN modifier sidebar; zoom into the Simulation Zone node tree |

## Post-processing (optional)

- Trim to 45–60 s in Blender VSE or any video editor.
- No title cards needed — this is a raw bench capture.
- Export as MP4 (H.264) at 1920×1080 30 fps, target ~20 MB.
- Place file at: `public/library/videos/geometry-nodes/gn-simulation-zone-coupled-pendulums-mathieu-resonance/screen.mp4`

## Troubleshooting

**Bobs not visible / simulation not running:**
- Confirm blueprint ran successfully and GN modifier `CoupledPendulumsGN` is present on the object.
- If Simulation Zone hasn't been baked, unbaked frames show only the first frame.
- Bake via Properties panel (not the `record.py` script — that bakes the render, not the sim).

**Bobs explode after frame ~50:**
- Driving amplitude `DRIVE_AMP = 0.15` is at the edge of the principal resonance band.
- If resonance grows unbounded (damping too low), reduce `DRIVE_AMP` to `0.08` and re-run blueprint.
- Alternatively, increase `DAMPING` from `0.012` to `0.025`.
