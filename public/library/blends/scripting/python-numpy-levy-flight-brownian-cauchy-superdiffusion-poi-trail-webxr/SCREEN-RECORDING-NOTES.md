# Screen Recording Notes — Lévy Flight & Brownian Motion

**Target file:** `public/library/videos/scripting/python-numpy-levy-flight-brownian-cauchy-superdiffusion-poi-trail-webxr/screen.mp4`

## OBS / Windows Game Bar setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off |
| Output format | MP4 (H.264) |
| Bitrate | 8 000 kbps |

## What to record

1. **Open Blender 5.1 → Scripting workspace**
2. Load `blueprint.py` into the text editor. Scroll slowly through the file, pausing on:
   - The `_cms_stable_steps()` function — explain CMS formula visually
   - The `generate_walk()` function — three modes side by side
   - The `walk_to_nurbs()` helper — NURBS clamped spline setup
3. **Run the script** (Alt+P) — show the three coloured NURBS curves appear in the viewport
4. **Viewport: Rendered mode (Z)** with EEVEE Next — bloom glow visible
5. **Orbit the camera** around the three walks:
   - Teal blob (Brownian): compact, evenly spread
   - Violet (Lévy α=1.5): moderate jumps visible
   - Amber (Cauchy α=1): wild long-range flights, tight clusters
6. Select each object, **Tab into Edit Mode** to show the underlying NURBS control polygon — demonstrates how the CHUNK_SIZE segments connect
7. **Material preview**: click into one material node tree, show the EmissionStrength=3.5

## Trim points

- **Start recording** just before running the script (so the viewer sees the three objects appear)
- **Stop recording** after ~30 s of viewport orbit

## Naming

Save as `screen.mp4` in the target directory above.
