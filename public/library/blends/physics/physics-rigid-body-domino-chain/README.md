# Rigid Body Dynamics: Domino Chain Topple

**Blender 5.1 · Physics · CC0 · Holoflow Studio**

A chain of 15 dominoes (ivory/navy alternating) on a grey floor, driven by
Blender's Bullet Physics rigid body solver.  The first domino is pre-tilted 12°
past the critical tipping angle; each subsequent collision propagates the topple
across the full chain in under 90 frames (3.75 s at 24 fps).  BOX collision shapes,
calibrated friction (0.70) and restitution (0.15), and a collision margin of 2 mm
keep the chain reaction stable without tunnelling.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds scene, configures Bullet world, exports `domino_chain.blend` + `domino_chain.glb` |
| `record.py` | Arcing camera render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar capture instructions |
| `.expected-artefacts.json` | CI artefact manifest |

## Running

```bash
# 1. Build scene
blender --background --python blueprint.py

# 2. Open in Blender, bake simulation (Object > Rigid Body > Bake to Keyframes 1–120)

# 3. Render video
blender --background domino_chain.blend --python record.py
```

## Key Parameters

| Parameter | Value | Effect |
|-----------|-------|--------|
| `DOMINO_COUNT` | 15 | Number of dominoes in the chain |
| `CHAIN_SPACING` | 0.045 m | Centre-to-centre; 33 mm gap between faces |
| `TILT_DEG` | 12° | Initial tilt of first domino; critical angle ≈ 8.5° |
| `RB_SUBSTEPS` | 20 | Sub-steps per frame; prevents tunnelling at impact |
| `RB_ITERATIONS` | 20 | Bullet PGS solver iterations per sub-step |
| `DOMINO_MARGIN` | 2 mm | Bullet collision inset; must be < T/2 = 6 mm |
| `DOMINO_FRICTION` | 0.70 | Wood-on-wood kinetic friction |
| `DOMINO_BOUNCE` | 0.15 | Restitution; low so dominoes do not bounce back |

## Tutorial

[/tutorials/blender-tutorial-physics-rigid-body-domino-chain](/tutorials/blender-tutorial-physics-rigid-body-domino-chain)

## Outside Sources

- [Blender Manual — Rigid Body Physics](https://docs.blender.org/manual/en/latest/physics/rigid_body/index.html) — CC-BY-SA 4.0 · Blender Foundation
- [Bullet Physics SDK](https://github.com/bulletphysics/bullet3) — zlib licence · Erwin Coumans / Google
- [glTF-Blender-IO](https://github.com/KhronosGroup/glTF-Blender-IO) — Apache-2.0 · Khronos Group
