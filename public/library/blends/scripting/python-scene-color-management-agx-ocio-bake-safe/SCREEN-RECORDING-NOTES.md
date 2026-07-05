# Screen Recording Notes — Python scene.view_settings Tutorial

## Target file
`public/library/videos/scripting/python-scene-color-management-agx-ocio-bake-safe/screen.mp4`

## OBS / Game Bar settings
| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (visual-only capture) |
| Format | MP4 / H.264 |

---

## Recording sequence (approx. 8 min)

### 1 — Open scene & verify AgX
1. Open `colour_chart_agx.blend` (product of `blueprint.py`).
2. Split the Properties editor → Render Properties → show **Color Management** panel.
3. Point camera at panel: `view_transform = AgX`, `look = Punchy`, `exposure = 0.00`.

### 2 — Live view-transform comparison
4. Toggle `view_transform` from **AgX → Filmic** — observe how the Skin sphere shifts
   toward orange and the Sky sphere shifts toward cyan at specular peaks.
5. Switch to **Standard** (no tone-map) — highlight clipping is now visible.
6. Switch to **False Color** — exposure diagnostics heat-map; show that the chart is
   correctly exposed (chart whites in the green/yellow band, not blown).
7. Restore **AgX + Punchy**.

### 3 — Script Walkthrough (Text Editor)
8. Open the Text Editor panel. Load `blueprint.py`.
9. Walk through sections: `PALETTE`, `configure_color_management()`, gotcha comments,
   `snapshot_view_settings()` / `restore_view_settings()`, `create_bake_safe_images()`.
10. Run the script with **Run Script** (Alt+P).  Show the terminal output in the
    System Console (`Window → Toggle System Console` on Windows).

### 4 — Bake image colorspace verification
11. Switch to the UV Editor.  In the Image menu select `bake_normal_2048`.
12. Show Image → Properties (N panel) → `Non-Color` colorspace.
13. Select `bake_albedo_2048` — show `sRGB` colorspace.
14. Explain aloud: same bake, different colorspace → different data interpretation by
    the runtime.

### 5 — OCIO config readout
15. In the Text Editor paste and run:
```python
import bpy
p = bpy.context.preferences.system.ocio_config_path
print(p or "(bundled Blender default OCIO config)")
```
16. Show the terminal output.  Explain that the path is read-only — the config can only
    be changed in **Edit → Preferences → System → Color Management**.

---

## Editing notes (post-production)
- Trim dead air at transitions between panels.
- Add chapter markers: 0:00 AgX overview | 1:30 Live comparison | 3:00 Script walkthrough
  | 5:30 Bake colorspace | 7:00 OCIO path readout.
- No music — colour work requires a distraction-free viewport read.
