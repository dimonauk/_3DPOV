# Gielis Superformula — Polar-Form 3D Organic Poi Head

**Blender 5.1 · Python · numpy · CC0**

A single six-parameter polar equation that unifies circles, squares, starfish,
flowers, and hypocycloids.  Extended to 3D by two independent superformula
evaluations over latitude and longitude.  This entry builds a poi-head mesh from
the hexagonal-blob parameter set, adds four shape keys that morph through
biologically inspired forms, vertex-colours the surface by local radius, and
exports a WebXR-ready GLB with Draco compression.

---

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Build mesh, shape keys, vertex colours, export GLB |
| `record.py` | Animate shape-key sequence, render `viewport.mp4` via Workbench |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | CI manifest |

## Outputs

| Artefact | Location |
|---------|---------|
| `hf_superformula_poi.glb` | Same folder as blueprint.py (run in-blend) |
| `hf_superformula_poi.blend` | Saved manually after run |
| `viewport.mp4` | `public/library/videos/scripting/<slug>/viewport.mp4` |
| `screen.mp4` | Same videos directory |

## How to run

1. Open Blender 5.1.
2. Switch to **Scripting** workspace.
3. Load `blueprint.py` → press **Alt+P**.
4. Console should print `[superformula] ✓ exported //hf_superformula_poi.glb`.
5. Load `record.py` → press **Alt+P** to render `viewport.mp4`.
6. Follow `SCREEN-RECORDING-NOTES.md` for the OBS screen recording.
7. **File → Save As** → `hf_superformula_poi.blend`.

## Shape keys

| Key | m  | n1   | n2   | n3   | Shape |
|-----|----|------|------|------|-------|
| Basis    | 6  | 1.0  | 1.0  | 1.0  | Hexagonal blob |
| Starfish | 5  | 2.0  | 7.0  | 7.0  | 5-arm sea star |
| Cross    | 4  | 1.0  | 2.0  | 2.0  | 4-lobe cross |
| Thorns   | 8  | 0.5  | 0.5  | 8.0  | 8-spike ball |
| Cube     | 4  | 50.0 | 50.0 | 50.0 | Rounded cube |

## Licence
CC0 — no rights reserved.

## External references
- Gielis, J. (2003). "A generic geometric transformation that unifies a wide range
  of natural and abstract shapes." *American Journal of Botany* 90(3):333–338.
  DOI 10.3732/ajb.90.3.333
- Bourke, P. "Superformula." paulbourke.net/geometry/superformula/ (PD reference)
