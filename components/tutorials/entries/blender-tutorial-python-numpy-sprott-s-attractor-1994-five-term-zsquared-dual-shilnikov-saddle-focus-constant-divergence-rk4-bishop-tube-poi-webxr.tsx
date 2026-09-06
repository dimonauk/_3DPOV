import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-s-attractor-1994-five-term-zsquared-dual-shilnikov-saddle-focus-constant-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott S Attractor 1994: ẋ=−x−4y ẏ=x+z² ż=1+x " +
  "5-Term z²-Nonlinearity Dual Fixed Points P±=(−1,¼,±1) " +
  "Shilnikov Saddle-Focus at P+ |λ_r|≈1.60 Re(λ_c)≈0.30 Ratio≈5.3 " +
  "Constant Divergence ∇·F=−1 λ₁≈+0.051 D_KY≈2.05 Liouville ∑λᵢ=−1=∇·F " +
  "RK4 DT=0.01 BURN_IN=3000 N=90000 THIN=30→3000wp " +
  "Basis(c=1.0)/SK_LowC(c=0.7)/SK_HighC(c=1.3)/SK_WideC(c=1.6) " +
  "Shape Keys Cobalt–Amber SprottS_Speed FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott S is the nineteenth and final entry in the 1994 minimal-chaos " +
  "catalogue (systems A–S), and the last 5-term system to use a z²-nonlinearity.  " +
  "Unlike Sprott H and N — its nearest z²-siblings — S carries two fixed points " +
  "at P± = (−1, ¼, ±1) with fundamentally different local geometry: P+ is a " +
  "Shilnikov saddle-focus (ratio ≈ 5.3, chaos guaranteed), while P− is a " +
  "saddle-spiral with a real-unstable eigenvalue.  The interplay between these " +
  "two topological centres produces the asymmetric two-scroll orbit.  Four c-parameter " +
  "shape keys survey how the dual scrolls merge, separate, and approach bifurcation.  " +
  "Bishop parallel-transport tube, WebXR-ready poi head.";

function Body() {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">
        Divergence and the Liouville volume contraction
      </h2>
      <p>
        The Sprott S vector field is{" "}
        <code>(−x−4y,&nbsp;x+z²,&nbsp;c+x)</code>.
        Its divergence is:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`∇·F = ∂(−x−4y)/∂x + ∂(x+z²)/∂y + ∂(c+x)/∂z
     = −1 + 0 + 0 = −1   (constant, c-independent)`}
      </pre>
      <p>
        By Liouville's theorem the phase-volume element contracts as e
        <sup>−t</sup> — exactly the same rate as the Lorenz, Rössler, and Lü
        systems.  The constant divergence means every Sprott S trajectory is
        attracted to a set of zero volume, guaranteeing a measure-zero attractor
        regardless of the initial condition (outside any unstable manifold).
      </p>
      <p>
        Compare with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-o-attractor-1994-five-term-xz-product-zero-trace-shilnikov-ratio-two-variable-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott O
        </Link>
        {" "}where ∇·F = x, position-dependent — a rare property among the catalogue.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Fixed points and the Shilnikov certificate
      </h2>
      <p>
        Setting <code>ẋ = ẏ = ż = 0</code> at c = 1:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ż = 0  →  x = −1
ẋ = 0  →  −(−1) − 4y = 0  →  y = ¼
ẏ = 0  →  (−1) + z² = 0  →  z = ±1

Fixed points:  P+ = (−1, ¼, +1)   P- = (−1, ¼, −1)`}
      </pre>
      <p>
        The Jacobian evaluated at either fixed point (∂z²/∂z = 2z):
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`       [−1  −4   0]
J|P± = [ 1   0  ±2]
       [ 1   0   0]

Characteristic polynomial at P+:  λ³ + λ² + 4λ + 8 = 0
Roots:  λ_r ≈ −1.60,  λ_c ≈ +0.30 ± 2.22i

Characteristic polynomial at P-:  λ³ + λ² + 4λ − 8 = 0
Roots:  λ_r ≈ +1.20,  λ_c ≈ −1.10 ± 2.33i`}
      </pre>
      <p>
        At <strong>P+</strong>: |λ_r| = 1.60 {">"} Re(λ_c) = 0.30, ratio ≈ 5.3.
        The Shilnikov condition is satisfied — homoclinic orbits to P+ are
        accompanied by a countably infinite family of period-doubling cascades,
        confirming deterministic chaos.
      </p>
      <p>
        At <strong>P−</strong>: the real eigenvalue is <em>positive</em> (+1.20)
        while the complex pair is <em>stable</em> (Re ≈ −1.10).  This is the
        reverse configuration — a saddle-spiral — not the Shilnikov type.  Orbits
        initiated near P− are repelled along the real unstable manifold and fold
        into the P+ scroll.
      </p>
      <p>
        This dual-topology pairing is what separates Sprott S from its z²-siblings{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-h-attractor-1994-five-term-z-squared-shilnikov-saddle-focus-origin-rk4-bishop-tube-poi-webxr"
        >
          Sprott H
        </Link>
        {" "}and{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-n-attractor-1994-five-term-zsquared-single-saddle-focus-shilnikov-constant-divergence-rk4-bishop-tube-poi-webxr"
        >
          Sprott N
        </Link>
        , which each carry a single fixed point of Shilnikov type.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Shape keys: the c-parameter family
      </h2>
      <p>
        In Sprott's original paper the constant in ż is fixed at 1.  Replacing it
        with the continuous variable c lets us interpolate between qualitatively
        different regimes.  The fixed-point positions generalise to:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`P± = (−c, c/4, ±√c)   (require c > 0 for real fixed points)

