# Screen Recording Notes — Arnold Tongue Circle Map

**Target file**:
`public/library/videos/scripting/python-numpy-arnold-tongue-circle-map-mode-locking-poi-disc-webxr/screen.mp4`

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 (exact window title) |
| Base Resolution | 1920 × 1080 |
| Output Resolution | 1920 × 1080 |
| Frame Rate | 30 fps |
| Audio | Disabled — no mic, no system audio |
| Encoder | x264 (CRF 18) or NVENC H.264 (CQ 18) |
| Container | MP4 |
| Keyframe Interval | 2 s |

## What to Record

### Part 1 — Setup (30 s)

1. Open **Blender 5.1**. Dismiss splash. Keep default metric units.
2. Switch to the **Scripting** workspace (top menu bar).
3. In the **Text Editor** panel, click **Open** → navigate to `blueprint.py`.
4. Show the full script in frame for 3 s.
5. Point at the `GRID_RES`, `N_ITER`, and `LOCK_EPSILON` constants and
   narrate briefly what each controls.

### Part 2 — Run & Wait (60–90 s)

6. Press **Run Script** (▶ button in the Text Editor header).
7. Switch focus to the **Info** header at the very top of Blender.
   Let the `[arnold] Mode-locked fraction:` progress lines scroll through.
8. While waiting, open the **System Console** (Window → Toggle System Console
   on Windows) or watch the terminal. The script prints each pass.

### Part 3 — Inspect Mesh (60 s)

9. Switch to **Layout** workspace. The `hf_arnold_tongue` mesh is selected.
10. Press **Z → Material Preview** to show vertex colours.
11. Slowly middle-mouse orbit around the mesh — 180° horizontal, then tilt
    down to show the raised tongue plateaux from the side.
12. With mesh selected, press **Tab** (Edit Mode) → enable
    **Overlays → Vertex Colours**. Show the per-vertex hue bands.
13. Press **Tab** back to Object Mode.

### Part 4 — Node Tree (30 s)

14. Split the viewport: drag a new panel, switch to **Shader Editor**.
    Show the `VertexColor → Principled BSDF → Material Output` node chain.
15. Hover over the VertexColor node and show `Layer: Col` in the header.

### Part 5 — EEVEE Render Preview (30 s)

16. Back in 3D Viewport, press **Z → Rendered**. The tongue relief is now
    lit. Orbit slowly to show the colour contrast between locked and chaotic
    regions.

### Part 6 — Run record.py (30 s)

17. In the Text Editor, open `record.py`.
18. Press **Run Script**. Blender begins rendering 360 frames to
    `viewport.mp4`. You do not need to wait for the full render —
    show the render window opening and the first few frames completing,
    then stop the OBS recording.

## Trim Points

| Marker | Time |
|--------|------|
| Start | Frame when ▶ Run Script is clicked for blueprint.py |
| End | First rendered frame visible in the EEVEE render window |
| Total target | 3–5 minutes |

## Suggested Thumbnail Frame

The top-down material preview showing the full (Ω, K) parameter space —
coloured tongue bands radiating from the bottom (K = 0) upward,
with sharp boundaries between pastel-hued locked regions and dark chaotic gaps.
