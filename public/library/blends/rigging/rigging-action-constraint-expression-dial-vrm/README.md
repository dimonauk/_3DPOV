# Action Constraint: Expression Dial VRM Face Rig

**Blender 5.1 · Rigging · Holoflow Studio Library**

One control bone (`CTRL_expression`) rotates from 0° to 45° on its local Y-axis and simultaneously:
- Tilts the brow bone back (eyebrow raise via Action Constraint on the armature)
- Lifts both mouth-corner bones (smile via the same Action Constraint)
- Raises the `brow_raise` and `mouth_smile` shape keys (via RNA drivers on the mesh)

This is the production-grade pattern for VRM facial rigs where a single "expression dial" drives multiple targets without polling or per-frame Python.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the full rig scene from scratch |
| `record.py` | Animates a 90-frame sweep and renders `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for the manual demo capture |

## Output Artefacts (after running scripts)

```
public/library/videos/rigging/rigging-action-constraint-expression-dial-vrm/
└── viewport.mp4

(Save .blend manually: File > Save As > expression_dial_rig.blend)
```

## Key Concepts

- **Action Constraint** — maps one bone's transform range to frames of a stored Action; evaluates any bone fcurves in that Action at pose-eval time.
- **mix_mode = 'ADD'** — essential for stacking: a second expression (e.g. "surprised") uses its own Action Constraint on the same root bone, and both add together.
- **Shape key split** — shape keys live on the mesh, not the armature; RNA drivers reading `CTRL_expression.rotation_euler.y` bridge the gap cleanly.

## Licence

All code CC0 (public domain). No external assets.

## See Also

- Tutorial: `/tutorials/blender-tutorial-rigging-corrective-shape-keys-driver`
- Tutorial: `/tutorials/blender-tutorial-rigging-fk-ik-switch-custom-property-driver`
- Tutorial: `/tutorials/blender-tutorial-python-shape-key-driver-rig-vrm-facial`
