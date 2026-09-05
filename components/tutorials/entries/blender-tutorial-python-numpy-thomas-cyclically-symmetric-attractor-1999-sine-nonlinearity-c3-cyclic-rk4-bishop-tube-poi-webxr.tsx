import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-1999-sine-nonlinearity-c3-cyclic-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Thomas Cyclically Symmetric Attractor 1999: " +
  "ẋ=sin(y)−bx ẏ=sin(z)−by ż=sin(x)−bz " +
  "C₃ Cyclic Symmetry Sine-Bounded Forcing Globally Bounded ∀b>0 " +
  "Constant Divergence ∇·F=−3b Shilnikov Saddle-Focus at P± " +
  "λ₁≈+0.037 D_KY≈2.056 Liouville ∑λᵢ=−0.624=∇·F " +
  "Basis(b=0.208)/SK_LowB(b=0.17 wider)/SK_NearTorus(b=0.22)/SK_Periodic(b=0.30) " +
  "Shape Keys Cobalt–Amber Thomas_Speed FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "René Thomas's cyclically symmetric system uses sine nonlinearity — " +
  "ẋ=sin(y)−bx, ẏ=sin(z)−by, ż=sin(x)−bz — rather than the polynomial " +
  "products used by Lorenz, Rössler, and the Sprott family. Because sin is " +
  "globally bounded, the attractor exists for every b>0 without additional " +
  "proof; as b→0 it expands into labyrinthine chaos exploring a " +
  "near-Hamiltonian lattice. For b=0.208 a single-lobe strange attractor " +
  "appears, driven by Shilnikov saddle-foci at P±≈(±2.661,±2.661,±2.661). " +
  "Four shape keys sweep the bifurcation diagram: wide chaos, near-torus " +
  "transition, and periodic limit cycle. Bishop parallel-transport tube and " +
  "poi head, ready for WebXR.";

