import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-l-attractor-1994-quadratic-rectifying-x-squared-single-saddle-focus-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott L Attractor 1994: ẋ=y+3.9z ẏ=0.9x²−y ż=1−x " +
  "5-Term x²-Rectifying Nonlinearity Single Shilnikov Saddle-Focus " +
  "P*=(1,0.9,−0.231) λ_r≈−1.47 λ_c≈+0.235±1.61i |λ_r|>Re(λ_c) ✓ " +
  "Constant Divergence ∇·F=−1 λ₁≈+0.063 D_KY≈2.059 Liouville ∑λᵢ=−1=∇·F " +
  "RK4 DT=0.01 BURN_IN=3000 N=90000 THIN=30→3000wp Bishop Parallel-Transport " +
  "Basis(a=3.9,b=0.9 canonical)/SK_HighA(a=5.0 wider spiral)/" +
  "SK_LowB(b=0.6 near-bifurcation)/SK_Compact(a=2.8,b=1.1 tighter) " +
  "Shape Keys Cobalt–Amber SprottL_Speed FLOAT_COLOR Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott L achieves bounded chaos with only five terms and a single " +
  "x²-rectifying nonlinearity: the squared term is always non-negative, " +
  "perpetually injecting energy regardless of the sign of x. " +
  "The system's unique fixed point is a Shilnikov saddle-focus — one " +
  "stable real eigenvalue (≈ −1.47) and one unstable complex pair " +
  "(≈ +0.235 ± 1.61i) — and because the stable modulus exceeds the " +
  "unstable real part, Shilnikov's 1965 theorem guarantees genuine chaos.";

