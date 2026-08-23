# Three-Body Figure-8 Choreography

**Blender 5.1 · Python + numpy · CC0**

In 2000 Alain Chenciner and Richard Montgomery proved that three equal masses
under Newtonian gravity can orbit each other on a single figure-8 curve,
each body chasing the next at a phase offset of one third of the period.
Cristopher Simó refined the initial conditions to machine precision in 2002.
The orbit is remarkable: the figure-8 shape was hidden in the solution space
for centuries despite Newton's equations being known since 1687.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | RK4 integration, Bishop tube, shape keys, GLB export |
| `record.py` | Viewport animation with shape-key morphs and camera orbit |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `hf_three_body_fig8.blend` | Saved Blender file (run blueprint.py first) |
| `hf_three_body_fig8.glb` | Draco-6 WebP GLB for WebXR |

---

## Orbit mechanics

```
Period     T ≈ 6.3259   (G = m = 1)
Symmetry   D₆ dihedral group of order 12
Bodies     3 equal masses on the same closed curve
Phase      each body at offset k·T/3,  k = 0, 1, 2
Topology   braid word (σ₁ σ₂⁻¹)³ in B₃
Energy     E = −0.8726... (conserved)
```

Initial conditions (Simó 2002, Table 1):

```
Body 1:   x = ( 0.97000436, −0.24308753, 0)   v = (0.46620369, 0.43236573, 0)
Body 2:   x = (−0.97000436,  0.24308753, 0)   v = (0.46620369, 0.43236573, 0)
Body 3:   x = ( 0,           0,          0)   v = (−0.93240737, −0.86473146, 0)
```

Centre-of-mass conserved: x₁+x₂+x₃ = 0, v₁+v₂+v₃ = 0 ✓

---

## Integration

RK4 with dt = T/6 000 ≈ 0.001054 per step. Energy conservation ΔE/E₀ ≈ 5×10⁻⁹
per orbit — enough to keep the tube seam visually closed at N_LONG = 360 samples.

---

## Mesh

| Parameter | Value |
|-----------|-------|
| Spine samples N_LONG | 360 |
| Cross-section sides N_CIRC | 14 |
| Vertices | 5 040 |
| Quads | 5 040 |
| Shape keys | Basis · SK_Wide · SK_Thin |
| Vertex colour | ThreeBody_Phase (FLOAT_COLOR POINT) |

---

## Shape keys

| Key | Tube radius | Purpose |
|-----|-------------|---------|
| Basis | 0.028 m | Standard poi head |
| SK_Wide | 0.055 m | Emphasises volume of the orbit |
| SK_Thin | 0.012 m | Wire — highlights the self-intersection |

---

## Vertex colour: ThreeBody_Phase

The orbit has three-fold (D₆) symmetry: each third of the period looks the same
under a 120° rotation combined with a time shift of T/3. The colour encodes this:

```
t ∈ [0,   T/3):  COBALT (#0E68EA) → AMBER  (#EB8210)
t ∈ [T/3, 2T/3): AMBER  (#EB8210) → WHITE
t ∈ [2T/3, T):   WHITE            → COBALT (#0E68EA)
```

The three colour bands mark the regions where each body is "ahead" — cobalt
for body 1's current segment, amber for body 2's, white for body 3's.

---

## Export

`hf_three_body_fig8.glb` — Draco level 6, WebP textures, Y-up, transforms
applied, morph targets included. Target file size ≈ 28–38 KB.
