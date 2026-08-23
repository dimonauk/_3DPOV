# Neovius Surface — Im-3m TPMS, Genus 9

**Blender 5.1 · Python/NumPy · CC0**

The highest-genus surface in common use among the triply periodic minimal
surfaces.  Edvard Rudolf Neovius described it in his 1883 Helsingfors
doctoral thesis — four years before Schwarz published his catalogue — as one
of two new periodic minimal surfaces distinct from the catenoid and helicoid
families.

## Mathematical content

| Property | Value |
|---|---|
| Level-set equation | f = 3(cos x + cos y + cos z) + 4 cos x · cos y · cos z = 0 |
| Space group | Im-3m (#229, body-centred cubic Oh⁹) |
| Euler characteristic | χ = −16 per conventional cubic cell [0, 2π]³ |
| Genus | g = 9 per primitive BCC unit cell |
| Labyrinths | 2, non-congruent: ~74% (larger) and ~26% (smaller) |
| Mean curvature | H = 0 everywhere (minimal surface) |
| Gaussian curvature | K ≤ 0 everywhere; K = 0 at 24 flat points per cell |
| Flat points | Located at ⟨100⟩ face-centres and their BCC translations |
| BCC body-centre | (π, π, π); f = −13 < 0, inside the smaller labyrinth |
| BCC corner | (0, 0, 0); f = +13 > 0, inside the larger labyrinth |

## Comparison with companion TPMS tutorials

| Surface | f(x,y,z) = 0 | Space group | Genus |
|---|---|---|---|
| Schwarz P | cos x + cos y + cos z | Pm-3m | 3 |
| Schwarz D | sin x sin y sin z + … | Fd-3m | 3 |
| Gyroid | sin x cos y + sin y cos z + sin z cos x | Ia-3d | 3 |
| **Neovius** | **3(Cx+Cy+Cz) + 4·Cx·Cy·Cz** | **Im-3m** | **9** |

## Files

| File | Purpose |
|---|---|
| `blueprint.py` | Blender 5.1 bpy script — marching tetrahedra, shape keys, curvature colour, GLB export |
| `record.py` | Render a 120-frame viewport animation → `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |

## Artefacts produced

- `neovius_floor.blend` — Blender file (save after running `blueprint.py`)
- `neovius_floor.glb` — Draco-6, Gaussian curvature vertex colour, 3 shape keys
- `viewport.mp4` — 4-second orbit + morph render (via `record.py`)
- `screen.mp4` — manual screen recording (see notes)

## Running

```bash
blender --background --python blueprint.py
```

Or paste `blueprint.py` into the Scripting workspace and press **Run Script**.

## Shape keys

| Key | ISO offset | Effect |
|---|---|---|
| Basis | 0.0 | Standard Neovius surface |
| SK_Expand | +0.50 | Surface shifts into larger labyrinth (corner region expands) |
| SK_Compress | −0.50 | Surface shifts into smaller labyrinth (body-centre pockets grow) |
| SK_Wide | +0.90 | Near-rupture of larger labyrinth; topology approaching Schwarz P |

## Why the non-congruent labyrinths matter

All three canonical TPMS (Schwarz P, D, Gyroid) divide space into two
*congruent* labyrinths — you can apply a crystallographic symmetry to map
one onto the other.  The Neovius surface breaks this symmetry: no
crystallographic operation maps the 74% channel system to the 26% pocket
system.  This makes the Neovius surface an example of a *heterogeneous*
bicontinuous morphology, relevant to block-copolymer self-assembly and
nano-porous electrode design.

## Licence

All files in this directory are released under **CC0 1.0 Universal**
(public domain dedication).  No attribution required, but appreciated.
