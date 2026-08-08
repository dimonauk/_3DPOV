# Kuen, Dini & Pseudosphere — Constant Negative Gaussian Curvature K = −1

**Blender 5.1 · Python · NumPy · CC0**

Three classical differential-geometry surfaces, each carrying K = −1 everywhere,
encoded as Blender shape keys on a single poi-head mesh.  They are Bäcklund
transforms of one another — discrete symmetries of the sine-Gordon PDE.

## What the blueprint produces

| Output file | Description |
|---|---|
| `hf_kuen_poi.blend` | Blender scene with three K=−1 morphotype shape keys |
| `hf_kuen_poi.glb` | Draco-6 GLB, 4 800 vertices, morph targets, vertex colour |
| `viewport.mp4` | 150-frame Kuen → Dini → Pseudosphere morph animation |
| `screen.mp4` | OBS screen-recording per `SCREEN-RECORDING-NOTES.md` |

## Surfaces

### Kuen surface (1884)
Parametric equations (Weingarten–Kuen form):
```
d(u,v) = 1 + u² sin²v
x = 2(cos u + u sin u) sin v / d
y = 2(sin u − u cos u) sin v / d
z = log tan(v/2) + 2 cos v / d
```
Domain used: u ∈ [−2.6, 2.6], v ∈ [0.18, π − 0.18].
The sine-Gordon angle: φ = 2 arctan(u sin v).

### Dini surface (1865)
```
x = a cos u sin v
y = a sin u sin v
z = a (cos v + log tan(v/2)) + b·u
```
Domain: u ∈ [0, 4π], same v range.  With (a, b) = (1.0, 0.4).

### Pseudosphere / Tractroid (Beltrami 1868)
```
x = sech(v) cos u
y = sech(v) sin u
z = v − tanh(v)
```
Domain: u ∈ [0, 2π], v ∈ [0, 3.8].

## Running the blueprint

1. Open Blender 5.1.
2. Switch to the **Scripting** workspace.
3. Create a new text block, paste `blueprint.py`, press **Alt + P**.
4. Console confirms: vertex count, face count, shape key names.
5. Load `record.py` in a second text block and press **Alt + P**.
6. Press **Ctrl + F12** to render `viewport.mp4`.
7. Export **File → Export → glTF 2.0** with options:
   - Format: GLB · Draco 6 · Morph Targets ✓ · Vertex Colors ✓ · Apply Transforms ✓

## External references

- Kuen, T. (1884). *Flächen von constantem Krümmungsmaasse*.
  Sitz. k. b. Akad. Wiss. München, math.-phys. Cl.  Public domain (>120 years).
- Beltrami, E. (1868). *Teoria fondamentale degli spazii di curvatura costante*.
  Ann. di Mat. 2(2):232–255.  Public domain.
- de Lima, E. L. & Spivak, M. inspirations in Paul Bourke's surface catalogue —
  formulae presented as public domain educational material.
  URL: http://paulbourke.net/geometry/

## Licence

All code: **CC0** (public domain dedication).
Mathematical formulae: inherently public domain.
