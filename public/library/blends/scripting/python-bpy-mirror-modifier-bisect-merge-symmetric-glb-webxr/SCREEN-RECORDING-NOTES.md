# Screen Recording Notes — MirrorModifier Bisect & Merge

Output file: `public/library/videos/scripting/python-bpy-mirror-modifier-bisect-merge-symmetric-glb-webxr/screen.mp4`

## OBS / Game Bar Setup

| Setting | Value |
|---------|-------|
| Source | Window Capture → Blender |
| Resolution | 1920 × 1080 |
| FPS | 30 |
| Audio | Off |
| Format | MP4 (H.264) |
| CRF | 23 |

## Session Script

1. Open `hf_clasp_buckle.blend` in Blender 5.1.
2. Start OBS recording.
3. **Viewport** — set to Material Preview, Solid + Matcap, or Rendered (Eevee).
4. Run `blueprint.py` via Scripting workspace → Run Script.
   - Narrate in post: *"Quarter-piece appears. No mirrors yet."*
5. In the Properties panel → Modifier Properties, show the two Mirror modifiers.
6. Toggle `Mirror_X` → show_viewport on/off twice to reveal the symmetry.
7. Toggle `Mirror_Y` → full bilateral shape appears.
8. In the mirror_object text block (commented out), uncomment and run to show
   off-centre pivot mirror, then undo.
9. Change `merge_threshold` from 0.0001 → 0.01 live; show merged seam bulge; revert.
10. In Scripting workspace, run the export section manually: call
    `bpy.ops.export_scene.gltf(...)` and show the file saved notification.
11. Open the exported GLB in Blender's File ▸ Import ▸ glTF 2.0 to verify
    the merged seam and Draco compression.
12. Stop recording.

## Editing Notes

- Cut the property-panel reveal to ≤ 8 seconds — viewers need to see the
  modifier parameters, not watch a scroll.
- Add a lower-third text card when toggling `use_bisect_axis` on/off to
  show the geometric difference at the seam.
- No voiceover required; captions sufficient.
- Target length: 4–6 minutes.
