# Screen-Recording Notes — Tinkerbell Map

OBS Studio or Windows Game Bar instructions for capturing `screen.mp4`.

---

## Capture settings

| Setting | Value |
|---|---|
| **Window source** | Blender 5.1 |
| **Resolution** | 1920 × 1080 |
| **Frame rate** | 30 fps |
| **Output format** | MP4 (H.264) |
| **Audio** | Off |

---

## Session flow

### 1. Open a new Blender project

File → New → General. Delete the default cube.

### 2. Open the Scripting workspace

Click the **Scripting** tab. Open a new Text file, paste the contents of
`blueprint.py`, and press **Run Script**.

The script takes 20–40 seconds depending on CPU speed. You'll see four progress
lines printed to the system console:

```
[Tinkerbell] Computing Basis density …
[Tinkerbell] Computing SK_Curled density …
[Tinkerbell] Computing SK_Open density …
[Tinkerbell] Computing SK_Drift density …
[Tinkerbell] Done — 14400 vertices, 14161 faces, 4 shape keys.
```

### 3. Switch to the 3D Viewport

- Select the `Tinkerbell_Attractor` object.
- Press **Numpad 5** (orthographic toggle → off, switch to perspective).
- Press **Numpad 0** to enter camera view, or press **Numpad 4/6** to orbit.

### 4. Shade and light

- Set viewport shading to **Material Preview** (EEVEE-Next) — the cobalt–amber
  gradient and emission bloom appear immediately.
- Add an area light (**Shift-A → Light → Area**, energy 600 W, size 3 m) above
  the floor to see the height ridges shadow properly.

### 5. Demonstrate the shape keys

In the **Properties** panel → **Object Data** → **Shape Keys**:

1. Set **Basis** value = 1.0 (already the default).
2. Slowly drag **SK_Curled** from 0 → 1. The two-wing butterfly contracts into a
   single tighter curl. Point out how the sparse-density sea stays flat while
   the dense ridges lift.
3. Return SK_Curled to 0, then drag **SK_Open** to 1. The attractor spreads into
   a multi-petal fan — larger `a` pushes the orbit further from the centre.
4. Return to Basis, then show **SK_Drift**: increasing `c` shifts the coupling
   between x and y, moving the basin's centre of mass to the right.

### 6. Explain the grid architecture

Pan the camera down to look at the mesh side-on (Numpad 1, then G-Z to orbit).
Show that the height-field is a flat quad grid where the cobalt sea represents
zero-density cells and the amber ridges mark the attractor's fold lines. This is
the same density-to-height approach used in the
[Peter de Jong Attractor](../python-numpy-peter-de-jong-attractor-discrete-2d-map-log-density-height-field-stage-floor-webxr/)
and
[Clifford Attractor](../python-numpy-clifford-attractor-pickover-discrete-2d-map-fractal-density-stage-floor-webxr/)
blueprints.

### 7. Run record.py (optional, for viewport.mp4)

With `Tinkerbell_Attractor` in the scene, open a new Text block, paste
`record.py`, and run it. Blender renders 300 frames to `viewport.mp4`
automatically. This step does NOT need to be screen-recorded — it outputs the
video file directly.

---

## Tips

- Zoom in on the mesh in **Edit Mode** (Tab) to show the quad topology — students
  can see that each cell is a square tile and the z-coordinate encodes density.
- Pressing **N** opens the Item panel where you can type exact shape-key values
  (0.00–1.00) for precise demo control.
- The mesh exports as GLB via **File → Export → glTF 2.0** with Draco compression
  level 6, `export_morph=True`, `export_colors=True`.
