import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-jacobi-elliptic-sn-cn-dn-agm-pendulum-poi-head-webxr";

const TITLE =
  "Python numpy — Jacobi Elliptic Functions: sn/cn/dn, AGM Quarter-Period & dn-Modulated Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Carl Jacobi's 1829 elliptic functions — sn, cn, dn — are the exact solution of the nonlinear pendulum for any swing amplitude, not merely the small-angle sin ≈ θ shortcut.  The key quantity is the complete elliptic integral K(k), computed in six iterations by the arithmetic-geometric mean (AGM): start with a₀=1, b₀=√(1-k²), repeatedly average and geometric-mean, and the sequence converges quadratically to K(k) = π/(2·AGM).  This blueprint uses dn(u,k) — the energy-envelope function, always positive, always between k′ and 1 — as a radial modulator on a sphere, building a poi head that morphs from a perfect ball at k=0 through increasingly waisted elliptic profiles to a dramatic hourglass at k=0.999, with five absolute shape keys and a gold-to-violet vertex-colour gradient encoding the dn amplitude.";

const data = {
  title: TITLE,
  lede: LEDE,
  date: "2026-08-09",
  externalSources: [
    {
      label:
        "Abramowitz, M. & Stegun, I.A. (1964). Handbook of Mathematical Functions §16 — Jacobian Elliptic Functions. NBS Applied Mathematics Series 55. Public Domain (US Government work).",
      url: "https://personal.math.ubc.ca/~cbm/aands/toc.htm",
      licence: "Public Domain",
      author: "Milton Abramowitz & Irene A. Stegun (eds.), National Bureau of Standards",
    },
    {
      label:
        "NIST Digital Library of Mathematical Functions §22 — Jacobian Elliptic Functions. DLMF release 1.1.12. Public Domain (NIST, US Government).",
      url: "https://dlmf.nist.gov/22",
      licence: "Public Domain",
      author: "NIST Digital Library of Mathematical Functions",
    },
    {
      label:
        "SciPy contributors. scipy.special.ellipj — Jacobi elliptic functions. BSD-3-Clause.",
      url: "https://docs.scipy.org/doc/scipy/reference/generated/scipy.special.ellipj.html",
      licence: "BSD-3-Clause",
      author: "SciPy community",
    },
  ],
};

