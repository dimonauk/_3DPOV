# Chua's Circuit — Leon Chua 1983, Double-Scroll Attractor

**System**: Chua's normalised circuit ODE (piecewise-linear)  
**Published**: Chua LO (1983); proven chaotic in Chua, Komuro, Matsumoto (1986)  
**Blender version**: 5.1  
**Licence**: CC0 (equations > 40 yr, mathematical content public domain)

---

## Equations

```
ẋ = α (y − h(x))       voltage across capacitor C₁
ẏ = x − y + z          voltage across capacitor C₂
ż = −β y               current through inductor L

h(x) = m₁x + ½(m₀−m₁)(|x+1| − |x−1|)   Chua diode i–v characteristic
```

Piecewise expansion of h(x):

```
h(x) = m₁x + (m₀−m₁)   x > +1   (outer, positive conductance)
h(x) = m₀x              |x| ≤ 1  (inner, negative conductance)
h(x) = m₁x − (m₀−m₁)   x < −1   (outer, positive conductance)
```

**Canonical parameters**: α=15.6  β=28.0  m₀=−1/7  m₁=2/7

---

## Fixed points

| Point | Coordinates | Type |
|-------|-------------|------|
| P₀ | (0, 0, 0) | Saddle (connects the two scrolls) |
| P₊ | (+1.5, 0, −1.5) | Saddle-focus (scroll centre) |
| P₋ | (−1.5, 0, +1.5) | Saddle-focus (scroll centre) |

Shilnikov condition at P±: |λ_r| / Re(λ_c) ≈ 4.9 > 1 → chaos guaranteed

---

## Position-dependent divergence (unique property)

```
∇·F = −α·h′(x) − 1

Inner |x| < 1  (h′ = m₀ = −1/7):  ∇·F ≈ +1.23   local expansion
Outer |x| > 1  (h′ = m₁ = +2/7):  ∇·F ≈ −5.46   strong contraction
```

Unlike every smooth system in this library, the divergence flips sign
as the orbit crosses x=±1.  The Chua diode injects energy near the
origin; the passive RLC circuit dissipates it in the outer regions.

---

## Lyapunov spectrum (canonical)

| Exponent | Value | Role |
|----------|-------|------|
| λ₁ | ≈ +0.39 | Chaos (diverging orbits) |
| λ₂ | ≈ 0.00 | Neutral (attractor surface) |
| λ₃ | ≈ −2.79 | Folding |
| D_KY | ≈ 2.14 | Kaplan–Yorke dimension |
| τ | ≈ 2.6 | Lyapunov time (s) |

---

## Shape keys

| Key | α | β | Character |
|-----|---|---|-----------|
| Basis | 15.6 | 28.0 | Canonical double-scroll |
| SK_HighAlpha | 20.0 | 28.0 | Tighter winding, same topology |
| SK_SpiralChua | 9.5 | 28.0 | Single-scroll spiral attractor |
| SK_LowBeta | 15.6 | 16.0 | Changed LC ratio, wider scroll |

---

## Integration

| Parameter | Value |
|-----------|-------|
| Integrator | RK4 |
| dt | 0.002 |
| Burn-in | 3 000 steps |
| N steps | 90 000 |
| Thin | 30 → **3 000 waypoints** |
| Tube sides | 12 |
| Vertices | 36 000 |
| Quads | 35 988 |

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Blender 5.1 Python script — builds mesh + exports GLB |
| `record.py` | Viewport animation render script |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen capture |
| `hf_chua_poi.blend` | Saved Blender file (run blueprint.py to generate) |
| `hf_chua_poi.glb` | Draco-compressed GLB for WebXR |

---

## Outside sources

1. **williamgilpin/dysts** — MIT licence  
   <https://github.com/williamgilpin/dysts>  
   Chua's circuit catalogued with independently verified Lyapunov exponents.  
   Related: scipy (BSD-3), matplotlib (PSF).

2. **Sprott JC — A Collection of Strange Attractors**  
   <https://sprott.physics.wisc.edu/chaos/chua/>  
   Permissive educational resource; Chua double-scroll parameters and phase portraits.  
   Related: <https://sprott.physics.wisc.edu/chaos/> (main chaos reference pages).
