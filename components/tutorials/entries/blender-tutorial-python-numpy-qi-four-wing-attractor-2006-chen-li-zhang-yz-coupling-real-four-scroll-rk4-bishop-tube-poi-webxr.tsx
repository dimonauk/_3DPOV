import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-qi-four-wing-attractor-2006-chen-li-zhang-yz-coupling-real-four-scroll-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Qi Four-Wing Attractor (Qi, Chen, Li & Zhang 2006): " +
  "ẋ=a(y−x)+d·yz ẏ=bx−xz−y ż=xy−cz Real Four-Scroll yz-Coupling " +
  "Z₂-Symmetric Three Fixed Points O P± Constant Divergence ∇·F=−23 " +
  "P±≈(±16.08,±7.72,15.52) Origin Real Saddle λ≈+8.82 " +
  "λ₁≈+0.28 D_KY≈2.012 RK4 DT=0.005 BURN_IN=3000 N=90000 THIN=30→3000wp " +
  "Basis(d=1)/SK_TwoWing(d=0)/SK_HighB(b=24)/SK_LowC(c=4) " +
  "Shape Keys Cobalt–Amber Qi_Speed FLOAT_COLOR Bishop Parallel-Transport Tube " +
  "Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Qi attractor (2006) is the simplest demonstration that one extra bilinear " +
  "term — d·yz in the x-equation — transforms a two-scroll double butterfly into a " +
  "genuine four-wing attractor visiting all four quadrants of the xy-plane. " +
  "This blueprint integrates 90 000 RK4 steps at dt=0.005, threads a Bishop " +
  "parallel-transport frame through 3 000 waypoints, and uses a SK_TwoWing shape key " +
  "to switch the yz coupling off live, letting you watch the four-wing topology " +
  "collapse directly into a two-wing double scroll as d moves from 1 to 0.";

