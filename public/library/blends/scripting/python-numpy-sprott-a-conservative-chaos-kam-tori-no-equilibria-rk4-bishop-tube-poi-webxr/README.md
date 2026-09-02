# Sprott A — Conservative Chaos, No Equilibria
**Blender 5.1 · Python + NumPy · CC0**

## What this is

A single-script Blender blueprint that integrates the Sprott A autonomous
three-variable system and wraps the trajectory in a Bishop parallel-transport
tube, producing a poi-head prop for WebXR deployment.

```
ẋ = y
ẏ = −x + yz
ż = 1 − y²
```

Source: Sprott JC (1994) "Some simple chaotic flows"
Phys. Rev. E 50(2):R647–R650  DOI: 10.1103/PhysRevE.50.R647

## Why this system matters

Every other attractor in the Holoflow scripting library is *dissipative*:
orbits converge to a lower-dimensional strange attractor because ∇·F < 0
globally.  Sprott A is fundamentally different:

- **No equilibria** — the trajectory never slows toward a fixed point.
- **Divergence = z**, not a constant.  Long-time average ⟨z⟩ ≈ 0, so
  phase-volume is conserved on average (Liouville balance).
- **No strange attractor** — the orbit does not compress into a set of
  measure zero.  Instead, trajectories partition into nested KAM tori
  (quasi-periodic) separated by thin stochastic layers (chaotic).
- **Lyapunov spectrum**: λ₁ ≈ +0.014, λ₂ ≈ 0, λ₃ ≈ −0.014  (sum ≈ 0).
  Kaplan–Yorke dimension D_KY = 2 + 1 = 3: the orbit fills 3-space.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Main Blender script — integrate, build mesh, export .blend + .glb |
| `record.py` | Viewport animation render → viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `.expected-artefacts.json` | Manifest schema and cross-reference metadata |
| `hf_sprott_a_poi.blend` | Blender scene (generated on run) |
| `hf_sprott_a_poi.glb` | Draco-6 WebP GLB for WebXR (generated on run) |

## Running

```bash
blender -b -P blueprint.py
```

Or from the Blender Scripting workspace: open `blueprint.py`, press **Run Script**.
Expect ~60 s on a modern laptop (numpy RK4 over 360 000 steps × 4 ICs).

## Shape keys

| Key | IC (x₀, y₀, z₀) | Character |
|---|---|---|
| Basis | (0, 0.9, 0) | Mixed regular / chaotic — canonical Sprott A |
| SK_Torus | (0, 0.3, 0) | Deep quasi-periodic KAM torus (low amplitude) |
| SK_Wide | (0, 1.3, 0) | Outer chaotic layer, near-ergodic behaviour |
| SK_Shift | (0.5, 0.9, 0.5) | Different phase-space island |

## Mesh spec

- 3 000 waypoints per shape key × 12 sides = **36 000 vertices**, 34 800 quads
- Colour attribute: `SprottA_Speed` FLOAT_COLOR (cobalt slow → amber fast)
- Export: Draco level 6, WebP textures, `holoflow:facet = False`

## Troubleshooting

**Tube self-intersects near z=0 crossings** — reduce `TUBE_R` from 0.028 to 0.018.

**Script runs too slowly** — set `THIN = 60` (1 500 waypoints) in the constants block.

**SK_Torus looks the same as Basis** — the low-amplitude torus is small; enable
Overlay → Colour Attributes and compare the speed gradient — the KAM torus orbit
is noticeably slower and smoother in hue.

**SK_Wide tube fills the bounding box** — this is expected; the high-amplitude
orbit is nearly ergodic and explores a much larger volume than Basis.
