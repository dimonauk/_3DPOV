import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-sprott-e-attractor-1994-minimal-chaos-saddle-centre-single-fixed-point-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Sprott E Attractor 1994: ẋ=yz ẏ=x²−y ż=1−αx " +
  "Saddle-Centre Eigenvalues −1 ±i/√α Unique Fixed Point P=(1/α,1/α²,0) " +
  "Constant Divergence ∇·F=−1 λ₁≈+0.053 D_KY≈2.050 Liouville ∑λᵢ=−1=∇·F " +
  "RK4 DT=0.01 BURN_IN=3000 N=90000 THIN=30→3000wp Bishop Parallel-Transport " +
  "Basis(α=4 canonical)/SK_Loose(α=3 broader)/SK_Tight(α=5 compressed)/" +
  "SK_Wide(α=2.5 near-onset) Shape Keys & Cobalt–Amber SprottE_Speed " +
  "FLOAT_COLOR Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Sprott E is one of nineteen minimal three-variable autonomous ODEs catalogued " +
  "by Julien Clinton Sprott in 1994; it achieves bounded chaos with only five terms " +
  "and one fixed point whose eigenvalues — one real stable and one purely imaginary " +
  "pair — form a saddle-centre, a structure normally associated with Hamiltonian " +
  "systems. The parameter α tunes the imaginary frequency 1/√α, directly controlling " +
  "how broadly the orbit fans around that fixed point.";

