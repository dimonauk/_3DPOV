# Screen-Recording Notes — Burning Ship Fractal

These instructions produce the `screen.mp4` companion to `viewport.mp4`.
Run `blueprint.py` in Blender's Scripting workspace first, then follow the
steps below before running `record.py`.

## OBS Settings

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Disabled |
| Output format | MP4 (H.264) |
| Output path | `public/library/videos/scripting/python-numpy-burning-ship-fractal-…/screen.mp4` |

## Blender Workspace Preparation

1. **Open Blender 5.1** and load (or re-run) `blueprint.py` from the
   Scripting workspace.  The `BurningShip` object should appear in the 3D
   Viewport.
2. Switch to the **3D Viewport**.  Set shading to **Rendered** (Eevee) or
   **Material Preview** to show vertex colours.
3. Frame the mesh: press **Numpad .** to focus selection, then tilt the view
   to a 50°–60° overhead angle so the height-field detail is clear.
4. Enable **Overlays → Statistics** (top-right of Viewport) so the vertex
   count is visible — it reads 14 400 vertices for the 120×120 grid.

## Recording Steps

1. Start OBS recording.
2. In Blender, open the **Timeline** and press **Space** to play.
   Alternatively, run `record.py` from the Scripting workspace — OBS will
   capture the viewport as the camera animates.
3. While recording, demonstrate the four shape keys manually:
   - Select `BurningShip` → Properties → **Object Data → Shape Keys**.
   - Scrub `SK_Ship` to 1.0: the height field zooms into the hull.
   - Scrub `SK_Mast` to 1.0: the mast tip detail comes into focus.
   - Scrub `SK_Julia` to 1.0: the Julia variant appears.
   - Return all to 0.0 and Basis to 1.0.
4. Stop OBS.  Trim the first/last second if needed.

## Talking Points for Narration

- The Burning Ship fractal applies `|Re(z)| + i·|Im(z)|` before squaring,
  which folds both half-planes back into the first quadrant.
- The "ship" shape (hull + mast) is visible in the full view near Re ≈ −1.75.
- The smooth colouring removes banding by using `n − log₂(log₂|z|)`.
- SK_Mast zooms 75× deeper — tiny self-similar copies of the ship appear.
- SK_Julia uses a fixed parameter c and variable starting point z₀.

## Export for WebXR

After recording, export `BurningShip.glb`:
- File → Export → glTF 2.0
- Include: Mesh Data, Shape Keys (morph targets), Vertex Colours
- Compression: Draco level 6, WebP textures
- Axis: +Y Up (auto-applied by the exporter in Blender 5.1)
- Root object name: `burning_ship` (snake_case)