function Body() {
  return (
    <>
      <p>
        In 1999 René Thomas introduced a family of cyclic systems as a
        vehicle for studying feedback loops in biological and physical
        networks. The simplest three-variable member is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ = sin(y) − b·x   ← x driven by its cyclic predecessor y; b damps it
ẏ = sin(z) − b·y   ← y driven by z; same structure by symmetry
ż = sin(x) − b·z   ← z driven by x; cycle closes`}
      </pre>
      <p>
        The cyclic permutation σ:(x,y,z)→(y,z,x) maps each equation to the
        next — the system is <em>equivariant</em> under C₃ rotation. Compare
        this with the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-cyclic-c3-symmetry-triple-scroll-rk4-bishop-tube-poi-webxr"
        >
          Halvorsen attractor
        </Link>
        , which shares the same C₃ symmetry but uses polynomial quadratic
        coupling (−y²). Thomas's sine replaces an unbounded polynomial with a
        bounded transcendental function — a structural choice that changes both
        the mathematics and the geometry of the attractor.
      </p>

      <h2>Why sine, not a polynomial?</h2>
      <p>
        Polynomial attractors (Lorenz: xy; Rössler: xz; Sprott: y²) are
        unbounded — the forcing grows without limit at large amplitude. A
        global strange attractor can still exist, but proving it requires a
        Lyapunov function showing that the flow eventually re-enters a bounded
        trapping region. Sine nonlinearity is different:{" "}
        <code>|sin(·)| ≤ 1</code> everywhere. For the Thomas system:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`d/dt (x² + y² + z²)/2 = x·sin(y) + y·sin(z) + z·sin(x) − b·(x²+y²+z²)
                      ≤ |x| + |y| + |z| − b·r²   (since |sin|≤1)
                      ≤ √3·r − b·r²               (by Cauchy–Schwarz)

This is negative once r > √3/b ≈ 8.3 for b=0.208 — attractor guaranteed
inside a ball of radius ≈ 8.3, without any additional assumptions.`}
      </pre>
      <p>
        Because the sine forcing saturates at 1, the system cannot have
        runaway trajectories for <em>any</em> b&gt;0. This is the{" "}
        <strong>labyrinthine chaos</strong> regime as b→0: the attractor
        swells to fill an ever-larger periodic lattice of cells, each
        cell looking locally like a Hamiltonian torus — topology-rich
        behaviour that polynomial systems cannot exhibit in the same way.
      </p>

      <h2>Fixed-point analysis and the Shilnikov mechanism</h2>
      <p>
        The Jacobian of the Thomas system at any fixed point
        P=(x*,y*,z*) is a circulant matrix:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`J = [[ −b,   cos(y*),  0      ],
     [  0,   −b,       cos(z*) ],
     [ cos(x*),  0,   −b      ]]

Circulant eigenvalues (generating row [c₀, c₁, c₂], ω = exp(2πi/3)):
  λ_k = c₀ + c₁·ω^k + c₂·ω^(2k),  k = 0, 1, 2`}
      </pre>
      <p>
        <strong>At the origin P₀=(0,0,0):</strong> cos(0)=1, so the
        generating row is [−b, 1, 0]:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`λ₀ = −b + 1 = 0.792                       real POSITIVE → unstable
λ₁,₂ = −b − ½ ± i√3/2 = −0.708 ± 0.866i  stable spiral (negative real part)

Saddle-focus, Shilnikov condition: |Re(λ₁,₂)|=0.708 > λ₀=0.792?  NO.
P₀ is NOT the Shilnikov source — it is a conventional saddle-focus.`}
      </pre>
      <p>
        <strong>At the symmetric fixed points P±=(x*,x*,x*):</strong>{" "}
        where sin(x*)/x*=b, so x*≈±2.661 for b=0.208, cos(x*)≈−0.878:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Generating row: [−b, cos(x*), 0] = [−0.208, −0.878, 0]

λ₀ = −0.208 + (−0.878) = −1.086          stable real (strong attracting)
λ₁,₂ = −0.208 + 0.439 ± i·0.760 = +0.231 ± 0.760i   UNSTABLE spiral

Shilnikov: |λ₀|=1.086 > Re(λ₁,₂)=0.231  ✓  Condition MET
→ Guaranteed spiral chaos around each P±.`}
      </pre>
      <p>
        This is the same Shilnikov mechanism that drives the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr"
        >
          Shimizu–Morioka laser attractor
        </Link>{" "}
        and{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-h-attractor-1994-five-term-z-squared-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr"
        >
          Sprott H
        </Link>
        . Here the Shilnikov fixed points are at P± rather than at the
        origin — the orbit spends most of its time winding around these
        off-centre points, making the attractor look like a single scroll
        with two interleaved winding regions.
      </p>

      <h2>Divergence and Liouville check</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`∇·F = ∂(sin y − bx)/∂x + ∂(sin z − by)/∂y + ∂(sin x − bz)/∂z
     = −b + (−b) + (−b) = −3b   CONSTANT (position-independent)

For b=0.208: ∇·F = −0.624
Liouville: sum of Lyapunov exponents = λ₁+λ₂+λ₃ ≈ +0.037+0.000+(−0.661) = −0.624  ✓`}
      </pre>
      <p>
        The constant divergence puts Thomas's system in the same structural
        class as Lorenz (∇·F=−41/3), Halvorsen (∇·F=−3a), and May-Leonard —
        dissipation is uniform throughout phase space, unlike the
        position-dependent ∇·F of the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-aizawa-attractor-langford-1984-torus-wrapping-bishop-tube-poi-webxr"
        >
          Aizawa (Langford) attractor
        </Link>
        .
      </p>

      <h2>Shape-key bifurcation tour</h2>
      <p>
        Four shape keys sweep across b, letting you watch the attractor
        change topology in real time:
      </p>
      <ul>
        <li>
          <strong>Basis (b=0.208):</strong> canonical single-lobe chaos;
          λ₁≈+0.037, D_KY≈2.056. The orbit visits P+ and P− in a
          seemingly random sequence but always returns.
        </li>
        <li>
          <strong>SK_LowB (b=0.17):</strong> stronger chaos, ∇·F=−0.51,
          wider orbit. The Shilnikov saddle-focus eigenvalues shift:
          Re(λ₁,₂) drops toward zero, so the orbit unwinds into broader spirals.
        </li>
        <li>
          <strong>SK_NearTorus (b=0.22):</strong> approaching the chaos
          → quasiperiodic torus transition. The attractor begins to
          flatten — Poincaré cross-sections show a ring rather than a
          solid region, a hallmark of incipient torus birth.
        </li>
        <li>
          <strong>SK_Periodic (b=0.30):</strong> past the bifurcation
          into a limit cycle. The tube collapses to a closed loop
          around P+ (or P−); both wings are now stable.
        </li>
      </ul>

      <h2>Blueprint walkthrough</h2>
      <p>
        The script follows five steps:
      </p>
      <ol>
        <li>
          <strong>RK4 integration</strong> with DT=0.05. Sine forcing is
          smooth and bounded — the RK4 truncation error is proportional to
          DT⁴·f⁽⁴⁾, which for sin is controlled by its own derivatives
          (all bounded by 1). Compare the larger DT used here with DT=0.01
          needed for polynomial attractors like{" "}
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr"
          >
            Sprott A
          </Link>
          , where DT=0.05 would overstep.
        </li>
        <li>
          <strong>Burn-in of 2000 steps</strong> (100 time units). Starting
          near the origin, the orbit escapes the P₀ unstable manifold and
          settles onto the Shilnikov attractor around P± within about 50
          time units.
        </li>
        <li>
          <strong>Thinning</strong> to 3000 waypoints (every 30th step).
          3000 rings × 8 radial segments = 24 000 vertices — a mesh size
          that exports under Draco level 6 in roughly 0.4 MB GLB.
        </li>
        <li>
          <strong>Bishop parallel-transport frames</strong> for the tube
          cross-section. The Thomas attractor has very low curvature near
          the P± winding zones; Bishop frames avoid the Frenet torsion
          artifact (tube flipping) that would appear at inflection points.
        </li>
        <li>
          <strong>Thomas_Speed FLOAT_COLOR</strong> — instantaneous speed
          ‖ṡ‖ normalised to [0,1] and mapped to a cobalt–amber ramp.
          Near-P± regions (slow winding) appear cobalt; near-origin passages
          (fast transits) appear amber.
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Orbit escapes to infinity for very small b:</strong>{" "}
          for b&lt;0.05 the burn-in point (0.1, 0, 0) may lie in the
          labyrinthine chaos basin that explores large x,y,z values. Increase
          BURN_IN to 5000 or reduce DT to 0.02.
        </li>
        <li>
          <strong>SK_Periodic orbit is not closed:</strong> for b=0.30
          the limit cycle period is long (~140 time units); increase N_STEPS
          to 150 000 or reduce THIN to 20 to capture the full loop.
        </li>
        <li>
          <strong>Speed colour appears uniform:</strong> check that{" "}
          <code>Thomas_Speed</code> is set as the active attribute in
          Mesh → Attributes. In Workbench, set Colour Type to Vertex.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Thomas R (1999). "Deterministic chaos seen in terms of feedback
          circuits: Analysis, synthesis, 'labyrinthine' chaos."
          <em> Int. J. Bifurc. Chaos</em> 9(10):1889–1905.
          DOI{" "}
          <a
            className={lk}
            href="https://doi.org/10.1142/S0218127499001383"
            target="_blank"
            rel="noreferrer"
          >
            10.1142/S0218127499001383
          </a>
          {" "}— original paper; equations are public-domain mathematical facts
          (CC0 equivalent).
        </li>
        <li>
          Gilpin W (2021–2024). <em>dysts: Dynamical Systems Benchmarks.</em>{" "}
          MIT licence.{" "}
          <a
            className={lk}
            href="https://github.com/williamgilpin/dysts"
            target="_blank"
            rel="noreferrer"
          >
            github.com/williamgilpin/dysts
          </a>
          {" "}— Python reference implementation of Thomas system with validated
          Lyapunov data. Related: github.com/williamgilpin/fnn (false
          nearest-neighbour dimension estimation).
        </li>
        <li>
          Bishop RL (1975). "There is more than one way to frame a curve."
          <em> Amer. Math. Monthly</em> 82(3):246–251.
          DOI{" "}
          <a
            className={lk}
            href="https://doi.org/10.2307/2311093"
            target="_blank"
            rel="noreferrer"
          >
            10.2307/2311093
          </a>
          {" "}— original Bishop frame paper; public domain.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
    slug: SLUG,
    title: TITLE,
    lede: LEDE,
    date: "2026-09-05",
    tags: [
      "blender",
      "python",
      "numpy",
      "chaos",
      "strange-attractor",
      "thomas",
      "cyclic-symmetry",
      "sine",
      "bishop-frames",
      "webxr",
      "glb",
    ],
    body: <Body />,
  });
