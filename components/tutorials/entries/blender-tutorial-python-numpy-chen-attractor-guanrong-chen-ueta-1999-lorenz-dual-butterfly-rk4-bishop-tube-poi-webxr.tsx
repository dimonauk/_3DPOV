import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Chen Attractor: Guanrong Chen & Ueta 1999 Lorenz-Dual Butterfly, Constant Divergence −a+c−b, RK4 Bishop Parallel-Transport Tube & Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The Chen attractor (Guanrong Chen & Ueta 1999) is the simplest known " +
  "'anti-dual' of the Lorenz system: both produce a double-lobe butterfly strange " +
  "attractor, but Lorenz contracts in the y-direction while Chen expands directly " +
  "through a +cy feedback term. This one structural difference changes the " +
  "saddle-focus proportions, the speed distribution across the two lobes, and the " +
  "bifurcation sequence — yet both attractors share constant phase-space divergence, " +
  "an elegant Liouville identity that gives an exact sanity check on any RK4 " +
  "integration. This blueprint integrates 60,000 steps at DT=0.002, constructs a " +
  "12-sided Bishop parallel-transport tube around 3,000 thinned waypoints, and " +
  "exports four shape keys spanning the canonical chaos, a Hopf-bifurcation limit " +
  "cycle (SK_Periodic), denser wings (SK_Wing), and the Lü bridge attractor that " +
  "interpolates continuously between Lorenz and Chen.";

function Body() {
  return (
    <>
      <p>
        Most textbooks introduce chaos through the Lorenz attractor and stop
        there, as though the butterfly topology were unique. The Chen attractor
        — published in 1999 by Guanrong Chen and Tetsushi Ueta in a two-page
        letter — refutes that assumption. It has exactly the same double-lobe
        silhouette as Lorenz, the same dimensionality (D_KY ≈ 2.17), and the
        same structural role for each variable. But it is{" "}
        <em>not topologically equivalent</em> to Lorenz; its saddle-focus
        geometry is inverted in a precise sense that Chen and Ueta called
        &ldquo;anti-duality.&rdquo;
      </p>
      <p>
        Understanding the anti-duality requires looking at one term in the
        y-equation. In Lorenz, ẏ = σ(x−y) − xz in a shifted frame, so
        ∂ẏ/∂y = −1 (the y-direction always contracts). In Chen, the
        corresponding term is +cy, so ∂ẏ/∂y = +c = +28 (it expands). The
        total divergence is still constant — −a + c − b = −10 for canonical
        Chen params — but the expansion in y is counterbalanced by stronger
        contraction in x (∂ẋ/∂x = −a = −35). This redistribution of
        contraction and expansion changes the asymmetric saddle structure, the
        Lyapunov exponents, and the bifurcation diagram.
      </p>

      <h2>Equations of motion</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = a(y − x)              a = 35
ẏ = (c−a)x − xz + cy     b = 3,  c = 28  (canonical)
ż = xy − bz

div = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z
    = −a + c − b
    = −35 + 28 − 3
    = −10  (constant, position-independent)

Liouville identity: ∑ λᵢ = div = −10 (exact)`}
      </pre>
      <p>
        The constant divergence is a rare and useful property. It means that
        the sum of all three Lyapunov exponents must equal −10 exactly, to
        within the precision of the numerical integration. This gives a
        free numerical sanity check: if your computed ∑λᵢ deviates from −10
        by more than ≈ 0.05, either DT is too large or the burn-in is too
        short. The same identity holds for Thomas (∑λ = −3b) and for the
        Lorenz system (∑λ = −σ − 1 − β ≈ −13.67, also constant).
      </p>

      <h2>Lyapunov spectrum</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Canonical: a=35, b=3, c=28
  λ₁ ≈ +2.027   chaotic divergence; Lyapunov time τ ≈ 0.49
  λ₂ ≈  0.000   along-flow direction (by construction)
  λ₃ ≈ −12.027  folding onto the attractor sheet
  ∑λᵢ = −10.000  ← exact Liouville check
  D_KY = 2 + λ₁/|λ₃| ≈ 2.169

Compare Lorenz (σ=10, β=8/3, ρ=28):
  λ₁ ≈ +0.906   slower chaos; τ ≈ 1.1
  ∑λᵢ ≈ −13.67  (also constant, different value)`}
      </pre>
      <p>
        Chen&apos;s λ₁ ≈ 2.03 is more than twice as large as Lorenz&apos;s
        0.91. The attractor is <em>more chaotic</em> in the sense that nearby
        trajectories separate twice as fast. This makes a visible difference
        in the recorded animation: the tube snakes through the lobes with
        noticeably more &ldquo;kinks&rdquo; per unit arc length.
      </p>

      <h2>RK4 integration</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`DT      = 0.002   # λ₁≈2.03 → 245 steps per Lyapunov time
BURN_IN = 3_000   # ≈ 6 Lyapunov times; transient dies in < 2
N_STEPS = 60_000  # recorded
SKIP    = 20      # → 3,000 waypoints (same density as Lorenz entry)

def _deriv(s, a, b, c):
    x, y, z = s
    return np.array([a*(y - x),
                     (c - a)*x - x*z + c*y,
                     x*y - b*z])

def _rk4(s, a, b, c, dt):
    k1 = _deriv(s, a, b, c)
    k2 = _deriv(s + 0.5*dt*k1, a, b, c)
    k3 = _deriv(s + 0.5*dt*k2, a, b, c)
    k4 = _deriv(s + dt*k3, a, b, c)
    return s + (dt/6)*(k1 + 2*k2 + 2*k3 + k4)`}
      </pre>
      <p>
        The step size DT = 0.002 gives ≈ 245 RK4 steps per Lyapunov time —
        comfortable accuracy for a 4th-order method. Chen&apos;s faster
        Lyapunov exponent demands a smaller step than Thomas (DT = 0.05) but
        the same as Lorenz. Halving DT and re-checking ∑λᵢ is the standard
        convergence test.
      </p>

      <h2>Bishop parallel-transport tube</h2>
      <p>
        The Bishop frame propagates a reference normal N₀ by Rodrigues
        minimal rotation at each step, accumulating no twist. The Chen
        trajectory has two near-straight regions inside each lobe (where
        the trajectory approaches the saddle-focus and slows down) — exactly
        where Frenet&apos;s frame would be undefined. Bishop handles these
        cleanly.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`TUBE_SIDES = 12     # 12-gon ≈ 1.5 % deviation from circle
TUBE_R     = 0.014  # thin; Chen's lobes are closer than Lorenz's
POI_R      = 0.082  # standard Holoflow poi-head radius

# The scaling normalises max orbital radius → POI_R:
pts *= POI_R / np.linalg.norm(pts, axis=1).max()`}
      </pre>

      <h2>Shape keys</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis      a=35, b=3, c=28  canonical chaos; D_KY ≈ 2.17
