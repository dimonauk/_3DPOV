# Involute Gear: Module System, Base-Circle Involute, Trochoidal Root Fillet & Mating Pair

**Blender 5.1 · Python / numpy · CC0**

## What this builds

Two meshing spur gears — a 20-tooth driving gear and a 40-tooth driven gear (2:1 ratio) — both
built from mathematically correct involute tooth profiles and trochoidal root fillets.

| Gear | Teeth | Module | Pitch radius | Tip radius | Root radius | Pressure angle |
|------|-------|--------|-------------|-----------|------------|----------------|
| Drive  | 20 | 1.0 | 10.0 mm | 11.0 mm | 8.75 mm | 20° |
| Driven | 40 | 1.0 | 20.0 mm | 21.0 mm | 18.75 mm | 20° |

Centre distance = 10 + 20 = **30 mm** (exact pitch-circle tangency).

## Technique: involute geometry

A taut string unwound from the **base circle** (radius r_b = r_p · cos φ) traces the involute.
In parametric form:

```
x(t) = r_b · (cos t + t·sin t)
y(t) = r_b · (sin t − t·cos t)          t ∈ [0, t_tip]
```

where `t_tip = √((r_a/r_b)² − 1)` is the unwinding angle at the tip circle.

The involute guarantees **conjugate action** — a constant angular-velocity ratio — no matter
how the centre distance varies slightly. This is why it became the standard for power
transmission gears in 1867 (Hooke's earlier cycloidal gears did not share this property).

## Technique: trochoidal root fillet

The gap between teeth is cut by a rack cutter whose tip carries a fillet circle of radius
`ρ = 0.38m` (ISO standard).  As the rack rolls without slipping on the pitch circle, the
centre of that tip circle traces a **trochoid** in gear coordinates:

```
x_c(θ) = (r_p − d) · sin θ + r_p · θ · cos θ
y_c(θ) = (r_p − d) · cos θ − r_p · θ · sin θ
```

where `d = (1.25m − ρ)` is the depth below the pitch line and θ is the rolling angle.
The fillet itself is the envelope of this moving circle, offset outward by ρ.

The true trochoid distributes root bending stress across a wider cross-section than a simple
circular arc, and avoids the stress-concentrating re-entrant corner that appears when the
cut is made without a tip radius.

## Undercut criterion

Undercutting (interference between the involute and the fillet) occurs when:

```
N < N_min = 2 / sin²(φ) ≈ 17.1   for φ = 20°
```

Both gears (N = 20 and N = 40) are safely above this limit.  For N = 16 the blueprint
clamps the root radius to 80% of the base radius to prevent self-intersection.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Run in Blender ▸ Scripting → builds both gears, exports GLB |
| `record.py`    | Run after blueprint → renders 120-frame EEVEE animation |
| `SCREEN-RECORDING-NOTES.md` | OBS/screen-capture instructions |
| `.expected-artefacts.json` | CI manifest for automated checks |

## Running

1. Open Blender 5.1
2. Scripting workspace → open `blueprint.py`
3. Run script (▶) — outputs `output/hf_involute_gear_pair.glb`
4. Open `record.py`, run → renders `viewport.mp4`

## Cross-references

### Holoflow studio

- [GN Clockwork Tutorial](/tutorials/blender-tutorial-gn-scene-time-rotation-mechanical-clockwork) —
  keyframe-free gear animation using Scene Time + Rotation sockets (compare approach)
- [Python bmesh Dodecahedron](/tutorials/blender-tutorial-python-bpy-bmesh-dodecahedron) —
  direct bmesh construction from vertex/face lists (same technique used here)
- [Codex: Poi Sculptor](/codex/poi-sculptor) —
  precision geometry tools relevant to hardware prop design

### External sources

1. **Blender Python API 5.1** — Blender Foundation — CC-BY-SA-4.0
   https://docs.blender.org/api/5.1/ · Related: https://projects.blender.org/blender/blender
2. **NumPy User Guide** — NumPy contributors — BSD-3-Clause
   https://numpy.org/doc/stable/user/ · Related: https://github.com/scipy/scipy
3. **KhronosGroup glTF-Blender-IO** — Khronos Group — Apache-2.0
   https://github.com/KhronosGroup/glTF-Blender-IO · Related: https://github.com/KhronosGroup/glTF-Sample-Assets
