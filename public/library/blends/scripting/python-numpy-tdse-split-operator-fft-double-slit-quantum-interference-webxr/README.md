# TDSE Split-Operator FFT — Double-Slit Quantum Interference

**Blender 5.1 / numpy · CC0**

Propagates a 2D Gaussian wavepacket through a double-slit barrier by solving the
time-dependent Schrödinger equation (TDSE) with the Strang split-operator method.
The probability density |ψ|² is mapped to vertex height and the wave phase arg(ψ)
to an HSV vertex colour, producing a glb export for WebXR.

## Quick start

1. Open Blender Scripting workspace, load **blueprint.py**, click ▶ Run Script.
2. The script logs `norm` (should stay at 1.0000xxxx) and `peak|ψ|²` at each interval.
3. Switch to 3D Viewport → horizontal ribbon of colour on a raised mesh → the
   bright horizontal bands are interference fringes behind the double slit.
4. Load **record.py** and run to build the 10-snapshot shape-key animation.

## Parameter cheat-sheet

| Constant      | Default  | Effect                                              |
|---------------|----------|-----------------------------------------------------|
| `N`           | 64       | Grid resolution (N×N verts). 128 → 4× slower.      |
| `K0`          | 8.0      | Rightward momentum → fringe spacing ≈ 2πL/(K0·d)   |
| `SIGMA`       | 0.5      | Wavepacket half-width. Smaller → broader k-spread.  |
| `V0`          | 500.0    | Barrier height. 10×K0² → nearly opaque.             |
| `SLIT_W`      | L/12     | Slit width. < λ gives maximum diffraction.          |
| `SLIT_SEP`    | L/4      | Slit centre separation → fringe spacing ∝ 1/d.      |
| `N_STEPS`     | 40       | Total steps. Increase to 80 for full fringe spread. |
| `DT`          | 0.01     | Timestep. Any value is stable (split-operator).     |
| `DISP_SCALE`  | 0.04     | Peak vertex height in metres.                       |

## Files

| File | Description |
|------|-------------|
| `blueprint.py` | Main simulation + GLB export |
| `record.py` | Shape-key animation across 10 snapshots |
| `hf_tdse.glb` | Exported mesh (Draco L6, WebP, vertex colours) |
| `README.md` | This file |
| `SCREEN-RECORDING-NOTES.md` | OBS / Game Bar recording guide |
| `.expected-artefacts.json` | CI artefact manifest |

## Physics

Natural units ℏ = 1, m = 0.5 so ℏ²/(2m) = 1.  The Strang splitting
approximates the time-evolution operator U(DT) = e^{−iH·DT} as:

```
U ≈ e^{−iV·DT/2} · e^{−iT·DT} · e^{−iV·DT/2}
```

where T̂ = k² in momentum space (diagonal), so each of the three factors is
applied as element-wise complex multiplication — no matrix solve required.
Norm error per step is O(DT³) and accumulates as O(DT²) over fixed total time.
With periodic boundary conditions the norm is conserved to machine precision
regardless of DT: the printed norm should read `1.00000xxx` at every log step.

## Young's double-slit fringe spacing

```
Δy = λ·D / d

λ = 2π / K0 ≈ 0.785   (de Broglie wavelength)
D = L / 2   ≈ 3.14    (slit-to-observation-plane distance = half domain)
d = SLIT_SEP ≈ 1.571  (slit centre separation)
Δy ≈ 0.785 × 3.14 / 1.571 ≈ 1.57  ≈ L/4
```

Four fringes across the domain width L = 2π — clearly visible in the vertex
colour HSV phase stripe pattern.

## WebXR (Three.js)

```js
const mat = new THREE.MeshStandardMaterial({ vertexColors: true });
// Draco GLB: radial displacement already in vertex positions.
// COLOR_0 maps automatically from the 'Col' BYTE_COLOR attribute.
```
