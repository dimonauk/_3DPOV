# Screen Recording Notes — Orbital Camera Constraint Rig

**OBS / Windows Game Bar setup for `screen.mp4`**

| Setting       | Value                          |
|---------------|-------------------------------|
| Source        | Window Capture → Blender       |
| Resolution    | 1920 × 1080                    |
| Frame rate    | 30 fps                         |
| Audio         | Disabled                       |
| Output        | `public/library/videos/animation/animation-constraints-follow-path-track-to/screen.mp4` |

---

## What to record

### Part A — Constraint stack walkthrough (≈ 90 s)

1. Open the completed `.blend` file.
2. Select `OrbitalCam` in the Outliner.
3. Open **Properties ▸ Object Constraints** (chain-link icon).
4. Hover over the **Follow Path** block — show `use_path = True`, `offset_factor`.
5. Hover over the **Track To** block — show `track_axis = TRACK_NEGATIVE_Z`, `up_axis = UP_Y`.
6. Click on `EyeCone`, show the **Damped Track** constraint — compare axis settings to Track To.

### Part B — Live playback (≈ 60 s)

1. Set viewport shading to **Rendered** (EEVEE Next).
2. Press **Spacebar** — play from frame 1.
3. Watch: camera orbits while the look-target bobs up/down; EyeCone tracks smoothly.
4. Let it play one full orbit (200 frames ≈ 8 s at 24 fps).
5. Pause at any frame; scrub backwards to demonstrate the constraint evaluating live.

### Part C — Offset factor graph (≈ 30 s)

1. Open the **Graph Editor**.
2. Select `OrbitalCam`, filter to show only `offset_factor` F-curve.
3. Point out: straight diagonal line = constant angular velocity = LINEAR interpolation.
4. Drag one keyframe handle to Bézier — show the orbit slowing at the end; restore to LINEAR.

### Part D — Quick Bake for export (≈ 30 s)

1. Go **Object ▸ Animation ▸ Bake Action…**
2. Settings: **Visual Keying ✓**, **Clear Constraints ✗**, Frame range 1–200.
3. Explain: this converts the constraint-driven motion into explicit keyframes suitable for NLA or glTF export.
4. Undo immediately to restore live constraints.

---

## Tips

- **Blender window maximised** — hide the System Console to keep the frame clean.
- **N-panel visible** on the right for item co-ordinates as context.
- Keep the mouse deliberate and unhurried; viewers pause-step through these sections.
- Stop recording before saving the file to avoid the save dialog appearing on camera.
