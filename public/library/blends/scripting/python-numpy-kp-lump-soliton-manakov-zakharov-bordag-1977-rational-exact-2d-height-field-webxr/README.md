# KP-I Lump Soliton — Kadomtsev–Petviashvili Rational Exact Solution (1977)

**Blender version:** 5.1  
**Licence:** CC0  
**Topic category:** scripting / nonlinear waves  

## What this does

`blueprint.py` generates a 128×128 stage-floor height-field mesh from the
exact rational lump soliton of the Kadomtsev–Petviashvili equation (KP-I):

```
( u_t  +  6u·u_x  +  u_xxx )_x  −  u_yy  =  0
```

The lump is computed analytically via the tau-function substitution
`u = 2∂²_x ln τ` with the quadratic tau function:

```
τ = (x − vt)²  +  y²  +  C²,   v = 3/C²
```

Five time snapshots (t = −2, −1, 0, +1, +2) are baked as shape-key morphs.
A per-vertex `KP_Lump_Height` FLOAT_COLOR attribute drives cobalt (negative
lobes) → amber (positive peak) emission via an Attribute node.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Main Blender script — 16384V mesh, 5 shape keys, material, GLB export |
| `record.py` | EEVEE Next OpenGL animation render → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS/Game Bar guide for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

## Parameters (top of `blueprint.py`)

| Constant | Default | Meaning |
|----------|---------|---------|
| `GRID_N` | 128 | Vertices per side (128² = 16 384 V, 16 129 Q) |
| `C_PARAM` | 1.0 | Width parameter (peak amplitude = 4/C², velocity = 3/C²) |
| `HEIGHT_SCALE` | 0.45 m | Vertical scale (peak height ≈ 1.8 m at C=1) |
| `TIMES` | [−2, −1, 0, +1, +2] | Time snapshots for shape keys |
| `EMIT_STRENGTH` | 3.5 | Material emission multiplier |

## Running

1. Open Blender 5.1.
2. Save a new `.blend` file in this directory (`hf_kp_lump.blend`).
3. Open the **Scripting** workspace; paste / drag `blueprint.py`.
4. Run the script (`Alt+P` or the ▶ button).
5. Shape keys appear in the **Properties → Object Data → Shape Keys** panel.
6. Scrub the **SK_t0** key to 1.0 to see the centred lump.

## Physics background

The Kadomtsev–Petviashvili equation was derived in 1970 as a 2D extension of
the KdV equation to model long weakly-two-dimensional surface waves on shallow
water.  It has two variants:

- **KP-I** (negative transverse dispersion): admits rational lump solitons
  localised in both x and y, propagating without radiation.
- **KP-II** (positive transverse dispersion): supports line solitons but no
  lumps; governs generic shallow-water waves.

The exact 1-lump solution was found in 1977 by Manakov, Zakharov, Bordag,
Its, and Matveev using the inverse scattering / Darboux transform.  It decays
as 1/r² in all directions — algebraically slower than the exponential decay
of KdV solitons — and carries a characteristic dipole signature: a positive
central peak flanked by two negative lobes along the propagation direction.

## Cross-references

### Studio
- [KdV 2-Soliton — parent equation, Hirota bilinear method](/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr)
- [Peregrine Breather — rational NLS soliton on a background](/tutorials/blender-tutorial-python-numpy-peregrine-breather-rogue-wave-nls-rational-solution-poi-disc-webxr)
- [Gray-Scott Reaction-Diffusion — height-field technique](/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr)

### Outside sources
- Manakov SV et al. (1977) *Physics Letters A* **63**(3):205-206.
  [sciencedirect.com](https://www.sciencedirect.com/science/article/pii/0375960177906566) — PD
- Kadomtsev BP, Petviashvili VI (1970) *Sov. Phys. Doklady* **15**:539-541 — PD
