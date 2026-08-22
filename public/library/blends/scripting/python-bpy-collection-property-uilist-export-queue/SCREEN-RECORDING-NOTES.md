# Screen Recording Notes
## Tutorial: CollectionProperty + UIList Export Queue Panel
### Blender 5.1 — `public/library/videos/scripting/python-bpy-collection-property-uilist-export-queue/screen.mp4`

---

## Software

| Tool | Setting |
|------|---------|
| OBS Studio / Windows Game Bar | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output | MP4 (H.264) or lossless → re-encode |

---

## Scene Setup (before hitting Record)

1. Open Blender 5.1 with a default scene.
2. Switch to the **Scripting** workspace.
3. Open `blueprint.py` in the Text Editor.
4. Press **Alt+P** to run the script — three placeholder objects appear and
   the "Export Queue" panel opens in **View 3D → N-panel → Holoflow**.

---

## Shot List (target: 60–90 seconds)

| # | Action | Notes |
|---|--------|-------|
| 1 | Pan to N-panel, show empty queue | Show the empty list widget |
| 2 | Click **+** (Add) three times | Each click adds a row; point at Object picker |
| 3 | Set each row's object via the eyedropper/picker | Explain PointerProperty |
| 4 | Toggle the checkbox on row 2 (exclude it) | Show non-destructive exclude |
| 5 | Change Draco level on row 1 to 4 | Show compact per-item control |
| 6 | Click ↑ / ↓ arrows to reorder rows | Explain move operator |
| 7 | Hover over row 3, click **−** (Remove) | Show remove + index clamp |
| 8 | Click **Batch Export Queue** | Show Info bar message with export count |
| 9 | Open `//exports/` folder in file browser | Confirm GLB files present |

---

## Editing

- Cut between shots; no colour grade needed.
- Add captions for the key vocabulary: `CollectionProperty`, `UIList`,
  `active_index`, `template_list()`.
- Target duration: 60–90 seconds.
- Export at 1920 × 1080, 30 fps, H.264, CRF 22.
- Filename: `screen.mp4` → place in the videos folder alongside `viewport.mp4`.
