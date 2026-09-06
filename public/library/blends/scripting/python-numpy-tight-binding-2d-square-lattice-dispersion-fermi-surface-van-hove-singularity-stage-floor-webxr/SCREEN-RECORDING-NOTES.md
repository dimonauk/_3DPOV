# Screen Recording Notes — OBS / Game Bar

## Output file
`public/library/videos/scripting/python-numpy-tight-binding-2d-square-lattice-dispersion-fermi-surface-van-hove-singularity-stage-floor-webxr/screen.mp4`

## Settings
- **Source**: Window Capture → Blender 5.1
- **Resolution**: 1920×1080
- **Frame rate**: 30 fps
- **Encoder**: x264 / NVENC, CRF 18
- **Audio**: OFF

## What to record

1. Open `tb_band_floor.blend` in Blender.
2. Switch to **Material Preview** or **Rendered** viewport shading.
3. Set the viewport to perspective view (numpad 5).
4. Manually drag the Basis shape-key slider from 0→1 to show the pure
   square-lattice dispersion loading.
5. Switch to SK_NNN — show the saddle point at X shift as particle-hole
   symmetry breaks.
6. Switch to SK_TriLattice — observe the six-fold saddle arrangement.
7. Switch to SK_DWave — highlight the nodal lines where |Δ|=0.
8. Orbit around the floor at a low angle to show the 3-D relief.

## Highlight moments
- The **flat region** at E=0 in Basis = the Fermi level of half-filling
- The **four-lobe flower** of SK_DWave = d-wave superconductor signature
- The **curved ridges** of SK_TriLattice = geometrical frustration visible
  as the band top shifts from the corner to the edge of the BZ
