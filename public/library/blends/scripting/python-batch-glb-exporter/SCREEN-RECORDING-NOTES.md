# Screen Recording Notes — Python Batch GLB Exporter

**Window**: Blender 5.1 — Scripting workspace (Text Editor + Info + 3D Viewport)  
**Capture**: OBS Studio or Windows Game Bar  
**Resolution**: 1920 × 1080 @ 30 fps  
**Audio**: off (no narration for raw capture)  
**Output**: `public/library/videos/scripting/python-batch-glb-exporter/screen.mp4`

---

## Pre-roll setup (do before hitting Record)

1. Open Blender 5.1 → **Scripting** workspace.
2. In the **Text Editor** panel, click **New** → paste `blueprint.py` contents.
3. Split the top-right area: one panel = **3D Viewport** (Solid), one panel = **Info**.
4. Maximise Blender to fill the 1920 × 1080 frame.
5. In OBS: Source = **Window Capture → Blender**, set canvas to 1920 × 1080.

---

## Shot list

| # | Action | Duration |
|---|--------|----------|
| 1 | Pan through the script in the Text Editor — let the viewer read EXPORT_PREFIX, OUTPUT_DIR, and the Draco parameters. | ~15 s |
| 2 | Click **Run Script**. Watch the 3D Viewport populate: arch column, gem cluster, cable bundle appear. | ~10 s |
| 3 | Pan the 3D Viewport — orbit around all three collections. Switch to **Rendered** display briefly. | ~10 s |
| 4 | Open the **Outliner** and expand the three HF\_EXPORT\_ collections to show the object hierarchy. | ~8 s |
| 5 | Open a **System Console** window (Window ▸ Toggle System Console) — the print statements from the exporter scroll as each GLB completes. | ~15 s |
| 6 | Navigate to the GLB output folder in a File Manager — show the three `.glb` files and `manifest.json`. | ~10 s |
| 7 | Open the **manifest.json** in a text editor — show the slug, polygon count, and file size per entry. | ~8 s |

Total target: **75–90 seconds**

---

## OBS settings

- **Video Bitrate**: 8000 Kbps (CBR)
- **Encoder**: x264 (software) or NVENC H.264 if available
- **Output format**: MKV (remux to MP4 in OBS after recording)
- **FPS**: 30

---

## Post-processing

Trim head/tail dead frames in DaVinci Resolve or ffmpeg:

```bash
ffmpeg -i screen_raw.mkv -ss 0 -t 90 -c:v libx264 -crf 20 -preset slow \
  -an public/library/videos/scripting/python-batch-glb-exporter/screen.mp4
```
