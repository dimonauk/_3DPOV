# Hydraulic Erosion — Particle-Droplet FBM Terrain (Blender 5.1)

Geomorphological simulation of rainfall erosion via the particle-droplet
(path-tracing) method.  Each virtual raindrop accelerates downhill,
picks up sediment proportional to its speed and the local slope,
deposits excess when capacity drops, and evaporates until it stops.
Running 40 000–100 000 drops over a Fractal Brownian Motion heightmap
carves river valleys, narrow ridges, and alluvial fans at their mouths.

## Output

| File | Description |
|------|-------------|
| `hydraulic_erosion_floor.blend` | Blender 5.1 scene with shape keys |
| `hydraulic_erosion_floor.glb` | GLB for WebXR stage floor |
| `blueprint.py` | Fully reproducible generation script |
| `record.py` | Viewport-animation render setup |
| `viewport.mp4` | 15 s orbit showing erosion stages |
| `screen.mp4` | Full OBS screen recording |

## Topology

- Grid: **128 × 128 = 16 384 vertices, 16 129 quads**
- World bounds: 4 m × 4 m, height ≤ 0.70 m
- Shape keys: `Basis` · `SK_Eroded` · `SK_Rivers` · `SK_Deposition`
- Vertex attribute: `Erosion_Depth` FLOAT_COLOR
  (red = river channel; white = plateau; blue = alluvial fan)

## Algorithm

```
1. FBM heightmap H(x,y) = Σᵢ gainⁱ · turbulence(2ⁱ · p)
   Parameters: octaves=6, lacunarity=2, gain=0.5, scale=3.2

2. For each droplet (px, py, dx, dy, speed, water, sediment):
   a. Bilinear gradient (h, gx, gy) at (px, py)
   b. Direction blend:  dx = inertia·dx − (1−inertia)·gx  (normalise)
   c. Move:  (nx, ny) = (px+dx, py+dy);  dh = H(nx,ny) − H(px,py)
   d. capacity = max(min_slope, |dh|) × speed × water × K
   e. if sediment > capacity or climbing uphill → deposit
      else → erode  (bilinear splat to 4 neighbours)
   f. speed ← √max(0, speed² − dh·g);  water *= (1 − evap)
   g. Stop if water < 0.01 or off-grid
```

| Parameter | Value | Effect |
|-----------|-------|--------|
| `INERTIA` | 0.05 | 95% gradient steering; 5% momentum |
| `CAPACITY_K` | 8.0 | Scales sediment load per unit slope |
| `ERODE_SPEED` | 0.30 | Fraction of deficit eroded per step |
| `DEPOSIT_SPEED` | 0.30 | Fraction of surplus deposited per step |
| `EVAP_RATE` | 0.01 | Water volume lost per step |
| `GRAVITY` | 4.0 | Kinetic energy gained on downhill step |

## Colour interpretation

| Colour | Meaning |
|--------|---------|
| Red | Active erosion channel (high net erosion depth) |
| White | Neutral plateau (no net change) |
| Blue | Alluvial deposition fan (sediment dumped at slope break) |

## Sources

1. **Sebastian Lague** — "Hydraulic Erosion" (2019–2023, MIT)
   https://github.com/SebLague/Hydraulic-Erosion
2. **Eric Galin et al.** — "A Review of Digital Terrain Modeling"
   Eurographics 2019, *Computer Graphics Forum* 38(2).
   https://onlinelibrary.wiley.com/doi/abs/10.1111/cgf.13657

## Related studio tutorials

- [Geometry Nodes: Low-Poly Terrain](/tutorials/blender-tutorial-gn-image-texture-heightmap-terrain)
- [Geometry Nodes: Raycast Terrain Decal Scatter](/tutorials/blender-tutorial-gn-raycast-terrain-decal-scatter)
- [GN Simulation Zone: Reaction–Diffusion Turing](/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing)
- [Python NumPy: Kelvin–Helmholtz Shear Instability](/tutorials/blender-tutorial-python-numpy-kelvin-helmholtz-shear-instability-spectral-vorticity-height-field-stage-floor-webxr)

## Licence

CC0 — blueprint mathematics and implementation are public domain.
