# Screen Recording Notes — Raup Shell Tutorial

**Output file:** `public/library/videos/scripting/python-numpy-raup-mollusc-shell-morphospace-helicoidal-coiling-poi-head-webxr/screen.mp4`

## OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Encoder | x264 / CRF 18 |
| Format | MP4 |

## Recording Script (~12 minutes)

### 1 · Theory (2 min)
- Open a web browser alongside Blender, navigate to the tutorial page
- Explain the 4 Raup parameters (W, D, T) at the whiteboard or on screen
- Show the three iconic shell types: ammonite, nautilus, turritella (image search OK)

### 2 · Code walkthrough (3 min)
- Open `blueprint.py` in the Scripting workspace
- Walk through: surface equations → meshgrid → bmesh quad strip → shape key loop
- Highlight: `W ** (TH / (2 * np.pi))` — the exponential coiling law
- Highlight: `endpoint=False` on the phi linspace — why the ring must not double the seam vertex

### 3 · Live run (2 min)
- Press **Alt+P** with `blueprint.py` loaded
- Watch the console: vertex count, shape key list, vertex colour confirmation
- Orbit around the mesh in Viewport — show the open aperture and columella

### 4 · Shape key demo (2 min)
- Object Properties → Shape Keys panel
- Drag **Ammonite** → 0.0, drag **Turritella** → 1.0 — show the tower emerging
- Drag **Cone** → 1.0 to show intermediate spire height
- Return all to 0.0 and Ammonite to 1.0 for the base display

### 5 · Viewport render (1 min)
- Load `record.py` → Alt+P to set up keyframes
- Press **Ctrl+F12** — let it render (120 frames, ~2 min off-camera)
- Show the resulting `viewport.mp4` in Blender's Video Sequence Editor briefly

### 6 · Export GLB (1 min)
- File → Export → glTF 2.0
- Compression: Draco level 6, Format: glTF Binary (.glb)
- Include: Mesh, Shape Keys (Morph Targets), Vertex Colors
- Output: `hf_raup_shell.glb`

### 7 · Wrap (1 min)
- Note the macro file at `tools/blender-addon/holoflow_macros/raup_shell.py`
- Link to the 3D Print Toolbox tutorial for taking the shell to FDM/resin

## Stop Recording
- Stop OBS → save to the `videos/` path above
- Verify file plays at 1920×1080, ~12 min, ≤ 1 GB
