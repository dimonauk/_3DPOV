# Screen Recording Notes — Sculpt Face Sets: Zone Masking

**Target file:** `public/library/videos/sculpting/sculpt-face-sets-zone-masking-vrm-retopo/screen.mp4`

---

## OBS / Game Bar settings

| Setting | Value |
|---------|-------|
| Window source | Blender 5.1 (fullscreen or maximised) |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | OFF — no mic, no desktop audio |
| Format | MP4 / H.264 |

---

## Scene to open

Run `blueprint.py` first (Scripting workspace → Run Script). This creates:
- `head_proxy` UV sphere with four coloured face-set zones visible as vertex colours
- Four vertex groups: `hs_zone_01` … `hs_zone_04`
- Material: `face_set_zones` using Vertex Color node

---

## Recording sequence (~90 seconds)

### Part 1 — Zone overview (0:00–0:20)
1. Material Preview mode (`Z` → Material Preview or click sphere icon in header).
2. Rotate the head proxy to show all four colour bands.
3. In the **Outliner**, click the eye icon on `head_proxy` to confirm it's visible.

### Part 2 — Enter Sculpt Mode + see face sets (0:20–0:45)
1. Select `head_proxy`, press `Ctrl+Tab` → **Sculpt Mode**.
2. In the top Viewport Shading dropdown: enable **Face Sets** overlay (Overlay menu → Face Sets checkbox).
3. The coloured zones now appear as Blender's native face-set colour overlay.
4. Hover the cursor over Zone 1 (red/cranial top). Press `H` to **hide** that zone.
   Blender greys it out — the rest of the mesh is still visible.
5. Press `Alt+H` to **show all** face sets again.

### Part 3 — Mask from face set (0:45–1:10)
1. In the tool header, switch to the **Mask** brush (`Ctrl+M` shortcut).
2. Press `Ctrl+W` while hovering Zone 2 (green/facial) — this flood-fills a
   mask over the entire Zone 2 face set.
3. Press `A` to **invert the mask** — now Zone 2 is unmasked and the rest is masked.
4. Pick the **Draw** brush and make a stroke across Zone 2 — note that strokes
   respect the mask and only affect Zone 2.

### Part 4 — Convert face sets to vertex groups (1:10–1:30)
1. Return to **Object Mode** (`Tab`).
2. Open **Properties → Object Data (mesh icon) → Vertex Groups** panel.
3. Show the four `hs_zone_01` … `hs_zone_04` groups.
4. Select `hs_zone_02`, click **Select** at the bottom — Blender selects the
   facial-plane vertices.
5. Enter **Weight Paint Mode** — show the weight gradient for Zone 2.

### Part 5 — Export GLB (1:30–1:40)
1. Return to Object Mode.
2. **File → Export → glTF 2.0 (.glb/.gltf)**
3. In the export panel: ensure **Data → Attributes → Vertex Colors** is ticked
   (exports `hs_zone_col` as `COLOR_0`).
4. Click **Export glTF 2.0** — `sculpt_face_sets_zones.glb` is written next to
   the .blend file.

---

## Tips
- If the Face Sets overlay is not visible, check **Viewport Overlays → Sculpt Mode Overlays → Face Sets**.
- Face-set colours in Blender are random per-session; the zone ordering (1–4)
  is what matters, not the specific hue.
- The `hs_zone_col` vertex-colour attribute is readable in Three.js as
  `geometry.attributes.color` when the GLB is loaded with `vertexColors: true`
  on a `MeshStandardMaterial`.
