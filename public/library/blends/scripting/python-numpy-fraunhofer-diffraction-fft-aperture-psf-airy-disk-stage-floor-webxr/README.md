# Fraunhofer Diffraction: 2D FFT Aperture PSF Height Field
**Blender 5.1 | Python + numpy | CC0 | Holoflow Studio**

Computes the far-field point-spread function (PSF) of three aperture shapes
by zero-padded 2D FFT, log-compresses the intensity for dynamic range, and
builds a **96 × 96 bmesh stage-floor height field** with morph-target shape keys.

## Quick Start

```bash
blender --python blueprint.py
```

Output: `hf_fraunhofer_psf.glb` (Draco-6, WebP textures, morph targets, +Y-up)

## Shape Keys

| Key | Aperture | PSF character |
|-----|----------|---------------|
| `Circular_Airy`      | Hard-edged disc (ø 45 % grid) | Airy disk — concentric rings, first dark ring at 1.22λ/D |
| `Hexagonal_Spikes`   | Regular hexagon (flat-top)    | 6 diffraction spikes perpendicular to each edge pair |
| `Annular_Sharpened`  | Ring aperture, ε = 0.35       | Narrower core (~0.64λ/D), elevated first sidelobe    |

## Recording

```bash
blender --python blueprint.py --python record.py
```

Writes a 150-frame viewport.mp4 to
`public/library/videos/scripting/.../viewport.mp4`.

## How the PSF is Computed

1. **Aperture grid** — `FFT_N × FFT_N = 512 × 512` binary mask (pupil = 1, outside = 0).
2. **Zero-pad to 2N × 2N** — prevents circular-convolution wrap-around; separates
   tiled copies of the aperture by ≥ 1 Rayleigh range.
3. **2D FFT + fftshift** — DC component (zero spatial frequency) centred.
4. **Intensity** `I = |F|²` — irradiance in the focal plane.
5. **Log compress** `10 log₁₀(I + ε)` — PSFs span 50–70 dB dynamic range.
6. **Crop** central `ZOOM_FRAC × FFT_N` bins in each direction (~22 Airy radii).
7. **Subsample** to `96 × 96` for the Blender mesh.

## Why the Hexagonal Aperture Has 6 Spikes

Each straight edge of the hexagon produces a sinc-like sidelobe lobe
perpendicular to itself (diffraction by a single slit).  Three pairs of
parallel edges → three pairs of opposing spikes → 6 spikes total, offset 60°.
This is why JWST starfield images show 6 primary spikes (plus weaker secondary
spider-vane spikes).

## Vertex Colour

Blue → teal → white ramp encodes log PSF intensity, written as a
`FLOAT_COLOR / POINT` attribute so the Emission shader reads it directly
without a separate UV map.

## External Sources

- **Born & Wolf, *Principles of Optics*, 7th ed.** (1999), §8.5 "Fraunhofer
  Diffraction" — Public Domain (pre-1978 editions; 1999 ed. published by
  Cambridge University Press).  Related: <https://www.cambridge.org/9781108477406>
- **NIST Digital Library of Mathematical Functions §10.21** "Zeros of Bessel
  Functions" — Public Domain US Govt.  URL: <https://dlmf.nist.gov/10.21>
  (Airy disk ring positions are the zeros of J₁(x)).
  Related: <https://dlmf.nist.gov/10>

## Licence

CC0 — no rights reserved.  Blend file, GLB, scripts: do what you like.
