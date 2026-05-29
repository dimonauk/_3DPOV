# Screen Recording Notes — Curves-Based Hair Grooming

**Target file**: `public/library/videos/rigging/curves-hair-grooming/screen.mp4`

## OBS settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Disabled (no mic needed) |
| Encoder | x264, CRF 20 |
| Output | screen.mp4 |

## Shot list (approx. 4–6 min)

### 1 — Open the .blend (0:00–0:20)
- Open `hair_grooming_head.blend`
- Show the Outliner: `head_scalp` mesh + `hair_strands` Curves object
- Click `hair_strands` so the Properties panel shows Curves data properties

### 2 — Curves data panel (0:20–0:50)
- Properties → Object Data (the wavy-line icon for Curves)
- Point at **Surface** field — shows `head_scalp`
- Point at **Surface UV Map** — shows `UVMap`
- Point at **Viewport Display → Radius** — controls rendered thickness
- Explain: this binding is what lets the sculpt tools snap roots to the mesh

### 3 — Spreadsheet: POINT domain (0:50–1:20)
- Open **Spreadsheet** editor in a split viewport
- Select the `hair_strands` object in the spreadsheet header
- Set domain to **POINT** — show `position` (vec3) and `radius` (float)
- Change domain to **CURVE** — show it's empty (we have no per-curve attrs yet)
- This confirms the seeded positions from blueprint.py are correct

### 4 — Sculpt mode grooming tools (1:20–3:00)
- Switch to **Sculpt Mode** (Tab or Header → Sculpt Mode) with `hair_strands` active
- Header shows the hair grooming toolbar: Add, Comb, Snake Hook, Smooth, Pinch,
  Puff, Slide, Grow/Shrink, Trim, Delete
- **Comb tool** (C): brush over some strands — drag them sideways to flatten a
  section and show how roots stay pinned to the surface
- **Smooth tool** (S): run over the combed area to reduce kinks
- **Trim tool**: hold and drag a line across stray strands — they clip to the line
- Undo (Ctrl+Z) back to the seeded state so the final .blend is clean

### 5 — EEVEE Next render preview (3:00–3:45)
- Press **Z → Rendered** to switch to rendered shading
- Rotate around the head slowly — show the Principled Hair BSDF specular lobe
- Lower the **Melanin** slider in the hair material node to 0.3 and show the
  colour shift to warm brown / blonde — then undo

### 6 — GN ribbon setup (3:45–5:00)
- Add a new Plane object
- Add a **Geometry Nodes** modifier, name it `CurvesToRibbons`
- In the GN editor: **Object Info** (target = `hair_strands`) →
  **Curve to Mesh** (Profile = QuadrilateralPrimitive, Width = 0.004, Height = 0.001) →
  **Set Material** (hair material) → **Group Output**
- Show the ribbons appear on the plane — flat mesh strips following each strand
- This is the export-ready geometry for WebXR GLB

### 7 — GLB export (5:00–5:30)
- Select `head_scalp` + the ribbon plane (the GN result)
- File → Export → glTF 2.0 → GLB
- Enable **Apply Modifiers** and **Draco Mesh Compression** level 6
- Export to `hair_grooming_head_full.glb`

## End card
Cut recording, save the OBS output as `screen.mp4` to
`public/library/videos/rigging/curves-hair-grooming/`.
