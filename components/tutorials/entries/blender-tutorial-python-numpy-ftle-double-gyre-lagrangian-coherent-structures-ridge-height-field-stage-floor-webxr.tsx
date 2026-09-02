import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-ftle-double-gyre-lagrangian-coherent-structures-ridge-height-field-stage-floor-webxr";

const TITLE =
  "Python numpy — FTLE / Lagrangian Coherent Structures: " +
  "Double-Gyre Transport Barrier, Cauchy-Green Strain, " +
  "Ridge Height-Field Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "The Finite-Time Lyapunov Exponent (FTLE) field is the workhorse diagnostic " +
  "of Lagrangian fluid mechanics: seed particles on a grid, integrate them " +
  "forward (or backward) in time, measure how far apart they end up, and " +
  "the logarithm of that stretching — normalised by integration duration — " +
  "gives you a scalar field whose ridges are Lagrangian Coherent Structures.  " +
  "This blueprint applies that pipeline to Shadden, Lekien & Marsden's " +
  "(2005) canonical double-gyre test case — two counter-rotating gyres whose " +
  "shared boundary oscillates, generating a chaotic transport zone — and " +
  "visualises the result as a 120×60 stage-floor height-field with four " +
  "shape keys spanning forward/backward integration and two parameter variants.  " +
  "Ridges glow amber against the cobalt gyre bodies.";

