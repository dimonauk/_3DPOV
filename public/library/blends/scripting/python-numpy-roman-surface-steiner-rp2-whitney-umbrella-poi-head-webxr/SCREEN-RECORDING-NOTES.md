# Screen Recording Notes — Steiner Roman Surface

**Target file:** `public/library/videos/scripting/python-numpy-roman-surface-steiner-rp2-whitney-umbrella-poi-head-webxr/screen.mp4`

---

## Setup

1. Run blueprint:
   ```bash
   blender --background --python blueprint.py
   ```
2. Open the generated `hf_roman_surface.blend` in Blender 5.1 (double-click or `blender hf_roman_surface.blend`).
3. Switch to **Viewport Shading → Solid → Color: Vertex**.
4. Set window to **1920 × 1080** (drag window edges or use Display preferences).

---

## OBS Configuration

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off |
| Output format | MP4 (H.264) |
| Bitrate | 8000 kbps |

---

## Shot Sequence (≈ 90 seconds)

### 1. Establishing orbit (0–15 s)
- Numpad 5 → orthographic
- Numpad 1 → front view
- Middle-mouse drag — slow orbit 360° around the surface
- Pause at each of the **three coordinate-axis double-line segments** (visible as seam lines running through the centre)

### 2. Singularity tour (15–35 s)
- Zoom in on one **Whitney umbrella tip** (the pointed extremity along each axis)
- Comment in OBS overlay (optional) or narrate: *"Six Whitney umbrella singularities — each a fold catastrophe z²=xy²"*
- Orbit slowly so the three double lines crossing the interior become visible

### 3. Shape-key demo (35–70 s)
- Open **Properties → Object Data → Shape Keys**
- Scrub each shape key in turn:
  - **SK_Oblate** → value 0→1→0 (flattened disc)
  - **SK_Elongate** → value 0→1→0 (elongated wand)
  - **SK_Compact** → value 0→1→0 (compact sphere-like)

### 4. Material comparison (70–90 s)
- Switch shading to **Material Preview** (Z key → Material Preview)
- The Principled BSDF metallic finish with emission glow shows in the preview
- Final slow orbit to closing pose

---

## Notes

- The self-intersection lines (three segments along coordinate axes) are NOT a mesh error — they are the genuine topology of the Roman surface.
- Z-fighting (flickering) at the self-intersection region is expected and geometrically correct.
- Use **Overlay → Statistics** to confirm: ~6241 vertices, ~6241 quads ≈ 12 k tris.
