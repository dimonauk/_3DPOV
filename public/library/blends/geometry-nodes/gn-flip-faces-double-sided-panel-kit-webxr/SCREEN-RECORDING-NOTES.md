# Screen Recording Notes — GN Flip Faces Double-Sided Panel

**Target file:** `public/library/videos/geometry-nodes/gn-flip-faces-double-sided-panel-kit-webxr/screen.mp4`

## OBS / Windows Game Bar settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no desktop audio) |
| Output format | MP4 (H.264 CRF 18) |
| Duration | ~6 minutes |

## What to capture

1. **Open a new .blend.** Confirm units are Metric, scale 1.0 m.
2. **Add → Mesh → Grid** (X: 6, Y: 10). Scale to (1.6, 2.4, 1) in Object Properties, apply scale. Rotate 90° in X so it hangs vertical.
3. **Add Geometry Nodes modifier.**  Build the tree live:
   - Wire Group Input → `Store Named Attribute` (FACE, FLOAT, name=`hs_side`, value 0.0) → first Join input.
   - Wire Group Input → `Flip Faces` → `Store Named Attribute` (FACE, FLOAT, name=`hs_side`, value 1.0) → `Set Position` (Offset = `Input Normal` × Epsilon via VectorMath SCALE) → second Join input.
   - `Join Geometry` → `Named Attribute` (hs_side, FLOAT) → `Compare` (LESS_THAN, B=0.5) → `Set Material Index` (0) + `Boolean NOT` → `Set Material Index` (1) → Group Output.
4. **Add two materials**: slot 0 = banner red, slot 1 = canvas cream. Set `Back-face Culling: On` on both.
5. **Orbit in the 3D viewport** (numpad 4/6) to show the panel from front (red) and back (cream). Pause on each side.
6. **Apply modifier.** Show mesh in Edit Mode — confirm two overlapping face layers, select all, check face count is 2× source.
7. **Spreadsheet Editor**: open, set domain to Face, show `hs_side` column (0.0 = front half, 1.0 = back half).
8. **File → Export → glTF 2.0**: Draco 6, WebP, Apply Modifiers ON.  
9. Drag exported `.glb` into a Three.js viewer or Babylon Sandbox to confirm both sides render.

## Framing tips

- Float the GN node editor side-by-side with the 3D viewport (split horizontally 60/40).
- After adding Flip Faces, briefly orbit to show the panel disappears from the back before Set Position is wired — illustrating WHY z-fighting prevention matters.
- Use the Spreadsheet to prove both hs_side=0.0 and hs_side=1.0 faces exist after Join.