function Body() {
  return (
    <>
      <p>
        In 1994 Julien Clinton Sprott conducted what was at the time the most systematic
        computer search for minimal three-variable chaos: he enumerated every autonomous
        polynomial ODE with at most six terms and at most two quadratic nonlinearities,
        integrated each one, and identified exactly nineteen that sustain genuine bounded
        chaos.  The library already holds{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr"
        >
          System A (conservative, no equilibria)
        </Link>{" "}
        and{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr"
        >
          System B (six-term, constant divergence)
        </Link>
        .  System E is the third entry and the one with the richest fixed-point geometry
        of the three.
      </p>

      <h2>The equations</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = y · z
ẏ = x² − y
ż = 1 − α · x        (canonical α = 4)

Fixed point:   ẋ = 0 → y·z = 0.
               If z = 0: ẏ = 0 → x² = y; ż = 0 → x = 1/α.
               ∴ P = (1/α,  1/α²,  0)   — the unique fixed point.

Divergence:    ∇·F = ∂(yz)/∂x + ∂(x²−y)/∂y + ∂(1−αx)/∂z
                   = 0 + (−1) + 0 = −1    (constant, same as Sprott B)`}
      </pre>
      <p>
        The system has five terms — one fewer than Systems A and B — yet still sustains
        chaos.  Every bit of dissipation in the system flows through the single linear
        term −y in the second equation; remove it and the system ceases to contract
        phase-volume.
      </p>

      <h2>The saddle-centre fixed point</h2>
      <p>
        The Jacobian at P = (1/α, 1/α², 0) evaluates to:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`J(P) = [[ 0,    0,   1/α² ],
        [ 2/α, −1,    0   ],
        [−α,    0,    0   ]]

Characteristic polynomial:
  λ³ + λ² + (1/α)λ + 1/α = (λ + 1)(λ² + 1/α) = 0

Eigenvalues:
  λ₁ =  −1          (real, stable manifold)
  λ₂,₃ = ± i/√α    (purely imaginary pair)`}
      </pre>
      <p>
        A purely imaginary pair means the linear approximation at P is a{" "}
        <em>centre</em> in its own two-dimensional invariant plane: orbits initiated on
        that plane orbit P forever without spiralling in or out.  The real eigenvalue −1
        provides a stable manifold transverse to that plane.  In dynamical systems
        terminology this is a <em>saddle-centre</em> — a configuration far more common
        in Hamiltonian (energy-conserving) mechanics than in dissipative systems.
      </p>
      <p>
        What forces this into a strange attractor, despite the centre eigenvalues, is the
        global nonlinear coupling: the quadratic term x² in the second equation folds
        phase-space orbits back on themselves before they can complete one full revolution
        around P.  The result is a thin ribbon wound tightly around the fixed point,
        coloured cobalt at slow-moving bends and amber at fast-moving straights.
      </p>
      <p>
        Compare with{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr"
        >
          Genesio–Tesi (1992)
        </Link>
        {" "}which has saddle-<em>focus</em> fixed points (complex eigenvalues with
        non-zero real parts), and{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr"
        >
          Rössler (1976)
        </Link>
        {" "}whose single fixed point is also a saddle-focus but with a far larger
        imaginary part.  Sprott E sits at the boundary between conservative and
        dissipative topology.
      </p>

      <h2>The α-parameter family and shape keys</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`α controls the imaginary part  Im(λ) = 1/√α:

  Basis    α = 4.0 → Im = 1/2  = 0.500  (canonical: moderate oscillation)
  SK_Loose α = 3.0 → Im = 1/√3 ≈ 0.577  (slower spin → broader loops)
  SK_Tight α = 5.0 → Im = 1/√5 ≈ 0.447  (faster spin → compressed ribbon)
  SK_Wide  α = 2.5 → Im = 1/√2.5 ≈ 0.632 (near-onset, widest geometry)

Fixed point moves with α:  P = (1/α, 1/α², 0)
  α=4: P ≈ (0.250, 0.0625, 0)
  α=3: P ≈ (0.333, 0.111,  0)
  α=5: P = (0.200, 0.040,  0)
  α=2.5: P = (0.400, 0.160, 0)`}
      </pre>
      <p>
        A smaller α places P further from the origin and allows the orbit to fan wider;
        a larger α compresses everything.  The Lyapunov exponent λ₁ also shifts — the
        chaos is slightly more pronounced in the Basis configuration and weakens as α
        moves toward 2.5 (near the edge of the chaotic regime).
      </p>

      <h2>Blueprint walk-through</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# 1. Integrate  ─────────────────────────────────────────────────
pts = integrate(alpha=4, ic=(0,1,0), burn=3000, n=90000, thin=30)
# → 3000 waypoints, each scaled to fit in 1 m sphere

# 2. Arc-speed colour  ──────────────────────────────────────────
speeds = [ |ẏ(p)| for p in pts ]   # norm of vector field at each waypoint
# fast sections (where orbit accelerates away from P) → amber
# slow sections (where orbit lingers near P) → cobalt

# 3. Bishop parallel-transport tube  ────────────────────────────
# Central-difference tangents; seed normal via Gram-Schmidt;
# propagate frame along curve using rotation by cross-product axis.
# Produces a closed 8-gon tube, 3000 × 8 = 24 000 vertices.

# 4. Shape keys  ────────────────────────────────────────────────
# Repeat integration for α ∈ {3, 5, 2.5}, same N → same vertex count.
# Each new vertex buffer assigns directly to sk.data[vi].co.`}
      </pre>

      <h2>Troubleshooting</h2>
      <p>
        <strong>Tube has a sudden twist.</strong>  The Bishop frame propagates
        numerically; if two adjacent tangents are nearly anti-parallel (can happen at
        a tight fold), the Rodrigues rotation picks the wrong branch.  Fix: increase{" "}
        <code>THIN</code> slightly so adjacent waypoints are less tightly spaced.
      </p>
      <p>
        <strong>Shape key vertex count mismatch.</strong>  All four integrations must
        produce exactly <code>N_STEPS // THIN = 3000</code> waypoints.  If you change{" "}
        <code>N_STEPS</code> or <code>THIN</code>, do so consistently across all
        four runs before adding the first shape key.
      </p>
      <p>
        <strong>Attractor collapses to a line for SK_Wide (α=2.5).</strong>  Near
        the lower edge of the chaotic regime, the system can settle onto a periodic
        orbit for some initial conditions.  Try{" "}
        <code>ic=(0.1, 1.0, 0.1)</code> instead of{" "}
        <code>(0, 1, 0)</code> if this occurs.
      </p>

      <h2>WebXR export</h2>
      <p>
        The mesh is already scaled to a ≈0.10 m bounding sphere — standard for poi
        heads in this library.  Export via{" "}
        <code>File → Export → glTF 2.0</code> with{" "}
        <strong>Apply Modifiers</strong>, <strong>+Y Up</strong>,{" "}
        <strong>Draco level 6</strong>, and <strong>WebP</strong> textures to obtain{" "}
        <code>hf_sprott_e_poi.glb</code>.  The Holoflow WebXR exporter respects the{" "}
        <code>SprottE_Speed</code> FLOAT_COLOR attribute without additional mapping —
        it appears as a per-vertex colour in the Three.js scene.
      </p>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <strong>Sprott JC (1994)</strong> — &ldquo;Some simple chaotic flows&rdquo;,{" "}
          <em>Physical Review E</em> 50(2): R647–R650.  Mathematical content is in the
          public domain.  Companion C code:{" "}
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/chaos/sprott.htm"
            target="_blank"
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu/chaos/sprott.htm
          </a>{" "}
          (MIT licence for the code samples).  Related collection:{" "}
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/chaos/elegantchaos.htm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Elegant Chaos (2010)
          </a>
          .
        </li>
        <li>
          <strong>NumPy Developers</strong> — NumPy (BSD-3-Clause),{" "}
          <a
            className={lk}
            href="https://github.com/numpy/numpy"
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
      </ul>

      <h2>Related entries</h2>
      <ul>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr"
          >
            Sprott A — conservative chaos, no fixed points, KAM tori
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-b-attractor-linz-two-quadratic-minimal-chaos-rk4-bishop-tube-poi-webxr"
          >
            Sprott B — six-term minimal dissipative chaos
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr"
          >
            Rössler attractor — Shilnikov homoclinic orbit, saddle-focus
          </Link>
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-genesio-tesi-attractor-1992-jerk-chaos-quadratic-rk4-bishop-tube-poi-webxr"
          >
            Genesio–Tesi — jerk chaos, dual unstable equilibria
          </Link>
        </li>
      </ul>
    </>
  );
}

const instructable = buildInstructable({
  libSlug:
    "python-numpy-sprott-e-attractor-1994-minimal-chaos-saddle-centre-single-fixed-point-rk4-bishop-tube-poi-webxr",
  topic: "scripting",
  blenderVersion: "5.1",
  licence: "CC0",
  files: ["blueprint.py", "record.py", "SCREEN-RECORDING-NOTES.md"],
});

export const entry: Entry = {
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-02",
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
    "saddle-centre",
    "minimal-chaos",
  ],
  body: Body,
  instructable,
};
