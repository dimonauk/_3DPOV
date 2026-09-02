# Screen Recording Notes — Genesio–Tesi Attractor

## Target file
`public/library/videos/scripting/python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr/screen.mp4`

## OBS / Game Bar settings
- **Window source**: Blender (full window, not display capture)
- **Resolution**: 1920 × 1080
- **Frame rate**: 30 fps
- **Audio**: OFF (no commentary needed for library record)
- **Format**: MP4 / H.264

## What to record (approx 90 seconds)

### Step 1 — Open Blender 5.1 (0:00–0:10)
Open a fresh General project. Confirm Blender version in Help → About.

### Step 2 — Paste and run blueprint.py (0:10–0:45)
- Open Scripting workspace (top bar tab).
- New text block. Paste full contents of `blueprint.py`.
- Click **Run Script** (▶) or press Alt+P.
- Switch to 3D Viewport. The `hf_genesio_tesi_poi` object appears as a
  cobalt-to-amber tube tracing a single asymmetric lobe.

### Step 3 — Inspect the attractor (0:45–1:10)
- Orbit with middle-mouse-drag: show the single-wing topology. Note the
  orbit never crosses itself — the tube coils monotonically around P₁ = (1,0,0).
- In the Properties → Object Data Properties → Shape Keys panel, slide
  `SK_DenseWrap` to 1.0: the tube visibly expands as c₃ drops from 0.44
  to 0.30 — weaker damping, larger orbit.
- Return `SK_DenseWrap` to 0.0. Slide `SK_BorderChs` to 1.0: the orbit
  contracts toward a near-periodic orbit as c₃ → 0.55.
- Return to Basis.

### Step 4 — Vertex colour (0:10–1:25)
- In Viewport Shading (top-right overlay dropdown), switch Material Preview
  to Attribute shade and select `GT_Speed`. The speed gradient from
  cobalt (slow approach to P₁) to amber (fast escape) is visible.

### Step 5 — Save (1:25–1:30)
File → Save As → `hf_genesio_tesi_poi.blend` in
`public/library/blends/scripting/python-numpy-genesio-tesi-attractor-.../`

## Tips
- Keep Blender maximised. Collapse the outliner if it occludes the 3D viewport.
- The shape-key panel is in Properties (right sidebar) → green triangle icon
  (Object Data Properties) → Shape Keys section. Scroll down if needed.
- After running the script, use Numpad 5 for orthographic and Numpad 4/6/8/2
  to orbit to a good angle before recording shape-key morphing.
