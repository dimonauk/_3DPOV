# Chua's Circuit — Double-Scroll Strange Attractor
**Holoflow Studio Library · Blender 5.1 · CC0-1.0**

---

## What this is

A poi head geometry built from the trajectory of Chua's circuit — the simplest
autonomous electronic circuit known to produce chaos.  The double-scroll
attractor is two intertwined spiral lobes wound around a pair of saddle-focus
fixed points, rendered as a Bishop parallel-transport tube (TUBE_R = 0.016 m,
12-sided cross-section, 45 000 integration steps).

---

## Circuit physics

The Chua circuit has four components: an inductor L, two capacitors C₁ and C₂,
and a two-terminal nonlinear resistor called the **Chua diode** (symbol R_n).
The diode has an N-shaped current–voltage characteristic with a region of
**negative resistance** — it pumps energy into the circuit rather than
dissipating it, sustaining the oscillation indefinitely.

In normalised coordinates (x = V(C₁)/E_bp, y = V(C₂)/E_bp, z = RI_L/E_bp):

```
ẋ = α (y − x − f(x))
ẏ = x − y + z
ż = −β y

f(x) = m₁x + (m₀−m₁)/2 · (|x+1| − |x−1|)
```

Canonical double-scroll parameters (Matsumoto 1985):
`α = 9, β = 100/7, m₀ = −8/7, m₁ = −5/7`

---

## Fixed-point analysis

Setting ẋ = ẏ = ż = 0 and solving:

| Point | x   | y | z    | Character |
|-------|-----|---|------|-----------|
| P₀   | 0   | 0 | 0    | Saddle (one positive real eigenvalue) |
| P+   | 3/2 | 0 | −3/2 | Saddle-focus (complex pair + real) |
| P−   | −3/2| 0 | 3/2  | Saddle-focus (complex pair + real) |

Derivation for P±: with |x| > 1, f(x) = m₁x + (m₀−m₁)·sign(x).
Setting f(x) = −x gives (m₁+1)x = −(m₀−m₁)·sign(x) → x = ±(m₁−m₀)/(m₁+1) = ±3/2. ✓

---

## Shilnikov chaos

Shilnikov's theorem (1965) guarantees horseshoe dynamics when a saddle-focus
equilibrium has a homoclinic orbit and the unstable (real) eigenvalue ρ_u
exceeds the magnitude of the stable real part ρ_s from the complex pair.

For Chua's circuit, the global dynamics are richer: the unstable manifold from
P₀ is **heteroclinic** to both P±, and the unstable manifolds from P± re-inject
into the P₀ neighbourhood, creating an infinite sequence of homoclinic returns.
Chua, Komuro and Matsumoto (1986) proved this rigorously via computer-assisted
analysis of the first-return map, establishing that the double scroll contains a
Smale horseshoe and is therefore chaotic in the formal (topological) sense.

---

## Shape keys

| Key | α | β | Character |
|-----|---|---|-----------|
| Basis | 9.0 | 14.286 | Canonical double scroll |
| SK_Dense | 10.5 | 14.286 | Denser spiral winding |
| SK_Tight | 9.0 | 18.0 | Tighter loop radius (higher inductance ratio) |
| SK_Wide | 11.8 | 14.286 | Spread arms near window boundary |

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full bpy script: RK4, tube, shape keys, vertex colour, GLB export |
| `record.py` | Viewport animation renderer (192 frames, 24 fps → `viewport.mp4`) |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI artefact manifest |

---

## References

- Chua L O, Komuro M, Matsumoto T (1986). *The Double Scroll Family*.
  IEEE Transactions on Circuits and Systems **33**(11): 1072–1118.
  DOI [10.1109/TCS.1986.1085869](https://doi.org/10.1109/TCS.1986.1085869)
- Matsumoto T (1984). *A Chaotic Attractor from Chua's Circuit*.
  IEEE Transactions on Circuits and Systems **31**(12): 1055–1058.
  [Historical equations are public domain]
- NumPy: BSD-3-Clause · <https://numpy.org/>
- Shilnikov L P (1965). *A case of the existence of a countable number of
  periodic motions*. Soviet Mathematics Doklady **6**: 163–166. [PD]
