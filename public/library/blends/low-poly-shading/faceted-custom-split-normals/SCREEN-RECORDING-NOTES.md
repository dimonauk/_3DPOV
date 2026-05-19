# Screen Recording Notes — Faceted Custom Split Normals

**For Dimona / whoever sits at the bench.**
These notes tell you exactly what to record for `screen.mp4`. No editing
needed — one continuous take is fine; viewers can scrub.

---

## Software

| Tool | Setting |
|------|---------|
| OBS Studio (or Windows Game Bar Win+G) | Window capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** — no mic needed; the tutorial has text narration |
| Output | `public/library/videos/low-poly-shading/faceted-custom-split-normals/screen.mp4` |

---

## Pre-recording checklist

- [ ] Blender 5.1 open, default scene loaded (just the cube is fine — you'll delete it)
- [ ] Preferences → Interface → Display → **Scale 1.25** so buttons are readable at 1080p
- [ ] Set viewport shading to **Solid** → **Flat** (the studio look)
- [ ] Properties panel open on the right (N key)
- [ ] Overlays on: **Face Orientation**, **Statistics** ticked

---

## Shot list (one continuous take, ~10–12 minutes)

### 0:00 — Open scene
Show the default startup scene briefly. Delete the default cube (X, Delete).

### 0:20 — Add an icosphere
Add > Mesh > ICO Sphere. In the operator panel (bottom-left) set
**Subdivisions = 1**. Object stays selected.

### 0:40 — Show smooth appearance
Change viewport shading: press Z → Material Preview. The sphere looks smooth
— every face blends into its neighbours. This is the problem.

### 1:00 — Shade Flat
Right-click the sphere → **Shade Flat**. Now the facets are visible in the
viewport. Explain out loud (or via a text overlay later): *"Shade Flat is a
display setting. It will NOT survive the GLB export."*

### 1:30 — Open the Python console
Header area: Editor type → Python Console. Show `bpy.context.object.data`
and `bpy.context.object.data.has_custom_normals` — it returns `False`.

### 2:00 — Run the blueprint
Scripting workspace. Open `blueprint.py` from the library. Run it (▶ button
or Alt+P). Let the console output scroll — point to:
```
[faceted] has_custom_normals: True
[faceted] loops: 240, polygons: 80
[smooth]  has_custom_normals: False
```

### 3:00 — Inspect both spheres
Switch to Solid view, Flat shading. Select `faceted_icosphere` — in the
Properties panel (Mesh Data > Custom Split Normals) the section now appears.
Select `smooth_icosphere` — the section is absent.

### 3:40 — Viewport normal overlay
Enable Overlays → Normals → Face (the small orange lines). On `faceted_icosphere`
every normal arrows straight out from its face. On `smooth_icosphere` the normals
fan out, averaging neighbours.

### 4:20 — Material preview
Switch to Material Preview. Show how the specular highlight walks discretely
across the faceted sphere (jumps from face to face) versus the smooth sphere
(continuous gradient). This is the visual signature of the technique.

### 5:00 — Export to GLB
File → Export → glTF 2.0. Show the key settings:
- Format: **GLB**
- Include Normals: **ticked**
- +Y Up: **ticked**
Hit Export. Navigate to the output path shown in blueprint.py.

### 5:40 — Vertex count comparison (optional but great)
In the Properties panel with `faceted_icosphere` selected: Mesh → Statistics
(enable in Overlays). Show vertex count. Then select `smooth_icosphere` and
compare. Explain: *"The custom normals split every shared vertex at a hard
edge, so the GLB has more vertices than Blender's internal count. That's
expected and correct."*

### 7:00 — Open the GLB in the browser (optional)
Drag the exported `.glb` into https://gltf-viewer.donmccurdy.com (or any
local Three.js viewer). Show it looks identical to the Blender viewport — the
facets survived the round-trip. This is the proof.

### 8:30 — Run record.py (optional bonus shot)
Scripting workspace → open `record.py`, run it. Let the terminal show the
render progress. Skip ahead to the finished `viewport.mp4` in File Explorer
and play it.

### 10:00 — Wrap
End recording.

---

## Trimming hints (for post)

- Cut the file-browser navigation down to 10 seconds max.
- Keep the terminal output takes — viewers want to see the `has_custom_normals`
  confirmation.
- No need to add captions — the tutorial page carries the narration.
