# Screen Recording Notes — Enneper Surface

## Target output
`public/library/videos/scripting/python-numpy-enneper-surface-.../screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no commentary track) |
| Format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

## What to record (~4–6 minutes)

### Part 1 — Open Blender and paste blueprint.py (90 s)
1. New file → General.  Delete default cube.
2. Switch to **Scripting** workspace.  New script.
3. Paste `blueprint.py`.  Show key sections briefly:
   - The Weierstrass–Enneper formula comment block.
   - The three parametric lines `X = …  Y = …  Z = …`.
   - The curvature colour ramp.
4. Run script (▶).  Switch to **3D Viewport**, numpad `0` for camera view.
5. Hold the shot: orbit once with middle-mouse to show the 4-arm saddle.

### Part 2 — Inspect the curvature gradient (60 s)
1. In Viewport Shading header choose **Material Preview** (sphere icon).
2. Camera top-down (`numpad 7`): the cobalt centre and amber arms are clear.
3. Switch to **Vertex Paint** mode to confirm the K_curvature attribute is on
   every vertex (Show Attribute → K_curvature).
4. Back to Object mode.

### Part 3 — Shape key demo (60 s)
1. Properties → Object Data → Shape Keys panel.
2. Set **SK_Tight** value to 1.0 — smooth saddle, no self-intersection.
3. Return to 0. Set **SK_Wide** to 1.0 — arms fold back, deep self-intersection.
4. Return to 0. Set **SK_Rotate45** to 1.0 — saddle axis rotates 45°.
5. Show all three at 0.5 partial blend.

### Part 4 — GLB export confirmation (30 s)
1. Open the System Console (Window → Toggle System Console on Windows).
2. Confirm the export log line: `[holoflow] Enneper surface — 6400 verts …`
3. File manager → navigate to the output GLB path; show file exists.

## Tips
- Close all panels you are not actively using — a clean viewport reads better.
- Hold Shift+Numpad-4 / Shift+Numpad-6 to orbit slowly for dramatic effect.
- Do not speed-ramp: viewers learning the technique need real-time pace.
