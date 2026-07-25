# Screen Recording Notes — BVH → VRM Retarget Pipeline

## Software
- OBS Studio (or Windows Game Bar Win+G) / QuickTime (macOS)
- Blender 5.1 open to a two-armature scene (source BVH left, target VRM right)

## Capture settings
- Window source: Blender (full window, not viewport only)
- Resolution: 1920 × 1080
- Frame rate: 30 fps
- Audio: OFF
- Output: `screen.mp4` → place in `public/library/videos/scripting/python-bpy-bvh-import-vrm-bone-remap-nla-bake-retarget/`

## Shot sequence

### 1. Scene overview (0–8 s)
Show both armatures side by side in the 3D Viewport (front orthographic).
Label which is the BVH source (orange) and which is the VRM target (cyan).
Play the 120-frame animation (Space) to show the target following the source
via constraints in real time.

### 2. Scripting workspace — blueprint.py (8–30 s)
Switch to Scripting workspace.  Open `blueprint.py`.  Scroll slowly through:
- The `CMU_TO_VRM` dictionary (10 s)
- The `apply_retarget_constraints()` function, pausing on `space='LOCAL'`
  and `target_space='LOCAL'` — zoom in on those two lines (18 s)
- The `bake_to_nla()` call with `visual_keying=True` highlighted (24 s)

### 3. Pose mode — constraints panel (30–40 s)
Select the VRM armature, enter Pose Mode, click the `leftUpperArm` bone.
Open the Bone Constraints properties panel (chain-link icon).
Show the `HF_RETARGET_rot` COPY_ROTATION constraint with Space dropdowns
clearly readable.

### 4. NLA editor — baked strip (40–55 s)
Switch to NLA Editor.  Show the `hf_retarget` track with the baked action
strip.  Scrub the timeline while watching both the NLA strip highlight and
the VRM armature deforming in the viewport (split the screen if possible).

### 5. Run blueprint.py → GLB export (55–75 s)
Return to Scripting, click Run Script.  Show the Info bar at the bottom
printing `[HF] Baked … FCurves → NLA strip` and `[HF] Exported →`.

### 6. Result in Viewport (75–90 s)
Play the final animated VRM armature with BVH source hidden (H key on source).
End on a clean loop of the retargeted dance motion.

## Blender layout tip
Use the N-panel → View → Lock Camera to View OFF.
Numpad-1 for front ortho during the constraint demo,
Numpad-0 to switch to camera view for the final playback shot.

## File naming
Save as: `screen.mp4`
Upload destination: `public/library/videos/scripting/python-bpy-bvh-import-vrm-bone-remap-nla-bake-retarget/screen.mp4`
