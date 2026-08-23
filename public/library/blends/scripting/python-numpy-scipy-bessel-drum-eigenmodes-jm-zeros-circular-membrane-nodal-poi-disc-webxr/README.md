# Bessel Drum Eigenmodes

**Circular Membrane Vibrational Modes · J_m(k_{mn} r/R) cos(mθ)**  
Blender 5.1 · Python + numpy + scipy.special · CC0

---

## What this is

The circular drumhead (radius R, fixed rim) has analytically exact
vibrational modes given by Bessel functions of the first kind.  Each
mode is labelled by two integers:

- **m** — azimuthal order: the number of nodal **diameters** (lines through
  the centre where displacement = 0).
- **n** — radial order: determines the number of nodal **circles** (n−1
  interior circles plus the rim itself).

The displacement field is:

```
u_{m,n}(r, θ) = J_m(k_{mn} r / R) × cos(mθ)
```

where `k_{mn}` is the **n-th positive zero** of the Bessel function `J_m`,
computed by `scipy.special.jn_zeros(m, n)[-1]`.

---

## Six shape keys

| Shape key    | m | n | Nodal diameters | Interior circles |
|--------------|---|---|-----------------|-----------------|
| SK_Mode_0_1  | 0 | 1 | 0               | 0 (fundamental) |
| SK_Mode_1_1  | 1 | 1 | 1               | 0 (sloshing)    |
| SK_Mode_2_1  | 2 | 1 | 2               | 0               |
| SK_Mode_0_2  | 0 | 2 | 0               | 1 (breathing 2) |
| SK_Mode_3_1  | 3 | 1 | 3               | 0               |
| SK_Mode_1_2  | 1 | 2 | 1               | 1               |

---

## Vertex colour

The FLOAT_COLOR POINT attribute `Drum_Mode` encodes the normalised
eigenmode amplitude (−1 to +1):

- **Cobalt** — positive displacement
- **White** — nodal line (zero displacement)
- **Amber** — negative displacement

The white nodal patterns are the visual centrepiece: you can read the
(m, n) mode directly from the number of white lines crossing the disc.

---

## Files

| File | Role |
|------|------|
| `blueprint.py` | Run in Blender ▷ Scripting. Builds mesh + shape keys + GLB. |
| `record.py` | Run after blueprint. Animates shape-key cycle → `viewport.mp4`. |
| `SCREEN-RECORDING-NOTES.md` | OBS setup for screen capture. |
| `.expected-artefacts.json` | Manifest of expected output files. |

---

## Physics context

The same Bessel-function eigenmodes appear in:

- **Acoustics** — drum kit tom tones, tabla, timpani
- **Optics** — Airy disc (the `(0,1)` pattern of a circular aperture)
- **Fibre optics** — LP01, LP11, LP21 guided modes
- **Quantum mechanics** — 2D hydrogen atom / circular quantum dot states
- **Electromagnetism** — circular waveguide TE/TM modes

---

## Blender version

Tested on Blender **5.1**.  Requires `scipy` to be available in
Blender's Python environment:

```bash
# From Blender's bundled Python:
<blender_dir>/4.x/python/bin/python -m pip install scipy
```

---

## Licence

CC0 — no rights reserved.  The underlying mathematics is in the
public domain (NIST DLMF §10, US Government work).
