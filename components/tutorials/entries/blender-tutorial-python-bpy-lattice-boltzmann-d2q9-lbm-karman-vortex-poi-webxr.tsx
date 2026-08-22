import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Most fluid simulations in 3D software solve the Navier-Stokes equations
        with finite-volume or finite-element methods — discretising continuous
        partial differential equations onto irregular meshes. The Lattice
        Boltzmann Method (LBM) takes a fundamentally different route: instead of
        tracking the fluid directly, it tracks the statistical behaviour of a
        fictitious particle gas on a regular lattice. Each lattice node stores
        nine distribution functions f₀…f₈ — one per discrete velocity direction
        in the D2Q9 scheme — and the macroscopic fluid properties (density ρ,
        velocity u) emerge from their sum. The appeal for Blender is immediacy:
        a frame-change handler runs one BGK step per frame, the result flows
        straight into a per-vertex colour attribute, and the vortex street
        appears live in the viewport without a separate solver or cache.
      </p>
      <p>
        The D2Q9 velocity set has nine lattice speeds arranged in a 3×3 grid:
        one rest population (e₀ = 0), four axial populations (±x, ±y), and four
        diagonal populations (±x±y). Each carries a weight w_i (4/9, 1/9,
        or 1/36) that ensures the lattice gas recovers the correct second-order
        moments of the Maxwell-Boltzmann distribution at low Mach number. The
        weights are the fingerprint of the lattice geometry: D2Q9 is the minimal
        2D set that is isotropic to fourth order, which is the condition required
        to derive the incompressible Navier-Stokes equations from the Chapman-
        Enskog expansion.
      </p>

      <h2>The BGK collision operator</h2>
      <p>
        Collision in LBM does not model individual particle interactions.
        Instead, Bhatnagar, Gross, and Krook (1954) proposed a single-relaxation-
        time approximation: the distribution relaxes toward a local equilibrium
        f_i^eq at rate 1/τ per step:
      </p>
      <pre>{`f_i(x, t+1) = f_i(x,t) − (f_i − f_i^eq) / τ`}</pre>
      <p>
        The equilibrium is computed from the macroscopic quantities at each node:
      </p>
      <pre>{`ρ  = Σᵢ fᵢ                     (density)
u  = Σᵢ fᵢ eᵢ / ρ              (velocity)
f_i^eq = wᵢ ρ [1 + 3(eᵢ·u) + 9/2(eᵢ·u)² − 3/2|u|²]`}</pre>
      <p>
        The kinematic viscosity of the recovered fluid is ν = (τ−0.5)/3 in
        lattice units. This means τ controls both the viscosity and the
        numerical stability: τ must satisfy 0.5 &lt; τ &lt; 2.0, and values
        approaching 0.5 give increasingly low viscosity (high Reynolds number)
        at the cost of numerical instability. We choose τ = 0.55 for Re ≈ 96 —
        comfortably inside the stable regime while generating a clear{" "}
        vortex street.
      </p>

      <h2>Streaming and the Kármán vortex street</h2>
      <p>
        After collision, each population propagates one cell in its velocity
        direction — the streaming step. In numpy this is a{" "}
        <code>np.roll</code> per population:
      </p>
      <pre>{`fn[1] = np.roll(f_post[1],  1, 1)   # e₁=(+1,0): shift right in x
fn[2] = np.roll(f_post[2],  1, 0)   # e₂=(0,+1): shift down in y
fn[3] = np.roll(f_post[3], -1, 1)   # e₃=(−1,0): shift left in x
# ...eight pops + rest`}</pre>
      <p>
        Solid boundaries use bounce-back: at obstacle nodes, each distribution
        f_i is replaced by the post-collision population in the opposite direction
        f_opp. This reversal enforces a no-slip wall without any pressure
        boundary terms. A cylindrical obstacle at column 30 (one-fifth of the
        domain width) causes the flow to separate at Re ≈ 96. For Reynolds
        numbers between roughly 40 and 200, the separated shear layers roll up
        into alternating counter-rotating vortices — the Kármán vortex street,
        named after Theodore von Kármán (1911). The shedding frequency follows
        the Strouhal relation St = f·D/U ≈ 0.20, giving a shed period of
        ≈ 80 frames at our parameters.
      </p>
      <p>
        The studio connection is direct: a spinning poi head is a bluff body
        moving through air. At typical poi speeds (~5–10 m/s) and poi-head
        diameters (~0.06–0.10 m), Re ≈ 300–700 — above our lattice simulation
        but in the same vortex-shedding regime. The alternating wake vortices
        create the characteristic wobble visible in slow-motion poi footage, and
        long-exposure light paintings of poi trails contain the visual trace of
        this aerodynamic signature. Compare the SPH fluid approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting"
          className={lk}
        >
          SPH Fluid — Müller Kernels tutorial
        </Link>
        : SPH tracks Lagrangian particle positions; LBM tracks Eulerian
        distributions on a fixed grid. LBM converges faster for low-viscosity
        wall-bounded flows; SPH handles free surfaces better.
      </p>

      <h2>Vorticity colour mapping</h2>
      <p>
        Vorticity ω = ∂uy/∂x − ∂ux/∂y is the curl of the 2D velocity field —
        positive for counter-clockwise rotation, negative for clockwise.{" "}
        <code>np.gradient</code> computes centred finite differences over the
        (NY, NX) velocity arrays:
      </p>
      <pre>{`omega = np.gradient(uy, axis=1) - np.gradient(ux, axis=0)
# axis=1 → x-derivative (column direction)
# axis=0 → y-derivative (row direction)`}</pre>
      <p>
        Vorticity is mapped to a blue-white-red ramp: t = ω/(2·VOR_MAX) + 0.5
        clamped to [0,1], then piecewise-linear RGB gives t=0 → red (clockwise),
        t=0.5 → white (irrotational), t=1 → blue (counter-clockwise). The
        result is written to a <code>FLOAT_COLOR</code> attribute on the{" "}
        <code>POINT</code> domain via{" "}
        <code>mesh.attributes['Col'].data.foreach_set('color', rgba)</code> —
        the same attribute pipeline used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-biot-savart-magnetic-field-line-tracer-poi-webxr"
          className={lk}
        >
          Biot-Savart field-line tracer
        </Link>{" "}
        for per-curve colour gradients. An Emission shader reads{" "}
        <code>ShaderNodeAttribute('Col')</code> with strength 3.5 against a
        black world, giving the characteristic fluid-dynamics poster look.
      </p>

      <h2>Stability, Mach number, and the compressibility error</h2>
      <p>
        LBM is not truly incompressible: it recovers the weakly compressible
        Navier-Stokes equations with a speed of sound c_s = 1/√3 ≈ 0.577 in
        lattice units. The Mach number of the inflow is Ma = U/c_s ≈ 0.17 at
        U=0.10, well within the low-Ma regime where compressibility errors are
        O(Ma²) ≈ 3%. Three failure modes to know:
      </p>
      <ul>
        <li>
          <strong>τ → 0.5</strong>: viscosity approaches zero, BGK amplifies
          numerical noise. Below τ = 0.505 the simulation explodes within tens
          of frames. The fix: raise τ (lower Re) or use a multi-relaxation-time
          (MRT) collision operator.
        </li>
        <li>
          <strong>U_INFLOW &gt; 0.15</strong>: Ma &gt; 0.26 introduces
          spurious pressure waves that contaminate the vortex pattern.
          Characteristic: checkerboard density artefacts on the pressure field.
        </li>
        <li>
          <strong>High blockage ratio</strong>: obstacle diameter / channel
          height &gt; 0.25 causes wall-confinement effects that raise the
          effective Re and shift the Strouhal number. Our 16/80 = 0.20
          blockage is at the acceptable limit; for cleaner results use NY=120.
        </li>
      </ul>
      <p>
        These same constraints govern the Kelvin-Helmholtz sheet simulation in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-kelvin-helmholtz-vortex-filament-birkhoff-rott"
          className={lk}
        >
          Birkhoff-Rott vortex filament tutorial
        </Link>
        , where the desingularisation parameter δ plays an analogous role to τ
        — both set a minimum resolved length scale below which the numerical
        method becomes unphysical. See also the ocean wave approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-ocean-modifier-beaufort-wave-spectrum-foam-seascape-webxr"
          className={lk}
        >
          Beaufort wave spectrum tutorial
        </Link>{" "}
        for a complementary Eulerian surface-wave model that bypasses
        Navier-Stokes entirely via the Stokes-wave dispersion relation.
      </p>
    </>
  );
}

