# Phyllotaxis — Golden Angle, Vogel Model & Fibonacci Parastichies
## Sunflower Poi Disc for WebXR · Blender 5.1

> "Nature does not solve an optimisation problem.  She simply uses the most
> irrational number available."

---

## What this builds

A **poi-disc head** assembled from 280 seed platelets arranged by Vogel's
phyllotaxis model.  Five shape keys let you scrub between the optimal
golden-angle packing and visibly broken configurations, making the
mathematics of irrational numbers physically tangible.

| File | Purpose |
|------|---------|
| `blueprint.py` | Full scene construction; produces `phyllotaxis_poi_disc.glb` |
| `record.py` | Viewport animation: overhead plan → orbit → morph demo → pull-back |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions |
| `.expected-artefacts.json` | Artefact manifest with cross-references |

---

## The mathematics in three paragraphs

**Vogel 1979**: place seed number *n* (n = 0, 1, 2, …) at polar radius
r = C·√n and angle θ = n·α, where C is a scale constant and α is the
divergence angle.  √n spacing gives equal area to each seed regardless of
radial position — a first-order packing requirement.

**Golden angle**: α = 2π/φ² ≈ 2.3999632 rad ≈ 137.5077°, where
φ = (1+√5)/2.  φ has continued fraction [1;1,1,1,…], the slowest
possible rational convergence.  Any rational approximant p/q would
create *q* straight spokes; because φ's best approximants are consecutive
Fibonacci ratios F_k/F_{k+1}, the spokes you see in a real sunflower are
always adjacent Fibonacci numbers — classically 34 clockwise and 55
counter-clockwise (or 55 and 89 in larger flowers).

**Why it matters for poi**: the disc is viewed from both faces during a
performance.  A radially symmetric disc would look the same from every
angle.  A phyllotaxis disc has *apparent* 34-fold symmetry from the front
and *different apparent symmetry* from a rotated view — the pattern
appears to breathe as the poi spins.  Five shape keys let the performer
choose their preferred arm count for a given set.

---

## Shape keys

| Key name | α (degrees) | Visual |
|----------|-------------|--------|
| `Basis` | 137.508° (golden) | Dense, no preferred arm |
| `Alpha_137_3` | 137.3° | Faint 89-arm ghost appears |
| `Alpha_137_7` | 137.7° | Mirror ghost (opposite chirality) |
| `Alpha_180` | 180.0° | Collinear rows — worst packing |
| `Alpha_120` | 120.0° | Clear 3-arm star |

Scrub between keys in **Properties → Object Data → Shape Keys** to see the
seeds rearrange in real time.

---

## Running the blueprint

```bash
# Blender 5.1 headless run
blender --background --python blueprint.py
# or open Blender, paste into Text Editor, click ▶ Run Script
```

Runtime: ~1–3 seconds (280 seeds, no marching algorithm needed).

---

## Export conventions

| Setting | Value |
|---------|-------|
| Format | GLB |
| Draco compression | Level 6 |
| Textures | WebP |
| Axis | +Y up (applied before export) |
| Root name | `phyllotaxis_poi_disc` |
| `holoflow:facet` | `true` |
| `holoflow:category` | `poi-head` |

---

## Licence

Blueprint, record script, and documentation: **CC0 1.0 Universal**.
Outside references credited in `.expected-artefacts.json` and the
accompanying tutorial page.
