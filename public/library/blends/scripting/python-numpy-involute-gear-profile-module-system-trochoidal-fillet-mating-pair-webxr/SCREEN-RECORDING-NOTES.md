# Screen Recording Notes

## Target file
`public/library/videos/scripting/python-numpy-involute-gear-profile-module-system-trochoidal-fillet-mating-pair-webxr/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source type | Window Capture — Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 / H.264 |

## Recommended shot list (approx. 3–4 minutes total)

1. **Blueprint overview** (30 s)
   - Show `blueprint.py` open in Scripting workspace
   - Scroll to `gear_radii()` and `involute_pt()` — point out the parametric formula
   - Show `build_tooth_profile()` and the trochoidal fillet block

2. **Run the script** (20 s)
   - Click ▶ Run Script
   - Cut to 3D Viewport — two glowing gear meshes appear side by side

3. **Viewport inspection — involute flank** (40 s)
   - Numpad 5 (orthographic), orbit to look along +Z
   - Edge select mode — select an involute flank edge and orbit to see the curvature
   - Hover cursor over the base circle region; note where the involute begins

4. **Tooth profile close-up** (40 s)
   - Zoom in to the meshing zone between the two gears
   - Show the root fillet transitioning from the gap into the involute
   - Toggle vertex colour display (Viewport Shading ▸ Colour: Attribute)
   - Cyan root → magenta tip gradient shows the pressure distribution path

5. **Undercutting demonstration** (30 s)
   - In the Script editor, change `N_DRIVE = 12` and re-run
   - Note the warning printed to console and the clamped root circle in the mesh

6. **GLB export result** (20 s)
   - Show the `output/hf_involute_gear_pair.glb` file in the Info log
   - Comment on Draco compression level and expected file size (~40–60 KB)

## Notes
- Keep the Blender window maximised at 1920 × 1080.
- Use the N-panel (keyboard N) to show object dimensions on screen when discussing
  pitch radius and centre distance.
- If the script console shows a `ValueError: face already exists`, this is expected
  on re-run — add `bpy.ops.object.select_all(action="SELECT")` + delete at the top
  and re-run from a clean scene.
