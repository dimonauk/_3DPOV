# GN Switch (Geometry) — Pristine / Damaged Variant Toggle (Blender 5.1)

`GeometryNodeSwitch` with `input_type='GEOMETRY'` selects between two
complete geometry branches on a single boolean socket. This enables
LOD switching, open/closed states, damage variants, and debug-overlay
toggles — all without duplicating or deleting geometry.

## Critical caveat: no branch short-circuit

Both the `False` and `True` geometry inputs are **evaluated on every
depsgraph update**, regardless of the Switch value. Moving the variant
logic into nested node groups (as done here) lets the GN evaluator reuse
each group's cached output when its inputs are stable — the best available
mitigation short of maintaining two separate modifier stacks.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy build: base mesh, two sub-groups, main Switch tree |
| `record.py` | Viewport animation — pristine → switch → damaged orbit |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `wall_panel_switch.blend` | Blender file (run `blueprint.py` to regenerate) |
| `wall_panel_switch.glb` | WebXR export: Draco 6, WebP, Y-up |

## Node tree summary

```
Group Input ─── Geometry ──► HS_CleanBranch ──► Switch.False
                                                               ▼
              ─── Geometry ──► HS_DamagedBranch ► Switch.True ► Output ► Group Output
              ─── Damaged ────────────────────────► Switch.Switch
```

**HS_CleanBranch**: Extrude Mesh on horizontal edges → groove lines → material 0  
**HS_DamagedBranch**: Noise-driven SetPosition normal displacement → material 1

## Switch node socket names (Blender 5.1)

| Socket | Type | Meaning |
|--------|------|---------|
| `Switch` | Bool | False → output False branch; True → output True branch |
| `False` | Geometry | Geometry returned when Switch = False |
| `True` | Geometry | Geometry returned when Switch = True |
| `Output` | Geometry | Selected result |

## Blender 5.1 compatibility

`GeometryNodeSwitch.input_type` must be set **before** wiring links; changing
it post-wiring silently drops existing connections as socket types are
recreated. Confirmed stable in 5.1. The `MATRIX` input_type was added in 4.3
and is available in 5.x.

## glTF export note

Export with `Damaged=True` to bake the damaged variant, or with `Damaged=False`
for the pristine variant. The Switch boolean is a modifier parameter — it is
not exportable as a glTF animation track. For animated state transitions, use
Shape Keys or a Simulation Zone morph instead.
