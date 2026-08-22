# Screen Recording Notes — Cycles Light Groups

**For**: `screen.mp4`
**Tool**: OBS Studio or Windows Game Bar
**Target resolution**: 1920 × 1080 @ 30 fps
**Audio**: off (no narration needed — motion tells the story)

---

## Session setup

1. Run `blueprint.py` — scene builds in under 2 s.
2. Switch to **EEVEE Next** in the Viewport Shading dropdown for the recording
   (Cycles viewport is too slow for fluid screen capture).
3. Set viewport shading to **Material Preview** (Sphere icon in viewport header).
4. Maximise the 3D viewport: drag its edges to fill the screen. Hide the side
   panels (N-panel: **N** key; toolbar: **T** key) so only the gem is visible.

---

## OBS window capture (recommended)

- Source: **Window Capture → Blender**
- Crop: top bar + bottom status bar (approximately 30 px top, 25 px bottom)
- Scale output to 1920 × 1080

---

## Shot 1 — Manual light group reveal (≈ 15 s)

Show what the viewer is about to see in the compositor.

1. In the **Properties panel → Light Properties** of `Light_neon_left`:
   set Energy to **0**.
2. Same for `Light_neon_right`: Energy → **0**.
3. Record for 3 s — only the ceiling overhead, flat white light on the gem.
4. Slowly drag `Light_neon_left` Energy from 0 → 90. Record 4 s — blue side light
   builds in from the left, facets catch it in bands.
5. Slowly drag `Light_neon_right` Energy from 0 → 90. Record 4 s — pink builds
   from the right; the gem glows with both.
6. Hold on the full three-light result for 4 s.

---

## Shot 2 — Compositor relighting demo (≈ 20 s)

1. Switch to the **Compositing workspace**.
2. Press **F12** to render (64 samples — ≈ 10–20 s on CPU).
   _Do not include the render progress in the final cut if editing; cut to the
   finished image in the Render Result window._
3. In the compositor, locate the **Gain: neon_left** node.
4. With the screen recording running, drag the Gamma input from 1.0 → 0.0 and back.
   The blue channel disappears and reappears in the preview — this is the
   non-destructive relight in action.
5. Change the Gamma for **Gain: neon_right** from 1.0 → 2.0 — the pink
   overbightens dramatically. Then back to 1.0.
6. Finish by showing the File Output node in the compositor and pointing at
   the per-group slot names (`neon_left`, `neon_right`, `ceiling`).

---

## Export

Encode with H.264 CRF 18 or better. Keep under 60 s total.
Save to: `public/library/videos/rendering/cycles-light-groups-non-destructive-relight/screen.mp4`
