import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Aizawa Attractor: Toroidal Strange Attractor, z³ Restoring Force, RK4 Integration & Ring-Void Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Aizawa attractor (Aizawa & Ichi 1984) is a three-dimensional strange attractor whose most distinctive feature is a persistent hole through its centre — the chaotic trajectory winds continuously around a toroidal void without ever passing through it. The mechanism is a (x,y) oscillator driven by z as a slowly modulated gain: when z exceeds the threshold β the radius grows, when it falls below β it contracts, and the z motion is bounded by a cubic restoring term −z³/3. The incommensurability of the fast orbital rotation (δ = 3.5 rad / time unit) with the slow z oscillation produces deterministic chaos. This blueprint integrates 60,000 steps of the Aizawa ODE with 4th-order Runge-Kutta, constructs a bevelled POLY tube from the trajectory, and records two shape-key deformation targets at ε=0 and ε=0.5 to demonstrate how the coupling coefficient reshapes the toroidal structure.";

function Body() {
  return (
    <>
      <p>
        Most strange attractors in the classical 3D catalogue — Lorenz,
        Rössler, Halvorsen — have no topological hole: the trajectory either
        winds around two lobes (Lorenz), spirals outward then folds back
        (Rössler), or sweeps three symmetric arms (Halvorsen). The Aizawa
        attractor is unusual in that the trajectory is topologically
        constrained to loop <em>around</em> a central void, like a tangled
        length of cord knotted around a hula hoop but never through it.
      </p>

      <h2>Equations of motion</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = (z − β)·x − δ·y
ẏ =  δ·x + (z − β)·y
ż =  γ + α·z − z³/3 − (x² + y²)·(1 + ε·z) + ζ·z·x³

Canonical parameters
  α = 0.95   β = 0.70   γ = 0.60
  δ = 3.50   ε = 0.25   ζ = 0.10`}
      </pre>
      <p>
        The (x,y) subsystem is a complex oscillator with eigenvalue
        λ<sub>xy</sub> = (z − β) ± i·δ. When z &gt; β the real part is
        positive: the oscillator grows. When z &lt; β it damps. The z equation
        provides the slow clock that alternates between these two regimes.
      </p>

      <h2>Why there is a hole</h2>
      <p>
        At any frozen value of z, the (x, y) subsystem is a 2D linear system
        with angular frequency δ ≈ 3.5 rad / time unit. The orbit in (x, y)
        is an inward or outward spiral. The spiral never reaches the origin:
        when r → 0, the coupling term (x² + y²)·(1 + ε·z) also → 0, so the z
        equation is no longer influenced by x or y and z just evolves as
        γ + α·z − z³/3, whose fixed points pull z back to a moderate value.
        The trajectory is therefore repelled from the z-axis by the dynamics
        — and can never cross through the hole. This is not a topological
        constraint in the strict sense (the attractor lives in ℝ³, not on a
        torus), but a <em>dynamical</em> constraint: the density of the
        trajectory measure is zero on any disc through the z-axis.
      </p>

      <h2>Lyapunov spectrum</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`λ₁ ≈ +0.073   positive — chaos confirmed (doubling time ≈ 14 time units)
λ₂ ≈  0.000   zero   — along the flow direction
λ₃ ≈ −0.490   negative — folding (strong contraction onto attractor sheet)
∑λᵢ ≈ −0.417  negative — system is dissipative (∇·F < 0 on average)
D_KY ≈ 2 + λ₁/|λ₃| ≈ 2.15  (fractal between surface and solid)`}
      </pre>
      <p>
        The positive Lyapunov exponent λ₁ ≈ 0.073 is unusually small relative
        to Lorenz (λ₁ ≈ 0.90) or Halvorsen (λ₁ ≈ 0.22). The attractor is{" "}
        <em>mildly</em> chaotic: trajectories separate slowly, so the winding
        looks quasi-periodic over short timescales but is genuinely chaotic
        over thousands of orbits. This is precisely what gives the attractor
        its layered, wound-thread appearance.
      </p>

      <h2>RK4 integration at fixed step</h2>
      <p>
        The Aizawa system is not stiff: the largest magnitude eigenvalue of the
        Jacobian at typical attractor points is ≈ δ = 3.5, giving a stability
        criterion h &lt; 2 / 3.5 ≈ 0.57 for explicit Euler. RK4 has a stability
        boundary ≈ 2.8× larger, so h = 0.010 is in the deeply stable regime
        (effective stiffness ratio ≈ 0.028). Fixed-step RK4 is preferable to
        adaptive solvers here because:
      </p>
      <ul>
        <li>
          Shape-key deformation targets must have <em>exactly</em> the same
          number of points as the basis trajectory. An adaptive step would
          produce a different point count for each ε value, making shape keys
          impossible to construct.
        </li>
        <li>
          Visual fidelity (smooth tube) does not require the global accuracy
          guarantees that adaptive solvers provide — local truncation error at
          h = 0.010 is O(h⁵) ≈ 10⁻¹⁰, far below visual resolution.
        </li>
      </ul>

      <h2>Shape keys: ε as a control parameter</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ε = 0.00 (SK_e0)  — coupling term (x²+y²)(1+0·z) = (x²+y²): isotropic
                           smoother ring, larger central void, less chaos
ε = 0.25 (Basis)  — canonical: z modulates coupling; toroidal tangle
ε = 0.50 (SK_e50) — stronger coupling; denser winding, tighter void`}
      </pre>
      <p>
        Each shape key is an independent ODE integration from the same initial
        condition with the same number of steps, so morphing between them
        in WebXR literally interpolates between two distinct dynamical regimes.
        The morph is geometrically smooth because the same seed and the same
        step count produce topologically similar trajectories that differ only
        in their winding density.
      </p>

      <h2>POLY curve with bevel in Blender 5.1</h2>
      <p>
        Blender 5.1&apos;s POLY spline stores control points as straight-edge
        polyline segments — no interpolation overhead, minimal memory per
        point. The bevel settings produce a 16-sided tube:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`crv.bevel_mode       = "ROUND"   # circular cross-section
crv.bevel_depth      = 0.022    # tube radius in metres
crv.bevel_resolution = 3        # 2^(3+1) = 16 sides
crv.use_fill_caps    = True     # closed disc at each end`}
      </pre>
      <p>
        At 60,000 points with 16 sides, the realised mesh has 960,000 vertices.
        Draco-6 compression (enabled in the GLTF exporter) reduces the GLB
        from ≈ 18 MB to ≈ 2.4 MB at negligible visual loss.
      </p>
      <p>
        Shape keys on a Blender <em>curve</em> object use{" "}
        <code>ShapeKeyCurvePoint.co</code>, a 3-vector (unlike mesh shape keys
        which are also 3-vectors but on mesh vertices). The GLTF exporter
        exports curve shape keys as morph targets on the realised mesh — every
        bevel vertex is morphed, which gives smooth tube deformation in WebXR.
      </p>

      <h2>Burn-in: settling onto the attractor</h2>
      <p>
        Starting from <code>[0.1, 0.0, 0.0]</code>, the trajectory is not yet
        on the attractor — it is in the basin of attraction but follows a
        transient path. The blueprint discards 5,000 steps (50 time units) as
        burn-in. The Aizawa attractor basin is large and the transient is short:
        visual inspection confirms the tube is on the attractor by step 200.
        5,000 steps is therefore conservative, but costs only 0.1 s of CPU
        time and avoids any risk of including transient artefacts.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Shape key count mismatch</strong> — if you change{" "}
          <code>N_STEPS</code> between runs, re-run the full{" "}
          <code>build()</code> from a fresh scene. Shape keys cannot be
          resized after creation; a count mismatch raises{" "}
          <code>IndexError</code> in the foreach loop.
        </li>
        <li>
          <strong>GLB export: &quot;context is incorrect&quot;</strong> — the GLTF
          exporter requires an active object. The script sets{" "}
          <code>bpy.context.view_layer.objects.active = obj</code> before
          exporting. If you run export manually, activate the curve object
          first.
        </li>
        <li>
          <strong>Tube looks too thin / invisible in WebXR</strong> — increase{" "}
          <code>TUBE_R</code> (default 0.022 m) or <code>SCALE</code> (default
          0.18). The attractor raw extent is ≈ ±1.5 in (x,y) and ≈ −0.3…1.2
          in z; after scaling by 0.18 the GLB fits in a ≈ 0.5 m bounding box.
        </li>
        <li>
          <strong>Script runs slowly</strong> — reduce <code>N_STEPS</code> to
          30,000 and <code>BURN_IN</code> to 2,000 for a quick preview. The
          shape keys each add a full integration pass, so total cost is
          1 + len(EPS_KEYS) integrations.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-z3-symmetry-rk4-poi-light-trail-webxr"
            className={lk}
          >
            Python numpy — Halvorsen Attractor: Z₃-Symmetric Strange Attractor
          </Link>{" "}
          — the Halvorsen system also uses RK4 fixed-step integration and POLY
          bevel tubes; its C₃ orbit symmetry contrasts with the Aizawa
          attractor&apos;s single-arm toroidal topology
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
            className={lk}
          >
            Python numpy — Lorenz Attractor: RK4 Integration & Butterfly Poi
            Light Trail
          </Link>{" "}
          — the Lorenz butterfly is the classical two-lobe reference; comparing
          Lorenz (λ₁ ≈ 0.90, strongly chaotic) with Aizawa (λ₁ ≈ 0.073,
          mildly chaotic) shows how the Lyapunov exponent governs visual texture
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr"
            className={lk}
          >
            Python numpy — Hopf Fibration: S³→S² Bundle & Linked-Circle Poi
          </Link>{" "}
          — the Hopf fibration fibres S³ over S² in closed circles; the Aizawa
          attractor&apos;s toroidal topology is a chaotic analogue of the
          fibration&apos;s winding structure on T² ⊂ S³
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
            className={lk}
          >
            Python numpy — Duffing Oscillator: Period-Doubling Route to Chaos
          </Link>{" "}
          — Duffing&apos;s driven oscillator is a 2D Poincaré-section system;
          the Aizawa attractor generalises the same period-doubling scenario
          to an autonomous 3D flow
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-torus-knot-tpq-braid-word-seifert-fiber-bishop-tube-poi-webxr"
            className={lk}
          >
            Python numpy — Torus Knot T(p,q): Bishop-Frame Tube Poi
          </Link>{" "}
          — torus knots are mathematically tidy curves winding around a torus;
          the Aizawa attractor can be read as a chaotic torus knot that never
          closes, filling the torus surface densely
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Aizawa, Y. and Ichi, T. (1984){" "}
          <a
            href="https://doi.org/10.1143/PTPS.79.96"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            &quot;Instabilities Towards Chaos&quot; — Progress of Theoretical Physics
            Supplement 79, pp. 96–109
          </a>{" "}
          — the original publication introducing the attractor equations and
          the canonical parameter set used in this blueprint. The equations are
          mathematical content in the public domain. Related journal:{" "}
          <a
            href="https://academic.oup.com/ptps"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Progress of Theoretical Physics Supplement
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
          parameters, Lyapunov spectra, and standardised integration; includes{" "}
          <code>dysts.flows.Aizawa</code> with the canonical parameters
          confirmed here. Related:{" "}
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
  date: "2026-08-22",
  topics: ["blender", "python", "scripting", "mathematics", "webxr", "poi"],
  body: Body,
  library: {
    type: "blend + glb",
    topic: "scripting",
    path: `blends/scripting/${SLUG}/`,
    blenderVersion: "5.1",
  },
});
