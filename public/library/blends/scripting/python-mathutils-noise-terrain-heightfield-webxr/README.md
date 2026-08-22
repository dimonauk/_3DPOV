# mathutils.noise — Procedural Terrain Heightfield & Gradient Attributes (Blender 5.1)

Generates a 64×64 quad-grid terrain entirely in Python using `mathutils.noise.hetero_terrain()`,
then derives a slope attribute via central differences and exports as GLB with custom accessors.

## Files

| File | Purpose |
|------|---------|
| `blueprint.py` | Full terrain generation + GLB export script |
| `record.py` | Viewport animation — camera arc for `viewport.mp4` |
| `SCREEN-RECORDING-NOTES.md` | OBS instructions for `screen.mp4` |
| `terrain_heightfield.glb` | Generated on local run |

## Usage

1. Open Blender 5.1.  New → General.
2. Scripting workspace → Open `blueprint.py` → Run Script (Alt + P).
3. The terrain mesh appears in the viewport with zone vertex colours.
4. `terrain_heightfield.glb` is written to the same folder.
5. Optional: run `record.py` to render `viewport.mp4`.

## Key parameters

| Constant | Default | Effect |
|----------|---------|--------|
| `GRID_X / GRID_Y` | 64 | Vertex count per axis; 128 for production detail |
| `H` | 0.55 | Hurst exponent — 0=rough, 1=smooth |
| `LACUNARITY` | 2.1 | Frequency gap between octaves |
| `OCTAVES` | 7 | Spectral depth |
| `OFFSET` | 0.8 | Valley-to-ridge roughness gradient (hetero_terrain only) |
| `TERRAIN_H` | 2.4 m | Maximum Z excursion |
| `SEA_LEVEL` | 0.18 | Fraction below which terrain is clamped flat (ocean floor) |
| `NOISE_SCALE` | 0.45 | Frequency in noise space — larger = wider terrain |

## GLB attributes

| Accessor name | Type | Domain | Content |
|---------------|------|--------|---------|
| `_ELEVATION` | FLOAT | VERTEX | Normalised elevation [0, 1] |
| `_SLOPE` | FLOAT | VERTEX | Normalised gradient magnitude [0, 1] |
| `COLOR_0` | FLOAT_VEC4 | VERTEX | Zone RGBA (water/grass/rock/snow) |

## Three.js access

```js
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
const loader = new GLTFLoader();
loader.load('terrain_heightfield.glb', ({ scene }) => {
  const mesh = scene.getObjectByName('terrain_heightfield');
  const elev  = mesh.geometry.attributes['_ELEVATION'];   // Float32BufferAttribute
  const slope = mesh.geometry.attributes['_SLOPE'];
  // threshold: LOD switch on slope, physics material on elevation
});
```

## Noise basis options

Swap `NOISE_BASIS` constant:
- `'PERLIN_ORIGINAL'` — classic gradient noise; best general-purpose terrain
- `'PERLIN_NEW'` — more isotropic; subtle difference at low frequency
- `'VORONOI_CRACKLE'` — high-contrast cracking; good for rocky desert
- `'CELLNOISE'` — blocky mesa-like terrain

## Licence

CC0 — Holoflow Studio.
