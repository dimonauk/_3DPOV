# Python Modifier Stack — Add, Configure, Reorder & Pre-Export Apply
**Blender 5.1 | Scripting | CC0**

Builds a four-modifier stack (`BEVEL → BOOLEAN → SOLIDIFY → SUBSURF`) on a
flat-panel prop entirely via Python, demonstrates safe reordering with
`modifier_move_to_index()`, serialises the stack to a JSON-compatible recipe
dict, and applies every modifier in order for a clean pre-export mesh.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full Python script — builds, configures, reorders, reads, applies and exports |
| `record.py` | OpenGL viewport animation (orbit + subsurf step demo → `viewport.mp4`) |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Expected output artefacts

- `output/mod_stack_result.glb` — applied mesh, Draco 6, WebP textures, +Y up
- `viewport.mp4` — 120-frame orbit + subsurf-step animation
- `screen.mp4` — manual screen recording (see SCREEN-RECORDING-NOTES.md)

## Key API surface

```python
# Add a modifier (no VIEW_3D area needed)
bev = ob.modifiers.new("HF_Bevel", "BEVEL")
bev.width = 0.015
bev.segments = 2
bev.limit_method = "ANGLE"

# Reorder (OBJECT mode, active_object set — no VIEW_3D area needed)
bpy.ops.object.modifier_move_to_index(modifier="HF_Solidify", index=0)

# Apply (requires VIEW_3D area via temp_override)
with bpy.context.temp_override(window=..., area=..., region=...):
    bpy.ops.object.modifier_apply(modifier="HF_Bevel")
```

## Usage

1. Open Blender 5.1, Scripting workspace.
2. Paste and run `blueprint.py` (Alt + P).
3. Check the Properties panel → Modifier tab: four modifiers in order.
4. Run `record.py` to generate `viewport.mp4`.
5. Follow `SCREEN-RECORDING-NOTES.md` to capture `screen.mp4`.

## Licence

CC0 — public domain. No attribution required.
