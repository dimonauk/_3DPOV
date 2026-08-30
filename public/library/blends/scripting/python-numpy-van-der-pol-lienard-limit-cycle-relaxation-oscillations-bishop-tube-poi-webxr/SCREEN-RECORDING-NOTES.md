# Screen-Recording Notes — Van der Pol Oscillator Poi Head

**Target file:** `public/library/videos/scripting/python-numpy-van-der-pol-lienard-limit-cycle-relaxation-oscillations-bishop-tube-poi-webxr/screen.mp4`

## Software

- **OBS Studio** 30.x (Windows / macOS / Linux) — free, recommended
- Alternative: Xbox Game Bar (Win+G on Windows), or QuickTime on macOS

## Steps

### 1 — Prepare Blender

1. Open Blender 5.1.
2. Scripting workspace → open `blueprint.py` → **Run Script**.
3. Wait for console to confirm: `[VanDerPol] 30000 verts  29990 faces`.
4. Switch to 3-D Viewport, set shading to **Material Preview** (Z key → Material Preview) or **Rendered** (EEVEE Next).
5. Numpad 5 → toggle Orthographic. Numpad 1 → front view. Then orbit (middle-mouse drag) to a 3/4 view showing the helical coil.
6. Frame the object: numpad period (.) or View → Frame Selected.

### 2 — OBS Configuration

| Setting | Value |
|---|---|
| Source | Window Capture → **Blender** |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Recording format | MP4 (H.264) |
| Audio | **Off** (none needed) |
| Output path | `…/videos/scripting/python-numpy-van-der-pol-…/screen.mp4` |

### 3 — What to Capture

1. **Script run** (10–15 s): show the Scripting workspace, highlight the main `run()` call, hit Run Script, watch console output.
2. **Object inspection** (20–30 s): orbit around the helical coil in Material Preview. Point out the cobalt (backward swing) and amber (forward swing) colour bands alternating around each loop.
3. **Shape key demo** (30–40 s): switch to Properties → Object Data → Shape Keys. Slide from Basis → SK_Gentle (notice loops become circular as μ→0.2). Slide to SK_Relax (μ=3: sawtooth becomes visible as wider, uneven loops). Slide to SK_Strong (μ=5: extreme slow/fast separation, fewer loops).
4. **Close-up** (10 s): zoom into one loop to show the tube cross-section (decagonal profile) and the colour gradient mid-swing.

### 4 — Tips

- Enable **Viewport → Overlays → Statistics** to show vertex count on screen.
- Use Blender's timeline scrubber to keyframe between shape-key values if you want animated playback on screen.
- Set World → Background to near-black before recording so the bloom glow stands out.
- If EEVEE Next bloom is not visible in Material Preview, switch to Rendered mode with EEVEE Next selected as the renderer.
