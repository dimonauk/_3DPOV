# CGLE — Complex Ginzburg–Landau Equation  
### Spiral Turbulence · Benjamin–Feir Instability · Phase Defects  
**Blender 5.1 · Python + numpy · Stage Floor · WebXR**

---

## What this is

The Complex Ginzburg–Landau equation (CGLE) is the universal normal form for any
oscillatory medium near a Hopf bifurcation. One complex scalar field
A(x,y,t) captures both **amplitude** (|A|) and **phase** (∠A).
The 2-D version:

```
∂A/∂t = A + (1+ic₁)∇²A − (1+ic₂)|A|²A
```

produces a phase diagram of spectacular patterns depending on (c₁, c₂):
- **Stable spirals** — long-wavelength, frozen defect arrangement (|c₁c₂| ≪ 1)  
- **Phase turbulence** — modulated uniform oscillation, no defects (BF marginal)  
- **Defect turbulence** — spontaneous creation/annihilation of ±1 vortex pairs  

The **Benjamin–Feir criterion** (Newell 1974): plane wave solutions are
linearly unstable when **1 + c₁c₂ < 0**.

## Mesh

- 128 × 128 = **16 384 vertices**, 16 129 quads  
- Vertex Z = |A| × 4.0 (amplitude height field)  
- `CGL_Phase` FLOAT_COLOR: phase angle ∠A mapped cobalt→amber  

## Shape keys

| Key | c₁ | c₂ | c₁c₂ | BF | Pattern |
|---|---|---|---|---|---|
| Basis | 0.50 | −1.40 | −0.70 | stable | gentle spiral walls |
| SK_Turbulent | 2.00 | −1.50 | −3.00 | **unstable** | defect turbulence |
| SK_PhaseTurb | 0.80 | −1.80 | −1.44 | **unstable** | phase turbulence |
| SK_Frozen | 0.20 | −0.60 | −0.12 | stable | frozen spiral cores |

## Numerical method — ETD1 (Cox & Matthews 2002)

In Fourier space: operator L(k) = 1 − (1+ic₁)|k|²

```
Â_{n+1} = exp(L·dt)·Â_n + φ₁(L,dt)·N̂_n
φ₁ = expm1(L·dt) / L          (stable for any dt)
N(A) = −(1+ic₂)|A|²A          (nonlinear term)
```

ETD1 treats the stiff linear part exactly. dt = 0.1 is safe regardless of N.

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Full bpy script — integrate, mesh, shape keys, export |
| `record.py` | Viewport animation: Basis→SK_Turbulent morph, 10 s mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |
| `holoflow_cgl_floor.blend` | Saved scene (created on run) |

## Outside sources

1. **Aranson & Kramer 2002** — *"The world of the complex Ginzburg–Landau equation"*  
   Rev Mod Phys 74:99. https://arxiv.org/abs/cond-mat/0106115 (arXiv, open access).  
   Authors: Igor Aranson, Lorenz Kramer.

2. **Cox & Matthews 2002** — *"Exponential time differencing for stiff systems"*  
   J Comput Phys 176:430–455. DOI 10.1006/jcph.2002.6995  
   Method used: ETD1 / ETD2RK. Public-domain algorithm.

3. **Cross & Hohenberg 1993** — *"Pattern formation outside of equilibrium"*  
   Rev Mod Phys 65:851. https://doi.org/10.1103/RevModPhys.65.851  
   Comprehensive reference for Ginzburg–Landau phenomenology.
