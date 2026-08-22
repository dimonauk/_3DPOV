# Screen Recording Notes
## python-usd-export-usdz-spatial-computing-pipeline

**Target file:** `public/library/videos/scripting/python-usd-export-usdz-spatial-computing-pipeline/screen.mp4`

---

### OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop audio) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

---

### What to capture

1. **Open Blender 5.1.** Scripting workspace visible.
2. **Paste `blueprint.py`** into the text editor (or File → Open Text).
3. **Run the script.** Watch the System Console for:
   - `[holoflow] USDC written → …/scene_export.usdc`
   - `[holoflow] USDZ packaged → …/holoflow_scene.usdz  (NNN KB, N texture(s))`
   - `[holoflow] manifest → …/export_manifest.json`
   - `[holoflow] USD/USDZ export pipeline complete.`
4. **Switch to the 3D Viewport.** Press `Numpad 0` (camera view).
   The gem + floor + key light scene is now in the scene.
5. **Open a File Browser panel** (drag a viewport edge → File Browser).
   Navigate to the `usd_export/` directory beside the .blend.
   Show: `scene_export.usdc`, `textures/` folder, `holoflow_scene.usdz`.
6. **Optional — Apple Quick Look preview:**
   If on macOS: double-click `holoflow_scene.usdz` in Finder.
   Quick Look opens the gem as an AR object.
   Record this for ~10 s.
7. **Total recording duration:** aim for 60–90 s.

---

### Post-processing (DaVinci Resolve / FFmpeg)

```
ffmpeg -i screen_raw.mp4 \
  -vf scale=1920:1080 \
  -c:v libx264 -crf 20 -preset slow \
  -an \
  public/library/videos/scripting/python-usd-export-usdz-spatial-computing-pipeline/screen.mp4
```