const data = {
  date: "2026-07-25",
  title:
    "Python bpy — Lattice Boltzmann D2Q9 Fluid: BGK Streaming-Collision for Kármán Vortex Street & Poi Wake Visualisation (Blender 5.1)",
  lede: "A 160×80 quad mesh carries per-vertex FLOAT_COLOR updated each frame by a bpy frame_change_pre handler that runs one D2Q9 LBM step — BGK collision (τ=0.55, Re≈96) followed by nine np.roll streaming operations and full-way bounce-back at a cylinder obstacle — then maps vorticity ω=∂uy/∂x−∂ux/∂y to a blue-white-red emission ramp, producing a live Kármán vortex street that develops from a symmetric wake into a fully periodic alternating-vortex pattern by frame 80, visualising the same aerodynamic wake structure that governs poi-head flutter in slow-motion footage.",
  body: Body,
  libraryPath:
    "blends/scripting/python-bpy-lattice-boltzmann-d2q9-lbm-karman-vortex-poi-webxr/",
  steps: [
    {
      title: "Run blueprint.py — mesh, LBM initialisation, handler registration",
      body: "Open Blender 5.1 → **Scripting** workspace. Open `blueprint.py` and press **Run Script**.\n\n`setup()` clears the scene, builds the obstacle mask with `np.mgrid` (a boolean (80,160) array where `(ii−30)² + (jj−40)² ≤ 64`), and initialises the 9×80×160 distribution array `F` to the equilibrium at inflow velocity. `WARMUP=80` BGK steps run immediately to seed a tiny asymmetry in the wake — without warmup the left-right symmetry is exact and the vortex street never triggers.\n\n`from_pydata` builds the 160×80 quad mesh: vertices are listed row-major (`j*NX+i` index = vertex index), faces are `(j*NX+i, j*NX+i+1, (j+1)*NX+i+1, (j+1)*NX+i)`. The `FLOAT_COLOR POINT` attribute `Col` is created with `me.attributes.new('Col','FLOAT_COLOR','POINT')`. The emission material reads this attribute via `ShaderNodeAttribute`. Finally `lbm_handler` is appended to `bpy.app.handlers.frame_change_pre`.",
    },
    {
      title: "Play the simulation — watch the vortex street develop",
      body: "Switch the 3D viewport to **Rendered** shading. The initial state shows nearly white everywhere (low vorticity in the uniform inflow), with a dark disc for the obstacle.\n\nPress **Space**. Each frame fires the handler which calls `lbm_step(F, OBS)`. Watch the sequence:\n\n**Frames 1–40**: a thin red streak forms above the cylinder and a blue streak below — the boundary-layer separation point. The wake is fully attached and symmetric.\n\n**Frames 40–80**: the separated shear layers roll up into two counter-rotating cores close behind the cylinder. Symmetry is still approximately preserved.\n\n**Frame ~80**: asymmetry triggers. One vortex (say, blue/CCW) grows slightly faster, detaches, and drifts downstream. The opposite (red/CW) vortex then detaches from the other side.\n\n**Frames 80–160**: the periodic street locks in. Each shed cycle takes ≈80 frames (Strouhal St≈0.20). The vortices convect downstream at ≈70% of U_INFLOW and slowly expand by viscous diffusion.",
    },
    {
      title: "Inspect the BGK collision line and streaming axes",
      body: "In the `lbm_step` function, the BGK line:\n```python\nf_post = f - (f - _feq(rho, ux, uy)) / TAU\n```\nThis is three numpy operations on (9,80,160) arrays: compute feq (which calls `_feq`), subtract to get the deviation, divide by τ, subtract from f. The entire (9×80×160 = 115 200 floats) is updated in one vectorised pass — no Python loop over cells.\n\nFor the streaming, each `f_post[i]` slice has shape (80,160). `axis=0` runs over **rows** (y direction), `axis=1` runs over **columns** (x direction). Check that your roll directions make sense:\n- `np.roll(f_post[1], 1, 1)`: shifts column-axis right by 1 → position `(j,i)` receives value from `(j,i-1)`. Particle at column i-1 moves to column i in the +x direction. ✓\n- `np.roll(f_post[2], 1, 0)`: shifts row-axis down by 1 → position `(j,i)` receives value from `(j-1,i)`. Particle at row j-1 moves to row j in the +y direction. ✓\n\nThe bounce-back loop iterates over 9 populations — acceptable since the loop body is a numpy masked assignment (one array op, not a pixel loop).",
    },
    {
      title: "Vary Reynolds number and observe transition",
      body: "The Reynolds number is Re = U_INFLOW × 2×OBS_R / ν = U × D / ((τ−0.5)/3).\n\n**Re < 40 (τ=0.75, U=0.05, R=8)**: steady wake. Two attached symmetric recirculation bubbles sit behind the cylinder. No shedding. Colour: static blue-on-one-side, red-on-other.\n\n**Re ≈ 96 (default)**: periodic Kármán street. Clear alternating pattern.\n\n**Re ≈ 200 (τ=0.55, U=0.10, R=12)**: denser street, shorter wavelength. Shed vortices decay faster (higher ν is lower at equal Re but with larger D). To raise Re safely, reduce τ toward 0.51 but watch for blow-up.\n\n**Re > 300**: the D2Q9 BGK scheme becomes unstable before the physical turbulence appears. Use MRT-LBM (not implemented here) or entropic LBM for higher Re.\n\nFor studio light-painting use: a still frame at peak vorticity contrast (≈frame 120) with EEVEE bloom `threshold=0.2, intensity=0.8` gives a striking dual-helix light-painting render that maps directly onto the poi wake aesthetic seen in the Kelvin-Helmholtz and Biot-Savart tutorials.",
    },
  ],
  finalResult:
    "A live 160×80 LBM fluid simulation running at one BGK step per Blender frame via a frame_change_pre handler: D2Q9 BGK collision (τ=0.55), nine np.roll streaming operations, full-way cylinder bounce-back (OBS_R=8, Re≈96), zero-gradient right outflow, and equilibrium left inflow. Vorticity ω=∂uy/∂x−∂ux/∂y colour-mapped to a FLOAT_COLOR POINT attribute drives an emission material. The Kármán vortex street is visible from frame 80, with periodic shedding at St≈0.20. Saved as hf_karman_vortex.blend.",
  troubleshooting: [
    {
      symptom:
        "Simulation explodes after a few frames — vertex colours turn NaN/uniform grey",
      cause:
        "τ too close to 0.5 or U_INFLOW too high. At τ=0.50 the BGK denominator is effectively zero and numerical noise is amplified exponentially. At U_INFLOW > 0.15 the Mach number exceeds the stability limit.",
      fix: "Raise τ to at least 0.52, or reduce U_INFLOW to 0.08. Add a `np.nan_to_num(f, nan=0.0)` guard at the top of lbm_step as an emergency catch. The `np.maximum(rho, 1e-10)` guard in the blueprint already prevents division-by-zero density.",
    },
    {
      symptom:
        "Vortex street is perfectly symmetric — left-right mirror image, no shedding",
      cause:
        "WARMUP is 0 or the initial conditions are exactly symmetric. The BGK scheme with equilibrium inflow has no built-in symmetry-breaking seed.",
      fix: "Increase WARMUP to 100–150 steps so numpy's floating-point arithmetic accumulates enough asymmetry. Alternatively, add a small random perturbation: `F[:, :, OBS_CX+OBS_R+1] += np.random.uniform(-1e-4, 1e-4, (9, NY))` before the warmup loop.",
    },
    {
      symptom:
        "Mesh visible but colours don't update during playback",
      cause:
        "The handler was registered but frame playback in Blender's animation player does not always fire frame_change_pre for every single frame at high speed.",
      fix: "Use manual frame stepping (← → arrow keys or scrub the timeline by hand) to trigger the handler reliably. For a fully rendered animation, use record.py which calls `scene.frame_set(frame)` explicitly per frame.",
    },
  ],
  externalLinks: [
    {
      label: "PyLBM — Python Lattice Boltzmann library (BSD-3-Clause)",
      href: "https://github.com/pylbm/pylbm",
    },
    {
      label:
        "Blender Python API 5.1 — bpy.types.Mesh (CC-BY-SA 4.0, Blender Foundation)",
      href: "https://docs.blender.org/api/5.1/bpy.types.Mesh.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "SPH Fluid — Müller Kernels, Pressure & Viscosity for Light-Painting Trails",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting",
    },
    {
      label:
        "Kelvin-Helmholtz Vortex Filament — Birkhoff-Rott Equation & Shear-Flow Roll-Up",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-kelvin-helmholtz-vortex-filament-birkhoff-rott",
    },
    {
      label:
        "Biot-Savart Field-Line Tracer — Helix Wire Current → RK4 Particle Integration",
      href: "/tutorials/blender-tutorial-python-bpy-biot-savart-magnetic-field-line-tracer-poi-webxr",
    },
    {
      label:
        "Ocean Modifier — Beaufort Wave Spectrum & Foam Seascape for WebXR",
      href: "/tutorials/blender-tutorial-python-bpy-ocean-modifier-beaufort-wave-spectrum-foam-seascape-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-bpy-lattice-boltzmann-d2q9-lbm-karman-vortex-poi-webxr",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "physics",
      "fluid-simulation",
      "lattice-boltzmann",
      "light-painting",
      "poi",
      "numpy",
    ],
    body: Body,
  },
  data,
);
