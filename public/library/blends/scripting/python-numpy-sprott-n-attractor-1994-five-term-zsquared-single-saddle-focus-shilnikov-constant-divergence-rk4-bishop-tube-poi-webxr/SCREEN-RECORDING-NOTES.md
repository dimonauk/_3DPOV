# Screen-Recording Notes — Sprott N Attractor

> OBS or Windows Game Bar instructions for capturing `screen.mp4`.

## Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled (silent tutorial) |
| Format | MP4 / H.264 |
| Output | `public/library/videos/scripting/sprott-n-attractor-1994/screen.mp4` |

## Suggested capture flow (≈10 minutes total)

### 1. Scene setup (2 min)
- Open Blender 5.1, new General file.
- Switch to **Scripting** workspace.
- Paste or open `blueprint.py`.
- Show the raw equations in the script header:
  `ẋ = −2y`, `ẏ = x + z²`, `ż = b + y − 2z`

### 2. Run the integration (1 min)
- Press **Run Script**.
- Switch to **3D Viewport**, numpad-`0` for top view.
- Narrate: "Only one fixed point, yet Shilnikov ratio ≈ 15 — highest in the
  canonical 1994 Sprott N-case catalogue entry."

### 3. Inspect geometry (2 min)
- Orbit the viewport: the tube wraps into a single-lobed ribbon.
- Open **Properties → Object Data → Shape Keys**.
- Show the four keys: Basis, SK_LowB, SK_HighB, SK_WideB.
- Slide each key from 0 → 1 in the timeline to show orbital shape change.

### 4. Shading mode (2 min)
- Switch to **Material Preview** (Z → Material Preview).
- Enable viewport **Bloom** (Render Properties → Bloom) for glow effect.
- The cobalt-to-amber gradient shows slow (blue) vs. fast (orange) orbit regions.
- Note where amber spikes: near the closest approach to the fixed point at
  P = (−1/4, 0, 1/2), speed peaks as the tube is compressed by the
  stable manifold.

### 5. GLB export (1 min)
- File → Export → glTF 2.0
- Enable: **Morph Targets**, **Vertex Colors**, **Draco compression** (level 6).
- Set Y-up export and root name `hf_sprott_n_poi`.

### 6. Outro (1 min)
- Show the rendered `viewport.mp4` in Image Editor or VLC.
- Point to the tutorial page URL.

## OBS scene settings
```
[OBS Studio]
Scene: BlenderCapture
Source 1: Window Capture (Blender 5.1)
  → Crop: top 30px (remove title bar if desired)
Source 2: none (no mic, no webcam needed)
Output: CRF 18, preset=veryfast, MP4
```

## Key moments to narrate
- **t=0:00** — Open the script, show equations
- **t=1:30** — Run script, first view of the attractor tube
- **t=3:00** — Slide SK_LowB: smaller, more compact loop
- **t=4:30** — Slide SK_WideB: orbit elongates dramatically in z
- **t=6:00** — Material Preview with bloom active
- **t=8:00** — Export dialogue, highlight morph-targets checkbox
