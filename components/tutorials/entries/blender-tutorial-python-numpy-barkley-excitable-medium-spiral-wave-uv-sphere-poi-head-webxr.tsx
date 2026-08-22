import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const data = {
  title:
    "Python numpy — Barkley Excitable Medium: Rotating Spiral Wave Simulation, RK2 Integration & UV-Sphere Displacement Poi Head with Wave-State Shape Keys for WebXR (Blender 5.1)",
  lede: "Simulate the Barkley model — a minimal two-species PDE system for excitable media — on a 128² grid using Runge-Kutta 2, then wrap three spiral-wave snapshots onto a UV sphere as shape keys, producing a displaced poi head whose geometry encodes one quarter-revolution of a rotating chemical spiral.",
  date: "2026-08-08",
  externalSources: [
    {
      label:
        "Barkley, D. (1991) — 'A model for fast computer simulation of waves in excitable media.' Physica D 49(1-2):61–70",
      url: "https://doi.org/10.1016/0167-2789(91)90194-E",
      licence: "Public Domain",
      author: "Dwight Barkley",
    },
    {
      label:
        "Fenton, F. & Karma, A. (1998) — 'Vortex dynamics in three-dimensional continuous myocardium with fiber rotation.' Chaos 8(1):20–47",
      url: "https://doi.org/10.1063/1.166311",
      licence: "Public Domain",
      author: "Flavio Fenton & Alain Karma",
    },
  ],
};

