# Screen Recording Notes — EEVEE Toon / Cel-Shader Node Group
## Target file: `public/library/videos/shading/eevee-toon-cel-shader/screen.mp4`

---

### Software
- OBS Studio 30+ or Windows Game Bar (Win+G)
- Blender 5.1 open on Windows/macOS/Linux

### Capture settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (no mic/desktop audio needed) |
| Output format | MP4 / H.264 |
| Bitrate | 8000 kbps (or CRF 20 equivalent) |

---

### Shot list

**Shot 1 — Blender startup (0:00 – 0:15)**
Open Blender 5.1. Show the splash screen. Close it. Note: render engine will
be set to EEVEE Next in script.

**Shot 2 — Run blueprint.py (0:15 – 0:45)**
Open the Scripting workspace (top menu → Scripting).
File → Open → navigate to `blueprint.py`.
Press the ► Run Script button.
Let the script complete. The console at the bottom should print:
```
[toon-shader] GLB   → .../toon_demo.glb
[toon-shader] Blend → .../toon_demo.blend
```

**Shot 3 — Viewport result (0:45 – 1:30)**
Switch to Layout workspace. The icosphere with the toon material is in the
centre of the scene.
Render engine should already be EEVEE Next (check Properties → Render → Render Engine).
Press Numpad 0 to enter camera view, then Z → Rendered to see the toon shading.
Slowly rotate the view (middle-click drag) to show the shadow band and rim light.

**Shot 4 — Shader Editor (1:30 – 2:30)**
Open the Shader Editor workspace (top menu → Shading).
Select the sphere. The ToonDemoMaterial should appear in the shader editor.
Click the HoloflowToonShader Group node to select it.
Press Tab to enter the group and show the full node graph inside.
Move the camera around slowly (Numpad 4/6 to orbit) so all nodes are visible.
Press Tab again to exit the group.

**Shot 5 — Live parameter edit (2:30 – 3:30)**
With the Shader Editor active, double-click the HoloflowToonShader Group node
(or Tab to enter it). Locate the Toon ColorRamp node.
With Rendered viewport visible, drag the CONSTANT stop at position 0.45 left
and right. Show the shadow boundary moving in real time.
Then change the shadow stop colour (double-click the left black square) to a
warm red (#4a0a00) to show the band colour update.
Revert back to the dark navy (Ctrl+Z).

**Shot 6 — Rim light toggle (3:30 – 4:15)**
Still inside the group: locate the Rim ColorRamp. Move its right stop from
position 0.25 to 0.5 to widen the rim band. Show the silhouette rim growing.
Move it back to 0.25.
Disconnect the n_rim_ramp.outputs['Alpha'] → n_mix.inputs['Fac'] link
(click the link socket and drag off) to show the sphere without rim. Reconnect.

**Shot 7 — record.py playback note (4:15 – 4:45)**
Switch to Scripting workspace.
Open record.py. Show the TOTAL_F and VIDEO_OUT constants.
Point to the `animate_rotation()` function. Explain that running this script
renders the 150-frame Z-rotation animation to viewport.mp4 in the videos folder.
Do not actually run the render (it takes minutes at full resolution).

**Shot 8 — GLB in browser (4:45 – 5:00)**
Open a file browser, navigate to the toon_demo.glb output file.
Drag it into the Khronos glTF Viewer tab (https://gltf-viewer.donmccurdy.com)
to confirm the mesh exported correctly. The sphere will appear flat-lit.
Note verbally that this is expected — toon → glTF → Three.js requires the
texture bake step described in the tutorial.

---

### OBS scene setup (quick-start)
1. OBS → Sources → + → Window Capture → select Blender.
2. Edit → Transform → Stretch to screen (or crop to 1920×1080).
3. Settings → Output → Recording → MP4, H.264, 8000 kbps.
4. Start Recording before Shot 1. Stop after Shot 8.
5. Trim start/end silence in DaVinci Resolve or Kdenlive. Export as H.264 MP4.
6. Save as `screen.mp4` in `public/library/videos/shading/eevee-toon-cel-shader/`.
