# Screen-Recording Notes — Thomas Cyclically Symmetric Attractor

**Target file:** `public/library/videos/scripting/<slug>/screen.mp4`

---

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (silent demo) |
| Format | MP4 / H.264, CRF 18 |

---

## Shot List

### 0:00 – 0:20 · Blueprint overview
- Open `blueprint.py` in the Scripting workspace.
- Scroll slowly to the **DIVERGENCE & FIXED POINTS** block.
- Pause on the Jacobian circulant eigenvalue analysis — this is the visual
  explanation of WHY the orbit wraps around P±.

### 0:20 – 0:50 · Run blueprint
- Click **Run Script** (► button).
- Switch to 3-D Viewport (Workbench Solid, Vertex Colour mode).
- Orbit the viewport slowly around the tube with middle-mouse drag.
- Note the distinctive single-lobe shape compared with two-scroll attractors.

### 0:50 – 1:20 · Shape key morphs
- Open Properties → Object Data → Shape Keys.
- Drag **SK_LowB** to 1.0 (b=0.17): orbit widens, stronger dissipation contrast.
- Return to 0. Drag **SK_NearTorus** to 1.0 (b=0.22): orbit flattens toward
  a quasiperiodic torus — this is the pre-bifurcation signal.
- Return to 0. Drag **SK_Periodic** to 1.0 (b=0.30): orbit collapses to
  a closed limit cycle around P±.

### 1:20 – 1:50 · Speed colour readout
- In Workbench shading panel, confirm Colour Type = Vertex.
- Point at the bright amber regions (high speed — near origin where sin(·)
  forces are large and dissipation b·x is small).
- Point at the cobalt regions (slow — near the Shilnikov P± centres where the
  orbit winds many tight loops).

### 1:50 – 2:10 · GLB export check
- File → Export → glTF 2.0.
- Confirm: Draco compression level 6, WebP textures, +Y up, morph targets on.
- Cancel (don't export for real during tutorial unless on a session with disk).

---

## Clipping Guidance

- Record the full 2:10 run in one take.
- Trim start/end silence in DaVinci Resolve or ffmpeg:
  `ffmpeg -i raw.mp4 -ss 0 -to 130 -c:v libx264 -crf 18 screen.mp4`
