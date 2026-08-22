# Screen-Recording Notes — python-bpy-lattice-cage-deform-morph-bake-webxr

Target file: `public/library/videos/scripting/python-bpy-lattice-cage-deform-morph-bake-webxr/screen.mp4`

## OBS / Windows Game Bar settings

| Setting | Value |
|---|---|
| Capture source | Window — Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

## Script (~6 minutes)

**1. Open Blender 5.1** — File > New > General. Show the empty viewport.

**2. Scripting workspace** — click the Scripting tab across the top bar.

**3. Open blueprint.py** — Text > Open, navigate to
`public/library/blends/scripting/python-bpy-lattice-cage-deform-morph-bake-webxr/blueprint.py`.

**4. Walk the constants block** (lines 40–55) — explain LAT_U/V/W resolution
and WAVE_AMP/PINCH_SCALE as the two main shape-control knobs.

**5. `build_base_mesh`** — zoom into the `create_grid` + `extrude_face_region`
lines.  Point out that without the Z extrusion the lattice would only deform
the top surface; the side walls need interior geometry.

**6. `build_lattice`** — highlight `interpolation_type_* = 'KEY_LINEAR'`.
Explain why KEY_LINEAR is chosen over BSPLINE for production bakes.

**7. `deform_control_points`** — trace the index formula on screen:
`idx = u + v * U + w * U * V`.  Hover over the `.co_deform.z = 0.5 + dz`
line and explain the difference between `.co` (read-only rest grid) and
`.co_deform` (writable deformed position).

**8. `apply_modifier`** — show the `temp_override()` wrapper.  Cross-reference
to the context-override tutorial.

**9. Run the script** — press ▶ (Run Script button top-right of the editor).
Keep the system console visible (Window > Toggle System Console on Windows)
so the `[holoflow]` print lines appear on screen.

**10. Switch to 3D Viewport** — press `Numpad 0` for camera view, then orbit
with Middle Mouse Button to show the top wave and side taper from multiple
angles.  Press `Z` > Rendered to show the metallic PBR material.

**11. Modifier stack check** — open Object Properties (wrench icon) > Modifier
Properties.  The stack is empty: the LATTICE modifier was applied and is gone.

**12. Import the GLB** — File > Import > glTF 2.0, import
`holoflow_lattice_baked.glb`.  Compare the imported object against the
live mesh — they should be identical, confirming the bake round-trip.

## Editing notes

- Cut between step 8 and step 9 if the run takes more than 8 seconds.
- Final shot: 3D viewport orbiting the baked mesh for 5 seconds in Rendered
  mode so the specular wave highlight is clearly visible.
- Trim the GLB import step if total length exceeds 6 minutes.
