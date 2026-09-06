# Rikitake Two-Disk Dynamo (1958)

**Geomagnetic reversal chaos — 5 years before Lorenz.**

> Rikitake, T. (1958). Oscillations of a system of disk dynamos.  
> *Proc. Camb. Phil. Soc.* 54(1):89–105.  
> DOI: 10.1017/S0305004100033223 — PD mathematics, CC0 implementation.

## What this is

The Rikitake Two-Disk Dynamo is a coupled electromagnetic system that
models the irregular reversal of Earth's magnetic field.  Two conducting
discs, each spinning and driving the other's current, produce an unpredictable
series of sign flips in the magnetic moment — mirroring the geomagnetic
reversals recorded in rocks over millions of years.

Rikitake published this in 1958; Lorenz published his convection system in
1963.  This makes the Rikitake dynamo one of the earliest physical
demonstrations that deterministic differential equations can produce
irregular, non-repeating behaviour — chaos before the word existed.

## Equations

```
ẋ = −μx + zy
ẏ = −μy + x(z − a)
ż =  1 − xy

μ = 2.0,  a = 5.0  (canonical)
```

`x` and `y` are the currents in each disc; `z` is the relative angular
velocity.  When the product `xy` exceeds 1, the discs decelerate (`ż < 0`);
when it falls below 1, they accelerate again.  A reversal occurs when `x` (and `y`)
change sign — irregular in timing, impossible to predict from initial conditions
beyond a short horizon.

## Divergence

```
∇·F = −μ − μ + 0 = −2μ = −4.0   (canonical)
```

Constant, μ-dependent.  Liouville: λ₁ + λ₂ + λ₃ = −4.0.

## Fixed points

```
P± = (±1.689, ±0.592, +5.70)   (μ=2, a=5)
```

Both fixed points share the same z — the angular velocity is the same at
both poles.  Eigenvalues are one strongly stable real (λ_r ≈ −4.01) and one
weakly unstable complex pair (λ_c ≈ +0.005 ± 2.00i), giving a Shilnikov ratio
of order 800 — the system lingers for a very long time near each fixed point
before a reversal.

## Shape keys

| Key | μ | a | Character |
|-----|---|---|-----------|
| Basis | 2.0 | 5.0 | Canonical — moderate reversals |
| SK_LowMu | 1.5 | 5.0 | Lower dissipation — wider orbit |
| SK_HighMu | 2.5 | 5.0 | Stronger dissipation — tighter tube |
| SK_HighA | 2.0 | 7.0 | Larger coupling — topology shift |

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full build: RK4 orbit → Bishop tube → shape keys → material |
| `record.py` | Viewport render: 10 s orbit + morph animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | Mesh stats, cross-references, export settings |

## Cross-references

### Studio
- [Shimizu–Morioka Attractor](/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr) — dual-saddle-focus, constant divergence
- [Thomas Cyclically Symmetric](/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-1999-sine-nonlinearity-c3-cyclic-rk4-bishop-tube-poi-webxr) — cyclic symmetry, constant divergence
- [Newton–Leipnik (bistability)](/tutorials/blender-tutorial-python-numpy-newton-leipnik-attractor-1981-double-strange-bistability-rigid-body-feedback-rk4-bishop-tube-poi-webxr) — two coexisting attractors vs. Rikitake's single basin

### External
- **Rikitake 1958** — DOI: 10.1017/S0305004100033223 — original paper, PD
- **dysts (MIT)** — https://github.com/williamgilpin/dysts — canonical parameter catalogue includes Rikitake
- **Chaos Theory (Letellier CC-BY)** — https://www.worldscientific.com/worldscibooks/10.1142/10297 — includes Rikitake in historical context

## Usage

```python
# In Blender 5.1 Scripting workspace:
exec(open("blueprint.py").read())   # builds Rikitake_Poi mesh
exec(open("record.py").read())      # sets up the render and animates
bpy.ops.render.render(animation=True)
```

Export GLB via the Holoflow exporter (Properties → Scene → Holoflow WebXR Export)
or via `bpy.ops.export_scene.gltf(filepath="rikitake_poi.glb", export_draco_mesh_compression_enable=True)`.
