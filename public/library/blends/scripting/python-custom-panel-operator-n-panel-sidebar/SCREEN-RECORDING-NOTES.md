# Screen Recording Notes — N-Panel Sidebar Add-on

## Software

| Item | Setting |
|------|---------|
| Capture tool | OBS Studio or Windows Game Bar (Win+G) |
| Window source | Blender 5.1 (full application window) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no microphone needed for this take) |
| Output file | `public/library/videos/scripting/python-custom-panel-operator-n-panel-sidebar/screen.mp4` |

---

## Preparation

1. Open Blender 5.1 to the **default startup file** (cube + camera + light).
2. Split the layout so the left 60% is the **3D Viewport** and the right 40% is the **Scripting** workspace Text Editor. (Or use separate workspaces and switch tabs during recording.)
3. Open `blueprint.py` in the Text Editor.
4. Set the Viewport to **Solid** mode, **Material Preview** shading.
5. Make sure the N-Panel sidebar is **visible** (press N to toggle it open).

---

## Shot list

### Shot 1 — The raw scene (0:00–0:20)
- Three mesh objects in the viewport, named with spaces and mixed case: `Panel A Rough`, `Wall Trim.01`, `Floor_Detail`.
- Camera hovers over them at a medium angle.
- **Purpose**: establish "before" state — messy names, no facet tags, default scale not applied.

### Shot 2 — Register the add-on from the Text Editor (0:20–1:00)
- Switch to the Scripting workspace.
- Scroll through `blueprint.py` slowly — let the viewer see the class names: `HoloflowSceneProps`, `HOLOFLOW_OT_apply_transforms`, `HOLOFLOW_PT_export_prep`.
- Press **Run Script** (the ▶ button or Alt+P).
- Cut back to the 3D Viewport — the **HoloFlow** tab should now appear in the N-Panel sidebar on the right.

### Shot 3 — Walk the panel UI (1:00–2:00)
- Click the **HoloFlow** tab.
- Show **Export Prep** panel: Output Dir, Export Scale, Texture Format, Draco Level, Apply Transforms toggle.
- Expand **Active Object** sub-panel — it shows the active object's name and the `holoflow:facet` checkbox.
- Select `Wall Trim.01` — the Active Object sub-panel updates live.

### Shot 4 — Batch rename (2:00–2:30)
- Select all three objects (A).
- In the N-Panel → Active Object sub-panel, click **Rename → snake_case**.
- The object names in the Outliner instantly update to `panel_a_rough`, `wall_trim_01`, `floor_detail`.
- Close-up cut of the Outliner to show the change.

### Shot 5 — Tag holoflow:facet (2:30–3:00)
- Select `panel_a_rough`.
- In the N-Panel, click **Tag Facet**.
- Switch to the **Properties** panel → Object Properties → Custom Properties.
- Show `holoflow:facet = 1` now present on the object.

### Shot 6 — Apply transforms + Export (3:00–3:45)
- Select all objects (A).
- Click **Apply All Transforms** — a brief INFO bar message confirms it.
- Set Output Dir to `//exports/`.
- Click **Export Selected GLB** (the large button at the bottom of the panel).
- Open the file browser to confirm `untitled.glb` appeared in `exports/`.

### Shot 7 — Outro (3:45–4:00)
- Return to the 3D Viewport, deselect all, orbit the camera 90°.
- Fade to black.

---

## OBS Scene configuration

```
Sources:
  [Window Capture]  → Application: Blender
  [Text]            → "HoloFlow Studio — N-Panel Add-on (Blender 5.1)" (bottom-left, 24pt)

Filters on Window Capture:
  Crop/Pad: none (full 1920×1080)
  Colour Correction: none

Output:
  Recording Path: <absolute path to screen.mp4>
  Format: MKV → remux to MP4 after recording
  Video Bitrate: 8000 Kbps (CQP 18 for NVENC, RF 18 for x264)
  Audio Bitrate: none (tracks disabled)
```

---

## Post-processing

- Trim to ≤ 4 min in DaVinci Resolve or ffmpeg:
  ```
  ffmpeg -i raw_screen.mkv -ss 0 -t 240 -c:v libx264 -crf 18 -preset slow \
         -an -movflags +faststart screen.mp4
  ```
- Add lower-third title card at 0:00: **"bpy.types.Panel + Operator — N-Panel Sidebar (Blender 5.1)"** using a 700ms fade-in.
- No colour grade required — Blender's default UI is already colour-neutral.
