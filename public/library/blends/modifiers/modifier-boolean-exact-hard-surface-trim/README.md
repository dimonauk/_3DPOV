# Modifier — Boolean: Exact Solver Hard-Surface Trim Sheet (Blender 5.1)

Stack `BOOLEAN` modifiers using the **Exact solver** to carve channels, ports,
and recesses into a sci-fi panel mesh without ever touching Edit Mode.
A `BEVEL` modifier placed after all Booleans automatically chamfers every new cut
edge, while the non-destructive modifier stack remains live for revision.

## Artefacts

| File | Description |
|------|-------------|
| `blueprint.py` | Full scene-build + GLB export script |
| `record.py` | 90-frame turntable viewport render |
| `SCREEN-RECORDING-NOTES.md` | OBS shot list for `screen.mp4` |
| `hard_surface_panel.blend` | Final `.blend` (save after running blueprint) |
| `../../../glbs/modifiers/modifier-boolean-exact-hard-surface-trim/hard_surface_panel.glb` | WebXR-ready GLB |
| `../../../../videos/modifiers/modifier-boolean-exact-hard-surface-trim/viewport.mp4` | Turntable render |
| `../../../../videos/modifiers/modifier-boolean-exact-hard-surface-trim/screen.mp4` | Screen recording |

## Quick start

```bash
# Run blueprint inside Blender's scripting workspace
blender --background --python blueprint.py
```

Then open the saved `.blend` to inspect the modifier stack live.

## Key concepts

- **Exact vs Fast solver** — Exact uses halfedge boolean arithmetic; tolerates
  coplanar cutter faces and edge-on intersections that crash the Fast solver.
- **Modifier stack order** — Solidify must precede Boolean; Bevel must follow.
  Moving Bevel above a Boolean causes it to chamfer the uncut base mesh edges only.
- **Hole Tolerant** — `mod.use_hole_tolerant = True` handles cutters that don't
  fully pierce the base mesh (e.g. the partial-depth rectangular inset).
- **Cutter collection** — Group cutters in their own Blender collection.
  Hide the collection from the viewport render camera so cutters never appear in
  final renders or GLB exports.
- **Harden Normals** — setting on the Bevel modifier writes Custom Split Normals
  that make chamfered bevel faces catch specular highlights as expected in EEVEE.

## Export checklist

- [ ] Apply transforms on base panel before export (`Ctrl+A → All Transforms`).
- [ ] Duplicate panel, apply all modifiers on the duplicate only.
- [ ] Export the duplicate as GLB: Draco level 6, WebP textures, Y-up.
- [ ] Delete the duplicate; keep the original non-destructive stack for revision.

## Licence

CC0 — public domain dedication. No attribution required.  
Outside reference: Blender Manual — Boolean Modifier  
https://docs.blender.org/manual/en/latest/modeling/modifiers/generate/booleans.html  
(CC-BY-SA 4.0, Blender Foundation)
