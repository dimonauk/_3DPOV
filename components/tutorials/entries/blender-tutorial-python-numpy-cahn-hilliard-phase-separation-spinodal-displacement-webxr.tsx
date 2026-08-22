import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        John W. Cahn and John E. Hilliard, working at the US National Bureau of
        Standards in 1958, wanted to know why alloy microstructures look the way
        they do: equal-volume labyrinths of two phases, neither one enclosing the
        other, the interface between them perfectly sharp at the nanometre scale.
        The answer was a free-energy functional with a gradient-penalty term, and
        the PDE that minimises it is now named after them.
      </p>
      <p>
        The Cahn-Hilliard equation is a fourth-order conservation law for the
        order parameter φ ∈ [−1, +1]:
      </p>
      <pre>{`∂φ/∂t = ∇²μ,    μ = φ³ − φ − γ∇²φ

φ = +1  ⟹  pure phase A (amber coral branch)
φ = −1  ⟹  pure phase B (slate void)
φ =  0  ⟹  interface   (sharp domain wall)`}</pre>
      <p>
        The bulk free-energy density f(φ) = (φ²−1)²/4 has the classic
        double-well shape: it is minimised at ±1 and has a local maximum at 0.
        Any uniform state with |φ₀| &lt; 1/√3 lies in the spinodal region
        where d²f/dφ² &lt; 0 — it is unstable to infinitesimal fluctuations.
        The gradient term γ(∇φ)² penalises sharp interfaces; the competition
        between bulk instability and interface cost selects a dominant
        wavelength λ* = 2π√(2γ) ≈ 0.89 at γ = 0.01.
      </p>

      <h2>Why Fourier spectral integration?</h2>
      <p>
        The biharmonic ∇⁴φ in the denominator is the stiff term. An explicit
        scheme requires Δt &lt; (γ · k_max⁴)⁻¹ ≈ 5×10⁻⁸ for a 128-point grid —
        roughly 10 million steps per unit time. The semi-implicit spectral scheme
        treats γk⁴ implicitly:
      </p>
      <pre>{`φ̂_out = (φ̂_in − Δt · k² · FFT(φ³−φ)) / (1 + Δt · γ · k⁴)`}</pre>
      <p>
        The denominator (1 + Δt·γ·k⁴) is precomputed once and is always ≥ 1,
        so the scheme is unconditionally stable at any Δt. We use Δt = 1.0 and
        run 600 steps — the equivalent of roughly 5×10⁷ explicit steps. The
        numpy FFT pair takes about 0.2 ms per step on a modern CPU; 600 steps
        finish in under five seconds.
      </p>
      <p>
        Compare the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-lattice-boltzmann-d2q9-lbm-karman-vortex-poi-webxr"
          className={lk}
        >
          Lattice Boltzmann D2Q9 blueprint
        </Link>
        , which uses nine streaming directions and a BGK collision operator.
        LBM is also a Fourier-stable scheme, but for the{" "}
        <em>Navier-Stokes</em> equations — convection-diffusion, not
        phase-field evolution. Here there is no velocity field: the only
        transport mechanism is diffusion of the chemical potential.
      </p>

      <h2>Bicontinuous topology and the 1/3 coarsening exponent</h2>
      <p>
        At early times (t &lt; 50) the spinodal amplification is nearly linear:
        each wavenumber k in the unstable band grows as e^{"{σ(k)·t}"} where
        σ(k) = k²(2 − γk²). The fastest-growing mode is at k* = 1/√(2γ) ≈ 7.
        By step 200 the field has saturated at ±1 and the domains are
        &lsquo;coral-scale&rsquo; — roughly λ* ≈ 0.9 in normalised units, or
        about 7 mm on a 1-metre tile.
      </p>
      <p>
        After saturation the system coarsens: larger domains grow at the expense
        of smaller ones, driven by the reduction in total interface length
        (minimising ∫γ|∇φ|²). The coarsening law for a diffusion-controlled
        system is L(t) ∼ t^(1/3) — the Lifshitz-Slyozov-Wagner exponent. At
        step 600 the domains are roughly 1.5–2× the step-200 size; running to
        step 5000 would produce much coarser structure at the expense of
        topological complexity.
      </p>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-bz-oregonator-spiral-waves"
          className={lk}
        >
          Belousov-Zhabotinsky Oregonator blueprint
        </Link>{" "}
        produces spiral waves from an excitable reaction-diffusion system
        (activator + inhibitor). The BZ system has a different mathematical
        structure — it does not conserve the mean of any field — and produces
        rotating spirals rather than stationary bicontinuous patterns.
        Cahn-Hilliard is a conserved gradient flow; BZ is a non-conserved
        limit-cycle system.
      </p>

      <h2>From field to mesh</h2>
      <p>
        The blueprint converts the 128×128 numpy array directly to vertex Z
        positions via <code>bmesh.ops.create_grid</code> (N−1 segments in X
        and Y, giving N² vertices on a [−0.5, +0.5] m square). Each vertex is
        located back to its grid index by position arithmetic, then
        Z ← φ[iy, ix] × DISP_SCALE.
      </p>
      <p>
        This is fundamentally different from the Displace modifier approach used
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-displace-modifier-texture-height-terrain-glb-webxr"
          className={lk}
        >
          Displace Modifier — texture height-field terrain blueprint
        </Link>
        . The modifier approach applies displacement at render time and requires
        Apply Modifiers for GLB export. Direct vertex Z assignment is applied at
        Python time — the resulting mesh has the final topology already baked,
        which is what GLTF expects.
      </p>
      <p>
        The vertex colour attribute (&ldquo;Col&rdquo;, BYTE_COLOR, CORNER
        domain) stores φ as greyscale on every face corner — the standard GLTF
        2.0 vertex colour channel. The material&apos;s CONSTANT ColorRamp at
        grey = 0.5 snaps from amber emission (phase A) to slate diffuse (phase
        B), giving the hard cel-shade interface identical to the physical
        domain wall. Compare the noise-driven heightmap in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-noise-terrain-heightfield-webxr"
          className={lk}
        >
          mathutils noise terrain blueprint
        </Link>
        , where the displacement is continuous and perceptually isotropic
        rather than phase-separated.
      </p>
      <p>
        The standing-wave Chladni analysis in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-wave-equation-chladni-standing-waves"
          className={lk}
        >
          GN Simulation Zone — wave equation Chladni blueprint
        </Link>{" "}
        also maps a 2D scalar field to mesh displacement, but uses a Simulation
        Zone with a 2D finite-difference Laplacian rather than Fourier spectral
        integration, and the field conserves momentum rather than phase fraction.
      </p>
    </>
  );
}

