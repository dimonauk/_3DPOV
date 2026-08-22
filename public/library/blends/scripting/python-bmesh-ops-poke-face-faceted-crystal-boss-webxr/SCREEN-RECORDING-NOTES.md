# Screen Recording Notes — hf_poke_shield

Target file: `public/library/videos/scripting/python-bmesh-ops-poke-face-faceted-crystal-boss-webxr/screen.mp4`

## OBS / Game Bar settings

| Setting | Value |
|---|---|
| Window source | Blender 5.1 |
| Resolution | 1920 × 1080 |
| Frame rate | 30 fps |
| Audio | Off (no mic, no system audio) |
| Output format | MP4 / H.264 |
| CRF / quality | 18 (high quality) |

## Session outline

1. **Scripting workspace** — open a new Text block, paste `blueprint.py`, run it.
   - Point out the constants block at the top: `GRID_SEGS`, `DISC_RADIUS`, `BOSS_HEIGHT`.

2. **Viewport inspection** — switch to 3D viewport, `Z` → Wireframe overlay.
   - Show each quad of the disc grid has become 4 triangles meeting at a raised centre.
   - Toggle `N` panel → Item → Dimensions to confirm disc is ~2 m wide, ~0.1 m deep.

3. **Overlay: Face Normals** — enable Face Normals in Viewport Overlays.
   - All normals point outward from the faceted surface — no recalc_face_normals
     artefacts on the front; show that the back cap normals face down.

4. **Material Preview** — `Z` → Material Preview.
   - Dark steel body + gilt boss triangles visible.
   - Orbit with middle-mouse to show the X-crown pattern on each faceted cell.

5. **Shader Editor insert** — briefly show the two Principled BSDF nodes
   (HF_Shield_Body and HF_Shield_Boss) and their colour values.

6. **Blueprint walkthrough** — scroll through blueprint.py, pausing at:
   - `bmesh.ops.poke(...)` call and `result['verts']` — explain the boss_verts set.
   - Sharp-edge loop — show a single spoke edge selected, confirm smooth=False.
   - `extrude_edge_only` → `translate` → `fill` back-plate sequence.

7. **GLB export check** — open a terminal, run `file hf_poke_shield.glb`; confirm
   binary glTF and Draco compression active.

## Chapters (for editing)

```
00:00  Script run → viewport appears
00:15  Wireframe X-crown inspection
00:40  Face normals overlay
01:00  Material Preview orbit
01:30  Shader Editor
02:00  Blueprint code walkthrough
03:00  GLB export confirmation
03:20  End card
```

## Post-processing

- Trim to 3:20 maximum.
- Add chapter markers from the table above.
- Export at 1920 × 1080, H.264, CRF 18, no audio track.
- Drop finished file into `public/library/videos/scripting/python-bmesh-ops-poke-face-faceted-crystal-boss-webxr/screen.mp4`.
