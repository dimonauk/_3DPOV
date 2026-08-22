# GN Simulation Zone — Hair Curves Spring Dynamics (Blender 5.1)

Procedural hair physics via a Geometry Nodes Simulation Zone applied directly
to a **Curves** (HairCurves) object. No VRM Spring Bone runtime, no Mantaflow,
no cloth simulation — the physics lives entirely in the GN graph and evaluates
on every frame change inside Blender.

## Physics model

Each strand is a 1-D spring chain:

```
root (pinned) → p₁ → p₂ → … → p_{N-1} (tip, free)
```

Force on point pᵢ (i > 0):

```
F = K_SPRING * (p_{i-1} − pᵢ)    # spring toward parent
  + (0, 0, −GRAVITY)              # gravity
  + WIND_AMP·sin(t·WIND_FREQ) x̂  # sinusoidal wind gust
  + −DRAG · vᵢ                   # linear air drag
```

Euler integration with DT = 1/24 s. Root points have velocity zeroed and
position restored to their rest attribute every frame (hard pin).

## Key Blender 5.1 nodes

| Node | Role |
|---|---|
| `GeometryNodeOffsetPointInCurve` | Accesses the parent point (offset −1); `Is Valid Offset = False` detects root |
| `GeometryNodeSampleIndex` | Reads parent position / velocity by index |
| `GeometryNodeSimulationInput/Output` | Carries per-point state across frames via the Geometry body channel |
| `GeometryNodeStoreNamedAttribute` | Writes updated `vel` (FLOAT_VECTOR, POINT domain) back to geometry |
| `GeometryNodeSwitch` (VECTOR) | Applies root pinning: switches physics values to rest values for root points |
| `GeometryNodeInputSceneTime` | Provides elapsed seconds for the wind sinusoid |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Headless Python: builds the CURVES object, seeds rest+vel attributes, constructs GN tree, warms 30 frames, exports GLB + .blend |
| `record.py` | Viewport OpenGL render: 30-frame MP4 of strands swinging and recovering |
| `SCREEN-RECORDING-NOTES.md` | OBS / Windows Game Bar instructions for a screen-recorded companion |

## Outputs

- `hf_hair_spring.blend` — live simulation .blend
- `hf_hair_spring.glb` — frame-30 snapshot (strands at mid-swing)
- `viewport.mp4` — 30-frame swing animation

## Cross-references

- Studio tutorial: [Deform Curves on Surface — static hair binding](/tutorials/blender-tutorial-gn-deform-curves-on-surface-vrm-hair)
- Studio tutorial: [VRM Spring Bones — runtime physics](/tutorials/blender-tutorial-vrm-spring-bones-hair-chain)
- Studio tutorial: [GN Simulation Zone — Verlet Rope & Cable Physics](/tutorials/blender-tutorial-gn-simulation-zone-verlet-rope-cable-physics)
- Studio tutorial: [GN Curves Hair Grooming](/tutorials/blender-tutorial-curves-hair-grooming)
- Studio codex: [holoflow.co.uk/codex](https://holoflow.co.uk/codex)

## Licence

CC0 — no attribution required.
