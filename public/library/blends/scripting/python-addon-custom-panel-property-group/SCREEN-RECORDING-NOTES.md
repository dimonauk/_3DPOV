# Screen-Recording Notes — Python Add-on: Custom Panel + PropertyGroup + Operator

**Target file:** `public/library/videos/scripting/python-addon-custom-panel-property-group/screen.mp4`

---

## Software

| Tool | Setting |
|------|---------|
| OBS Studio (≥ 29) or Windows Game Bar (Win+G) | Window capture — select "Blender" |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no microphone needed) |
| Output | MP4 / H.264 |

---

## Blender layout before recording

1. Open Blender 5.1.  File → New → General.
2. Go to **Scripting** workspace (top bar tab).
3. In the **Text Editor** pane, click **Open** and load `blueprint.py`.
4. Press **Alt + P** to run it (or click the ▶ Run Script button).
   You should see "1 class registered" in the Info header.
5. Switch to the **Layout** workspace.
6. Press **N** in the 3D Viewport to open the N-panel.
7. Click the **Holoflow** tab — the Quick Facet panel should appear.
8. Select the default cube (click it).

---

## Scene to record

### Take 1 — Installing and running (≈ 90 s)

| Timestamp | Action |
|-----------|--------|
| 0:00 | Show Scripting workspace with `blueprint.py` loaded |
| 0:10 | Press **Alt + P** — highlight the N-panel appearing |
| 0:20 | Switch to Layout workspace, open N-panel (N), click Holoflow tab |
| 0:30 | Show the three properties: Normal Mode, Bevel Width, Segments |
| 0:40 | Select the default cube; click **Apply Quick Facet** |
| 0:55 | Rotate around the cube to show flat facets + chamfer edge |
| 1:10 | Press **Ctrl + Z** to undo — show it reversing cleanly |
| 1:20 | Change Normal Mode to Auto, increase Bevel Width to 0.05, click again |
| 1:30 | Show soft-edge result on the cube |

### Take 2 — Installing as extension (≈ 60 s)

| Timestamp | Action |
|-----------|--------|
| 0:00 | Open **Edit → Preferences → Get Extensions** |
| 0:10 | Click **Install from Disk** (top-right arrow icon) |
| 0:15 | Navigate to `tools/blender-addon/holoflow_extensions/quick_facet/` and select `__init__.py` |
| 0:25 | Show the extension appearing in the list as "Holoflow Quick Facet" |
| 0:35 | Return to 3D Viewport — Holoflow N-panel tab visible without Alt+P |
| 0:50 | Demonstrate operator on a UV Sphere |

---

## Tips

- Zoom the N-panel so the Holoflow tab fills ≥ 40 % of the screen width.
- Set Blender's UI scale to **1.5×** (Preferences → Interface → Resolution Scale)
  so text is readable at 1080p.
- Use **Solid** viewport shading (press **Z → Solid**) for the first take so facets
  are clearly visible without noise.
- Trim the recording to remove dead time between clicks.

---

## File naming

```
screen.mp4      — final edited recording (replaces placeholder)
screen_raw.mp4  — unedited capture (optional, for re-editing)
```
