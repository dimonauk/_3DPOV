# Screen Recording Notes — Python Motion Tracking → Camera Solve → WebXR AR

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | `public/library/videos/scripting/python-movieclip-motion-tracking-camera-solve-webxr-ar/screen.mp4` |

## What to record (4–6 minutes)

### 1. Scripting workspace — Blueprint walkthrough (1 min)
- Open `blueprint.py` in the Blender text editor.
- Pan through the file top-to-bottom, pausing at each section comment.
- Highlight the `_clip_ctx` context manager — explain the `temp_override` trick.

### 2. Clip Editor — Footage and markers (1 min)
- Switch the lower viewport to **Movie Clip Editor**.
- Open the footage clip (File → Open Clip or via the script's `load_clip()` call).
- Show the loaded footage with frames advancing via the timeline.
- After `detect_markers()` runs, show the cyan cross-hair markers scattered
  across the frame. Zoom in to one to show the pattern/search box.

### 3. Run tracking (30 s)
- With the cursor in the Clip Editor, trigger `track_all()` from the Script panel
  or press **Ctrl+T** to start tracking forward.
- Play the timeline — watch the markers follow features across frames.
- Show any tracks that drift and drop out (red markers) — normal on low-contrast areas.

### 4. Camera solve + terminal output (30 s)
- Run `camera_solve()`. The system console should print the RMS error.
- Show the print output: `[solve] RMS reprojection error: 0.2341 px` (target).
- Switch to the 3D viewport — the reconstructed point cloud appears as white dots
  and the camera trajectory as a coloured path.

### 5. 3D viewport — camera path (1 min)
- Tumble the 3D viewport to show the point cloud from different angles.
- Play back the solved camera animation — watch the camera object follow the solve path.
- Enable **Camera View** (Numpad 0) — shows the footage with the tracked features
  overlaid as reprojection markers. Tight clusters = good solve.

### 6. Export and JSON preview (30 s)
- Show the `solved_camera.glb` and `camera_path.json` outputs in the file browser.
- Open `camera_path.json` in a text editor — show the `[{frame, t, q}, …]` structure.
- Close Blender and open the GLB in the Three.js 3D Viewer or `glTF-Sample-Viewer`
  to confirm the camera animation plays back correctly.

## Thumbnail frame
Seek to the moment in step 5 when the 3D viewport shows the reconstructed point
cloud with the camera path arc — top-left: Blender viewport, top-right:
clip editor footage. Crop to 1280 × 720.
