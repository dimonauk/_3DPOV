# Soft Body — Squash-and-Stretch Jelly Blob (Blender 5.1)

Blender category: **Physics / Soft Body**  
Studio interests: WebXR morph targets · VRM shape keys · cartoon physics

## What this teaches

- How Blender's Soft Body solver works at the spring-mass level
- Goal groups: tethering vertices to their animated positions via weight paint
- Edge Springs (Pull / Push / Bend) and their interaction with Goal strength
- Solver substeps, adaptive time-stepping, and disk cache
- Harvesting baked simulation frames into GLB-compatible shape keys

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Builds the full scene: sphere, collision floor, material, soft body modifier, goal weight group, drop animation |
| `record.py` | Viewport render to `viewport.mp4` (run after baking) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```
1. Blender 5.1 → Scripting workspace → Open blueprint.py → Run Script
2. Properties → Physics → Soft Body → Cache → Bake All Dynamics  (~2–5 min)
3. Play animation (Spacebar) — watch squash, stretch, settle
4. Uncomment harvest_shape_keys() + export_glb() in blueprint.py → re-run
5. Run record.py to produce viewport.mp4
```

## Key parameters (in blueprint.py)

| Constant | Value | Effect |
|---|---|---|
| `GOAL_MIN` | 0.05 | Bottom vertices nearly free — maximum impact splash |
| `GOAL_MAX` | 0.90 | Crown vertices held rigid — prevents inversion |
| `EDGE_PULL` / `EDGE_PUSH` | 0.85 | Symmetric spring stiffness — volume-preserving feel |
| `BEND` | 0.60 | Resists surface creasing across edges |
| `STEPS` | 40 | Substeps per frame — reduce to 20 to speed up bake |
| `MASS` | 0.30 kg | Lighter mass → springier, faster response |

## Outside sources

- Blender Manual — Soft Body (CC0):
  https://docs.blender.org/manual/en/5.1/physics/soft_body/index.html
- Blender Manual — Soft Body Settings:
  https://docs.blender.org/manual/en/5.1/physics/soft_body/settings/object.html

## Related studio tutorials

- `/tutorials/blender-tutorial-physics-cloth-simulation-waving-flag` — cloth simulator (another spring-network solver)
- `/tutorials/blender-tutorial-physics-rigid-body-domino-chain` — rigid body (mass but no deformation)
- `/tutorials/blender-tutorial-shape-keys-morph-targets` — shape keys for GLB export
- `/tutorials/blender-tutorial-gn-bake-node-simulation-growth` — Geometry Nodes bake pattern
