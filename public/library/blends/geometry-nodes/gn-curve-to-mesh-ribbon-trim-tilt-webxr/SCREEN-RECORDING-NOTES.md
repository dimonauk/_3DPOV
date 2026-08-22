# Screen Recording Notes — GN Curve to Mesh: Light Ribbon

**Target file**: `public/library/videos/geometry-nodes/gn-curve-to-mesh-ribbon-trim-tilt-webxr/screen.mp4`
**Duration**: ~8 minutes | **Resolution**: 1920×1080 @ 30 fps | **Audio**: off

---

## OBS / Game Bar setup

| Setting | Value |
|---|---|
| Window source | Blender 5.1 |
| Capture mode | Window capture (not display capture) |
| Output resolution | 1920×1080 |
| Frame rate | 30 fps |
| Encoder | H.264 (software) |
| Rate control | CRF 23 |
| Audio | Disabled |

Trim the recording to remove dead time. Export as MP4 H.264 baseline.

---

## Shot list

### 0:00 – 0:30 Motivation
- Open a fresh Blender 5.1 scene.
- Show the default cube. Press `A`, `X` → Delete to clear the scene.
- Pan to the **Info** header: mention this is Blender 5.1 and point at the
  version number.

### 0:30 – 1:30 Scripting workspace
- Switch to the **Scripting** workspace (top header tabs).
- Open `blueprint.py` (New → paste or load from file).
- Press **Run Script** (`Alt+P`).
- Switch back to **Layout** workspace → show the `hf_light_ribbon` object
  in the 3D Viewport. Orbit around it. The ribbon should be fully visible
  (Trim End = 1.0).

### 1:30 – 3:00 Modifier inputs
- Select `hf_light_ribbon`. Press `N` to open the sidebar (or go to
  **Modifier Properties** `🔧`).
- Expand **HF_LightRibbon** modifier.
- Drag **Tilt Turns** from 1.5 down to 0.0: show the cross-section
  untwisting. Then drag back to 2.5 for a tighter spiral.
- Reset Tilt Turns to 1.5.
- Drag **Trim End** from 1.0 to 0.0: the ribbon disappears from the tip
  backwards. Then drag back to 1.0. Pause here to let it sink in.
- Drag **Trim Start** from 0.0 to 0.5: the base half vanishes — a "snake"
  effect. Reset to 0.0.
- Change **Profile Verts** from 8 to 3 (triangle tube), then 12 (smoother),
  then back to 8.

### 3:00 – 4:30 Geometry Nodes editor
- Switch to the **Geometry Nodes** workspace (or split the viewport).
- Select `hf_light_ribbon` → the GN tree appears.
- Walk through the node chain left to right:
  1. **BezierSegment** — the S-curve input.
  2. **SplineParameter → MapRange → SetCurveRadius** — taper from 0.06 m to 0.016 m.
  3. **SplineParameter → Math × 2π → Math × Tilt_Turns → SetCurveTilt** — spiral twist.
  4. **TrimCurve** — the parametric reveal node. Point at Start / End sockets.
  5. **ResampleCurve** — uniform arc-length spacing after trim.
  6. **SplineParameter → StoreNamedAttribute(ribbon_t)** — colour attribute.
  7. **CurvePrimitiveCircle** (profile) → **CurveToMesh** → **SetMaterial**.
- Hover over **TrimCurve** → read the tooltip aloud.
- Temporarily mute (press `M`) the **SetCurveTilt** node to show the untilted
  version; unmute to restore the twist.

### 4:30 – 6:00 Shading & material
- Switch to **Shading** workspace.
- The material `hf_ribbon_emission` is already active.
- Walk the shader tree: **Attribute(ribbon_t) → ColorRamp → Emission → Output**.
- Click the indigo stop on the ColorRamp and show the colour picker.
- Drag the **Strength** on the Emission node from 4.5 up to 10 in the dark
  viewport — the ribbon glows brighter. Reset to 4.5.

### 6:00 – 7:00 Animation preview
- Return to **Layout** workspace. Press `Space` to play (or `Shift+Alt+Space`
  for playback from start).
- If record.py keyframes are present: Trim End animates 0→1 over 120 frames —
  watch the ribbon grow.
- If not yet animated: manually keyframe Trim End: at frame 1 set 0.0 →
  press `I` over the value. At frame 120 set 1.0 → press `I`. Press
  `Space` to preview.

### 7:00 – 8:00 GLB export
- File → **Export → glTF 2.0 (.glb/.gltf)**.
- Settings to show: **Apply Modifiers** ON, **Draco compression** Level 6,
  **Images** WebP, **+Y Up** ON.
- Export → show the file size in the file browser (should be ~120 KB
  with Draco).
- Close dialog. Mention the GLB is now ready for WebXR via Three.js.
