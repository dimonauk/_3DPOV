# Screen Recording Notes — Bessel Drum Eigenmodes

OBS / Windows Game Bar capture instructions for `screen.mp4`.

---

## OBS settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Bitrate | 8 000 kbps (CBR) |
| Audio | **Off** |
| Output format | MP4 (H.264) |

---

## What to capture (in order)

1. **Workspace** — Switch to Scripting workspace.  Show the empty
   `blueprint.py` code in the text editor.

2. **Paste & run blueprint** — Paste `blueprint.py` into the Blender
   text editor.  Press **Run Script** (▶).  The disc appears in the
   viewport.  Pause 3 seconds on the viewport.

3. **Inspect the mesh** — In the 3D Viewport, press **Numpad 1**
   (front view), then zoom in with scroll-wheel to show the fine
   polar-grid structure.  Return to camera view (**Numpad 0**).

4. **Shape-key panel** — Open Object Properties → Shape Keys panel.
   Slowly scrub the `SK_Mode_0_1` value slider from 0 → 1 → 0 while
   watching the disc cup upward (fundamental dome).

5. **Cycle all six modes** — One by one, set each shape key to 1,
   pause to show the nodal pattern, then return to 0:
   - 0_1: single dome
   - 1_1: fold in half (one white diameter line)
   - 2_1: four quadrants (two diameter lines)
   - 0_2: ring / dome combination (one white circle)
   - 3_1: six sectors (three diameter lines)
   - 1_2: combined circle + diameter

6. **Vertex colour** — With `SK_Mode_1_1` at 1.0, show the
   **Viewport Shading → Solid → Color → Attribute** view to see
   the cobalt/white/amber gradient clearly.  The white line is the
   nodal diameter.

7. **GLB** — Show the `hf_bessel_drum_poi.glb` file in the system
   file manager at the end to confirm export.

---

## Windows Game Bar (quick capture)

1. Focus the Blender window.
2. **Win + G** → **Start recording**.
3. Follow steps 1–7 above.
4. **Win + G** → **Stop recording**.
5. Rename the clip to `screen.mp4` and place it at:
   `public/library/videos/scripting/<slug>/screen.mp4`.

---

## Tips

- Use **Eevee Next** renderer for the fastest viewport.
- Enable **Cavity** shading (Viewport Overlay → Cavity) to make
  the mesh ridges pop visually.
- If the disc appears black, check that the material's Attribute
  node has `attribute_type = GEOMETRY` (not Object).
