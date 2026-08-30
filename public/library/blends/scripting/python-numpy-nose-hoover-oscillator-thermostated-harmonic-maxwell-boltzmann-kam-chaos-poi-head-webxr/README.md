# Nosé–Hoover Oscillator — Poi Head (Blender 5.1)

A 3-D Bishop-tube trajectory through the Nosé–Hoover thermostated harmonic oscillator,
coloured by thermostat friction ξ (cobalt = cooling, amber = heating).

## The System

```
ẋ =  y
ẏ = −x + ξ·y          ← friction ξ damps or drives
ξ̇ =  y² − T           ← ξ grows when y²>T (system "too hot")
```

**T = 1** (canonical temperature).  The system enforces ⟨y²⟩→T over long times,
sampling the Maxwell-Boltzmann momentum distribution p(y) ∝ exp(−y²/2T).

Phase-space divergence: ∇·v = ξ (NOT constant, unlike Lorenz).  
On the ergodic sea: ⟨ξ⟩ = 0 → no long-run volume change.  
KAM tori coexist with the ergodic sea for select initial conditions.

## Parameters

| Constant | Value | Meaning |
|---|---|---|
| `T_TARGET` | 1.0 | Canonical temperature |
| `DT` | 0.010 | RK4 step size |
| `BURN_IN` | 5 000 | Transient discard steps |
| `N_STEPS` | 80 000 | Steps sampled |
| `SKIP` | 25 | Sample stride → 3 200 waypoints |
| `TUBE_R` | 0.016 m | Cross-section radius |
| `TUBE_SIDES` | 12 | Polygon sides per ring |

## Shape Keys

| Key | IC (x₀, y₀, ξ₀) | T | Notes |
|---|---|---|---|
| `Basis` | (0, 2, 0) | 1.0 | Ergodic chaotic sea |
| `SK_Torus` | (0, 1.4, 0) | 1.0 | Near KAM island — quieter winding |
| `SK_HotT` | (0, 2, 0) | 2.0 | Hot bath — wider, amber-dominant |
| `SK_ColdT` | (0, 1, 0) | 0.5 | Cool bath — confined, cobalt-dominant |

## Vertex Colour

**NH_Xi** (FLOAT_COLOR, per-vertex): cobalt (0.03,0.15,0.58) when ξ<0 (thermostat
cooling phase); amber (1.00,0.65,0.00) when ξ>0 (heating phase).

## Quick Start

1. Open Blender 5.1 → Scripting workspace → open `blueprint.py` → **Run Script**.
2. Check console: `[NoseHoover] Vertices: 38400, Faces: 38400`
3. Switch to 3-D Viewport, orbit to inspect.
4. Optionally run `record.py` for the animated viewport render.

## Sources

- Nosé S (1984) *J Chem Phys* **81**(1):511. doi:10.1063/1.447334 — equations PD  
- Hoover WG (1985) *Phys Rev A* **31**(3):1695. doi:10.1103/PhysRevA.31.1695 — LLNL/US-Gov PD  
- Sprott JC (2010) *Elegant Chaos*, World Scientific — "Sprott A" alias, equations PD
