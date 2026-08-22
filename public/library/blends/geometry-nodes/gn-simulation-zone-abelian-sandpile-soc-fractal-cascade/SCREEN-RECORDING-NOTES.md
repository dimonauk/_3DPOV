# Screen Recording Notes — Abelian Sandpile GN Tutorial

**Target file:** `public/library/videos/geometry-nodes/gn-simulation-zone-abelian-sandpile-soc-fractal-cascade/screen.mp4`

## Setup

1. Run `blueprint.py` in Blender's Scripting workspace to build `hf_sandpile.blend`.
2. Bake the simulation: **Object → Geometry Nodes Cache → Bake All** (takes ~30 s for 300 frames on a mid-range CPU).
3. Switch to the **3D Viewport**, set shading to **Rendered** (EEVEE Next), set view to **Camera** (`Numpad 0`).
4. Confirm the colour palette is visible: centre face near-white/yellow at frame 0; avalanche spreading green and black by frame 30.

## OBS settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Format | MP4 / H.264 |
| Audio | Off |
| Recording path | `…/screen.mp4` |

## What to capture (approx. 45 s)

| Time | Action |
|------|--------|
| 0:00–0:08 | Show the initial scene: flat black grid, single bright face at centre |
| 0:08–0:20 | Play animation from frame 0 → 80 at normal speed; comment on avalanche spreading radially |
| 0:20–0:28 | Pause at ~frame 80 to show the distinct diamond silhouette forming |
| 0:28–0:38 | Resume to frame 200; show that the diamond boundary has stabilised and internal fractal detail is complete |
| 0:38–0:45 | Zoom in using View → Frame All to show close-up pixel-like grain-count cells |

## Demo talking points

- "Each face holds 0–3 grains in stable state — the CONSTANT ramp snaps them to four distinct colours."
- "The diamond shape is not arbitrary — it's the growth limit of the sandpile's effective speed-of-light (1 face per frame per direction)."
- "The internal pattern is a fractal: self-similar at multiple scales, provably exhibiting power-law avalanche-size statistics."
- "BlurAttribute would give fractional counts at grid boundaries — SampleIndex with explicit index arithmetic gives exact integer counts everywhere."

## Render via script

```
blender --background hf_sandpile.blend --python record.py
```

This produces `viewport.mp4` (top-down orthographic) automatically.  Run the screen recording separately to capture the interactive UI walkthrough.
