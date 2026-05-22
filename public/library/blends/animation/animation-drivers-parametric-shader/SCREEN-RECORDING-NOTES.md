# Screen Recording Notes — Animation Drivers / Parametric Shader

**Target file**: `public/library/videos/animation/animation-drivers-parametric-shader/screen.mp4`  
**Software**: OBS Studio (or Windows Game Bar / macOS Screenshot)  
**Resolution**: 1920 × 1080 · 30 fps · audio OFF

---

## Setup in Blender before recording

1. Run `blueprint.py` so the crystal shard scene is loaded.
2. Open the **Properties** sidebar (N key in viewport) → **Item** tab → confirm
   `energy_level` slider is visible under Custom Properties.
3. Open **Shader Editor** — confirm the driver icon (grey curve) appears on
   Emission Strength and Mix Shader Fac inputs.
4. Open the **Drivers Editor** (switch editor type dropdown) — confirm both
   F-curves are listed with the `energy` variable targeting the object.
5. Return to viewport. Set Viewport Shading to **Material Preview** or
   **Rendered** (EEVEE Next) so the glow is visible.

---

## Shot list (≈ 3 min total)

| # | Duration | What to show |
|---|----------|-------------|
| 1 | 20 s | Properties panel → Item → drag `energy_level` slider 0 → 1 → 0. Crystal visibly pulses. No commentary needed — the visual speaks. |
| 2 | 30 s | Shader Editor — pan over Emission node, zoom in to show driver icon on Strength input. Hover over it to reveal the driver tooltip. |
| 3 | 30 s | Drivers Editor — show the two F-curves, click on one to show the SCRIPTED expression `energy * 4.0` and the variable target. |
| 4 | 40 s | Timeline — scrub through frames 1–60 (or play the animation). Show the energy_level F-curve pulsing in the Graph Editor alongside. |
| 5 | 20 s | Final viewport orbit — camera moving slowly while glow pulses. End on a clean frame at peak glow. |

---

## OBS source settings

- **Source type**: Window Capture → Blender
- **Crop**: none (full 1920 × 1080 Blender window)
- **Video bitrate**: 8000 kbps CBR (H264)
- **Audio**: muted / not captured

## Post-processing

Trim to remove setup pauses. No colour grading needed — EEVEE viewport
captures correctly at 8-bit. Export as MP4 H264 for web delivery.
