# Screen Recording Notes — Schoen Gyroid Poi Head

**File:** `screen.mp4`  
**Destination:** `public/library/videos/scripting/python-numpy-gyroid-schoen-1970-tpms-ia3d-self-dual-sponge-nodal-surface-marching-tetrahedra-poi-webxr/screen.mp4`

## OBS Setup

| Setting | Value |
|---|---|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Disabled |
| Encoder | H.264 (hardware) or x264 CRF 20 |
| Output | `screen.mp4` |

## What to Capture

1. **Open the blend file** `hf_gyroid_poi.blend`.
2. Split the viewport: keep 3D Viewport on the left, Scripting editor on the right.
3. **Zoom in** on the gyroid sphere in the viewport — the cobalt/amber curvature
   colour should be visible. Show both labyrinths visible through the open channels.
4. **Shape Key scrubbing** — in the Properties panel → Object Data → Shape Keys,
   scrub the `SK_ThickShell` value from 0 → 1 slowly. Show one labyrinth filling in.
5. **Return to Basis**, then scrub `SK_ThinShell` to 1. Note it looks similar
   (self-duality demonstration).
6. **Run blueprint.py** in the Scripting editor. Capture the terminal output
   showing vertex count, active-cube count, and GLB write confirmation.
7. **Open GLB** in the 3D viewport via File → Import → glTF to confirm export.

## Duration Target

90–120 seconds total.  Edit to remove long processing waits.

## Notes

- The gyroid's saddle-shaped channels are most visible with Material Preview
  shading (Eevee, roughness set to 0.3).
- Toggle between the shape keys on camera to demonstrate the topological
  self-duality: the two iso-offset shapes are geometrically congruent.
