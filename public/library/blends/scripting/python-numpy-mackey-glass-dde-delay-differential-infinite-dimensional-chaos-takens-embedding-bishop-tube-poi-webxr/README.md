# Mackey-Glass DDE — Infinite-Dimensional Chaos & Takens Embedding

**Blender 5.1 · Python scripting · poi head · WebXR**

The Mackey-Glass delay-differential equation (1977) models blood-cell
production under delayed feedback.  Its phase space is the infinite-dimensional
function space C([−τ, 0], ℝ).  Takens' theorem (1981) maps that space into ℝ³
via time-delay coordinates, producing the attractor curve threaded through the
Bishop tube here.

## Shape keys

| Key | τ | Regime |
|-----|---|--------|
| Basis | 17 | Weak chaos — λ₁ ≈ +0.0065, D_KY ≈ 3.6 |
| SK_Med | 23 | Moderate chaos — D_KY ≈ 4.5 |
| SK_Limit | 13 | Periodic orbit — sub-threshold closed loop |
| SK_Strong | 30 | High-dimensional chaos — D_KY ≥ 7 |

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Full Blender/Python script |
| `record.py` | EEVEE viewport render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions |

## Outside sources

1. Mackey MC & Glass L (1977) *Science* 197:287. DOI 10.1126/science.267326 — PD
2. Takens F (1981) *Lect. Notes Math.* 898:366. DOI 10.1007/BFb0091924 — PD
3. Farmer JD (1982) *Physica D* 4:366. DOI 10.1016/0167-2789(82)90042-2 — PD
4. NumPy — BSD-3-Clause — https://github.com/numpy/numpy

## Licence
Blueprint scripts: **CC0 1.0**. Mathematical content: public domain.
