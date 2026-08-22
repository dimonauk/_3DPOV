# Screen Recording Notes — ArrayModifier Radial Crown & Helix

## Software
OBS Studio (or Windows Game Bar Win+G).

## Capture settings
- Source: Window Capture → Blender 5.1
- Resolution: 1920 × 1080
- Frame rate: 30 fps
- Audio: disabled (tutorial voice-over added in post)

## Output
`public/library/videos/scripting/python-bpy-array-modifier-object-offset-radial-helix-webxr/screen.mp4`
H.264, CRF 18, preset slow.

---

## Shot list

### Shot 1 — empty scene + run blueprint.py (0:00–0:30)
1. Open Blender 5.1 → General template.
2. Select All (A) → Delete.
3. Open Scripting workspace.
4. New text block → paste blueprint.py.
5. Press **Run Script** (Alt+P).
6. Switch to Layout workspace: show the crown and helix in 3D viewport.

### Shot 2 — inspect the crown Empty (0:30–1:10)
1. Select `hf_crown_pivot` Empty in Outliner.
2. Open Properties → Object Properties → Transform.
3. Show `Rotation Z = 45°` (360°/8).
4. Switch to `hf_gem` → Modifier Properties → Crown_Array.
5. Point out: **Fit Type = Fixed Count 8**, **Offset = Object**, `use_relative_offset` is OFF.
6. Scrub the modifier stack — no relative offset displacement.

### Shot 3 — inspect the helix Empty (1:10–1:50)
1. Select `hf_helix_pivot`.
2. Show `Location Z = 0.065 m`, `Rotation Z = 18°`.
3. Select `hf_bead` → Modifier Properties → Helix_Array.
4. Show count = 20. Point out: 20 × 18° = 360°, 20 × 0.065 m = 1.30 m total rise.

### Shot 4 — live editing: change CROWN_N (1:50–2:20)
1. In the Script editor change `CROWN_N = 8` → `CROWN_N = 12`.
2. Re-run script — crown updates to 12 spokes (30° spacing).
3. Revert to 8.

### Shot 5 — orbit and admire (2:20–3:00)
1. Middle-mouse orbit around the scene.
2. Numpad 4 / Numpad 6 to rotate 15° steps, showing radial symmetry.
3. Enable Material Preview (Z → Material Preview) with a simple emission mat.

### Shot 6 — run record.py (3:00–3:20)
1. Open record.py in Script editor.
2. Run Script → viewport.mp4 renders to the videos folder.

---

## Editing notes
- Trim silence > 1 s at shot transitions.
- Add lower-thirds: shot name + bpy API call highlighted.
- Export: 1920×1080 H.264 MP4.
