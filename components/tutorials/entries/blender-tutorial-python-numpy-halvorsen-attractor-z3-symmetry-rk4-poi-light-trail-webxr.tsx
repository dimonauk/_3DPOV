import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr";

const TITLE =
  "Python numpy — Halvorsen Attractor: Z₃-Symmetric Strange Attractor, C₃ Orbit Decomposition & Three-Arm Poi Light Trail for WebXR (Blender 5.1)";

const LEDE =
  "The Halvorsen attractor is a 3D autonomous strange attractor discovered by A. Halvorsen (c. 1978) and catalogued by Sprott (2010). Its defining feature is exact C₃ cyclic symmetry under the coordinate permutation σ: (x,y,z)→(y,z,x), which maps the first equation of motion to the second and the second to the third — meaning three interleaved arms of the attractor are exact symmetry-related images of a single orbit. This blueprint integrates the three C₃-conjugate trajectories with 4th-order Runge-Kutta, constructs each as a bevelled NURBS POLY tube with emission material, and records two shape-key deformation targets at alternative dissipation values α=1.4 and α=1.6, bracketing the period-8 and quasi-periodic windows around the canonical chaotic form at α=1.89.";

function Body() {
  return (
    <>
      <p>
        Most strange attractors in the classical catalogue — Lorenz, Rössler,
        Chen — have at most a Z₂ reflection symmetry or no symmetry at all.
        The Halvorsen system is unusual in possessing an exact three-fold cyclic
        symmetry. The permutation σ: (x,y,z) → (y,z,x) is a linear map of
        order 3 (σ³ = identity), and the vector field F commutes with it:
        F(σ·s) = σ·F(s) for all states s.
      </p>

      <h2>The Z₃ symmetry group and orbit decomposition</h2>
      <p>
        The implication for trajectories is immediate. If γ(t) is a solution
        starting at s₀, then σγ(t) starting at σ·s₀ and σ²γ(t) starting at
        σ²·s₀ are also solutions — distinct from γ if s₀ is not on the
        symmetry axis (x=y=z). The three seeds used in this blueprint are
        exact σ-images of each other:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`seed_A = (-5.0,  0.0,  0.5)
seed_B = ( 0.0,  0.5, -5.0)   # σ(seed_A): (y,z,x) of seed_A
seed_C = ( 0.5, -5.0,  0.0)   # σ²(seed_A)`}
      </pre>
      <p>
        After the burn-in transient, each seed settles onto the attractor.
        The three resulting trajectories are topologically identical but
        displaced by 120° in the attractor&apos;s phase-space structure — this is
        exactly what produces the three-armed butterfly visible in any
        Halvorsen plot.
      </p>

      <h2>Dissipation and the Lyapunov spectrum</h2>
      <p>
        The system&apos;s divergence is ∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = −3α,
        which is constant and negative for all α &gt; 0. This guarantees the
        flow is dissipative: phase-space volume contracts at rate e^(−3α t).
        The three Lyapunov exponents must therefore sum to −3α.
      </p>
      <p>
        At α = 1.89 the exponent spectrum is approximately
        (λ₁, λ₂, λ₃) ≈ (+0.22, 0.00, −2.22):
      </p>
      <ul>
        <li>
          <strong>λ₁ ≈ +0.22</strong> — positive, confirming chaos: nearby
          trajectories separate exponentially (doubling time ≈ 1/λ₁ ≈ 4.5 time
          units)
        </li>
        <li>
          <strong>λ₂ ≈ 0</strong> — zero, marking the flow direction (no
          separation along the orbit)
        </li>
        <li>
          <strong>λ₃ ≈ −2.22</strong> — strongly negative, the folding
          direction that keeps trajectories bounded
        </li>
      </ul>
      <p>
        The Kaplan–Yorke (Lyapunov) dimension is D_KY = 2 + λ₁/|λ₃| ≈ 2.10,
        consistent with an attractor that is fractally thicker than a surface
        but thinner than a solid.
      </p>

      <h2>α bifurcation and shape keys</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`α < 1.3   — strongly chaotic, dense wing filling
α ≈ 1.4   — period-8 window: 8 discrete loops per arm
α ≈ 1.6   — quasi-periodic / period-4 transition
α = 1.89  — canonical chaotic form (basis shape key)
α > 2.0   — trajectories escape; no bounded attractor`}
      </pre>
      <p>
        Shape keys at α=1.4 and α=1.6 re-integrate the ODE from the same
        C₃ seeds and overwrite the POLY spline control-point positions via
        <code>ShapeKeyCurvePoint.co</code>, which is a 3-element XYZ vector
        (the homogeneous weight w=1 is not morphed). This allows a WebXR
        animation to lerp between the clean period-8 arcs and the dense
        chaotic filling — a visual demonstration of the bifurcation sequence.
      </p>

      <h2>RK4 integration — why fixed step size works here</h2>
      <p>
        Adaptive ODE solvers (Dormand–Prince, LSODA) adjust the step to
        control local truncation error. For attractor visualisation we do not
        need numerical accuracy beyond visual fidelity — a fixed step of
        h = 0.005 keeps the orbit on the attractor without the overhead of
        error estimation. The Halvorsen system is moderately stiff near α = 1.89:
        the fast folding exponent |λ₃| ≈ 2.22 requires h ≲ 2/|λ₃| ≈ 0.9 for
        stability of explicit Euler. RK4 has a stability radius of approximately
        2.83 on the imaginary axis and ≈2.79 on the negative real axis, so
        h = 0.005 is deeply stable (local stiffness ratio ≈ 0.011).
      </p>

      <h2>NURBS POLY curve with bevel</h2>
      <p>
        Blender 5.1&apos;s POLY spline is the lightest curve primitive — straight
        edges between control points, no interpolation overhead. Each of the
        8,000 trajectory points becomes a POLY control point. Bevel is applied
        via <code>bpy.types.Curve.bevel_mode = &quot;ROUND&quot;</code> with
        <code>bevel_depth = 0.04</code> and <code>bevel_resolution = 3</code>,
        producing a 16-sided circular cross section. Fill caps close the tube
        ends cleanly for GLB export.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`crv.bevel_mode       = "ROUND"
crv.bevel_depth      = 0.04   # tube radius in metres
crv.bevel_resolution = 3      # 2^(res+1) = 16 sides
crv.use_fill_caps    = True`}
      </pre>
      <p>
        At export the GLTF exporter realises the bevel geometry: 8,000 points
        × 16 sides = 128,000 vertices per arm, 384,000 total. Draco-6
        compression reduces the GLB from ≈11 MB to ≈1.8 MB.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Shape key count mismatch</strong> — if you change N_STEPS
          between runs, the shape-key data array length will not match the
          spline point count. Re-run the full <code>build()</code> from a fresh
          scene; shape keys cannot be resized after creation.
        </li>
        <li>
          <strong>GLB export fails with &quot;context is incorrect&quot;</strong> — the
          GLTF exporter requires an active object. The script calls
          <code>bpy.context.view_layer.objects.active = arm_objs[0]</code>
          before exporting; if you run export manually ensure at least one
          curve object is active.
        </li>
        <li>
          <strong>Trajectory escapes (diverges)</strong> — α ≥ 2.0 has no
          bounded attractor. The RK4 state grows without bound within a few
          hundred steps. Keep α &lt; 1.98 to stay safely within the basin.
        </li>
        <li>
          <strong>Period-8 window not visible at α=1.4</strong> — the burn-in
          of 2,000 steps may not be long enough to settle from arbitrary initial
          conditions at this α. Increase BURN_IN to 5,000 for the shape-key
          integrations.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting"
            className={lk}
          >
            GN Simulation Zone — Lorenz Attractor Poi Light Painting
          </Link>{" "}
          — the original 1963 Lorenz system integrated via Geometry Nodes
          simulation zones; Halvorsen (1978) is a later Z₃-symmetric generalisation
          that avoids the bilateral asymmetry of the Lorenz butterfly
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-bpy-rossler-attractor-rk4-poi-light-painting"
            className={lk}
          >
            Python bpy — Rössler Attractor: RK4 Poi Light Painting
          </Link>{" "}
          — Rössler (1976) uses the same RK4 POLY-curve pipeline; compare
          single-scroll topology (Rössler) vs three-armed butterfly (Halvorsen)
          and how C₁ vs C₃ symmetry changes visual complexity
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-scipy-thomas-cyclically-symmetric-attractor-labyrinth-chaos-poi-webxr"
            className={lk}
          >
            Python scipy — Thomas&apos; Cyclically Symmetric Attractor: Labyrinth
            Chaos, Z₃ Orbit Symmetry
          </Link>{" "}
          — Thomas&apos; system also has C₃ symmetry and produces three interlocked
          tubes; the labyrinth chaos topology (no bounded attractor on a torus)
          contrasts with Halvorsen&apos;s compact bounded wings
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
            className={lk}
          >
            Python numpy — Duffing Oscillator: Period-Doubling Route to Chaos
          </Link>{" "}
          — Duffing&apos;s driven oscillator shows the period-doubling cascade
          (1 → 2 → 4 → 8 → chaos) that also governs the Halvorsen α-bifurcation;
          Poincaré section methodology is identical
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-mathutils-hopf-fibration-linked-tori-light-sculpture-webxr"
            className={lk}
          >
            Python mathutils — Hopf Fibration: S³→S² Bundle, Clifford Parallels
            & 72-Fibre Linked-Torus Light Sculpture
          </Link>{" "}
          — the Hopf fibration&apos;s three-fold fibre bundles share the visual
          language of interlocked tubes; both Halvorsen arms and Hopf fibres
          explore how linked curves partition 3D space
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Sprott, J.C. (2010){" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/eleganceh.htm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Elegant Chaos: Algebraically Simple Chaotic Flows — Cambridge
            University Press
          </a>{" "}
          — catalogue of algebraically simple chaotic systems including the
          Halvorsen attractor with verified parameters; the algorithm and
          equations are mathematical content in the public domain. Related:{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/3dflows.htm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sprott&apos;s 3D Strange Attractor Explorer
          </a>
        </li>
        <li>
          Gilpin, W. (2021–2024){" "}
          <a
            href="https://github.com/williamgilpin/dysts"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            dysts: Dynamical Systems Benchmarks (MIT)
          </a>{" "}
          — Python library cataloguing 135+ chaotic systems with verified
          parameters and standardised integration; includes{" "}
          <code>dysts.flows.Halvorsen</code> with the canonical α=1.89 value
          used here. Related:{" "}
          <a
            href="https://github.com/williamgilpin/dysts_examples"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            williamgilpin/dysts_examples
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-02",
  topics: ["blender", "python", "scripting", "mathematics", "webxr", "poi"],
  body: Body,
  library: {
    type: "blend + glb",
    topic: "scripting",
    path: `blends/scripting/${SLUG}/`,
    blenderVersion: "5.1",
  },
});
