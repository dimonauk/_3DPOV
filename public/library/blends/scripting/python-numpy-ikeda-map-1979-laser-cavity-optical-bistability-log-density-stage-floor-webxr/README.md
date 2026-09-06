# Ikeda Map — Laser-Cavity Attractor (Blender 5.1)

**Category:** scripting · stage-floor height-field  
**Blender version:** 5.1  
**Licence:** CC0 (equations are public-domain mathematics)  
**WebXR ready:** yes — `holoflow:category = stage-floor`

---

## What this is

The Ikeda map models a monochromatic light field *z* = *x* + *iy* completing successive round trips inside an optical ring cavity whose Kerr-nonlinear medium imparts an intensity-dependent phase shift τ:

```
τ(x, y)  = 0.4 − 6 / (1 + x² + y²)
x'       = 1 + μ·(x cos τ − y sin τ)
y'       = μ·(x sin τ + y cos τ)
```

The single parameter **μ** (coupling strength) controls the dynamics:

| μ | Behaviour |
|---|---|
| < 0.61 | Single stable fixed point (optical bistability) |
| ≈ 0.61–0.83 | Feigenbaum period-doubling cascade |
| ≥ 0.90 | Fully developed strange attractor — flame/comb topology |

The blueprint runs **8 million iterates** at each μ value and accumulates log₁₊(count) into a 120 × 120 density grid, which becomes a height-field stage floor with **4 shape keys** at μ ∈ {0.90, 0.95, 0.85, 0.70}.

---

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Blender 5.1 Python script — builds the mesh, attributes, material, shape keys |
| `record.py` | Automated viewport render animation (210 fr, 30 fps, EEVEE) |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for the screen-capture video |
| `.expected-artefacts.json` | Artefact manifest for CI checks |

---

## Key facts

- **Vertices:** 14 400 (120 × 120)  
- **Quads:** 14 161  
- **Attribute:** `Ikeda_Density` FLOAT_COLOR POINT — cobalt (low) → amber (high)  
- **Shape keys:** Basis (μ=0.90) · SK_MuHigh (0.95) · SK_MuMid (0.85) · SK_MuLow (0.70)  
- **Lyapunov exponents:** λ₁ ≈ +0.505, λ₂ ≈ −1.85 → D_KY ≈ 1.27  
- **Jacobian determinant:** det J = μ² everywhere (invertible map)  
- **Export:** Draco-6, WebP, morph targets on, vertex colours on

---

## Running in Blender

1. Open Blender 5.1 → **Scripting** workspace.
2. Load `blueprint.py` and press **▶ Run Script**.
3. The console will print progress and confirm the vertex count on completion.
4. Inspect shape keys under **Properties → Object Data → Shape Keys**.
5. Export as GLB: File → Export → glTF 2.0, Draco level 6, WebP textures.

---

## Outside sources

- Ikeda K (1979) "Multiple-valued stationary state and its instability of the transmitted light by a ring cavity system." *Opt Comm* **30**(2):257–261. DOI [10.1016/0030-4018(79)90090-7](https://doi.org/10.1016/0030-4018(79)90090-7) — original paper; equations are public-domain mathematics.  
- Bourke P "Ikeda Attractor" CC0 <https://paulbourke.net/fractals/ikeda/> — reference renders and C source, related: <https://paulbourke.net/fractals/peterdejong/>.  
- Sprott JC chaos/2D survey (permissive educational) <https://sprott.physics.wisc.edu/chaos/2D/ikeda.htm> — parameter survey, related: <https://sprott.physics.wisc.edu/chaos/>.
