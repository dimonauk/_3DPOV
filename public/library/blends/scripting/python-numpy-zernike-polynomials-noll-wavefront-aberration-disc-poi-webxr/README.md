# Zernike Polynomials — Noll-Ordered Wavefront Aberration Disc

**Blender 5.1 · Python numpy · CC0**

Frits Zernike's orthonormal polynomial basis on the unit disc encodes every
classical optical aberration: defocus, astigmatism, coma, trefoil, spherical
aberration.  This entry builds a poi disc as the height field of the primary
spherical aberration mode (j=11), then adds four shape keys that morph through
defocus (j=4), astigmatism 0° (j=5), coma X (j=7), and trefoil X (j=9).
Vertex colours encode the signed wavefront value via teal/amber/white palette.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Builds mesh, colours, shape keys, exports GLB |
| `record.py` | Animates shape-key weights, renders viewport.mp4 |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for screen.mp4 |

## Artefacts

| File | Notes |
|------|-------|
| `hf_zernike_poi.blend` | Save manually after blueprint.py runs |
| `hf_zernike_poi.glb` | Written by blueprint.py — Draco-6, WebP, +Y-up |
| `viewport.mp4` | Written by record.py (path: ../../videos/…) |
| `screen.mp4` | Recorded manually per SCREEN-RECORDING-NOTES.md |

## Quick start

1. Open Blender 5.1 → Scripting workspace.
2. Load `blueprint.py` → **Alt+P**.  Takes ~4 s on an 8-core CPU.
3. Confirm console: `[zernike] ✓ exported //hf_zernike_poi.glb`.
4. Inspect in Material Preview — teal rim (high spherical), white zero centre.
5. Object Properties → Shape Keys → drag each morph weight 0→1→0.
6. Load `record.py` → **Alt+P** to bake the animation video.
7. **File → Save As** → `hf_zernike_poi.blend`.

## Maths in brief

```
R_n^|m|(ρ) = Σ_{s=0}^{(n-|m|)/2}  (-1)^s (n-s)! / [s! ((n+m)/2-s)! ((n-m)/2-s)!]  ρ^(n-2s)

Z_j(ρ,θ) = √(2(n+1)) · R_n^|m|(ρ) · cos(mθ)    m > 0
           √(2(n+1)) · R_n^|m|(ρ) · sin(|m|θ)   m < 0
           √(n+1)    · R_n^0(ρ)                   m = 0
```

Normalisation: `∫∫_disc Z_j Z_k dA = π δ_jk` (ANSI Z80.28 / Noll convention).

## Outside sources

- **Noll, R.J. (1976)** — "Zernike polynomials and atmospheric turbulence",
  *JOSA* 66(3):207–211. Public domain algorithm.
  https://opg.optica.org/josa/abstract.cfm?uri=josa-66-3-207
- **AOtools** — MIT — https://github.com/AOtools/aotools
  Python adaptive-optics toolkit; `zernike.py` module for reference.
  Related: https://github.com/ehpor/hcipy (MIT, high-contrast imaging).

## Noll index table

| j  | n | m  | Name               | Symmetry |
|----|---|----|--------------------|----------|
| 1  | 0 | 0  | Piston             | C∞       |
| 4  | 2 | 0  | Defocus            | C∞       |
| 5  | 2 | 2  | Astigmatism 0°     | D₂       |
| 7  | 3 | 1  | Coma X             | C₁       |
| 9  | 3 | 3  | Trefoil X          | D₃       |
| 11 | 4 | 0  | Spherical (primary)| C∞       |
