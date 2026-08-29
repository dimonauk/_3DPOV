# Screen Recording Notes — Lorenz-96 Atmospheric Ring Poi

**Target file**: `public/library/videos/scripting/python-numpy-lorenz-96-atmospheric-ring-rk4-bishop-tube-poi-webxr/screen.mp4`

## OBS / Game Bar setup

| Setting | Value |
|---------|-------|
| Capture source | Window — Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264, CRF 20) |

## Shot list (≈ 6–8 minutes total)

### 1. Open a fresh Blender scene (0:00 – 0:30)
- File → New → General
- Viewport shading: **Material Preview** (Z key → Material Preview)
- Delete the default cube, camera, and light

### 2. Paste and run blueprint.py (0:30 – 2:30)
- Scripting workspace → New text block
- Paste the full `blueprint.py` contents
- Click **Run Script**
- The tube appears in the 3-D viewport — rotate with middle-mouse to view all angles
- Narrate: "Lorenz-96 N=8, F=8, two positive Lyapunov exponents"

### 3. Shape-key tour in Properties → Data → Shape Keys (2:30 – 4:30)
- Set **SK_Hopf** to 1.0 — loops become more organised (near-periodic regime)
- Set **SK_Onset** to 1.0 — show the bifurcation threshold (F≈5.76)
- Set **SK_Strong** to 1.0 — dense turbulent tangle
- Return to **Basis** (F=8)

### 4. Vertex colour inspection (4:30 – 5:30)
- Switch shading to **Solid** → Colour → Vertex
- Cobalt segments = slow orbital speed; amber = fast
- Narrate how the colour gradient reveals the attractor's non-uniform time sampling

### 5. Material and export (5:30 – 7:00)
- Viewport shading back to Material Preview
- File → Export → glTF 2.0
  - Apply transforms: ✓
  - Draco compression: Level 6
  - WebP textures: ✓
- Narrate: "+Y-up at export, snake_case root name `lorenz96_poi`"

### 6. Run record.py (7:00 – 8:00)
- New text block → paste `record.py`
- Run Script → Blender renders 300 frames to `viewport.mp4`
- Show the output path in the render properties

## Tips
- Freeze on **SK_Onset** (F=5.76) for a title card — the orbit sits on the edge
  between periodic and chaotic and has the most striking silhouette
- Zoom to orthographic front view (numpad 1) before the shape-key demo
