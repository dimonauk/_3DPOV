# Screen Recording Notes — Scherk Doubly-Periodic Minimal Surface

**Target file** `public/library/videos/scripting/python-numpy-scherk-doubly-periodic-minimal-surface-saddle-tower-poi-webxr/screen.mp4`

---

## Setup

1. Open Blender 5.1 with the Scherk poi head scene loaded
   (run `blueprint.py` first if the scene is empty).
2. Set the **3D Viewport** to **Workbench** renderer, **Vertex** colour mode,
   **Flat** shading, shadows off.
3. Switch the viewport to a three-quarter perspective view
   (Numpad 5 for ortho/persp, Numpad 4/6 to orbit).

## OBS Studio settings

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 (H.264) |
| CRF / quality | 23 (medium — good balance of file size and quality) |

## Recording sequence

1. **00:00 – 00:08** — Open `blueprint.py` in the Scripting workspace,
   scroll through the code.  Pause on the `scherk_F` function to show the
   level-set equation in comments.
2. **00:08 – 00:20** — Click **Run Script**.  Watch the poi head appear in
   the viewport.
3. **00:20 – 00:35** — Orbit the viewport (middle-mouse drag) to inspect the
   saddle geometry from multiple angles.
4. **00:35 – 00:50** — In the **Properties → Object Data → Shape Keys** panel,
   scrub the `Scherk_Dense` influence from 0 to 1 to show the period-halving
   morph.
5. **00:50 – 01:05** — Reset to Basis; scrub `Scherk_Shallow` to show saddle
   compression.
6. **01:05 – 01:20** — Reset; scrub `Scherk_Rotated` to show the 45° rotation.
7. **01:20 – 01:30** — Final orbit to showcase the vertex colour gradient
   (violet saddle centres → gold vertical flanks).

## Windows Game Bar

Press **Win + Alt + R** to start / stop recording.  Output lands in
`%USERPROFILE%\Videos\Captures\`.

## After recording

Trim to ≤ 90 seconds and place the file at:

```
public/library/videos/scripting/
  python-numpy-scherk-doubly-periodic-minimal-surface-saddle-tower-poi-webxr/
  screen.mp4
```
