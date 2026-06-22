# GN Repeat Zone — Iterative Branch Growth
## Blender 5.1 · Geometry Nodes · CC0

The **Repeat Zone** (introduced in Blender 4.1, stable in 5.1) lets a body of
Geometry Nodes evaluate N times within a single frame. State threads through the
zone via typed loop variables — any socket type that can cross a Group boundary
can cross a Repeat Zone boundary (Geometry, Float, Int, Vector, Bool, Rotation).

This entry builds a **fractal spike ball**: each of N iterations extrudes every
"tip" face outward at a shrinking offset scale, creating nested shells of
progressively smaller spikes — all driven by one `Iterations` slider and
computed in a single frame evaluation with no simulation overhead.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene build + GLB export. Run in Blender 5.1 Text Editor. |
| `record.py` | Animates `Iterations 0→5` and renders `viewport.mp4`. |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4`. |
| `branch_ball.blend` | Saved scene (produced by blueprint.py). |
| `branch_ball.glb` | Draco-L6 + WebP GLB at Iterations=5 (produced by blueprint.py). |

---

## Node pipeline

```
Group Input
  ↓ Geometry
StoreNamedAttribute(FACE, 'is_tip', True)   ← marks ALL faces as tips before loop
  ↓
┌─ Repeat Input (Iterations, Geometry, Scale) ─────────────────────────────┐
│                                                                           │
│  NamedAttribute('is_tip') → Bool                                         │
│    ↓ Selection                                                            │
│  ExtrudeMesh(FACES, Individual=True, Offset Scale=Scale)                 │
│    ↓ Mesh          ↓ Top (Bool field: newly extruded tops = True)        │
│  StoreNamedAttribute(FACE, 'is_tip', Top)  ← only new tops remain tips  │
│    ↓                                                                      │
│  Math MULTIPLY(Scale × Shrink) → new Scale                               │
│                                                                           │
└─ Repeat Output (Geometry, Scale) ────────────────────────────────────────┘
  ↓ Geometry
SetShadeSmooth(FACE, smooth=False)           ← flat-faceted for studio pipeline
  ↓
Group Output
```

---

## Key Repeat Zone facts (Blender 5.1)

**Repeat Zone ≠ Simulation Zone.**  
The Repeat Zone runs its body N times in one evaluation pass; no frames
advance, no cache is written. The Simulation Zone runs once per frame and
accumulates state across time. Use Repeat for within-frame iteration
(fractals, L-systems, iterative fitting); use Simulation for physics-like
temporal evolution.

**Loop variable socket types** that can cross the zone boundary:
`NodeSocketGeometry`, `NodeSocketFloat`, `NodeSocketInt`,
`NodeSocketVector`, `NodeSocketBool`, `NodeSocketRotation`, `NodeSocketMatrix`.
Color and String are NOT supported.

**`repeat_out.repeat_items.new(socket_type, name)`** adds a loop variable
to both the Input and Output nodes simultaneously.

**`outputs[0]` on Repeat Input is always "Iteration"** (the current 0-based
loop index). Loop variable sockets begin at `outputs[1]`.

**Performance ceiling**: each iteration that calls ExtrudeMesh on M tip faces
adds M new faces. After N passes: face count ≈ 20 × (1 + 2^0 + 2^1 + … + 2^(N−1)).
At N=5 this is 20 × 32 = 640 faces — reasonable. At N=8 it is 20 × 256 = 5120,
which is still fast. At N=12 it is 20 × 4096 = 81920 — slow in the modifier
stack for interactive editing.

---

## Parametric controls

| Socket | Default | Effect |
|--------|---------|--------|
| `Iterations` | 5 | Number of spike generations. Raise for fractal depth; lower for performance. |
| `Branch Scale` | 0.55 | Extrude offset for the first (largest) generation. |
| `Shrink` | 0.68 | Multiplier applied to Branch Scale each iteration. Values >1 = growing spikes; <1 = converging spikes. |

---

## L-system extension (advanced)

True L-system branching requires per-tip **rotation divergence** — adjacent
tips grow at ±angle offsets from their parent direction. In a Repeat Zone
this can be approximated by:

1. `InstanceOnPoints` on the tip face centres (instead of ExtrudeMesh)
2. Rotate each instance via `FunctionNodeRandomValue(FLOAT_VECTOR, seed=Iteration)`
3. `RealizeInstances` inside the zone before feeding the Geometry loop variable

The tricky part is that `FunctionNodeRandomValue` with per-element seeds creates
positionally random offsets, not parent-direction-relative ones. A full
directional L-system requires passing the branch direction as a Vector loop
variable and rotating each new branch relative to that vector with
`FunctionNodeAlignEulerToVector + RotateEuler`.

---

## Cross-references

- **Studio tutorial**: /tutorials/blender-tutorial-gn-simulation-zone-conways-game-of-life
  (Simulation Zone for temporal iteration — the time-based sibling)
- **Studio tutorial**: /tutorials/blender-tutorial-gn-extrude-mesh-procedural-panel-inset
  (ExtrudeMesh node deep-dive)
- **Studio codex**: /codex/geometry-nodes (GN glossary)
- **Outside source**: Blender Manual — Repeat Zone (CC-BY-SA-4.0, Blender Foundation)
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/repeat_zone.html
- **Outside source**: Blender Manual — Simulation Zone (CC-BY-SA-4.0, Blender Foundation)
  https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/simulation_zone.html
  (Related project: blender/blender at projects.blender.org)
