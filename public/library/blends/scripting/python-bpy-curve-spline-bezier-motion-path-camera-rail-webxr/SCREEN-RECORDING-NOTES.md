# Screen Recording Notes
## python-bpy-curve-spline-bezier-motion-path-camera-rail-webxr

**Target file:** `public/library/videos/scripting/python-bpy-curve-spline-bezier-motion-path-camera-rail-webxr/screen.mp4`

---

### Software

- OBS Studio (Windows/Mac/Linux) **or** Xbox Game Bar (Windows — Win+G)
- Blender 5.1

---

### OBS Setup

1. **Source**: Window Capture → select `Blender` window
2. **Resolution**: 1920 × 1080 (set in OBS Output settings)
3. **Frame rate**: 30 fps
4. **Audio**: Disabled (mute Desktop Audio in OBS mixer)
5. **Output format**: MP4 (H.264, CRF 18)

---

### What to Record

**Part 1 — Blueprint run (≈ 60 s)**

1. Open Blender 5.1. Switch to the **Scripting** workspace.
2. Open `blueprint.py` in the text editor.
3. Press **Run Script** (or Alt+P). Show the oval curve appearing in the
   viewport; the camera object should appear with visible constraint arrows.
4. Switch to the **Animation** workspace. Scrub the timeline — you should
   see `cam_fly` animate around the rail for frames 1–120.
5. Show the **Outliner**: `cam_rail` curve, `cam_fly` camera, `look_target`
   empty, `scene_prop` torus.
6. Switch back to Scripting. Point out the constraint bake call in the code.
   After the script finishes, select `cam_fly` and show its constraint list
   in Properties → Object Constraints — it should be **empty** (baked away).
7. Show the action in the **Graph Editor**: location + rotation fcurves,
   120 keyframes each.

**Part 2 — Viewport playback (≈ 30 s)**

1. Press Numpad 0 to look through `cam_fly`.
2. Press Space to play. The viewport should show the scene prop from the
   flying camera perspective as it circles the oval rail.
3. Switch back to the perspective view and play again so the oval trajectory
   is visible as a path in 3D space.

**Part 3 — GLB inspection (≈ 20 s)**

1. Open a terminal alongside Blender. Run:
   ```
   python -c "import json, struct; ..."
   ```
   (or use the Babylon.js sandbox at sandbox.babylonjs.com — paste the GLB
   path and verify the camera animation plays.)
2. Point out the file size of `holoflow_cam_rail.glb`.

---

### Trim Points

- Start: first frame where the Blender window is fully visible
- End: the moment the terminal shows the completion print or the GLB loads in the sandbox
- Cut: any password prompts, IDE notifications, or desktop elements

---

### Post-processing (optional)

```bash
ffmpeg -i screen_raw.mp4 \
  -vf "scale=1920:1080,fps=30" \
  -c:v libx264 -crf 18 -preset slow \
  -an \
  public/library/videos/scripting/python-bpy-curve-spline-bezier-motion-path-camera-rail-webxr/screen.mp4
```
