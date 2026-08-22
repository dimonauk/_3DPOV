# Miura-Ori Rigid Origami — Kawasaki Flat-Foldability, Auxetic Fold & Poi Disc
## Blender 5.1 | Python + numpy | CC0

A poi disc generated from the Miura-ori fold pattern — a rigid origami
tessellation with a single degree of freedom governed by Kawasaki's
flat-foldability theorem.  Amber vertices are mountain peaks, cobalt are
valley troughs; the disc compresses uniformly as fold state increases,
exhibiting auxetic (negative Poisson's ratio) behaviour.

### Mathematical content
- **Kawasaki theorem (1989)**: at each interior vertex alternating face angles
  must sum to π. Miura-ori satisfies this trivially with angles φ, π−φ, φ, π−φ,
  making the sheet globally flat-foldable from any configuration.
- **Schenk & Guest (2013 PNAS)** lattice vectors:
  - `lx(θ) = a·sin θ / √(1 − sin²φ·cos²θ)` — x-pitch
  - `ly(θ) = b·√(1 − sin²φ·cos²θ)` — y-pitch (coupled: auxetic)
  - `lz(θ) = a·cos θ·sin φ / √(1 − sin²φ·cos²θ)` — z-amplitude
- **Poisson ratio**: ν = −sin²φ·cos²θ·sin²θ / (1−sin²φ·cos²θ)² < 0 for all
  φ ∈ (0°,90°), θ ∈ (0°,90°). This is the defining auxetic property: the sheet
  contracts in both x and y simultaneously when folded.
- **1-DOF mechanism**: the fold angle θ fully determines the shape; no panel
  needs to deform (all panels are rigid parallelograms).

### Files

| File | Role |
|------|------|
| `blueprint.py` | Main Blender script — builds mesh, shape keys, vertex colour, exports GLB |
| `record.py` | Viewport animation render (run after blueprint.py) → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar instructions for `screen.mp4` |
| `.expected-artefacts.json` | Artefact manifest with cross-reference metadata |

### Shape Keys

| Key | θ (rad) | Description |
|-----|---------|-------------|
| `Basis` | π/2 | Fully flat disc, z = 0 for all vertices |
| `SK_ThirdFold` | π/3 | ~33 % folded — crease ridges just appearing |
| `SK_TwoThirdFold` | π/6 | ~67 % folded — strong tent topology, clear compression |
| `SK_Compact` | π/12 | ~92 % folded — nearly closed, maximum z-amplitude |

### Parameters (top of blueprint.py)
- `PANEL_A = 0.055 m` — panel length along horizontal crease
- `PANEL_B = 0.048 m` — panel slant length (across crease)
- `PHI = 58°` — sector angle between crease families
- `N_ROWS = 16, N_COLS = 20` — panel count
- `DISC_R = 0.35 m` — circular mask radius (flat state)
- `POI_R = 0.100 m` — bounding-sphere target (GLB export scale)

### Outside Sources
1. **Schenk M & Guest SD (2013)** "Geometry of Miura-folded metamaterials."
   *PNAS* 110(9):3276–3281. Open access. CC BY.
   https://doi.org/10.1073/pnas.1217998110
2. **OrigamiSimulator** by Amanda Ghassaei. MIT licence.
   https://github.com/amandaghassaei/OrigamiSimulator

### Licence
Blueprint, record script, and all authored content: **CC0 1.0 Universal**.
