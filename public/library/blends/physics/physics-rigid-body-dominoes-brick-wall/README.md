# Rigid Body Dynamics — Domino Chain + Brick Wall Collapse

**Blender 5.1 · Physics · CC0**

A 16-piece domino chain that triggers a running-bond brick wall collapse.  Covers
Bullet physics integration in Blender, active vs passive body types, BOX collision
shape selection, origin-at-CoG requirement, rigid body world substep and solver
accuracy, and the domino chain propagation geometry.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Authoritative scene construction script |
| `record.py` | Camera-track OpenGL animation render (run after baking) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar capture instructions |
| `.expected-artefacts.json` | Artefact manifest with cross-references |

## Quick start

```bash
blender --python blueprint.py
# Opens Blender, builds scene, prints bake instruction.
# Then in Blender UI: Scene Properties → Rigid Body World → Cache → Bake All
blender --background domino_chain.blend --python record.py
```

## Key parameters (top of blueprint.py)

| Constant | Default | Effect |
|----------|---------|--------|
| `DOM_COUNT` | 16 | Number of dominoes |
| `DOM_SPACING` | 0.068 m | Centre-to-centre gap (max reliable = DOM_H − DOM_D/2 = 0.09 m) |
| `DOM_TILT` | 15° | First domino start angle (min to tip = ~11.3°) |
| `SUBSTEPS` | 20 | Physics substeps per frame |
| `BRICK_ROWS` | 4 | Courses of brick in wall |
| `BRICK_COLS` | 6 | Bricks per row |

## Cross-references

- [Mantaflow FLIP Liquid Dam Break](/tutorials/blender-tutorial-physics-mantaflow-liquid-dam-break) — Eulerian grid physics vs Bullet discrete collision
- [Particle Emitter Spark Trail](/tutorials/blender-tutorial-physics-particle-emitter-spark-trail-wind-deflector) — Newtonian particle physics comparison
- [Hard-Surface SubDiv Workflow](/tutorials/blender-tutorial-modifier-subdiv-crease-bevel-weight-hard-surface) — cuboid mesh quality for close-up bricks

## Licence

CC0 1.0 Universal — public domain dedication.  No rights reserved.
