# 2-D Tight-Binding Band Dispersion — Stage Floor (Blender 5.1)

Height-field of E(kx, ky) for four lattice models, all evaluated on the
first Brillouin zone [−π, π]².  The floor encodes the band landscape that
electrons inhabit in a crystal: low-energy valleys are cobalt, high-energy
peaks are amber, and the flat basin at E=0 marks the Fermi level for a
half-filled square lattice.

## Physics summary

| Shape key | Equation | Topology |
|-----------|----------|----------|
| **Basis** | E=−2(cos kx+cos ky) | particle-hole symmetric; saddle at X=(π,0) |
| **SK_NNN** | add −4(−0.3)cos(kx)cos(ky) | breaks PH sym; cuprate-like |
| **SK_TriLattice** | E=−2(cos kx+cos ky+cos(kx−ky)) | hexagonal Fermi surface |
| **SK_DWave** | Δ=|cos kx−cos ky| | d-wave gap nodes on kx=±ky |

The Van Hove singularity at X=(π,0) in the Basis shape is the saddle point
where the density of states diverges logarithmically — the seat of the square
lattice's nesting instability and the reason cuprate superconductors develop
antiferromagnetic order at half-filling.

## Running the blueprint

```bash
blender --background --python blueprint.py
```

Saves `tb_band_floor.blend` and `tb_band_floor.glb` in the same directory.

## GLB export settings

File → Export → glTF 2.0:
- **Draco** compression level 6
- **WebP** textures
- **Morph targets** enabled (shape keys)
- **Vertex colours** enabled
- **Up axis** = +Y
- Root name `tb_band_floor` with `holoflow:facet=true`

## Recording

See `SCREEN-RECORDING-NOTES.md`.  The viewport animation sweeps through
all four shape keys in a 10 s orbit loop.

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Builds the mesh and saves the .blend |
| `record.py` | Renders `viewport.mp4` via EEVEE_NEXT |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `.expected-artefacts.json` | Expected output file list |
