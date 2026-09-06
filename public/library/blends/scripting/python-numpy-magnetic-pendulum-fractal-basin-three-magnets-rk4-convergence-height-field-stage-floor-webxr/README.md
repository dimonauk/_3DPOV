# Magnetic Pendulum — Fractal Basin of Attraction

**Blender 5.1 · Python numpy · Stage Floor · WebXR · CC0**

---

## What this is

A damped pendulum hangs above a horizontal plane that holds three permanent
magnets at the vertices of an equilateral triangle.  When released from rest
at an arbitrary position, the pendulum eventually settles above one of the
three magnets — but *which one* depends on the starting position in a pattern
that is fractal: the boundary between any two basins of attraction is nowhere
differentiable and has Hausdorff dimension > 1.

This library entry maps that simulation to a Blender stage-floor mesh:

- **Vertex Z** (height) = normalised convergence time; points near the fractal
  boundary take the longest to settle and therefore rise the highest.
- **Vertex colour** = magnet identity — cobalt, amber, or violet — so the
  colour map is literally a basin diagram.

The result is a mesh whose ridge system traces the fractal boundary in three
dimensions, suitable for WebXR display or 3D printing.

---

## Physics

The 2-D equations of motion (pendulum bob constrained to a horizontal plane):

```
ẍ = −k·x − d·ẋ + Σᵢ Mᵢ·(xᵢ−x) / rᵢ³
ÿ = −k·y − d·ẏ + Σᵢ Mᵢ·(yᵢ−y) / rᵢ³
rᵢ = sqrt((x−xᵢ)² + (y−yᵢ)² + H²)
```

| Symbol | Role                                  | Default |
|--------|---------------------------------------|---------|
| k      | Spring (restoring) constant           | 0.20    |
| d      | Damping coefficient                   | 0.30    |
| Mᵢ     | Magnet strength                       | 1.00    |
| H      | Bob height above magnet plane (m)     | 0.50    |
| DT     | RK4 timestep                          | 0.05    |

The H² term is crucial: it prevents the force singularity when the bob passes
directly over a magnet, and models the physical geometry of the rig.

---

## Shape keys

| Key         | Params                       | Visual effect                         |
|-------------|------------------------------|---------------------------------------|
| Basis       | d=0.30, 3 magnets (triangle) | Moderate fractal ridge detail         |
| SK_HighDamp | d=0.50, 3 magnets            | Smooth basins, gentle ridges          |
| SK_LowDamp  | d=0.15, 3 magnets            | Intricate boundary, tall sharp ridges |
| SK_4Mag     | d=0.30, 4 magnets (square)   | Four-way basin with X-shaped ridges   |

---

## Files

| File                      | Purpose                                |
|---------------------------|----------------------------------------|
| `blueprint.py`            | Main Blender Python script             |
| `record.py`               | Viewport animation → `viewport.mp4`   |
| `SCREEN-RECORDING-NOTES.md` | OBS capture instructions              |
| `hf_magpend.blend`        | Saved scene (after running script)     |
| `hf_magpend.glb`          | WebXR-ready export (Draco 6, WebP)     |

---

## Usage

```python
# In Blender 5.1 Text Editor → Run Script
# blueprint.py produces hf_magpend.blend + hf_magpend.glb in the same folder
```

Three.js WebXR load:

```js
const loader = new GLTFLoader();
loader.load('hf_magpend.glb', (gltf) => {
  const floor = gltf.scene.children[0];
  floor.material.vertexColors = true;   // display MagPendCol attribute
  scene.add(floor);
});
```

---

## Cross-references

- [Newton Fractal Basin](/tutorials/blender-tutorial-python-numpy-newton-fractal-basin-attraction-complex-roots-stage-floor-webxr)
  — another basin-of-attraction height field, but over the complex plane.
- [Chirikov Standard Map](/tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr)
  — Hamiltonian chaos stage floor; contrasts dissipative vs conservative dynamics.
- [Double Pendulum](/tutorials/blender-tutorial-python-numpy-double-pendulum-lagrangian-chaos-rk4-butterfly-bishop-tube-poi-webxr)
  — sister pendulum tutorial using the same RK4 integrator.

---

## Licence

Blueprint, record script, and mesh data: **CC0 1.0 Universal**.
Mathematical equations: classical Newtonian mechanics, public domain.