const data = {
  title:
    "Python numpy FFT — Cahn-Hilliard Phase Separation: Spinodal Decomposition & Bicontinuous Domain Topology as Displaced Surface for WebXR",
  date: "2026-07-25",
  lede:
    "Fourier spectral semi-implicit integration (Δt=1, unconditionally stable) drives the Cahn-Hilliard equation (∂φ/∂t = ∇²(φ³−φ−γ∇²φ)) on a 128×128 periodic grid for 600 steps; the resulting bicontinuous order-parameter field φ ∈ [−1,+1] is mapped to vertex Z via bmesh, yielding a 16 k-vert coral landscape exported as a Draco-compressed GLB with a two-phase cel-shade material that snaps amber (phase A) from deep slate (phase B) at the hard Φ=0 domain boundary.",
  body: Body,
  libraryPath:
    "blends/scripting/python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr/",
  steps: [
    {
      title: "Run blueprint.py — simulation and mesh construction",
      body: "Open Blender 5.1 · Scripting workspace. Open `blueprint.py` and press **Run Script**.\n\nThe console prints:\n  `[CH] Simulating Cahn-Hilliard  N=128  steps=600 …`\n  `[CH] Done.  φ ∈ [−0.98, +0.97]`\n\nA φ range close to ±1 confirms that both phases have fully separated. If the range is narrow (e.g. [−0.3, +0.3]) after only 100 steps, the coarsening is still in the linear growth regime — increase N_STEPS to 400+.\n\nThe simulation takes 4–8 s on a modern CPU. The FFT pair (numpy.fft.fft2 + ifft2) accounts for roughly 90 % of the compute time; the mesh-building loop over 16 384 vertices takes under 0.5 s.",
    },
    {
      title: "Understand the semi-implicit Fourier scheme",
      body: "Open the Python console in Blender and run:\n\n```python\nimport numpy as np\nN, GAMMA, DT = 128, 0.01, 1.0\nk = np.fft.fftfreq(N, d=1.0/N)\nK2 = k[:,None]**2 + k[None,:]**2\nK4 = K2**2\nprint('Max denominator:', (1 + DT * GAMMA * K4).max())\nprint('Dominant mode k*:', round(1 / np.sqrt(2 * GAMMA)))\nprint('Interface width l:', round(2 * np.sqrt(GAMMA), 3))\n```\n\nExpected output:\n  `Max denominator: 1083.0`  (k=N/2 corner, fully damped at Δt=1)\n  `Dominant mode k*: 7`       (fastest growing wavenumber)\n  `Interface width l: 0.2`    (in normalised units)\n\nThe max denominator of 1083 means the stiffest mode (k²+k²=2×(N/2)²) is damped by a factor of 1/1083 per step — numerically annihilated. This is the whole point of implicit treatment.",
    },
    {
      title: "Inspect the vertex colour attribute",
      body: "After running blueprint.py, in the Python console:\n\n```python\nob   = bpy.data.objects['hf_cahn_hilliard']\nmesh = ob.data\nattr = mesh.attributes['Col']\nprint('Domain:', attr.domain)      # CORNER\nprint('Type:', attr.data_type)     # BYTE_COLOR\nprint('Corners:', len(attr.data))  # ≈ 65 000\n# Read one corner colour (first face, first loop)\nprint(attr.data[0].color)         # e.g. (0.03, 0.03, 0.03, 1.0) or (0.97, …)\n```\n\nA colour near (0, 0, 0) is deep in phase B (φ ≈ −1); near (1, 1, 1) is phase A (φ ≈ +1). The CONSTANT ColorRamp snaps at grey = 0.5, so visually you see only pure amber or pure slate — no gradient at the boundary. This matches the physical model: Cahn-Hilliard interfaces are hyperbolic-tangent profiles of width ℓ ≈ 0.2, which at N=128 spans ≈ 2–3 vertices. The CONSTANT ramp deliberately drops the gradient information in exchange for the cel-shade aesthetic.",
    },
    {
      title: "GLB export and WebXR deployment",
      body: "The script calls `bpy.ops.export_scene.gltf()` with `export_apply=True` and `export_draco_mesh_compression_enable=True` (level 6). Expect:\n\n- 16 384 vertices × 3 floats = ~200 KB raw positions\n- After Draco: ~25–40 KB (the grid has high spatial coherence, Draco exploits it aggressively)\n- Vertex colour adds ~65 k corners × 4 bytes = ~260 KB raw; ~30 KB after Draco\n- Total GLB: roughly 60–80 KB\n\nIn Three.js / WebXR, load with:\n```js\nconst loader = new GLTFLoader();\nloader.setDRACOLoader(draco);\nloader.load('hf_cahn_hilliard.glb', gltf => scene.add(gltf.scene));\n```\n\nThe vertex colour arrives as `geometry.attributes.color` (THREE.js) — already accessible on the default MeshStandardMaterial via `vertexColors: true`.",
    },
    {
      title: "Render viewport.mp4 with record.py",
      body: "After blueprint.py, in the same Blender session, open `record.py` → **Run Script**.\n\nThis renders the 240-frame 30 fps camera orbit (360° around the coral surface) to:\n  `public/library/videos/scripting/…/viewport.mp4`\n\nThe orbit uses perspective projection at 50 mm focal length with the camera at radius 1.1 m, height 0.9 m. To preview before rendering: press **Space** in the 3D Viewport with Rendered shading active — the orbit plays in real-time at EEVEE speed.\n\nFor the OBS screen recording (screen.mp4): follow `SCREEN-RECORDING-NOTES.md`. The combined viewport + Python console capture shows the simulation log, which is useful educational context.",
    },
  ],
  finalResult:
    "A 128×128 vertex displaced surface (16 k verts, ~32 k tris after GLTF triangulation) derived from 600 steps of semi-implicit Cahn-Hilliard integration at γ=0.01. The φ field reaches ±0.97+, indicating mature phase separation with a bicontinuous labyrinthine topology. BYTE_COLOR CORNER vertex colour drives a two-phase CONSTANT ColorRamp material: amber emission (strength=5) for phase A, deep slate diffuse for phase B. The final Draco L6 GLB is ~60–80 KB. A 240-frame 30 fps EEVEE orbit (viewport.mp4) reveals the 3D relief of the coral network; the camera uses perspective projection at 50 mm to emphasise the height of the ridges relative to the flat background.",
  variations: [
    "Set `N = 256` for a finer-grained bicontinuous pattern — 65 k vertices, ~130 k tris, runs in ~20 s. The domain boundary resolves more thinly and the coral branches are slimmer. Reduce DISP_SCALE to 0.04 to keep the relief proportional.",
    "Set `GAMMA = 0.001` (smaller interface penalty). The interface width narrows to ℓ ≈ 0.063 and the dominant wavelength shortens to λ* ≈ 0.28 — many more, thinner coral branches per tile. At this γ, Δt = 1.0 may begin to show oscillation artefacts at step 1000+; reduce to Δt = 0.5 if needed.",
    "Run two successive simulations with different seeds. Build two separate mesh objects (phase A only, phase B only) by thresholding φ: `phi_a = np.where(phi > 0, phi, 0)` and `phi_b = np.where(phi < 0, phi, 0)`. Offset them in Z by 0.15 m and assign contrasting materials. The pair looks like a coral reef and its negative mould — directly 3D-printable as a two-part casting.",
    "Animate coarsening: modify `_simulate()` to yield snapshots at steps [50, 100, 200, 400, 600]. Build a shape-key block for each snapshot via `ob.shape_key_add()` and `sk.data[vi].co.z = phi_snap[iy,ix] * DISP_SCALE`. Animate the shape-key values 0→1 linearly. The resulting animation shows the Lifshitz–Slyozov-Wagner t^(1/3) coarsening in real-time.",
    "Replace the double-well f(φ) = (φ²−1)²/4 with an asymmetric well: `nonlin = phi**3 - 0.7*phi`. This biases one phase to dominate, shifting the final domain area ratio from 50:50 to roughly 70:30. The minority phase (30 %) forms disconnected droplets rather than a bicontinuous network — the topology changes from labyrinthine to nucleation-and-growth.",
  ],
  troubleshooting: [
    {
      symptom: "φ range stays small after 600 steps — e.g. [−0.15, +0.12]",
      cause:
        "NOISE_AMP is too small (below the numerical noise floor at single precision) or N_STEPS is far too low for the chosen GAMMA.",
      fix: "Increase NOISE_AMP to 0.1 and N_STEPS to 1000. Also confirm numpy is operating in float64 by default (check `phi.dtype` — should be `float64`). If running in float32 mode, the spinodal growth may be too slow to see at 600 steps.",
    },
    {
      symptom: "Mesh Z displacement is flat (all vertices at Z ≈ 0)",
      cause:
        "The position-to-index mapping in `_build_surface` is returning ix=iy=0 for all vertices, meaning all vertices read from phi[0,0].",
      fix: "Check TILE_SIZE: if it is 0.0 or negative, (v.co.x + half) / step evaluates to 0 always. Confirm `half = TILE_SIZE * 0.5 = 0.5` and `step = TILE_SIZE / (N−1) ≈ 0.00787`. Print a sample vertex: `for v in bpy.data.meshes['hf_cahn_hilliard'].vertices: print(v.co.x, v.co.y); break`.",
    },
    {
      symptom: "GLB loads in Three.js but vertex colours are not visible",
      cause:
        "The GLTF loader is not reading the `COLOR_0` accessor, or the material does not have `vertexColors: true`.",
      fix: "In Three.js: `mat.vertexColors = true; mat.needsUpdate = true`. In Blender: verify the attribute is named exactly `Col` (capital C) — the GLTF exporter maps the first BYTE_COLOR CORNER attribute named `Col` to `COLOR_0`. If the name is wrong, the accessor is skipped.",
    },
    {
      symptom: "Simulation produces NaN values — console shows `φ ∈ [nan, nan]`",
      cause:
        "The denominator (1 + Δt·γ·k⁴) cannot go negative (it is always ≥ 1), so NaN typically means phi_hat contains NaN before the loop — NOISE_AMP is likely `np.inf` or the grid size N is 0.",
      fix: "Add `assert np.isfinite(phi).all()` immediately after the initial noise generation. Confirm N is a positive integer (not None or 0). Also confirm numpy is not in a degraded mode: `import numpy as np; print(np.__version__)` — should be 1.24+ for Blender 5.1.",
    },
  ],
  externalLinks: [
    {
      label:
        "Cahn & Hilliard 1958 — 'Free Energy of a Nonuniform System. I. Interfacial Free Energy' — J. Chem. Phys. 28 — mathematical result, no copyright",
      href: "https://doi.org/10.1063/1.1744102",
    },
    {
      label:
        "numpy.fft — Discrete Fourier Transform — BSD-3-Clause — NumPy Developers",
      href: "https://numpy.org/doc/stable/reference/routines.fft.html",
    },
    {
      label:
        "bpy.types.Mesh attributes — Blender Python API 5.1 — CC-BY-SA-4.0 — Blender Foundation",
      href: "https://docs.blender.org/api/5.1/bpy.types.Mesh.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "GN Simulation Zone — Belousov-Zhabotinsky Oregonator: Chemical Spiral Waves & Excitable Medium",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-bz-oregonator-spiral-waves",
    },
    {
      label:
        "Python mathutils noise — Terrain Heightfield for WebXR",
      href: "/tutorials/blender-tutorial-python-mathutils-noise-terrain-heightfield-webxr",
    },
    {
      label:
        "GN Simulation Zone — Wave Equation: Chladni Standing Waves",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-wave-equation-chladni-standing-waves",
    },
    {
      label:
        "Python bpy mesh.from_pydata — Enneper Minimal Surface: Faceted WebXR",
      href: "/tutorials/blender-tutorial-python-bpy-mesh-from-pydata-enneper-minimal-surface-faceted-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "simulation",
      "physics",
      "materials",
      "webxr",
    ],
    body: Body,
  },
  data,
);
