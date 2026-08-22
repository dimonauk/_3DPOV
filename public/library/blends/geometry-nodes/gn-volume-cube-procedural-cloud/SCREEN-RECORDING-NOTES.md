# Screen Recording Notes — GN Volume Cube Procedural Cloud

**Target file**: `public/library/videos/geometry-nodes/gn-volume-cube-procedural-cloud/screen.mp4`

---

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop audio) |
| Output format | MP4 / H.264 |
| Bitrate | 8 000 kbps |

---

## Scene to record in Blender

1. Open `blends/geometry-nodes/gn-volume-cube-procedural-cloud/` in Blender 5.1.
2. Run **blueprint.py** via Scripting workspace → Run Script.
   - You should see a cloud volume object (`cumulus_cloud`) in the viewport.
3. Switch Viewport Shading to **Rendered** (top-right sphere icon or `Z` → Rendered).
   - Let Cycles accumulate 32–64 samples so the volume resolves.
4. **Start OBS / Game Bar recording**.

---

## What to show (in order)

1. **Full cloud, rendered view** — rotate slowly around the cloud (numpad 4/6) to show the 3D volume from multiple angles. ~10 s.
2. **Node editor** — open Geometry Nodes editor with `cumulus_cloud` selected. Pan across the node graph left-to-right: Position → Noise A → Noise B → add/blend → altitude Map Range → threshold Map Range → Volume Cube → Set Material. ~15 s.
3. **Parameter tweak live** — in the GN node graph, grab the threshold Map Range `From Min` and scrub it from 0.90 down to 0.45. The cloud should grow from sparse wisps to full body in the rendered viewport. ~8 s.
4. **Altitude gradient demo** — scrub the altitude Map Range `To Min` to show the flat-base / rounded-top effect. ~5 s.
5. **Iso-surface mesh** — select `cumulus_cloud_iso` (offset to Y+5). Show the mesh silhouette in Solid view. This is what exports to GLB. ~5 s.
6. **Shader editor** — select `cumulus_cloud`, open Shader Editor, show the Principled Volume node and its colour/density/anisotropy inputs. ~8 s.

**Total target**: 50–60 seconds.

---

## Post-processing (optional)

- Trim any dead air at start/end in DaVinci Resolve or ffmpeg.
- No colour grade needed — Cycles already outputs Filmic by default.
- Place the finished file at `public/library/videos/geometry-nodes/gn-volume-cube-procedural-cloud/screen.mp4`.
