# Screen-Recording Notes — Sprott C Attractor

Target file: `public/library/videos/scripting/python-numpy-sprott-c-attractor-1994-yz-xy-dual-saddle-focus-shilnikov-rk4-bishop-tube-poi-webxr/screen.mp4`

## Software

- **OBS Studio** ≥ 30.x (Windows / macOS / Linux) — recommended
- Alternative: Windows Game Bar (`Win + G`) or macOS Screenshot tool

## Scene Setup in Blender 5.1

1. Open Blender 5.1. Set **Workspace → Scripting**.
2. Paste `blueprint.py` into the text editor. Click **▶ Run Script**.
   - Wait ≈ 60–90 s for all four shape keys to integrate.
3. Switch to **Layout** workspace.
4. Set shading to **Material Preview** (`Z` → Material Preview) so the
   cobalt–amber colour ramp is visible.
5. Set viewport overlay: **Statistics ON**, **Wireframe OFF**.
6. Open the Timeline (bottom bar). Press `←` to rewind to frame 1.

## OBS Settings

| Setting | Value |
|---|---|
| Video Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Disabled** (no audio track needed) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |
| Hotkey start | `Ctrl + F12` (custom) |
| Hotkey stop | `Ctrl + F11` (custom) |

## Recording Sequence

1. **Start OBS capture.**
2. In Blender, press **Numpad 0** (camera view).
3. Press **Space** to play the animation (300 frames, 10 s).
4. Let the playback complete to frame 300 (shape keys cycle through all
   four c-presets).
5. **Stop OBS capture.**
6. Trim to exactly 10 s in a video editor if needed.
7. Save as `screen.mp4` to the path above.

## Notes on the Shape-Key Morphs

| Frame range | Shape key | c value | What to watch for |
|---|---|---|---|
| 1–59 | Basis | 1.0 | canonical double-scroll, two symmetric lobes |
| 60–119 | SK_cLow | 0.7 | orbits contract toward both equilibria |
| 120–179 | SK_cHigh | 1.5 | lobes expand outward; winding loosens |
| 180–239 | SK_cWide | 2.0 | near-bifurcation; orbit nearly escapes |
| 240–299 | Basis | 1.0 | return to canonical |

The colour gradient (cobalt = slow, amber = fast) shows the laminar
passages near the z = 0 plane as deep blue bands — visually distinct from
the faster spiralling regions in amber.