SK_Periodic a=35, b=3, c=23  near Hopf bifurcation (c≈22); limit cycle
SK_Wing    a=35, b=3, c=31  denser wings; larger lobes
SK_Lu      a=36, b=3, c=20  Lü bridge: interpolates Lorenz↔Chen`}
      </pre>
      <p>
        Morphing from Basis to SK_Periodic animates the attractor collapsing
        into a smooth oval limit cycle — a clean visual demonstration of a
        Hopf bifurcation. SK_Lu shows the Lü system discovered by Lü & Chen
        in 2002 as the &ldquo;bridge&rdquo; in the unified chaotic system;
        its saddle proportions sit exactly between Lorenz and Chen.
      </p>

      <h2>Vertex colour: Chen_Speed (cobalt → amber)</h2>
      <p>
        The <code>Chen_Speed</code> FLOAT_COLOR attribute encodes
        instantaneous speed |ẋ,ẏ,ż|. Slow regions (cobalt) cluster near the
        saddle-focus of each lobe — the same fixed points that organise the
        whole topology. Unlike Lorenz, where the two lobes are nearly equal in
        speed, Chen&apos;s broken y-symmetry makes one lobe systematically
        faster than the other. The FLOAT_COLOR map makes this asymmetry
        immediately visible without any analysis.
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Trajectory escapes to infinity:</strong> c is above ≈ 35 or
          the IC lands outside the basin. Reset to the default IC
          (−0.1, 0.5, 0.2) and lower c.
        </li>
        <li>
          <strong>Shape key vertex counts don&apos;t match:</strong>{" "}
          N_STEPS // SKIP must be identical across all integrations.
          Never modify N_STEPS or SKIP inside{" "}
          <code>add_shape_key</code> — they are module-level constants.
        </li>
        <li>
          <strong>Lyapunov sum deviates from −10:</strong> halve DT and
          re-run. A deviation &gt; 0.1 usually means DT is too large or
          BURN_IN is too short for the trajectory to settle onto the attractor.
        </li>
        <li>
          <strong>SK_Periodic looks chaotic, not periodic:</strong> the Hopf
          bifurcation is sharp near c ≈ 22. Try c = 22.5 instead of 23;
          increase BURN_IN to 8 000 so the transient decays fully.
        </li>
        <li>
          <strong>Tube self-intersects at SK_Lu:</strong> the Lü attractor is
          larger than Chen; reduce TUBE_R from 0.014 to 0.010 for the Lü key.
          (Current blueprint normalises all keys to POI_R so their scale is
          consistent — the Lü lobe geometry simply packs the tube tighter.)
        </li>
      </ul>

      <h2>Cross-references</h2>
      <h3>Internal — Holoflow Studio</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
            className={lk}
          >
            Lorenz Attractor (Butterfly Chaos, RK4)
          </Link>{" "}
          — the canonical comparison: identical Bishop tube pipeline, different
          ODE. Comparing the FLOAT_COLOR maps of the two attractors reveals the
          y-symmetry difference directly — Lorenz&apos;s lobes are
          speed-balanced; Chen&apos;s are not.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-thomas-cyclically-symmetric-attractor-rene-thomas-1999-sin-decay-z3-bishop-tube-poi-webxr"
            className={lk}
          >
            Thomas Cyclically-Symmetric Attractor
          </Link>{" "}
          — another 1999 publication with exact constant divergence (−3b);
          useful for comparing how different algebraic structures produce the
          same Bishop-frame tube technique with very different topologies.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Aizawa Attractor (Toroidal Void, Bishop Tube)
          </Link>{" "}
          — demonstrates the same integration and tube pipeline on an attractor
          with toroidal topology, contrasting Chen&apos;s lobe topology.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chua-circuit-double-scroll-shilnikov-chaos-piecewise-linear-bishop-tube-poi-webxr"
            className={lk}
          >
            Chua Circuit (Double-Scroll, Shilnikov Chaos)
          </Link>{" "}
          — another double-scroll attractor to compare; Chua achieves a similar
          silhouette through piecewise-linear electronics rather than smooth ODEs.
        </li>
      </ul>

      <h3>External — sources and attribution</h3>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Chen G & Ueta T (1999){" "}
          <a
            href="https://doi.org/10.1142/S0218127499001024"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Yet Another Chaotic Attractor
          </a>{" "}
          — <em>Int J Bifurc Chaos</em> 9(7):1465–1466. Two-page original
          letter; equations are mathematical content (public domain). The
          related paper by Lü & Chen (2002) —{" "}
          <a
            href="https://doi.org/10.1142/S0218127402004620"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            A New Chaotic Attractor Coined
          </a>{" "}
          — introduces the unified chaotic system and the Lü bridge; also PD
          equations.
        </li>
        <li>
          Gilpin W (2021–2024){" "}
          <a
            href="https://github.com/williamgilpin/dysts"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            dysts: Dynamical Systems Benchmarks
          </a>{" "}
          — MIT licence. The Chen system is catalogued with verified Lyapunov
          exponents. Related:{" "}
          <a
            href="https://github.com/williamgilpin/dysts_examples"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            dysts_examples
          </a>{" "}
          (also MIT) provides Jupyter notebooks demonstrating parameter sweeps
          across the Chen and Lü families.
        </li>
        <li>
          Sprott J C (2010){" "}
          <a
            href="https://www.worldscientific.com/worldscibooks/10.1142/7183"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Elegant Chaos: Algebraically Simple Chaotic Flows
          </a>{" "}
          — Cambridge University Press; Chapter 5 discusses the Chen attractor
          alongside the unified chaotic system. Equations are in the public
          domain. The World Scientific catalogue of Chen-family systems is the
          most complete reference for parameter-regime mapping.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-08-29",
  tags: [
    "blender",
    "scripting",
    "python",
    "chaos",
    "attractor",
    "webxr",
    "mathematics",
    "dynamical-systems",
  ],
  body: Body,
});
