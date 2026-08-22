# Screen Recording Notes
## python-custom-pie-menu-rigging-export-toolkit

**Target file:**
`public/library/videos/scripting/python-custom-pie-menu-rigging-export-toolkit/screen.mp4`

---

## Software

- **OBS Studio 30+** (Windows / Linux / macOS)
  — or Xbox Game Bar (Win+G) if on Windows and OBS is unavailable.

## Capture settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF (voiceover added in post if needed) |
| Format | MP4 / H.264 / CRF 18 |

Use Window Capture (not Display Capture) to avoid recording other
applications if you alt-tab during the session.

---

## Blender layout before recording

1. Open `blueprint.py` in the Scripting workspace and run it once
   (Alt+P) to build the demo scene and register the pie.
2. Switch to the **Layout** workspace.
3. Set 3D View shading → **Solid**, Cavity: **Screen** (shows prop edges).
4. Enable **Overlays → Statistics** so the Info header changes are visible.
5. Maximise the 3D View with **Ctrl+Space**.

---

## Takes

### Take 1 — Script intro (≈ 30 s)

- Switch to Scripting workspace.
- Scroll through `blueprint.py`; pause on `class HOLOFLOW_MT_pie_rigging_export`
  and the `draw(self, ctx)` method.
- Highlight the layout.menu_pie() line and the eight `pie.operator()` calls.
- Run Script (Alt+P) — confirm "Holoflow Pie Menu registered" in the console.

### Take 2 — Pie overview (≈ 30 s)

- Switch to Layout workspace.
- Click `Prop_Panel_A` to select it.
- Press **Shift+Space** — pie appears.
- Hover slowly over all eight slots in order (W → E → S → N → NW → NE → SW → SE),
  pausing on each for ≈ 1 s so labels are legible.
- Dismiss without clicking (RMB or Escape).

### Take 3 — Tag Facet (≈ 25 s)

- Select `Prop_Panel_B`.
- Press **Shift+Space** → move cursor North → click **Tag Facet**.
- Watch Info bar: "holoflow:facet toggled on 1 mesh(es)".
- Open Object Properties → Custom Properties panel.
- Show `holoflow:facet = 1`.
- Press **Ctrl+Z** — value reverts to 0 (undo chain working).

### Take 4 — Quick GLB Export (≈ 25 s)

- Select `Prop_Panel_A`.
- The .blend must be saved first (Ctrl+S if needed).
- Press **Shift+Space** → cursor East → **Quick GLB**.
- Info: "GLB → /path/to/exports/prop_panel_a.glb".
- Open the File Browser (Ctrl+O) and navigate to the `exports/` folder to
  show the `.glb` file exists.

### Take 5 — Apply All Modifiers (≈ 20 s)

- Press A to select all three props.
- Press **Shift+Space** → cursor South → **Apply Modifiers**.
- In Properties Editor → Modifier tab — confirm modifier list is empty.

### Take 6 — Mark Seams (≈ 20 s)

- Select `Prop_Untagged`.
- Press **Shift+Space** → cursor West → **Mark Seams**.
- Press **Tab** to enter Edit mode.
- Show red seam edges tracing the top face perimeter.
- Press **Tab** to return to Object mode.

### Take 7 — Sidebar & Reset (≈ 20 s)

- Select `Prop_Panel_B`.
- Press **Shift+Space** → cursor NW → **Sidebar** — N-Panel opens/closes.
- Press **Shift+Space** → cursor NE → **Reset Xform** — delta transform clears.

### Take 8 — Outro (≈ 15 s)

- Press **Shift+Space** one final time.
- Hover all 8 slots slowly.
- Let pie dismiss without action (Escape).

---

## Export settings for final MP4

- Container: MP4
- Video codec: H.264
- Constant rate factor: 18 (OBS quality slider ≈ 80)
- Audio: none
- Maximum duration: 3 min 30 s

Trim dead air at head/tail before export.
