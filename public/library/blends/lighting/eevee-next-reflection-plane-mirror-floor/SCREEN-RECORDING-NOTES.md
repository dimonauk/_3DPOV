# Screen Recording Notes — EEVEE Next Reflection Plane Probe

**Output target:** `public/library/videos/lighting/eevee-next-reflection-plane-mirror-floor/screen.mp4`

---

## Software

- **OBS Studio** (recommended) or Windows Game Bar (`Win + G`).
- **Blender 5.1** — EEVEE Next renderer.

---

## OBS Settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Base Resolution | 1920 × 1080 |
| Output Resolution | 1920 × 1080 |
| Frame Rate | 30 fps |
| Audio | **Disabled** (mute all audio sources) |
| Output Format | MP4 (H.264) |
| CRF / Quality | 18–22 |

---

## Blender Preparation

1. Open Blender 5.1. Run `blueprint.py` via the Scripting workspace.
2. Switch the 3D Viewport to **Rendered** mode: `Z → Rendered`.
3. Set shading to **EEVEE Next** (Properties → Render → EEVEE).
4. In the **N-panel → View**, confirm **Clip Start = 0.01 m**, **Clip End = 100 m**.
5. Set viewport resolution: in the Viewport Overlay menu set **Render Region** if needed.
6. Open the **Timeline** (drag bottom of viewport) and set frame range 1–90.

---

## What to Capture — Shot List

### Shot 1: Blueprint run (≈ 30 s)
- Show the Scripting workspace with `blueprint.py` open.
- Click **Run Script**.
- Switch to **Layout** workspace → Rendered mode.
- Pause on the floor to show the reflection is immediately live (no bake needed).

### Shot 2: Probe object inspection (≈ 45 s)
- Select **`refl_plane_probe`** in the Outliner.
- Show **Properties → Object Data** (light probe icon).
- Call out: **Clip Start**, **Falloff**, **Influence Distance**.
- Briefly show how probe scale (orange rectangle in viewport) matches the floor footprint.

### Shot 3: Roughness demo via record.py (≈ 2 min)
- Run `record.py` in the Scripting workspace.
- Press **Space** to play the timeline animation.
- The floor transitions mirror → matte → mirror while the red sphere orbits.
- Pause at frame 40 (matte state) and point out: reflection is gone because roughness
  exceeds SSR_MAX_ROUGHNESS (0.45). This is the probe cutoff, not a gradual fade.
- Resume playback until the reflection returns at frame 70.

### Shot 4: Live editing proof (≈ 30 s)
- **Without stopping playback**, grab the blue sphere (`sphere_blue`) and move it.
- The floor reflection tracks the sphere in real time — demonstrating that this is
  a live render, not a baked cache.
- Press `Alt + G` to reset location.

### Shot 5: Probe vs SSR comparison (≈ 45 s)
- Stop playback. Set floor roughness back to 0.04 (via Material Properties).
- In **Properties → Render → Screen Space Reflections**, toggle **Use SSR** off.
- The reflection persists (Plane Probe renders independently of SSR).
- Toggle SSR back on, then try disabling the probe object (**H** to hide it).
- The reflection degrades to SSR quality: visible screen-edge cutoff and
  missing below-camera geometry.
- Unhide the probe (`Alt + H`).

---

## Export

After recording, trim in your video editor:
- Remove any desktop clutter frames at start/end.
- No colour grade needed — Blender Rendered mode is already tone-mapped.
- Export: H.264, CRF 20, 1920 × 1080, 30 fps.
- Save to `public/library/videos/lighting/eevee-next-reflection-plane-mirror-floor/screen.mp4`.