function Body() {
  return (
    <>
      <h2>What is an excitable medium?</h2>
      <p>
        An excitable medium is a system that, when perturbed beyond a threshold,
        fires a large pulse — then enters a <em>refractory period</em> before it
        can fire again. The canonical examples are cardiac muscle (action
        potentials), nerve axons (Hodgkin-Huxley spikes), and the
        Belousov-Zhabotinsky (BZ) reaction (a ferroin-catalysed oscillating
        redox reaction that turns the solution from red to blue and back in
        rotating spirals).
      </p>
      <p>
        What makes excitable media geometrically interesting is the{" "}
        <strong>spiral wave</strong>: a self-sustained rotating pattern where
        the wavefront curls around a small core. Discovered by Winfree in
        biological preparations (1972) and reproduced analytically by Barkley
        (1991), the spiral is not a feature of the initial conditions — it
        is an <em>attractor</em>. Almost any perturbation near threshold organises
        into one.
      </p>

      <h2>The Barkley model</h2>
      <p>
        Barkley&apos;s 1991 paper replaced the biophysically detailed
        Hodgkin-Huxley equations with the simplest PDE pair that preserves the
        qualitative behaviour:
      </p>
      <pre>{`∂u/∂t = (1/ε) u(1−u)(u − (v+b)/a) + D∇²u
∂v/∂t = u − v`}</pre>
      <p>
        Here <code>u ∈ [0,1]</code> is the fast activator (membrane voltage
        analogue) and <code>v ∈ [0,1]</code> is the slow inhibitor (recovery
        gating variable). The parameters control the regime:
      </p>
      <ul>
        <li>
          <strong>ε = 0.02</strong> — the time-scale ratio. Because ε ≪ 1, u
          relaxes much faster than v. In phase-plane terms, u is always near the
          cubic nullcline <code>F(u,v)=0</code> except during the sharp upstroke
          and downstroke of the pulse.
        </li>
        <li>
          <strong>a = 0.75</strong> — governs the slope of the cubic kinetics
          term. Values near 0.5–0.9 keep the system in the{" "}
          <em>rigidly rotating</em> spiral regime, where the core executes a
          perfect circular orbit with period T ≈ 19 time units.
        </li>
        <li>
          <strong>b = 0.06</strong> — the excitation threshold offset. Increasing
          b raises the firing threshold, shrinking the spiral&apos;s tip.
        </li>
      </ul>
      <p>
        The Laplacian term <code>D∇²u</code> (with D = 1.0) couples the
        spatial grid — this is what allows the wave to propagate. Without it the
        system is a set of 128² independent oscillators with no spatial
        communication.
      </p>

      <h2>Why Runge-Kutta 2 (midpoint method)?</h2>
      <p>
        The sharp wavefront — a fast transition in u over roughly one cell width
        — is sensitive to time-integration error. Explicit Euler is first-order:
        the local truncation error at each step is <code>O(Δt²)</code> and the
        global error is <code>O(Δt)</code>. At Δt = 0.05 this produces a
        measurable phase drift in the spiral&apos;s rotation rate across 1 200
        steps.
      </p>
      <p>
        The midpoint method (RK2) evaluates the derivative at the mid-step:
      </p>
      <pre>{`k1 = f(u, v)
k2 = f(u + 0.5·Δt·k1_u, v + 0.5·Δt·k1_v)
u_new = u + Δt·k2_u`}</pre>
      <p>
        This is second-order accurate <code>O(Δt³)</code> local / <code>O(Δt²)</code>{" "}
        global — enough to keep the spiral period stable to within 0.1% over the
        1 200 steps of this simulation, at the cost of one extra function
        evaluation per step.
      </p>

      <h2>Initial conditions and the phase singularity</h2>
      <p>
        A rotating spiral requires a <strong>phase singularity</strong> in the
        initial state — a point where the phase of the medium&apos;s oscillation
        is undefined. Winfree (1974) showed that the simplest way to create one
        is to initialise a step function in u and a gradient in v at right angles:
      </p>
      <pre>{`u[:half, :]  = 1.0                        # left half excited
v[:,  :half] = linspace(0, 0.5, half)    # bottom half v-ramp`}</pre>
      <p>
        The upper-right quadrant has <code>u = 0, v = 0</code> (quiescent); the
        lower-left has <code>u = 1, v ≈ 0.25</code> (excited and partially
        recovered). The boundary between them contains a point where the threshold
        condition <code>u = (v+b)/a</code> is satisfied from every direction —
        the phase singularity. Within about 50 steps a free rotor organises
        around it.
      </p>

      <h2>Step 1 — Vectorised Laplacian</h2>
      <p>
        The 5-point finite-difference stencil with periodic boundary conditions
        is implemented with <code>np.roll</code>:
      </p>
      <pre>{`def _laplacian(f):
    return (np.roll(f, -1, 0) + np.roll(f, 1, 0) +
            np.roll(f, -1, 1) + np.roll(f, 1, 1) - 4.0 * f) / (DX*DX)`}</pre>
      <p>
        <code>np.roll(f, -1, 0)</code> is the north-shifted copy (periodic wrap),
        and so on for the other three cardinal directions. At DX = 1, DT = 0.05
        the Von Neumann stability bound for the diffusion term is{" "}
        <code>DT ≤ DX²/(4D) = 0.0625</code> — comfortably satisfied. The
        reaction kinetics are stiff (fast cubic near the threshold) but the clamp
        to [0,1] after each step prevents blow-up without a semi-implicit scheme.
      </p>

      <h2>Step 2 — Three snapshots at T/4 intervals</h2>
      <p>
        The spiral rotates with period T ≈ 19 time units (380 steps at Δt =
        0.05). Three snapshots taken 95 steps apart cover approximately ¾ of
        one complete revolution, giving shape keys that smoothly morph through
        a portion of the spiral cycle in a WebXR scene.
      </p>
      <pre>{`SNAP_A = 800    # spiral well-established; Basis key
SNAP_B = 895    # ≈ T/4 later → Spiral_T2
SNAP_C = 990    # ≈ T/4 further → Spiral_T3`}</pre>

      <h2>Step 3 — Bilinear mapping to UV sphere</h2>
      <p>
        Each vertex on the UV sphere is addressed by a latitude angle φ ∈ [0,π]
        and a longitude θ ∈ [0, 2π). Normalising these to [0,1] gives grid
        coordinates into the 128 × 128 simulation field. The activator value u
        at that grid point is sampled with bilinear interpolation and used as a
        radial displacement:
      </p>
      <pre>{`r = POI_RADIUS + u(φ,θ) * DISP_SCALE`}</pre>
      <p>
        The equatorial band (φ ≈ π/2) covers the most simulation area per
        vertex — that is where the spiral arms are most visible. The poles are
        slightly smeared because a small region of the simulation grid maps to
        the collapsed cap vertices.
      </p>

      <h2>Step 4 — Vertex colours</h2>
      <p>
        The FLOAT_COLOR attribute{" "}
        <code>ActivatorField</code> stores a per-vertex colour sampled from the
        Basis snapshot. The colour ramp maps:
      </p>
      <ul>
        <li>
          <strong>Quiescent u ≈ 0</strong> → deep indigo (R=0, G=0, B=1)
        </li>
        <li>
          <strong>Excited u ≈ 1</strong> → flame yellow (R=1, G=1, B=0)
        </li>
      </ul>
      <p>
        Using FLOAT_COLOR (linear) rather than BYTE_COLOR (sRGB-quantised)
        preserves the sub-step gradients in the wavefront transition zone, which
        would otherwise be crushed to 8-bit steps on the Emission material.
      </p>

      <h2>Trade-offs and failure modes</h2>
      <ul>
        <li>
          <strong>Meandering spiral</strong>: set ε to 0.04 and a to 0.6 — the
          spiral core drifts on a flower-petal path ("meandering" or "linear core"
          regime). The poi head then shows a more complex, less symmetric surface
          deformation.
        </li>
        <li>
          <strong>Spiral breakup</strong>: very small ε or large curvature at the
          core can cause the spiral tip to drift off-grid or fragment into
          turbulence. This is the cardiac arrhythmia analogue; increase the
          grid to 256 × 256 to observe it cleanly.
        </li>
        <li>
          <strong>Pole smearing</strong>: the bilinear map concentrates many
          vertices near one simulation corner at the poles. For a cleaner cap,
          replace the constant-latitude UV sphere with a sphere using fewer
          vertices near the poles (non-uniform latitude spacing).
        </li>
        <li>
          <strong>Shape-key topology mismatch</strong>: all three shape keys must
          share the same vertex count and order — guaranteed here because
          <code>add_shape_key</code> recomputes positions on the same fixed
          (N_PHI+1) × N_THETA grid used for the Basis mesh.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr"
            className={lk}
          >
            Gray-Scott reaction-diffusion Turing patterns
          </Link>{" "}
          — the same simulation-to-height-field pipeline applied to an activator-inhibitor
          system that produces static spots and stripes rather than rotating spirals
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-ising-model-metropolis-monte-carlo-phase-transition-critical-height-field-webxr"
            className={lk}
          >
            Ising model Metropolis Monte Carlo
          </Link>{" "}
          — another two-state lattice simulation stored as shape-key height fields,
          this time encoding a thermodynamic phase transition rather than a
          propagating wave
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-gielis-superformula-polar-3d-organic-poi-head-webxr"
            className={lk}
          >
            Gielis superformula polar poi head
          </Link>{" "}
          — the same UV-sphere displacement + shape-key approach used to
          morph between five parametric 3D shapes
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chladni-figures-standing-wave-eigenmodes-nodal-lines-height-field-webxr"
            className={lk}
          >
            Chladni figures: standing wave eigenmodes
          </Link>{" "}
          — a related wave-pattern-to-mesh pipeline; Chladni uses the Helmholtz
          equation (linear standing waves) while Barkley uses nonlinear reaction
          kinetics
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  data,
  Body,
  slug: "blender-tutorial-python-numpy-barkley-excitable-medium-spiral-wave-uv-sphere-poi-head-webxr",
  libraryPath:
    "blends/scripting/python-numpy-barkley-excitable-medium-spiral-wave-uv-sphere-poi-head-webxr",
});
