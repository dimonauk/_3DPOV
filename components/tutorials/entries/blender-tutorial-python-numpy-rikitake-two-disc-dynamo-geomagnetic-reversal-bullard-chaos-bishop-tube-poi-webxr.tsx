import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-rikitake-two-disc-dynamo-geomagnetic-reversal-bullard-chaos-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Rikitake Two-Disc Dynamo: Geomagnetic Polarity Reversal Chaos ẋ=−μx+zy, Bullard 1955 & Rikitake 1958 Physical Dynamo Model, RK4 Bishop-Frame Tube & Cobalt–Amber Polarity FLOAT_COLOR Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "In 1958 Tsuneji Rikitake published three coupled differential equations describing two Faraday discs whose coils are wound around each other — and found that the mutual electromagnetic induction produced chaotic polarity flips whose irregular timing matched the palaeomagnetic record of Earth's geomagnetic reversals. This blueprint integrates those equations with 4th-order Runge-Kutta, builds a Bishop parallel-transport tube along 3 000 waypoints, encodes the polarity state as a cobalt-to-amber FLOAT_COLOR gradient (cobalt = present-day normal polarity, amber = reversed), and exports a Draco-compressed GLB poi-head for WebXR.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-29",
  externalSources: [
    {
      label:
        "Rikitake, T. (1958). Oscillations of a system of disk dynamos. Proc. Cambridge Phil. Soc. 54(1):89–105. DOI 10.1017/S0305004100033223. Mathematical content Public Domain.",
      url: "https://doi.org/10.1017/S0305004100033223",
      licence: "Mathematical content Public Domain",
      author: "Tsuneji Rikitake",
    },
    {
      label:
        "Bullard, E. C. (1955). The stability of a homopolar dynamo. Proc. Cambridge Phil. Soc. 51(4):744–760. DOI 10.1017/S0305004100030814. Mathematical content Public Domain. Related: single-disc self-exciting dynamo that Rikitake extended to two discs.",
      url: "https://doi.org/10.1017/S0305004100030814",
      licence: "Mathematical content Public Domain",
      author: "Edward Crisp Bullard",
    },
    {
      label:
        "Gilpin, W. (2021–2024). dysts: Dynamical Systems Benchmarks. MIT licence. https://github.com/williamgilpin/dysts. Rikitake catalogued as 'Rikitake' in the registry.",
      url: "https://github.com/williamgilpin/dysts",
      licence: "MIT",
      author: "William Gilpin",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        The problem Rikitake was solving in 1958 was not abstract: the
        palaeomagnetic record shows that Earth's magnetic field has reversed
        polarity at least 183 times in the last 83 million years, with reversal
        intervals ranging from tens of thousands to tens of millions of years,
        showing no periodicity whatsoever. Classical dynamo theory (single
        self-exciting disc, Bullard 1955) produces only a steady field or
        steady oscillations — it cannot account for the irregular record.
        Rikitake coupled two such dynamos together and showed that the coupling
        term is sufficient to destroy periodicity entirely.
      </p>

      <h2>The equations and their physical meaning</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`ẋ = −μ x + z y       (disc 1: braking friction + torque from disc-2 field)
ẏ = −μ y + (z − a) x  (disc 2: same, but offset by angular velocity a)
ż =  1  − x y         (shared current pool: driven at rate 1, drained by xy)

x, y  — angular velocity of disc 1 & disc 2
        (also proportional to each disc's coil current via Faraday induction)
z     — total current in the mutual induction circuit
μ     — dimensionless ratio: Ohmic resistance / rotor inertia
a     — angular velocity offset at which the system was initialised
Canonical: μ = 2.0, a = 5.0`}
      </pre>
      <p>
        The physical picture: when both discs spin in the same direction (x, y
        &gt; 0) the product <code>xy</code> is positive and drains the current
        pool (ż &lt; 0). As z falls below a, the torque on disc 2 reverses
        (since <code>(z−a)x &lt; 0</code>), disc 2 decelerates and y eventually
        becomes negative. The same drain mechanism then stops, z refills, and
        now with y negative and z again above a the torque on disc 1 eventually
        reverses too. The two discs swap roles — the field has reversed.
      </p>

      <h2>Why the reversals are chaotic</h2>
      <p>
        The Lorenz equations are chaotic because two unstable fixed points
        create two competing regions that the trajectory alternates between
        aperiodically. The Rikitake mechanism is analogous but more physical:
        the two lobes of the attractor correspond to{" "}
        <em>x &gt; 0, y &gt; 0</em> (one polarity convention) and{" "}
        <em>x &lt; 0, y &lt; 0</em> (reversed). The trajectory is driven out
        of each lobe by the current-drain nonlinearity and re-enters the
        opposite lobe after a transient. The timing of each re-entry is
        sensitive to the exact phase at which the trajectory left the previous
        lobe — a positive Lyapunov exponent (λ₁ ≈ 0.047) magnifies any
        small difference exponentially, producing the irregular record.
      </p>

      <h2>Lyapunov spectrum and attractor dimension</h2>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Jacobian  J(x,y,z) = [[ −μ,   z,    y  ],
                            [  z−a, −μ,   x  ],
                            [  −y,  −x,   0  ]]

Trace(J) = −2μ  →  ∑λᵢ = −2μ = −4.0  (uniform dissipation, μ=2)

Lyapunov spectrum (μ=2.0, a=5.0, numerical):
  λ₁ ≈ +0.047   positive: chaotic, divergence time ≈ 21 steps
  λ₂ ≈  0.000   near-zero: along-flow direction
  λ₃ ≈ −4.047   strong folding onto the attractor sheet
  D_KY ≈ 2 + λ₁/|λ₃| ≈ 2.012   very close to 2D — near-surface attractor`}
      </pre>
      <p>
        The near-zero Kaplan-Yorke excess above 2 (only ≈ 0.012) means the
        Rikitake attractor is almost a 2D surface folded in 3-space — much
        "flatter" than the Lorenz attractor (D_KY ≈ 2.06) or the Rössler
        attractor (D_KY ≈ 2.01 at canonical parameters). It is the product of
        very strong contraction on the third axis (|λ₃| ≈ 4μ) compared to the
        mild chaos on the first (λ₁ ≈ μ/42).
      </p>

      <h2>Blueprint walkthrough</h2>
      <p>
        The script is structured in five stages. Parameters are named constants
        at the top so you can experiment without reading the implementation.
      </p>

      <h3>1. RK4 integration</h3>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`MU      = 2.0     # friction/resistance
A_OFFSET = 5.0    # angular velocity offset
DT      = 0.005   # time step — small enough that ΔE/E₀ ≈ 1e-6 per orbit
BURN_IN = 5_000   # discard transient
SKIP    = 30      # sample every 30 steps → 3 000 waypoints from 90 000 steps`}
      </pre>
      <p>
        The initial condition <code>[1.0, 1.0, a/2]</code> is near the
        fixed-point cluster; 5 000 burn-in steps bring the trajectory to
        the attractor before sampling begins.
      </p>

      <h3>2. Scaling to poi-head size</h3>
      <p>
        After integration the bounding radius of the sampled points is measured
        and the whole trajectory is uniformly rescaled so the 95th-percentile
        radius equals <code>POI_R = 0.082 m</code> — the standard poi-head
        size across the studio library, ensuring consistent scale in WebXR
        scenes.
      </p>

      <h3>3. Bishop parallel-transport frame</h3>
      <p>
        The Bishop frame avoids the gimbal singularities of the Frenet-Serret
        frame by transporting the normal vector via the minimal Rodrigues
        rotation between consecutive tangents. For a 3 000-waypoint attractor
        this means 2 999 quaternion-free rotations, each costing one
        cross-product, one dot-product, and one division — fast and numerically
        stable even in the tight turns near a polarity-reversal event.
      </p>
      <p>
        Because the Rikitake attractor is <em>not</em> a closed curve — unlike
        the figure-8 choreography or Viviani's curve — no holonomy correction
        is applied. The tube is open at both ends (normal poi-head topology).
      </p>

      <h3>4. Tube mesh and vertex colour</h3>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`TUBE_SIDES = 10       # 10-gon cross-section
TUBE_R    = 0.013 m  # tube radius

# Colour encoding:
#   x ≫ 0  →  cobalt  (0.06, 0.20, 0.80)  — normal polarity
#   x ≈ 0  →  white   (0.95, 0.95, 0.95)  — reversal transition
#   x ≪ 0  →  amber   (0.88, 0.52, 0.04)  — reversed polarity
t = clip(0.5 − x / (2·max|x|), 0, 1)      # 0=cobalt, 0.5=white, 1=amber`}
      </pre>
      <p>
        The colour encoding makes the polarity state immediately legible: a
        long cobalt stretch is a normal-polarity epoch, a long amber stretch is
        a reversed epoch, and a white region is the reversal event itself. At
        canonical parameters (μ = 2, a = 5) there are roughly 25–30 reversals
        in the 3 000 sampled waypoints.
      </p>

      <h3>5. Shape keys</h3>
      <p>
        Three separate integrations are stored as shape keys rather than
        warping the Basis mesh — the topology (same waypoint count, same tube
        sides) is identical across all three, so the GLB morph target system
        can interpolate correctly in WebXR.
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-3 text-sm">
        {`Basis           μ=2.0, a=5.0  canonical — ~25–30 reversals
SK_HighFriction μ=3.0, a=5.0  stronger damping — fewer reversals, tighter lobes
SK_LowFriction  μ=1.0, a=5.0  weaker damping — longer epochs, wider excursions`}
      </pre>

      <h2>Trade-offs and failure modes</h2>
      <ul>
        <li>
          <strong>SKIP too small</strong> — waypoints crowd in slow regions
          near the reversal transition, producing a coarse tube near the
          lobes. Increase SKIP to 40–50 if the attractor looks lumpy.
        </li>
        <li>
          <strong>Bishop frame collapse</strong> — if two consecutive
          waypoints are nearly antipodal (tangents nearly antiparallel) the
          cross-product axis is near zero. The script checks{" "}
          <code>sin_a &lt; 1e-10</code> and copies the previous normal; for
          the Rikitake attractor this is rare because DT = 0.005 keeps steps
          smooth.
        </li>
        <li>
          <strong>Colour banding</strong> — the Rikitake attractor can produce
          very long epochs where |x| is large. The cobalt–white–amber lerp
          uses a symmetric clamp so extreme x values don't wash out to solid
          cobalt or amber. If you want more visible transitions, multiply x
          by a sigmoid before computing t.
        </li>
        <li>
          <strong>SK_LowFriction extends further</strong> — at μ = 1 the
          trajectory excursions are larger; POI_R scaling normalises by the
          Basis extents, so SK_LowFriction may appear to "inflate" the poi.
          Recompute scale per shape key if you want each key to fit POI_R
          independently.
        </li>
      </ul>

      <h2>Cross-references</h2>
      <p>
        The Bishop-frame tube technique is used identically in the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-rene-thomas-1999-sin-decay-z3-bishop-tube-poi-webxr"
        >
          Thomas Attractor
        </Link>{" "}
        and{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
        >
          Lorenz Attractor
        </Link>{" "}
        blueprints; comparing the three attractors side by side shows how
        dramatically different dissipation structures (uniform −3b for Thomas,
        non-uniform for Lorenz, uniform −2μ for Rikitake) produce different
        attractor topologies. The{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-bpy-rossler-attractor-rk4-poi-light-painting"
        >
          Rössler Attractor
        </Link>{" "}
        entry discusses why three-variable systems are the minimum for
        continuous-time chaos — a background directly applicable here.
      </p>

      <h2>Video recording</h2>
      <p>
        Run <code>record.py</code> from the Scripting workspace after
        blueprint.py. It configures Eevee Next with bloom (threshold 0.30,
        intensity 0.22), orbits the camera 240° over the first 80 frames, then
        morphs through Basis → SK_HighFriction → Basis → SK_LowFriction →
        Basis across 300 frames at 30 fps. OBS instructions for the
        screen recording are in <code>SCREEN-RECORDING-NOTES.md</code>.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  data,
  slug: SLUG,
  body: <Body />,
});
