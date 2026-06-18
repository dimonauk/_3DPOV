# Screen Recording Notes — HF Vertex Colour Painter Modal Operator

**OBS Studio / Game Bar target**: Blender 5.1 window, 1920 × 1080, 30 fps, audio off.

## What to capture

A single continuous take showing the modal operator in action:

| # | Action | Duration |
|---|--------|----------|
| 1 | Script running in Scripting workspace — show the N-panel pop up | 5 s |
| 2 | Switch to 3-D Viewport, open N-panel, click **HF Vertex Colour Paint** | 3 s |
| 3 | Brush circle appears following the cursor — hover across sphere without clicking | 3 s |
| 4 | LMB held + dragged over sphere equator — vermillion stripe appears face-by-face | 8 s |
| 5 | Release LMB, reposition, paint polar cap with a few arcing strokes | 6 s |
| 6 | Orbit the sphere with MMB to show the painted areas from different angles | 5 s |
| 7 | Press **Enter** to confirm — HUD disappears | 2 s |
| 8 | Undo (Ctrl+Z) once — paint reverts to grey; Redo (Ctrl+Shift+Z) — reappears | 4 s |

Total target: ~36 seconds.  Trim to ≤ 30 s for the final cut.

## OBS Setup

1. **Scene → Add → Window Capture** → select `Blender` (title bar match).
2. Base canvas: 1920 × 1080. Output resolution: 1920 × 1080.
3. Output format: MP4 / H.264, CRF 18, 30 fps.
4. Hotkeys: `F9` = start recording, `F9` again = stop.
5. Save to `public/library/videos/scripting/python-modal-operator-vertex-colour-painter/screen.mp4`.

## Blender pre-flight

- Run `blueprint.py` in the Scripting workspace to register the operator and build the sphere.
- Ensure viewport shading is **Solid → Vertex** (Colour Type: Vertex).  The script sets this automatically.
- Set background colour to dark grey: Viewport Shading → Background → Viewport → Dark.
- Zoom so the sphere fills ~70 % of the viewport.

## Post-processing (optional)

- Colour-grade the footage: `ffmpeg -i screen.mp4 -vf "eq=brightness=0.03:saturation=1.15" screen_graded.mp4`
- The viewport.mp4 produced by `record.py` can be placed side-by-side in any NLE for a split-screen compare.