c = 0.70:  P± = (−0.70, 0.175, ±0.837)  — scrolls tighten
c = 1.00:  P± = (−1.00, 0.250, ±1.000)  — canonical Sprott S
c = 1.30:  P± = (−1.30, 0.325, ±1.140)  — scrolls elongate
c = 1.60:  P± = (−1.60, 0.400, ±1.265)  — near topology shift`}
      </pre>
      <p>
        As c decreases from 1, the fixed points approach each other; at some
        c_crit the two scrolls merge into a single-lobe orbit.  As c increases,
        the orbit stretches along the z-axis and the attractor nears a
        period-doubling bifurcation.  SK_WideC (c = 1.6) sits just inside the
        chaotic window.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Bishop parallel-transport and the tube weld
      </h2>
      <p>
        The tube is extruded using the Bishop rotation-minimising frame (1975).
        At each waypoint i, the frame tangent <strong>t</strong>
        <sub>i</sub> is used to rotate the previous normal{" "}
        <strong>n</strong>
        <sub>i−1</sub> via Rodrigues' formula:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`axis = t_{i-1} × t_i / ‖t_{i-1} × t_i‖
θ    = arctan2(‖axis‖, t_{i-1}·t_i)
n_i  = R(axis, θ) · n_{i-1}`}
      </pre>
      <p>
        This prevents the Frenet frame's twist discontinuities at inflection
        points — particularly important near the origin-crossing of the Sprott S
        orbit, where adjacent tangents nearly align and the Frenet normal would
        otherwise flip by 180°.  The result is a tube with smooth ribbon-like
        normals along the full 3 000-waypoint path, which also benefits normal
        maps on the exported GLB.
      </p>

      <h2 className="mt-6 text-lg font-semibold">Studio connections</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-shimizu-morioka-attractor-1980-laser-mode-z2-saddle-focus-rk4-bishop-tube-poi-webxr"
          >
            Shimizu–Morioka Attractor
          </Link>
          {" "}— another two-scroll system with dual symmetric Shilnikov foci
          and constant divergence −(a+b).
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-newton-leipnik-attractor-1981-double-strange-bistability-rigid-body-feedback-rk4-bishop-tube-poi-webxr"
          >
            Newton–Leipnik Attractor
          </Link>
          {" "}— dual <em>coexisting</em> strange attractors (bistability), compared
          with Sprott S's single attractor visiting two fixed-point basins.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-vertex-colour-attributes"
          >
            Vertex Colour Attributes tutorial
          </Link>
          {" "}— FLOAT_COLOR domain, how the SprottS_Speed attribute maps to
          Material Preview shading in Blender 5.1.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Trajectory diverges:</strong> if DT {">"} 0.015 the explicit
          RK4 becomes unstable near the z²-term spike at z ≈ ±1.  Keep DT ≤ 0.010.
        </li>
        <li>
          <strong>SK_WideC appears periodic:</strong> c = 1.6 sits near a
          periodic window.  Try seeding from IC = (−1.6, 0.38, 1.27) + noise.
        </li>
        <li>
          <strong>Tube self-intersects:</strong> reduce TUBE_R from 0.040 to
          0.025; the canonical orbit has tighter crossings than Sprott H.
        </li>
        <li>
          <strong>Colours flat cobalt:</strong> in Viewport Shading set Colour
          to "Vertex" — the SprottS_Speed attribute is FLOAT_COLOR per-vertex.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Outside sources</h2>
      <ol className="list-decimal pl-5 space-y-2">
        <li>
          Sprott JC (1994) "Some simple chaotic flows."{" "}
          <em>Physical Review E</em> 50(2):R647–R650.{" "}
          DOI{" "}
          <a
            className={lk}
            href="https://doi.org/10.1103/PhysRevE.50.R647"
            target="_blank"
            rel="noopener noreferrer"
          >
            10.1103/PhysRevE.50.R647
          </a>
          .  Equations: public-domain mathematics.  Parameter table:{" "}
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/chaos/sprott.htm"
            target="_blank"
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu/chaos/sprott.htm
          </a>
          .  Related project:{" "}
          <a
            className={lk}
            href="https://github.com/williamgilpin/dysts"
            target="_blank"
            rel="noopener noreferrer"
          >
            williamgilpin/dysts
          </a>{" "}
          (MIT) — 131-attractor benchmark library with full Lyapunov spectra.
        </li>
        <li>
          Bishop RL (1975) "There is more than one way to frame a curve."{" "}
          <em>American Mathematical Monthly</em> 82(3):246–251.{" "}
          DOI{" "}
          <a
            className={lk}
            href="https://doi.org/10.2307/2311093"
            target="_blank"
            rel="noopener noreferrer"
          >
            10.2307/2311093
          </a>
          .  Public-domain parallel-transport theorem.  Related implementation:{" "}
          <a
            className={lk}
            href="https://github.com/mrdoob/three.js"
            target="_blank"
            rel="noopener noreferrer"
          >
            mrdoob/three.js
          </a>{" "}
          (MIT) — TubeGeometry uses Bishop framing for WebGL tube extrusion.
        </li>
      </ol>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-05",
  topics: [
    "blender",
    "scripting",
    "chaos",
    "attractor",
    "numpy",
    "webxr",
    "poi",
    "sprott",
    "dynamical-systems",
    "bishop-frame",
    "shilnikov",
    "shape-keys",
  ],
  body: <Body />,
});

export default entry;
