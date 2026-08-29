# Rikitake Two-Disc Dynamo — Geomagnetic Polarity Reversal Chaos

**Blender 5.1 · Python + NumPy · Poi Head for WebXR**  
*Holoflow Studio Library · CC0-1.0*

## What this is

A Bishop parallel-transport tube tracing the strange attractor of the **Rikitake
two-disc dynamo** (Tsuneji Rikitake, 1958) — the first mathematical model to
explain why Earth's magnetic field reverses polarity at chaotic, unpredictable
intervals.

The attractor visits two lobes: one where `x > 0` (coloured **cobalt**, corresponding
to normal magnetic polarity — the direction a compass points today) and one where
`x < 0` (coloured **amber**, corresponding to reversed polarity, as recorded in
palaeomagnetic basalt).  The transitions between lobes are chaotic: no two reversal
sequences are alike.

## Physics

Two Faraday discs each generate an EMF that drives a current through the
electromagnet coil wound around the other disc.  The coupling is:

```
ẋ = −μ x + z y
ẏ = −μ y + (z − a) x
ż =  1  − x y
```

`x` and `y` are the disc angular velocities (proportional to their coil currents);
`z` is the total driving current; `μ` is the resistance/friction ratio; `a` is
an angular offset.  At `μ = 2, a = 5` the system is chaotic with Lyapunov exponent
`λ₁ ≈ 0.047`.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Run in Blender Scripting workspace to build the mesh |
| `record.py` | Run after blueprint to render `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest of expected output files |

## How to use

1. Open Blender 5.1, go to the **Scripting** workspace.  
2. Open `blueprint.py`, press **Run Script**.  
3. Switch to **Layout**, set shading to **Rendered**.  
4. Export via **File → Export → glTF 2.0** with Draco compression level 6,
   WebP textures, `+Y up`, and morph targets enabled.

## Shape keys

| Key | Parameters | Visual effect |
|-----|-----------|---------------|
| Basis | μ = 2.0, a = 5.0 | Canonical geomagnetic chaos, ~25–30 polarity reversals |
| SK_HighFriction | μ = 3.0, a = 5.0 | Stronger dissipation — fewer reversals, tighter lobes |
| SK_LowFriction | μ = 1.0, a = 5.0 | Weaker damping — longer polarity epochs, wider excursions |

## Credits

- Rikitake T (1958) *Oscillations of a system of disk dynamos.*
  Proc. Cambridge Phil. Soc. **54**(1):89–105. (Mathematical content public domain.)
- Bullard E C (1955) *The stability of a homopolar dynamo.*
  Proc. Cambridge Phil. Soc. **51**(4):744–760. (Mathematical content public domain.)
- Gilpin W (2021–2024) *dysts: Dynamical Systems Benchmarks.* MIT licence.
  <https://github.com/williamgilpin/dysts>

## Cross-references

- [Thomas Cyclically-Symmetric Attractor](/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-rene-thomas-1999-sin-decay-z3-bishop-tube-poi-webxr)
- [Lorenz Attractor](/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr)
- [Rössler Attractor](/tutorials/blender-tutorial-python-bpy-rossler-attractor-rk4-poi-light-painting)