function Body() {
  return (
    <>
      <p>
        Every first-year physics course solves the pendulum in the small-angle limit: for
        θ₀ ≪ 1, sin θ ≈ θ and the period is T = 2π/ω₀ regardless of amplitude.  That
        is wrong above roughly 15°.  The true period is T = 4K(k)/ω₀ where k = sin(θ₀/2)
        and K is the complete elliptic integral of the first kind — a transcendental that
        grows without bound as k → 1 (θ₀ → 180°, the upright equilibrium).  At k = 0.99
        the true period is already 2.66 times the linear prediction.
      </p>

      <h2>The arithmetic-geometric mean</h2>
      <p>
        Computing K(k) directly from its integral is slow; the AGM evaluates it in
        O(log(1/ε)) arithmetic operations.  Start with a₀ = 1, b₀ = k′ = √(1−k²).
        Then iterate:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`aₙ₊₁ = (aₙ + bₙ) / 2        # arithmetic mean
bₙ₊₁ = √(aₙ · bₙ)           # geometric mean
K(k)  = π / (2 · lim aₙ)    # converges quadratically`}
      </pre>
      <p>
        Each step roughly doubles the number of correct decimal places.  Six iterations
        give 15 significant figures — more than double-precision float64 can represent.
        The convergence proof rests on the sequence being monotone and bounded:
        a₀ ≥ a₁ ≥ … ≥ b₁ ≥ b₀, with both tails squeezing to the same limit.
      </p>

      <h2>The three Jacobi functions</h2>
      <p>
        Given the <em>amplitude</em> φ = am(u, k) — the inverse of the incomplete
        elliptic integral F(φ, k) = u — the three functions are:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`sn(u, k) = sin(am(u,k))      # sinus amplitudinis
cn(u, k) = cos(am(u,k))      # cosinus amplitudinis
dn(u, k) = √(1 - k²·sn²)    # delta amplitudinis (energy envelope)`}
      </pre>
      <p>
        The key identities are sn² + cn² = 1 and k²·sn² + dn² = 1 — the elliptic
        Pythagorean pair.  At k = 0: sn = sin, cn = cos, dn = 1.  At k = 1:
        sn = tanh, cn = sech, dn = sech.  For all k, dn lies between the
        complementary modulus k′ = √(1−k²) and 1, and never changes sign —
        it is the natural amplitude to use as a <em>positive</em> radial scaling factor.
      </p>

      <h2>The dn-modulated sphere</h2>
      <p>
        The surface in this tutorial wraps dn around a sphere colatitude θ ∈ [0, π]:
      </p>
      <pre className="overflow-x-auto rounded bg-zinc-900 p-4 text-sm">
        {`u     = θ · 2K(k) / π          # map [0,π] → [0, 2K]: one half-period
ρ(θ)  = R · dn(u, k)            # modulated radius
x = ρ·sinθ·cosφ,  y = ρ·sinθ·sinφ,  z = ρ·cosθ`}
      </pre>
      <p>
        At k = 0: dn ≡ 1, so ρ = R everywhere — perfect sphere.  As k increases,
        dn reaches its minimum k′ at u = K (θ = π/2, the equator), giving a waist.
        At k = 0.95: k′ ≈ 0.31, equator radius ≈ 31% of pole radius — a clear
        hourglass.  The mesh is a 40 × 64 UV grid with degenerate pole rings
        merged by <code>bmesh.ops.remove_doubles</code>.
      </p>
      <p>
        Vertex colour is the normalised dn value: gold (dn = 1) at the poles,
        deep violet (dn = k′) at the equator.  Because the colour <em>also</em>{" "}
        morphs as k changes — the equatorial violet deepens and widens — the
        material tells the same physical story as the shape deformation.
      </p>

      <h2>Shape keys</h2>
      <p>
        Five shape keys are baked into the GLB, making the morphology animatable
        in Three.js / WebXR without recomputing geometry at runtime:
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-700">
            <th className="py-1 text-left">Key</th>
            <th className="py-1 text-left">k</th>
            <th className="py-1 text-left">Equator / pole ratio</th>
          </tr>
        </thead>
        <tbody>
          {[
            ["Basis", "0.00", "1.000 — sphere"],
            ["k_050", "0.50", "0.866 — 13% waist"],
            ["k_080", "0.80", "0.600 — 40% waist"],
            ["k_095", "0.95", "0.313 — 69% waist"],
            ["k_099", "0.999", "0.045 — hourglass"],
          ].map(([k, m, desc]) => (
            <tr key={k} className="border-b border-zinc-800">
              <td className="py-1 font-mono">{k}</td>
              <td className="py-1 font-mono">{m}</td>
              <td className="py-1">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Connection to the Weierstrass ℘-function</h2>
      <p>
        Jacobi elliptic functions and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-weierstrass-p-elliptic-lattice-doubly-periodic-height-field-webxr"
          className={lk}
        >
          Weierstrass ℘-function
        </Link>{" "}
        are both doubly-periodic meromorphic functions on the same lattice — two
        ways of uniformising an elliptic curve y² = (1−x²)(1−k²x²).  The relation
        is sn²(u,k) = (℘(u) − e₃)/(e₁ − e₃) where e₁, e₂, e₃ are the three
        branch-point values of ℘.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-kuen-dini-pseudosphere-k-minus-1-sine-gordon-poi-webxr"
          className={lk}
        >
          Sine-Gordon equation θ_tt = θ_xx + sin θ
        </Link>{" "}
        has exact single-soliton solutions also written in terms of sn —
        illustrating that the Jacobi functions underpin both classical mechanics
        and integrable PDE theory.{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr"
          className={lk}
        >
          KdV solitons
        </Link>{" "}
        can likewise be expressed as sn²-envelopes in the cnoidal wave regime.
        The geometry of the Hopf fibration{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-fiber-bundle-linked-circles-poi-webxr"
          className={lk}
        >
          S³ → S² tutorial
        </Link>{" "}
        also employs the period lattice of sn/cn to parameterise the quaternionic
        double-cover of SO(3).
      </p>

      <h2>Blueprint walkthrough</h2>
      <p>
        The script attempts <code>from scipy.special import ellipj, ellipk</code>
        and falls back to a pure-numpy RK4 integrator of the pendulum ODE
        (ds/du = cn·dn, dc/du = −sn·dn, dd/du = −k²·sn·cn) if SciPy is absent.
        The surface is built once for k = 0 as the mesh basis, then again for each
        remaining k value.  Shape-key vertex positions are mapped using a KD-tree
        lookup from the base topology so that merged-pole indexing stays consistent.
        The GLB is exported with Draco level 6 and morph targets enabled; the
        vertex colour attribute rides the <code>COLOR_0</code> accessor and is
        sampled in the emission shader via the Blender 5.1 Attribute node
        (<code>ShaderNodeAttribute → ShaderNodeEmission</code>).
      </p>

      <h2>Failure modes</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>k = 1.0 exactly</strong>: K(1) = ∞; the AGM denominator reaches
          zero.  The script guards with <code>min(k, 0.999)</code> in practice.
        </li>
        <li>
          <strong>Shape-key vertex mismatch</strong>: if <code>remove_doubles</code>
          merges a different number of verts between runs, the KD-tree lookup can
          shift positions.  Keep merge dist ≪ min edge length (1 mm vs ~3 mm cell).
        </li>
        <li>
          <strong>SciPy absent</strong>: the fallback RK4 is accurate to ~1e-6 for
          u ≤ 4K but drifts for large u; this is within acceptable render tolerance
          for N_THETA = 40 but not for scientific computation.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  data,
  Body,
  libraryPath:
    "public/library/blends/scripting/python-numpy-jacobi-elliptic-sn-cn-dn-agm-pendulum-poi-head-webxr",
});
