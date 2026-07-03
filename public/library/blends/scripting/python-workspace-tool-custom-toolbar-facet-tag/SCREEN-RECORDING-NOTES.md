# Screen Recording Notes
## Python WorkSpaceTool — holoflow:facet Click-Tagger (Blender 5.1)

**Output:** `public/library/videos/scripting/python-workspace-tool-custom-toolbar-facet-tag/screen.mp4`

### Software

| Tool | Setting |
|------|---------|
| OBS Studio | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Codec | x264, CRF 18 |

---

### Session prep

1. Open Blender 5.1, Scripting workspace.
2. Open `blueprint.py` → **Run Script**.  
   Confirm "Demo grid built." in the Info bar.
3. Switch to **Layout** workspace.  
   Set viewport shading to **Material Preview** (Z → Material Preview).

---

### Take list

| # | Duration | Content | Why |
|---|----------|---------|-----|
| 1 | 15 s | Properties → Object Data → Attributes panel. Show `holoflow:facet` INT attribute, domain=FACE. Scroll the attribute list. | Proves the attribute was created by blueprint.py |
| 2 | 20 s | Spreadsheet editor (open beside 3D viewport). Domain = Face. Column `holoflow:facet` visible, checkerboard 0/1 values. | Shows attribute data per-face |
| 3 | 10 s | Press Tab to enter Edit Mode. Press T to open toolbar. Scroll down to the separator — "HF Facet Tag" tool visible. | Proves tool registration |
| 4 | 30 s | Activate HF Facet Tag. Header bar shows "Enable" toggle and label. Click several orange faces: they stay orange. Click grey faces: they turn orange. Show Spreadsheet updating values live. | Core feature demonstration |
| 5 | 20 s | Uncheck "Enable" in header bar. Click several orange faces: they turn grey (value → 0). Spreadsheet shows 0. | Shows bi-directional toggle |
| 6 | 15 s | Press Tab → Object Mode. Object Data → Attributes → `holoflow:facet` still present. Values match what was set in Edit Mode. | Confirms bmesh write persists to mesh data |
| 7 | 15 s | File → Export → glTF 2.0. Tick "Include → Custom Properties". Export. Open the GLB in a hex editor or glTF Validator and show the `extras` object containing `holoflow:facet`. | Shows WebXR pipeline connection |
| 8 | 10 s | Back in Blender: Undo (Ctrl+Z) three times. Spreadsheet shows values rolling back. | Confirms REGISTER+UNDO on the operator |

---

### Cursor / focus hints

- When showing the toolbar (Take 3): zoom in on the T-panel so "HF Facet Tag" fills at least ¼ of the screen width.
- Take 4: keep the Spreadsheet editor open and visible beside the 3D viewport so attribute changes are legible.
- Take 7: if no hex editor available, use the Khronos glTF Validator web tool at `validator.khronos.org/` — drag-drop the GLB and expand the `extras` JSON.

---

### Edit notes

Cut order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8.  
Add lower-thirds: "Object Data → Attributes", "Spreadsheet (FACE domain)", "HF Facet Tag tool active", "holoflow:facet in glTF extras".  
No background music.
