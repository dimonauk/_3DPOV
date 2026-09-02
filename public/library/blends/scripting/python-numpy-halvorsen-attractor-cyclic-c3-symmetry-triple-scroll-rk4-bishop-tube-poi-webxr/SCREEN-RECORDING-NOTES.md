# Screen Recording Notes — Halvorsen Attractor

**OBS / Game Bar** instructions for capturing `screen.mp4`.

---

## Session overview

You are recording Blender 5.1's viewport while the Halvorsen attractor tube
builds and animates.  The finished recording should show:

1. A blank Blender scene (Scripting workspace open).
2. `blueprint.py` pasted into the Text Editor — scroll through the header once.
3. **Run Script** → the tube appears in the viewport over ≈ 10–20 s.
4. Shape key values scrubbed in the Properties panel (Object Data → Shape Keys):
   - Basis → SK_Wide → SK_Tight → SK_Trans → Basis
5. Viewport shading set to **Material Preview** (Z key) to show the cobalt–amber
   emission gradient.
6. Brief Numpad orbit: **Numpad 2 / 4 / 6 / 8** to show the three C₃ lobes from
   different angles — pause 2 s on each lobe so the symmetry is clear.
7. (Optional) `record.py` → Run Script, then switch to **Render Animation** to
   show the automated render starting.

---

## OBS settings

| Setting            | Value                                      |
|--------------------|--------------------------------------------|
| Source             | Window Capture → *Blender*                 |
| Resolution         | 1920 × 1080                                |
| Frame rate         | 30 fps                                     |
| Encoder            | x264 (CRF 18) or NVENC (quality = high)    |
| Audio              | **Off** (silent screen capture)             |
| Output file        | `screen.mp4` (MP4 container, H.264)        |

---

## Step-by-step

1. Open Blender 5.1. Choose **Scripting** workspace.
2. In the Text Editor: New → paste contents of `blueprint.py`.
3. **Start OBS recording.**
4. Scroll through the script header (first ~30 lines) — 5 s.
5. Click **Run Script**. Watch the tube appear in the 3D viewport.
6. Once complete, switch to the **Layout** workspace.
7. Set viewport shading to **Material Preview** (`Z` key menu → Material Preview).
8. In Properties → Object Data Properties → Shape Keys:
   - Click **SK_Wide** value, drag to 1.0.  Pause 3 s.
   - Drag back to 0.0.  Click **SK_Tight**, drag to 1.0.  Pause 3 s.
   - Drag back to 0.0.  Click **SK_Trans**, drag to 1.0.  Pause 3 s.
   - Return **Basis** to 1.0.
9. Orbit the viewport — **Numpad 1** (front), **Numpad 3** (side),
   **Numpad 7** (top).  Pause 2 s each.  The top view shows the C₃ rotational
   symmetry of the three lobes most clearly.
10. **Stop OBS recording.** Save as `screen.mp4` in the same folder.

---

## Notes on the C₃ symmetry shot

The most visually compelling moment for the video is the **top-down view**
(`Numpad 7`): the three lobes of the Halvorsen attractor arrange themselves
like a 3-armed pinwheel.  Rotate slowly in the viewport (hold **Middle Mouse**
and drag) to show how they interlock.  This is the geometric signature of the
cyclic permutation symmetry — every third crossing of the orbit visits the same
geometric neighbourhood, just rotated 120°.

---

## Output files expected

```
public/library/videos/scripting/
  python-numpy-halvorsen-attractor-cyclic-c3-symmetry-triple-scroll-rk4-bishop-tube-poi-webxr/
    viewport.mp4   ← from record.py
    screen.mp4     ← from this OBS session
```