function Body() {
  return (
    <>
      <p>
        Pull a leaf from a stream and watch it drift.  If it started near
        the mid-channel — between the leftward gyre on one side and the
        rightward gyre on the other — it is trapped in a corridor that
        neither gyre can quite capture.  If it started just a centimetre
        to one side, it spirals into that gyre and stays there for many
        periods.  That invisible boundary separating the two fates is a{" "}
        <em>Lagrangian Coherent Structure</em>, and the FTLE field is how
        you find it without knowing the boundary in advance.
      </p>

      <h2>The double-gyre flow</h2>
      <p>
        Shadden, Lekien & Marsden (2005){" "}
        <a
          href="https://doi.org/10.1016/j.physd.2005.10.007"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Physica D 212:271–304
        </a>{" "}
        defined the double gyre via a stream function on{" "}
        <code>[0,2] × [0,1]</code>:
      </p>
      <pre className="text-xs overflow-x-auto bg-black/30 rounded p-3">
{`ψ(x,y,t) = A · sin(π·f) · sin(π·y)
f(x,t)   = ε·sin(ωt)·x² + (1 − 2ε·sin(ωt))·x
u = −∂ψ/∂y = −πA·sin(πf)·cos(πy)
v = +∂ψ/∂x = +πA·cos(πf)·sin(πy)·f′
f′ = 2ε·sin(ωt)·x + (1 − 2ε·sin(ωt))`}
      </pre>
      <p>
        At <code>ε = 0</code> the boundary between the gyres at{" "}
        <code>x = 1</code> is an exact heteroclinic orbit — a perfect
        transport barrier.  At <code>ε &gt; 0</code> the boundary
        oscillates with period <code>T = 2π/ω = 10</code>, breaking the
        orbit into a homoclinic tangle (Aref 1984) and generating a chaotic
        zone from which fluid slowly leaks between gyres via lobes.
      </p>

      <h2>The FTLE computation</h2>
      <p>
        The blueprint seeds <strong>120 × 60 tracer particles</strong> on
        a regular grid and integrates them using 4th-order Runge–Kutta with{" "}
        <code>Δt = 0.025</code>.  At each interior grid point, the
        deformation gradient{" "}
        <code>F = ∂(x<sub>f</sub>, y<sub>f</sub>)/∂(x₀, y₀)</code> is
        approximated by central differences of the final particle
        positions:
      </p>
      <pre className="text-xs overflow-x-auto bg-black/30 rounded p-3">
{`Fxx = (Xf[i+1,j] − Xf[i−1,j]) / (2·Δx)
Fxy = (Xf[i,j+1] − Xf[i,j−1]) / (2·Δy)
Fyx = (Yf[i+1,j] − Yf[i−1,j]) / (2·Δx)
Fyy = (Yf[i,j+1] − Yf[i,j−1]) / (2·Δy)

C   = FᵀF   (symmetric Cauchy-Green tensor)
λ₁ ≥ λ₂ = eigenvalues of C

FTLE = log(√λ₁) / (2·|T_int|)`}
      </pre>
      <p>
        Because C is 2 × 2, <code>λ₁</code> has a closed-form expression:{" "}
        <code>tr(C)/2 + √((tr(C)/2)² − det(C))</code>.  This avoids the
        overhead of a numerical eigensolver for each of the 7 200 grid
        points.
      </p>

      <h2>Shape keys: four transport regimes</h2>
      <ul>
        <li>
          <strong>Basis</strong> — forward FTLE, <code>ε=0.10, T=+10</code>.
          The canonical ridge appears in the mid-channel.  Amber peaks mark
          the repelling LCS; cobalt valleys are gyre interiors where
          neighbouring particles stay close.
        </li>
        <li>
          <strong>SK_Bwd</strong> — backward FTLE, <code>T=−10</code>.  Now
          the attracting LCS appears: the lobe boundaries along which fluid
          folds and stretches as it enters or exits the gyres.
        </li>
        <li>
          <strong>SK_HiEps</strong> — <code>ε=0.25</code>, stronger
          oscillation.  The chaotic zone widens and the ridge broadens,
          spanning roughly 30 % of the domain width instead of 10 %.
        </li>
        <li>
          <strong>SK_LongT</strong> — <code>T=+20</code>, double integration
          window.  Material lines have more time to stretch; the FTLE
          resolves finer filament structure that is invisible at T=10.
        </li>
      </ul>

      <h2>Blender 5.1 mesh construction</h2>
      <p>
        Each FTLE field is a separate NumPy array of shape{" "}
        <code>(120, 60)</code>.  A BMesh is seeded in row-major order
        (i outer, j inner), placing vertices at
        <code>(xᵢ, yⱼ, FTLE[i,j] × 2.0)</code> metres.  Faces are
        right-hand-wound quads: <code>(i,j)→(i+1,j)→(i+1,j+1)→(i,j+1)</code>,
        giving outward-pointing normals in +Z.  A <code>FLOAT_COLOR</code>{" "}
        per-point attribute maps normalised FTLE linearly from cobalt at 0
        to amber at 1.
      </p>
      <p>
        After building the Basis mesh, each subsequent FTLE is applied as a
        shape key by setting{" "}
        <code>key_block.data[idx].co = (xᵢ, yⱼ, FTLE[i,j]·HEIGHT_SC)</code>.
        The export flags{" "}
        <code>export_morph=True, export_colors=True</code> preserve both in
        the GLB, so the stage floor arrives in WebXR with all four transport
        regimes accessible as morph targets.
      </p>

      <h2>Holoflow export notes</h2>
      <p>
        The object carries the custom properties{" "}
        <code>holoflow:facet=False</code> (height-field is smooth, not
        faceted) and <code>holoflow:category=stage-floor</code>.  Before
        GLB export the mesh receives a <code>−90°</code> X-rotation to flip
        from Blender's +Z-up to WebXR's +Y-up convention, applied with{" "}
        <code>transform_apply(rotation=True)</code> so the GLB root is
        orientation-neutral.
      </p>

      <h2>Cross-references</h2>
      <ul>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-rayleigh-taylor-instability-2d-boussinesq-vorticity-streamfunction-spectral-height-field-stage-floor-webxr" className={lk}>
            Rayleigh–Taylor Instability stage floor
          </Link>{" "}
          — another fluid-mechanics 2D height-field; compare pseudo-spectral
          vorticity with particle-tracking FTLE as diagnostic strategies.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-clifford-attractor-pickover-discrete-2d-map-fractal-density-stage-floor-webxr" className={lk}>
            Clifford Attractor density floor
          </Link>{" "}
          — orbit-density versus stretching-rate as competing ways to reveal
          2D dynamical structure.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting" className={lk}>
            SPH Fluid simulation (Geometry Nodes)
          </Link>{" "}
          — Lagrangian particle approach from the simulation side; FTLE is its
          diagnostic counterpart.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-zaslavsky-stochastic-web-kicked-oscillator-qfold-quasicrystal-stage-floor-webxr" className={lk}>
            Zaslavsky Stochastic Web floor
          </Link>{" "}
          — another symplectic transport diagnostic in a 2D phase plane,
          contrasting with the dissipative FTLE approach here.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Shadden, Lekien & Marsden 2005</strong> —{" "}
          <a href="https://doi.org/10.1016/j.physd.2005.10.007" className={lk} target="_blank" rel="noopener noreferrer">
            Physica D 212:271–304
          </a>.  Defines the double-gyre benchmark and proves that FTLE ridges
          have an error that diminishes with integration time.  Preprint PDF
          freely available at{" "}
          <a href="https://shaddenlab.berkeley.edu/uploads/LCS-theory.pdf" className={lk} target="_blank" rel="noopener noreferrer">
            shaddenlab.berkeley.edu
          </a>.  Related repos:{" "}
          <a href="https://github.com/haller-group/LCS-Tool" className={lk} target="_blank" rel="noopener noreferrer">
            haller-group/LCS-Tool (BSD-2-Clause)
          </a>.
        </li>
        <li>
          <strong>Haller & Yuan 2000</strong> —{" "}
          <a href="https://doi.org/10.1016/S0167-2789(00)00142-1" className={lk} target="_blank" rel="noopener noreferrer">
            Physica D 147:352–370
          </a>.  Original paper defining LCS as invariant manifolds of the
          Cauchy-Green tensor; connects the ridges to Kolmogorov-scale mixing
          barriers.  Related:{" "}
          <a href="https://github.com/haller-group/geodesic-LCS-computation" className={lk} target="_blank" rel="noopener noreferrer">
            geodesic-LCS-computation (MIT)
          </a>.
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>FTLE field looks flat (all near zero)</strong> — check that{" "}
          <code>A = 0.10</code> and <code>EPS_STD = 0.10</code> are not
          accidentally zeroed.  At A=0 there is no flow; at ε=0 the FTLE is
          still non-zero (the steady gyres do stretch material lines) but the
          mid-channel ridge is absent.
        </li>
        <li>
          <strong>Border artefacts (ring of zeros)</strong> — normal.  The
          border row/column uses no central difference, so FTLE = 0 there.
          Crop the domain by 1 pixel or enlarge the grid.
        </li>
        <li>
          <strong>Script is slow</strong> — the RK4 loop is fully
          vectorised over the 7 200-particle grid; each step is a few NumPy
          operations.  400 steps × 4 stage evaluations = 1 600 array
          operations; expect 3–8 seconds per FTLE call on a modern CPU.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-02",
  topics: ["blender", "python", "numpy", "fluid-dynamics", "lcs", "ftle"],
  body: <Body />,
});