function Body() {
  return (
    <>
      <p>
        In 1994 Julien Clinton Sprott enumerated all three-variable autonomous
        polynomial ODEs with at most six terms and at most two quadratic
        nonlinearities, integrated each one, and identified nineteen that produce
        genuine bounded chaos.  The studio already holds{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr">
          System A (conservative, no equilibria)
        </Link>
        ,{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr">
          System B (two quadratic terms, constant dissipation)
        </Link>
        , and{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-e-attractor-1994-minimal-chaos-saddle-centre-single-fixed-point-rk4-bishop-tube-poi-webxr">
          System E (saddle-centre eigenvalues, Hamiltonian-like structure)
        </Link>
        .  System L is the fourth member of the Holoflow Sprott collection, and
        the most physically transparent: its nonlinearity is a simple squarer.
      </p>

      <h2>The equations</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ = y + a·z           (a = 3.9 canonical)
ẏ = b·x² − y          (b = 0.9 canonical)
ż = 1 − x

∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z = 0 + (−1) + 0 = −1  (constant)
Liouville:  λ₁ + λ₂ + λ₃ = −1  (exact, verified numerically)`}
      </pre>

      <h2>Why x² is a rectifying nonlinearity</h2>
      <p>
        The term <code>b·x²</code> in <code>ẏ</code> is always non-negative
        — it injects energy into the y direction regardless of the sign of x.
        This is qualitatively different from the linear terms in Lorenz
        (ẋ = σ(y−x)), where the sign of x matters, and from the cubic terms
        in the Arneodo attractor (ẍ + aẋ − bx + cx³ = 0), where the
        nonlinearity changes sign.  In Sprott L the quadratic acts as a
        one-way valve: x can be positive or negative, but x² is always
        pushing y upward.  The balancing dissipation <code>−y</code> prevents
        y from diverging.  Together they form a self-sustaining energy cycle
        that the z-drive (<code>ż = 1−x</code>) modulates at a slow
        characteristic frequency.
      </p>

      <h2>The fixed point and Shilnikov's theorem</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`From  ż = 0 → x = 1
From  ẏ = 0 → y = b·1² = b = 0.9
From  ẋ = 0 → y + a·z = 0 → z = −b/a = −0.9/3.9 ≈ −0.231

P* = (1,  0.9,  −3/13)   (unique fixed point)

Jacobian at P*:
J = [[ 0,    1,   a  ],     = [[ 0,    1,   3.9],
     [2b,   −1,   0  ],        [ 1.8, −1,   0  ],
     [−1,   0,   0  ]]         [−1,   0,   0  ]]

Characteristic polynomial:  λ³ + λ² + (a − 2b)·… ≈ λ³ + λ² + 2.1λ + 3.9 = 0

Eigenvalues:
  λ_r  ≈ −1.47               (real, stable)
  λ_c  ≈ +0.235 ± 1.61i      (complex, unstable spiral)

Shilnikov condition:  |λ_r| = 1.47  >  Re(λ_c) = 0.235   ✓
→ Guaranteed horseshoe-type chaos near any homoclinic orbit through P*.`}
      </pre>

      <p>
        The Shilnikov condition is the key insight: the stable manifold
        contracts faster than the unstable manifold expands.  An orbit that
        approaches P* along the real eigenvector is re-ejected into an
        expanding spiral, which folds back, approaches P* again, and repeats
        — each return map contains a Smale horseshoe, hence infinitely many
        unstable periodic orbits of arbitrarily high period.  Compare this
        with the Rössler mechanism:{" "}
        <Link className={lk}
          href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr">
          Rössler (1976)
        </Link>{" "}
        relies on the same Shilnikov condition at a different set of
        eigenvalues, producing a qualitatively similar single-scroll but
        with a very different shape.
      </p>

      <h2>Colour attribute: speed reveals the saddle-focus</h2>
      <p>
        The <code>SprottL_Speed</code> FLOAT_COLOR attribute maps
        <code>|ẋ|</code> (the velocity magnitude along the orbit) from
        cobalt (slow) to amber (fast).  Near P* the orbit moves slowly
        — it is being attracted along the stable eigenvector while the
        unstable complex plane slowly spirals it outward.  This region
        appears as a warm amber cluster surrounded by cobalt fast-passages.
        The colour therefore acts as a direct visualisation of the
        Shilnikov mechanism: the amber blob is where chaos is generated.
      </p>

      <h2>Blueprint walkthrough</h2>
      <p>
        The integration is a straightforward RK4 loop (DT = 0.01,
        BURN_IN = 3 000, N_STEPS = 90 000, THIN = 30 → 3 000 waypoints).
        Bishop parallel-transport framing (Bishop 1975) avoids the
        Frenet-Serret undefined-curvature problem at inflection points —
        critical here because the orbit passes through near-linear segments
        when it re-approaches the saddle-focus.  The tube has 8 sides
        and radius 0.055 m; the poi head sphere sits at the mesh origin
        with radius 0.085 m.
      </p>
      <p>
        Each of the four shape keys runs a completely independent
        integration at its own (a, b) values.  The orbit is NOT scaled
        between keys — position coordinates are in world space metres,
        so the viewer can see genuine topological change rather than
        a uniform rescaling.
      </p>

      <h2>Shape key parameter guide</h2>
      <ul>
        <li>
          <strong>Basis</strong> (a=3.9, b=0.9) — canonical single-scroll.
          Shilnikov eigenvalues as computed above.
        </li>
        <li>
          <strong>SK_HighA</strong> (a=5.0, b=0.9) — increasing a strengthens
          the z-coupling in ẋ.  The imaginary part of λ_c increases, meaning
          the unstable spiral rotates faster before being reinjected.  The
          orbit fills a larger volume.
        </li>
        <li>
          <strong>SK_LowB</strong> (a=3.9, b=0.6) — reducing b weakens the
          rectifying injection.  The fixed point shifts to y=0.6 and the
          orbit begins approaching a period-doubling cascade boundary.
        </li>
        <li>
          <strong>SK_Compact</strong> (a=2.8, b=1.1) — higher b with lower a.
          Stronger injection compensated by weaker z-coupling yields a
          denser, more compact scroll.
        </li>
      </ul>

      <h2>Related studio tutorials</h2>
      <ul>
        <li>
          <Link className={lk}
            href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr">
            Genesio–Tesi (1992) — jerk chaos, quadratic nonlinearity, dual equilibria
          </Link>
        </li>
        <li>
          <Link className={lk}
            href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr">
            Shimizu–Morioka (1980) — Z₂-symmetric saddle-focus, laser mode chaos
          </Link>
        </li>
        <li>
          <Link className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr">
            Sprott A — conservative chaos, KAM tori, no equilibria
          </Link>
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          Sprott JC (1994){" "}
          <em>Some simple chaotic flows.</em>{" "}
          <em>Phys Rev E</em> 50(2):R647–R650.{" "}
          <a className={lk}
            href="https://doi.org/10.1103/PhysRevE.50.R647"
            target="_blank" rel="noopener noreferrer">
            DOI 10.1103/PhysRevE.50.R647
          </a>
          {" "}— PD mathematics; Sprott's companion atlas at{" "}
          <a className={lk}
            href="https://sprott.physics.wisc.edu/chaos/"
            target="_blank" rel="noopener noreferrer">
            sprott.physics.wisc.edu/chaos
          </a>{" "}
          (permissive educational).  Related: Sprott's 2010 book{" "}
          <em>Elegant Chaos</em>{" "}(World Scientific) with full parameter
          survey and C source for all 19 minimal systems.
        </li>
        <li>
          Gilpin W (2021–2024){" "}
          <em>dysts — Dynamical Systems Benchmarks.</em>{" "}
          MIT.{" "}
          <a className={lk}
            href="https://github.com/williamgilpin/dysts"
            target="_blank" rel="noopener noreferrer">
            github.com/williamgilpin/dysts
          </a>
          {" "}— 131 chaotic systems with Lyapunov spectra and attractor
          statistics; Sprott L is entry <code>SprottL</code>.  Related:
          Gilpin W (2021) <em>Chaos as an interpretable benchmark for
          forecasting and data-driven modelling</em>; NeurIPS Datasets &
          Benchmarks.
        </li>
      </ul>
    </>
  );
}

const instructable = buildInstructable({
  libSlug:
    "python-numpy-sprott-l-attractor-1994-quadratic-rectifying-x-squared-single-saddle-focus-rk4-bishop-tube-poi-webxr",
  topic: "scripting",
  blenderVersion: "5.1",
  licence: "CC0",
  files: ["blueprint.py", "record.py", "SCREEN-RECORDING-NOTES.md"],
});

export const entry: Entry = {
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-03",
  tags: [
    "blender",
    "python",
    "numpy",
    "scripting",
    "chaos",
    "attractor",
    "sprott",
    "dynamical-systems",
    "bishop-tube",
    "poi",
    "webxr",
    "shilnikov",
    "saddle-focus",
    "minimal-chaos",
    "rectifying-nonlinearity",
  ],
  body: Body,
  instructable,
};
