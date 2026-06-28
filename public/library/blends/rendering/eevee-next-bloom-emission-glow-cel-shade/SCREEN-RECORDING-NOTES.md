# Screen Recording Notes — EEVEE Next Bloom: Emission Glow for Cel-Shade

## Software
OBS Studio (Windows) or SimpleScreenRecorder (Linux)

## Source
- Window Capture → Blender (NOT display capture — avoids taskbar)
- Resolution: **1920 × 1080**
- Frame rate: **30 fps**
- Audio: **Off** (silent tutorial video; narration added in editing)

## Pre-recording checklist
1. Run `blueprint.py` from Scripting workspace. Confirm prop appears with cyan trim + amber core.
2. Switch to **3D Viewport**.
3. Press `N` → **View** tab → tick **Compositor → Always** to enable viewport bloom.
4. Switch shading to **Rendered** (Render Preview `Z` → 4).
5. Timeline: set to frame 1. Verify core glows amber.
6. Open **Compositor** workspace (top header). Confirm Render Layers → Glare → Composite chain.
7. Maximise Blender to full-screen (`Win + Up` / `Ctrl + Space`).

## Recording flow (3-part take, ~15 seconds each)

### Take 1 — Bloom off vs bloom on (45 s)
1. In compositor, disconnect the Glare node (drag the link off). Render → no bloom.
2. Reconnect. Render → bloom appears on trim + core. Hold for 5 s.
3. Drag `Glare.threshold` from 0.75 → 0.40 → body flats start to bloom. Back to 0.75.

### Take 2 — Pulse animation playback (20 s)
1. Back in 3D Viewport (Rendered shading, Compositor Always).
2. Press **Space** to play. Core pulses amber 4.0 → 8.0 emission over 60 frames.
3. Let it loop twice. Press **Space** to stop.

### Take 3 — Node tree walkthrough (30 s)
1. Switch to Compositor workspace.
2. Click Glare node, show Threshold / Size / Mix properties in N-panel.
3. Zoom into the Render Layers node — show Image socket feeding Glare.
4. Switch back to 3D Viewport, Rendered, for final beauty shot.

## Output file
Save OBS recording as `screen.mp4` into:
`public/library/videos/rendering/eevee-next-bloom-emission-glow-cel-shade/screen.mp4`

## Notes
- Keep Blender's dark theme (Preferences → Themes → Blender Dark) for contrast.
- If bloom looks too subtle, increase `CORE_EMIT_STRENGTH` in blueprint.py to 6.0.
- The Compositor workspace shows the composited result in the Viewer node — scrub the
  timeline there to preview bloom per-frame without a full render.
