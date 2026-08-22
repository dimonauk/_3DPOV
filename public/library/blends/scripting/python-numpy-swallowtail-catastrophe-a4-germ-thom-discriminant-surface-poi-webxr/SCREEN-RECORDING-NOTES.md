# Screen Recording Notes — Swallowtail Catastrophe Disc Poi

**Target file:** `public/library/videos/scripting/python-numpy-swallowtail-catastrophe-a4-germ-thom-discriminant-surface-poi-webxr/screen.mp4`

## OBS Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | **Off** (no mic, no desktop audio) |
| Output format | MP4 / H.264, CRF 20 |

## Recording Sequence (~5 min)

### 1. Script execution (0:00 – 0:45)
1. Open a fresh Blender 5.1 scene (File → New → General).
2. Switch the bottom panel to **Scripting** workspace.
3. Click **Open** → navigate to `blueprint.py` → **Open Text Block**.
4. Press **Run Script** (▶).
5. Watch the status bar: *"[Holoflow] Swallowtail done — 5808 verts, 5705 quads"*.
6. Switch to **Layout** workspace — the swallowtail disc should fill the viewport.

### 2. Geometry inspection (0:45 – 1:45)
1. Press **Numpad 5** → orthographic; orbit with **MMB** to inspect from several angles.
2. Press **Z** → Wireframe to show the NX×NA quad grid.
3. Return to Solid shading — note the vertex colour gradient (gold cusp throat → violet fold wings).
4. In **Object Data Properties → Shape Keys**, click `Swallowtail_Tight` → drag its Value
   slider from 0 to 1 and back.  The cusp throat should visibly pinch.
5. Click `Swallowtail_Flat` → drag Value 0→1 to see the c-axis collapse (caustic view).
   Return to 0.

### 3. Material preview (1:45 – 2:15)
1. Switch renderer to **EEVEE Next** (top bar dropdown).
2. Press **Z → Rendered** to see emission + bloom.
3. Hold **MMB** and slowly orbit — the gold-to-violet gradient and the self-intersection tail
   should be clearly visible.

### 4. GLB check (2:15 – 3:00)
1. File → Import → glTF 2.0 (.glb) → navigate to `glbs/scripting/.../hf_swallowtail.glb`.
2. Select the imported object → **Object Data Properties → Shape Keys** → confirm three
   keys (Basis, Swallowtail_Tight, Swallowtail_Flat) are present.
3. In **Vertex Color** paint mode, confirm `SCat` attribute is visible.

### 5. Wrap-up (3:00 – 3:30)
1. Return to Scripting workspace, scroll through `blueprint.py` to show the parametrisation
   comment block at the top.
2. Stop recording.

## Tips
- **Lighting the self-intersection:** with EEVEE bloom at 0.35 / 4.0 / 0.55, the
  violet wing-tips glow distinctly against the darker background.
- **Tail visibility:** orbit to ~30° elevation and −45° azimuth — the swallowtail
  tail (self-intersection fold) reads best from this angle.
- If the swallowtail appears very small, press **Numpad .** with it selected to frame it.
