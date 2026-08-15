# Dini's Surface — Helical Pseudosphere Poi Head

**Blender 5.1 · Python numpy · CC0**

---

## What this is

Dini's surface (Ulisse Dini, 1869) is a family of helically twisted pseudospheres,
each with constant Gaussian curvature K = −1/(a²+b²).  At pitch b = 0 it
collapses to Beltrami's pseudosphere, the first embedded model of the hyperbolic
plane in Euclidean 3-space.  As b increases the surface spirals into a drill-bit
shape while preserving its non-Euclidean geometry exactly.

The blueprint produces a poi head with five shape keys sweeping b from 0
(pseudosphere) to 2.4 (tight drill), coloured by the sine-Gordon kink angle ω
that encodes the soliton structure underlying the surface's integrability.

---

## Parametrisation

```
x(u,v) = a · cos(u) · sin(v)
y(u,v) = a · sin(u) · sin(v)
z(u,v) = a · (cos(v) + ln(tan(v/2)))  +  b · u

u ∈ [0, 2π · U_TURNS],   v ∈ (0, π)  (open — cusps at 0 and π)
K = −1 / (a² + b²)        (constant for all u, v)
```

The tractrix component `cos(v) + ln(tan(v/2))` is the height of the
curve whose surface of revolution is the pseudosphere.  Adding `b·u`
helically unwinds the surface while preserving K.

---

## Sine-Gordon connection

The angle ω between the two parameter curves on Dini's surface satisfies
the sine-Gordon equation ω_uu − ω_vv = sin(ω).  The kink solution at
velocity β = b/√(a²+b²) is ω = 4·arctan(exp(γ(u − βv))).  Vertex colour
maps this angle as rainbow hue, revealing the soliton ridge.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full mesh + shape keys + material + GLB export |
| `record.py` | 90-frame viewport animation render |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `.expected-artefacts.json` | CI artefact checklist |

---

## Usage

```python
# In Blender 5.1 Scripting workspace:
exec(open("blueprint.py").read())
# → hf_dini_poi.glb exported to glbs/scripting/<slug>/
```

Requires `numpy` (bundled with Blender 5.1).

---

## Failure modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| Mesh collapses at tips | V_MIN/V_MAX too close to 0/π | Increase V_MIN to 0.12 |
| Shape key jumps | `export_apply=True` destroys morph deltas | Keep `export_apply=False` |
| Black faces in viewport | backface culling on | Disable in Material: `use_backface_culling = False` |
| GLB has no colour | Wrong Blender attribute type | Use `FLOAT_COLOR`, not `BYTE_COLOR` |
