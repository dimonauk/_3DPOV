import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-bunimovich-stadium-ergodic-billiard-poincare-section-density-poi-disc-webxr";

function Body() {
  return (
    <>
      <h2>Order and chaos, side by side on one disc</h2>
      <p>
        Two billiard tables, one question: what does a particle&apos;s long-run
        behaviour look like when you draw it as a height field?
      </p>
      <p>
        In a <strong>circular billiard</strong> the particle bounces inside a
        perfect disc. Because the circle is rotationally symmetric, the angle
        of reflection never changes — the particle&apos;s orbit is either a
        closed polygon or a dense rosette, and its Poincaré section shows
        clean horizontal bands. That is an{" "}
        <em>integrable</em> system: predictable, crystalline, conservative of
        hidden quantities.
      </p>
      <p>
        Now push the two walls outward and cap the ends with semicircles. You
        have a <strong>Bunimovich stadium</strong>. L. A. Bunimovich proved in
        1979 that this tiny geometric change destroys every invariant curve. The
        Poincaré section fills its rectangle uniformly — every region of phase
        space is visited with equal frequency. That is{" "}
        <em>ergodicity</em>, one of the strongest mixing properties a
        deterministic system can have.
      </p>
      <p>
        This tutorial builds a poi disc whose height field{" "}
        <em>is</em> that Poincaré section density, computed by simulating
        tens of thousands of billiard bounces in Python and binning them in
        NumPy. The shape key <code>SK_Circle</code> morphs the flat ergodic
        plain into the spiked rings of the integrable circle — order and chaos
        as two keyframes on the same object.
      </p>

      <h2>Birkhoff coordinates: the right language for bouncing</h2>
      <p>
        After each reflection, record two numbers:
      </p>
      <ul>
        <li>
          <strong>s</strong> — the arc-length along the boundary at the bounce
          point, normalised to [0, 1).
        </li>
        <li>
          <strong>p = sin θ</strong> — the sine of the angle the outgoing ray
          makes with the boundary tangent.
        </li>
      </ul>
      <p>
        WHY sin θ rather than θ itself? The billiard map preserves the area
        element <code>ds ∧ dp</code>. If you used θ, the invariant measure
        would be <code>ds · sin(θ) dθ</code> — non-uniform and awkward to
        visualise. Choosing <code>p = sin θ</code> makes the measure perfectly
        flat, so a uniform density in (s, p) space genuinely means the orbit
        visits all parts of phase space equally.
      </p>
      <p>
        The pair (s, p) lives in the cylinder ∂Ω × (0, 1), and the billiard
        map T(s, p) → (s&apos;, p&apos;) is area-preserving by Liouville&apos;s theorem —
        applied here to a symplectic map rather than the usual Hamiltonian flow.
      </p>
      <p>
        Compare with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-henon-heiles-hamiltonian-kam-tori-poincare-section-poi-webxr"
          className={lk}
        >
          Hénon–Heiles Hamiltonian
        </Link>{" "}
        tutorial, where the Poincaré section of a smooth Hamiltonian system
        reveals a <em>mixed</em> phase space — KAM tori coexisting with chaotic
        seas. The stadium has no tori at all: it is fully chaotic for every
        initial condition off a measure-zero set.
      </p>

      <h2>Why the flat walls do nothing and the caps do everything</h2>
      <p>
        A pure rectangle is integrable: the x- and y-momentum components are
        separately conserved (up to sign). Add the semicircular caps and you
        break that hidden conservation law entirely.
      </p>
      <p>
        Here is the geometric intuition: a bundle of parallel rays reflecting
        off a <em>concave</em> mirror focuses — it becomes more ordered. The
        interior of the stadium is bounded by curves convex{" "}
        <em>toward</em> the interior, which means they act as{" "}
        <em>defocusing</em> mirrors. Each cap disperses a family of nearby
        trajectories, separating them exponentially fast. This is the
        Lyapunov exponent λ &gt; 0 that Bunimovich&apos;s theorem guarantees.
      </p>
      <p>
        The same defocusing mechanism drives chaos in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
          className={lk}
        >
          Lorenz attractor
        </Link>{" "}
        (where stretching and folding replace a geometric scatterer) and in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
          className={lk}
        >
          Duffing oscillator
        </Link>
        , whose period-doubling cascade leads to the same positive-exponent
        chaos by a different route.
      </p>

      <h2>The reflection algorithm: p = −(v · n̂)</h2>
      <p>
        The script uses four boundary pieces: bottom wall, top wall, right cap,
        left cap. For each, it finds the earliest positive time at which the ray{" "}
        <code>pos + t·vel</code> crosses the boundary, then reflects the
        velocity with the specular law:
      </p>
      <pre>{`# Outward normal n̂ at hit point
dot = vx*nx_n + vy*ny_n   # incoming · outward: negative
nvx = vx - 2*dot*nx_n     # reflect
nvy = vy - 2*dot*ny_n
p   = -dot                 # = sin θ = |v · n̂|`}</pre>
      <p>
        <code>-dot</code> equals sin θ because the incoming velocity has unit
        length and <code>dot = −sin(incidence angle)</code>. After reflection
        the angle is unchanged in magnitude, so sin θ is the same for the
        outgoing ray — it is the Birkhoff <em>p</em> coordinate, directly
        available from the reflection step.
      </p>

      <h2>Disc mapping: wrapping phase space onto a poi head</h2>
      <p>
        The Poincaré rectangle (s_norm, p) ∈ [0, 1]² maps to the disc via:
      </p>
      <pre>{`φ_disc = s_norm × 2π   # arc-length → azimuth angle
r_disc = p × DISC_R    # reflection momentum → radius`}</pre>
      <p>
        A 2D histogram of (s_norm, p) values accumulated over N_TRAJ × N_ITER
        reflections is normalised to [0, 1] and used as the height of each disc
        vertex. For the stadium billiard (chaotic) the histogram is nearly flat
        — ergodicity guarantees uniform density. For the circle billiard
        (integrable), each orbit contributes a horizontal band at its conserved
        p-value, producing concentric rings.
      </p>
      <p>
        The five rings in <code>SK_Circle</code> correspond to orbits inscribed
        as 9-, 7-, 5-, 4- and 3-gons. Their radii are{" "}
        <code>sin(π/n) × DISC_R</code> — a sequence rooted in the same
        arithmetic that governs the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-abc-flow-beltrami-force-free-rk4-streamlines-poi-webxr"
          className={lk}
        >
          Beltrami ABC flow
        </Link>
        &apos;s resonance widths.
      </p>

      <h2>Blueprint walkthrough</h2>

      <h3>1 — Run the simulation</h3>
      <pre>{`# Fourteen independent orbits, 3 500 bounces each ≈ 49 000 data points
ss, ps = _stadium_pts()    # (s_norm, p) for chaos branch
sc, pc = _circle_pts()     # five periodic orbits for order branch`}</pre>

      <h3>2 — Density histogram</h3>
      <pre>{`den_s = _density(ss, ps)   # 60×60 float32 array, normalised
den_c = _density(sc, pc)   # concentric rings`}</pre>

      <h3>3 — Polar disc mesh</h3>
      <pre>{`ob = _make_disc()          # N_R=26 rings × N_PHI=56 sectors + centre
_set_heights(ob, den_s)    # numpy foreach_set bulk write`}</pre>

      <h3>4 — Shape key for order</h3>
      <pre>{`ob.shape_key_add(name="Basis",     from_mix=False)
sk = ob.shape_key_add(name="SK_Circle", from_mix=False)
# ...fill sk.data[i].co from den_c heights...`}</pre>

      <h3>5 — Colour and export</h3>
      <p>
        Vertex colour attribute <code>dc</code> encodes density: cobalt for
        rarely-visited bins, amber for hotspots. The Solidify modifier (applied
        before export) adds a base thickness of 5 mm. Export via the Holoflow
        WebXR exporter: Draco level 6, WebP textures, +Y up.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Disc is uniformly flat (no stadium ergodicity visible):</strong>{" "}
          Increase <code>N_ITER</code> to 8 000+. The ergodic fill converges
          slowly in underpopulated bins.
        </li>
        <li>
          <strong>Circle rings are smeared:</strong> Decrease <code>N_BINS</code>{" "}
          (try 40). Periodic orbits produce sharp spikes; too many bins spread
          the density across neighbouring empty cells.
        </li>
        <li>
          <strong>Reflection bounces to wrong side:</strong> Check that{" "}
          <code>_t_seg</code> segment winding matches the domain interior. The
          top wall is passed right → left (<code>L, +1</code> to{" "}
          <code>-L, +1</code>) to keep the interior always on the left of the
          traversal direction.
        </li>
        <li>
          <strong>Cap normal points the wrong way:</strong>{" "}
          <code>nx_n = nx - L</code> for the right cap points outward from
          centre (L, 0). If the result ends up inside the cap, the sign is
          inverted somewhere upstream — verify that <code>dot &lt; 0</code> on
          the incoming ray.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Bunimovich Stadium Billiard: Ergodic Poincaré Section Density Poi Disc",
  description:
    "Python bpy script — Birkhoff coordinates (s, p), integrable circle " +
    "vs chaotic stadium density contrast, shape-key morph from ergodic plain " +
    "to inscribed-polygon spike rings, cobalt-amber vertex colour.",
  date: "2026-08-22",
  tags: [
    "blender",
    "python",
    "numpy",
    "dynamical-systems",
    "chaos",
    "ergodic-theory",
    "billiards",
    "poincare-section",
    "webxr",
    "poi",
  ],
  body: Body,
  sourceUrl:
    "https://github.com/dimonauk/_3dpov/tree/main/public/library/blends/scripting/python-numpy-bunimovich-stadium-ergodic-billiard-poincare-section-density-poi-disc-webxr",
});
