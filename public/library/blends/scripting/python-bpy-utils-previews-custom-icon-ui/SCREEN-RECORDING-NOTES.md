# SCREEN-RECORDING-NOTES.md
## Topic: bpy.utils.previews — Custom Icon Thumbnails & Render Previews
**Blender 5.1 | OBS Studio / Windows Game Bar | 1920×1080 @ 30fps**

---

### OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (no mic needed) |
| Output | `public/library/videos/scripting/python-bpy-utils-previews-custom-icon-ui/screen.mp4` |
| Codec | H.264, CRF 18 |

---

### Shot list

**Shot 1 — Empty N-panel (0:00 – 0:08)**
1. Open Blender 5.1 with the default cube scene.
2. Press `N` in the 3D Viewport to open the N-panel.
3. Show the Holoflow tab — the Icon Demo panel is visible but the thumbnail slot and queue are empty.
4. Hover over the panel to show it loaded.

**Shot 2 — Alt+P to register blueprint.py (0:08 – 0:20)**
1. Switch to Scripting workspace.
2. Open `blueprint.py` in the Text Editor.
3. Press `Alt+P` — the console prints the registration messages.
4. Switch back to 3D Viewport → N-panel → Holoflow → Icon Demo.
5. Show the queue populated with the first two scene objects.
6. **Highlight**: the Format column shows coloured icon squares (teal = GLB, amber = glTF).

**Shot 3 — Icon in action: change format (0:20 – 0:35)**
1. Click the format icon on the first queue row to open the dropdown.
2. Show the two options with their icons side by side.
3. Select "glTF + bin" — the icon in the row switches to amber.
4. Zoom in on the N-panel so icons are clearly legible.

**Shot 4 — Render thumbnail capture (0:35 – 0:55)**
1. Click on the first mesh object in the viewport (e.g. the cube) to make it active.
2. In the N-panel, click **Capture Render Thumbnail**.
3. Blender briefly renders at 128×128 Workbench mode (the viewport flickers).
4. The thumbnail slot at the top of the panel fills with the rendered preview image.
5. Hold for 3 seconds so the thumbnail is clearly visible.

**Shot 5 — Empty slot red alert (0:55 – 1:05)**
1. Click the object picker on one queue row and clear it (X button).
2. Show the row turning red — the `sub.alert = True` tint is clearly visible.
3. Re-assign an object so it turns back to normal.

**Shot 6 — Unregister cleanup (1:05 – 1:15)**
1. Switch to Scripting workspace.
2. In the Python Console, type: `import hlf_icon_demo; hlf_icon_demo.unregister()`
3. Switch back to the viewport — the Holoflow tab vanishes from the N-panel.
4. Shows clean unregister without error in the system console.

---

### Post-processing (FFmpeg)
```bash
ffmpeg -framerate 30 -i screen_%04d.png \
  -vf "scale=1920:1080" \
  -c:v libx264 -crf 18 -preset slow \
  -pix_fmt yuv420p \
  public/library/videos/scripting/python-bpy-utils-previews-custom-icon-ui/screen.mp4
```