function Body() {
  return (
    <>
      <p>
        Lorenz, Chen, and Lü all produce a double scroll: two lobes, two fixed
        points around which the orbit loops. In 2006, Qi, Chen, Li, and Zhang
        asked what happens when you add a single bilinear product to the first
        equation. The result is one of the clearest examples in the chaos
        literature of a topological phase transition controlled by a single
        parameter.
      </p>

      <h2>Equations and the yz coupling term</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Chen (1999):  ẋ = a(y − x)           ẏ = bx − xz − y   ż = xy − cz
Qi  (2006):  ẋ = a(y − x) + d·yz    ẏ = bx − xz − y   ż = xy − cz

Canonical:   a=14   b=16   c=8   d=1

Z₂ symmetry test under (x,y) → (−x, −y):
  ẋ → a(−y−(−x)) + d(−y)z = a(x−y)−dyz = −[a(y−x)+dyz]  ✓
  ẏ → b(−x)−(−x)z−(−y) = −bx+xz+y = −(bx−xz−y)         ✓
  ż → (−x)(−y)−cz = xy−cz                                ✓

The yz term does NOT break Z₂ symmetry — the four wings arise from the
orbit dynamics, not from any symmetry-breaking bifurcation.`}
      </pre>
      <p>
        The extra wings arise from the combination of two features absent in Lorenz:
        the −y damping term in ẏ (which adds a constant −1 to the divergence), and
        the yz coupling. Together they allow the orbit to cross into the
        x{">"}0,y{"<"}0 and x{"<"}0,y{">"}0 quadrants — regions the Chen system with
        d=0 can never reach.
      </p>

      <h2>Constant divergence and Liouville check</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂ẋ/∂x = −a = −14    (yz term has no ∂/∂x contribution)
∂ẏ/∂y = −1           (from explicit −y; position-independent)
∂ż/∂z = −c = −8

∇·F = −14 − 1 − 8 = −23    (constant; strongly dissipative)

Liouville identity:
  λ₁ + λ₂ + λ₃  ≈  +0.28 + 0 − 23.28  =  −23  =  ∇·F  ✓
  D_KY = 2 + λ₁/|λ₃| = 2 + 0.28/23.28 ≈ 2.012

Compare: Chen has ∇·F = −a−1−c = −23 with the same parameters.
The Qi system has identical divergence — the yz term contributes nothing
to ∇·F because ∂(dyz)/∂x = 0.`}
      </pre>

      <h2>Equilibria: why three fixed points give four wings</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Fixed points: ẋ=ẏ=ż=0

  Origin O = (0, 0, 0):
    J|_O = [[−14, 14, 0], [16, −1, 0], [0, 0, −8]]
    2×2 block: λ² + 15λ − 210 = 0
    λ_unstable ≈ +8.82   (drives wing-switching excursions)
    λ_stable   ≈ −23.82  (strongly contracting)
    λ_z        = −8      (stable z-mode)
    Type: real saddle (no Shilnikov complex pair at origin)

  Wings P± from (b−z)(a+z) = a:
    (16−z)(14+z) = 14   →   z² − 2z − 210 = 0
    z* = (2 + √844)/2 ≈ +15.52   →   real wings
    z* = (2 − √844)/2 ≈ −13.52   →   xy < 0; no real solutions

  P+ ≈ (+16.08, +7.72, +15.52)
  P− ≈ (−16.08, −7.72, +15.52)

"Four-wing" names the orbit geometry, not the fixed-point count.
The two extra wings trace excursions that the origin's unstable real
manifold forces into all four quadrants.`}
      </pre>

      <h2>SK_TwoWing: topology switch in real time</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`SK_TwoWing integrates with d=0 (yz coupling disabled).
Chen-type fixed points at d=0:  z* = b−1 = 15,  x* = ±√(cz*) = ±10.95
P+_Chen = (+10.95, +10.95, 15)   P−_Chen = (−10.95, −10.95, 15)

Slider 0 → 1 morphs mesh live in Blender:
  d=0 (SK_TwoWing=1):  two-lobe butterfly; orbit stays in two quadrants
  d=1 (Basis):         four-lobe; orbit crosses into all four quadrants

This is the clearest single-parameter demonstration of a topological
change in a chaotic attractor without a symmetry-breaking bifurcation.`}
      </pre>

      <h2>Blueprint walkthrough</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# 1 — Vector field
def _f(s, a, b, c, d):
    x, y, z = s
    return np.array([
        a * (y - x) + d * y * z,   # yz coupling; d=0 → Chen; d=1 → Qi
        b * x - x * z - y,          # -y term adds constant -1 to divergence
        x * y - c * z,
    ])

# 2 — RK4 at DT=0.005: max |λ|·DT = 23.82 × 0.005 = 0.119 ≪ 2.785 (stable)

# 3 — Bishop parallel-transport frame
#   Seed N⊥T[0]; transport forward by projecting off the new tangent.
#   B = T × N; frame twists freely in space, not in the tube cross-section.

# 4 — Tube: (nw waypoints) × (segs ring verts) quads connect adjacent rings

# 5 — Shape keys: re-integrate with (d=0, b=24, c=4) and patch tube positions`}
      </pre>

      <h2>Trade-offs and failure modes</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>DT stability.</strong> With a=14 the dominant origin eigenvalue
          is −23.82; RK4 stability requires |λ|·DT {"<"} 2.785, so DT=0.005 gives
          0.119 — well within bounds. At b=24 (SK_HighB) the eigenvalues shift
          slightly but remain stable.
        </li>
        <li>
          <strong>d {">"} 2 instability.</strong> For d considerably above 1 the yz
          coupling overwhelms the −a(y−x) restoring force near large y; trajectories
          escape to infinity. Keep d∈[0, 2] for bounded orbits.
        </li>
        <li>
          <strong>Burn-in depth.</strong> λ₁≈0.28 gives Lyapunov time τ≈3.6.
          BURN_IN=3 000 steps × 0.005 = 15 time units ≈ 4 Lyapunov times — enough
          to leave the initial transient without pre-sampling too much of the
          attractor before the recorded section begins.
        </li>
        <li>
          <strong>Shape-key vertex count.</strong> All shape keys must match Basis
          vertex count exactly. The poi-head vertices (appended after the tube) do not
          move between variants; _add_shape_key patches only the tube portion and
          holds the poi head fixed.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
            className={lk}
          >
            Lorenz Attractor — two-scroll ancestor
          </Link>{" "}
          — the original double butterfly; compare its xy-plane projection with Qi's
          four-lobe pattern.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Chen Attractor — Lorenz dual butterfly
          </Link>{" "}
          — the Qi system with d=0 (SK_TwoWing at 1.0) is precisely the Chen system
          at these parameters; load both blends and compare meshes directly.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-dadras-attractor-momeni-2009-four-scroll-variable-divergence-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Dadras Attractor — four-scroll variable divergence
          </Link>{" "}
          — another four-scroll system but with position-dependent ∇·F; contrast with
          Qi's position-independent constant divergence.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-cyclic-c3-symmetry-triple-scroll-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Halvorsen Attractor — C₃ cyclic triple scroll
          </Link>{" "}
          — three scrolls from C₃ symmetry; compare how symmetry group determines
          scroll count versus the bilinear-coupling mechanism in Qi.
        </li>
      </ul>

      <h2>Outside sources and attribution</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Qi et al. (2006)</strong> —{" "}
          <a
            href="https://doi.org/10.1142/S0218127406015180"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            "Four-wing attractors: From pseudo to real"
          </a>
          , Int. J. Bifurcation Chaos 16(4):859–885. Equations are public
          domain mathematics. Related earlier work:{" "}
          <a
            href="https://doi.org/10.1016/j.physa.2005.01.039"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            Qi et al. (2005) Physica A 352(2–4):295–308
          </a>{" "}
          — precursor analysis establishing the system family.
        </li>
        <li>
          <strong>NumPy</strong> (BSD-3-Clause) —{" "}
          <a
            href="https://numpy.org"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            numpy.org
          </a>{" "}
          ·{" "}
          <a
            href="https://github.com/numpy/numpy"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            github.com/numpy/numpy
          </a>
          . Harris CR et al., Nature 585:357–362 (2020).
        </li>
        <li>
          <strong>Sprott Elegant Chaos</strong> (MIT companion code) —{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/elegantchaos.htm"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            sprott.physics.wisc.edu/chaos/elegantchaos.htm
          </a>
          . Related: Sprott's broader attractor catalogue at{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaostsa/"
            target="_blank"
            rel="noopener noreferrer"
            className={lk}
          >
            sprott.physics.wisc.edu/chaostsa/
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: new Date("2026-09-06"),
  topics: ["blender", "python", "scripting", "chaos", "attractor", "webxr"],
  body: <Body />,
  furtherReading: [
    {
      label: "williamgilpin/dysts — Dynamical Systems in Python (MIT)",
      href: "https://github.com/williamgilpin/dysts",
    },
    {
      label: "Qi G et al. (2005) — Analysis of a new chaotic system, Physica A",
      href: "https://doi.org/10.1016/j.physa.2005.01.039",
    },
  ],
});
