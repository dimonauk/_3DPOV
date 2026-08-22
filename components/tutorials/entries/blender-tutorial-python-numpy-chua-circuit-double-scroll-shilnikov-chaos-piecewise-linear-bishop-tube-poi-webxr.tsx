import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-chua-circuit-double-scroll-shilnikov-chaos-piecewise-linear-bishop-tube-poi-webxr";

function Body() {
  return (
    <>
      <h2>The circuit that had to be chaotic</h2>
      <p>
        In 1983, Leon Chua sat down with a pencil and proved — before anyone
        had built the thing — that a particular electronic circuit must be
        chaotic. The argument used Shilnikov&rsquo;s homoclinic theorem: if a
        three-dimensional ODE has a saddle-focus equilibrium with a homoclinic
        orbit, and the unstable eigenvalue is large enough relative to the
        stable ones, the first-return map contains an infinite family of
        Smale horseshoes. Chaos is not an accident in Chua&rsquo;s circuit.
        It is structurally inevitable.
      </p>
      <p>
        Takashi Matsumoto and colleagues built the circuit in 1984 and watched
        the double-scroll appear on an oscilloscope in real time. It was the
        first instance of chaos predicted mathematically and then observed
        in hardware.
      </p>

      <h2>The circuit, normalised</h2>
      <p>
        Four components: inductor L, capacitors C₁ and C₂, and a two-terminal
        nonlinear resistor — the &ldquo;Chua diode&rdquo; — with a piecewise-
        linear current–voltage curve. Normalising by the breakpoint voltage
        E_bp and the linear resistor R:
      </p>
      <pre>{`ẋ = α (y − x − f(x))
ẏ = x − y + z
ż = −β y

f(x) = m₁x + (m₀−m₁)/2 · (|x+1| − |x−1|)

α = C₂/C₁      β = C₂R²/L`}</pre>
      <p>
        x is the normalised voltage across C₁, y across C₂, z is the
        normalised inductor current. The function f(x) is the Chua diode
        characteristic — piecewise linear in three segments:
      </p>
      <pre>{`|x| ≤ 1  →  f(x) = m₀ · x  = −(8/7) x      (inner: negative resistance)
|x| > 1  →  f(x) = m₁ · x − (3/7)·sign(x)  (outer: less-negative slope)`}</pre>
      <p>
        The inner segment has a steeper negative slope than the outer segments.
        That sign difference is what makes the circuit oscillate rather than
        settle. The Chua diode is not a passive element; it pumps energy.
      </p>
      <p>
        Canonical parameters (Matsumoto 1985):
        <code> α = 9, β = 100/7, m₀ = −8/7, m₁ = −5/7</code>.
      </p>

      <h2>Three fixed points</h2>
      <p>
        Setting ẋ = ẏ = ż = 0 and solving analytically:
      </p>
      <ul>
        <li>
          <strong>P₀ = (0, 0, 0)</strong> — always a fixed point since f(0) = 0.
          The Jacobian at the origin has one positive real eigenvalue (the
          &ldquo;saddle&rdquo; direction) that kicks trajectories away.
        </li>
        <li>
          <strong>P± = (±3/2, 0, ∓3/2)</strong> — from ẏ=0 we get y=0,
          from ż=0 we get z=−x, from ẋ=0 with y=z=−x we get f(x)=−x.
          In the outer region: <code>(m₁+1)x = (m₁−m₀)·sign(x)</code>
          → <code>x = ±(m₁−m₀)/(m₁+1) = ±(3/7)/(2/7) = ±3/2</code>.
          Both lie outside the |x|≤1 inner segment, so the calculation
          is self-consistent.
        </li>
      </ul>
      <p>
        P± are saddle-foci: their Jacobians have a complex conjugate pair
        (ρ ± iω) with ρ slightly positive, plus one negative real eigenvalue.
        The trajectory spirals away from each P± and eventually crosses to
        the other lobe — creating the characteristic double scroll.
      </p>

      <h2>Why Shilnikov guarantees chaos</h2>
      <p>
        Shilnikov&rsquo;s 1965 theorem states: if a 3D ODE has a
        saddle-focus equilibrium with eigenvalues γ (real) and ρ ± iω, and
        a homoclinic orbit returns to the equilibrium along its 1D unstable
        manifold, then — provided{" "}
        <code>|γ| &gt; ρ &gt; 0</code> (the &ldquo;tame&rdquo; case) or
        <code> ρ &gt; |γ| &gt; 0</code> (the &ldquo;wild&rdquo; case) —
        the return map near the homoclinic orbit contains a countably infinite
        family of periodic orbits and is therefore chaotic in the horseshoe
        sense.
      </p>
      <p>
        For Chua&rsquo;s circuit the global dynamics are richer still: the
        unstable manifold of P₀ is <em>heteroclinic</em> to both P±, and the
        unstable manifolds of P± re-inject near P₀, forming a figure-eight
        homoclinic structure. Chua, Komuro and Matsumoto (1986) established
        this rigorously via computer-assisted analysis, proving that the
        double scroll contains Smale horseshoes and is topologically chaotic.
      </p>

      <h2>Blueprint walkthrough</h2>
      <p>
        The blueprint integrates 45 000 RK4 steps (dt = 0.005) after a 3 000-
        step burn-in to land squarely on the attractor, then constructs a
        Bishop parallel-transport tube (TUBE_R = 0.016 m, 12 sides) through
        the Blender Curve API with <code>twist_mode = &quot;MINIMUM&quot;</code>.
        All 45 000 points become POLY spline control points; Blender&rsquo;s
        bevel does the cross-sectional geometry automatically.
      </p>
      <pre>{`# Chua diode — the entire nonlinearity in two lines
def _f(x, m0=M0, m1=M1):
    return m1 * x + 0.5 * (m0 - m1) * (abs(x + 1.0) - abs(x - 1.0))

# RK4 step
k1 = _deriv(state, alpha, beta)
k2 = _deriv(state + 0.5*dt*k1, alpha, beta)
k3 = _deriv(state + 0.5*dt*k2, alpha, beta)
k4 = _deriv(state +    dt*k3, alpha, beta)
state += (dt / 6.0) * (k1 + 2*k2 + 2*k3 + k4)`}</pre>
      <p>
        The Chua trajectory lives mainly in the x–z plane (the two scroll
        lobes side by side), so the coordinate mapping is
        Chua (x, y, z) → Blender (X, Z, Y): the thin y dimension becomes
        the vertical axis and the broad z dimension becomes depth — giving
        the poi head a satisfying 3D roundness rather than a flat disc.
      </p>
      <p>
        Vertex colour: hue = atan2(Blender-Y, Blender-X) / π, linearly
        interpolated from Cobalt (0.1, 0.3, 0.8) at phase = 0 to
        Amber (0.9, 0.6, 0.1) at phase = 1. The double scroll&rsquo;s
        two lobes naturally show up as warm and cool zones.
      </p>

      <h2>Shape keys</h2>
      <table>
        <thead>
          <tr>
            <th>Key</th><th>α</th><th>β</th><th>Character</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Basis</td><td>9.0</td><td>14.286</td><td>Canonical Matsumoto double scroll</td></tr>
          <tr><td>SK_Dense</td><td>10.5</td><td>14.286</td><td>Denser winding, arms overlap more</td></tr>
          <tr><td>SK_Tight</td><td>9.0</td><td>18.0</td><td>Higher β (inductance ratio), tighter loops</td></tr>
          <tr><td>SK_Wide</td><td>11.8</td><td>14.286</td><td>Near boundary of double-scroll parameter window</td></tr>
        </tbody>
      </table>
      <p>
        α controls how fast C₁ responds relative to C₂ — higher α makes the
        scroll arms trace out more quickly and overlap. β = C₂R²/L sets the
        inductor time-constant; higher β shrinks the loop radii. Both
        deformations are geometrically meaningful, not just aesthetic.
      </p>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Trajectory collapses to a point.</strong> The burn-in
          starting at (0.1, 0, 0) occasionally lands on a slow transient for
          non-canonical α values. Increase BURN_IN to 5 000 or perturb the
          initial condition to (0.1, 0.01, 0).
        </li>
        <li>
          <strong>Only one scroll lobe visible.</strong> The trajectory can
          spend long periods in one lobe before crossing over — visible as an
          unbalanced tube. Extend N_STEPS to 80 000 to ensure both lobes are
          equally filled.
        </li>
        <li>
          <strong>Tube self-intersects near origin.</strong> The trajectory
          passes through the P₀ neighbourhood repeatedly. Reduce TUBE_R from
          0.016 to 0.010 to avoid visible mesh clashing.
        </li>
        <li>
          <strong>GLB too large for browser.</strong> The default 45 000-point
          tube is ~18 MB uncompressed. Draco level 6 brings it to ~2 MB.
          If the exporter reports errors, ensure the glTF exporter Extension
          is enabled under Preferences → Add-ons → Import-Export: glTF 2.0.
        </li>
      </ul>

      <h2>See also</h2>
      <ul>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
            className={lk}
          >
            Lorenz Attractor
          </Link>{" "}
          — the butterfly strange attractor (1963); compare Chua&rsquo;s two
          scrolls with Lorenz&rsquo;s two butterfly wings. Both arise from
          saddle-focus heteroclinic tangles, but Lorenz uses a smooth cubic
          nonlinearity where Chua uses piecewise-linear.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Aizawa Attractor
          </Link>{" "}
          — a toroidal attractor using the same Bishop-tube technique; contrasts
          Chua&rsquo;s planar double-scroll topology with a ring-void geometry.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-period-doubling-poincare-chaos-poi-webxr"
            className={lk}
          >
            Duffing Oscillator
          </Link>{" "}
          — period-doubling route to chaos; the Duffing bifurcation diagram
          (Feigenbaum cascade) is the driven-oscillator counterpart to
          Chua&rsquo;s autonomous circuit chaos.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-numpy-feigenbaum-logistic-map-period-doubling-universality-poi-disc-webxr"
            className={lk}
          >
            Feigenbaum Universality
          </Link>{" "}
          — the universal constant δ ≈ 4.669 that governs all period-doubling
          cascades, including the routes to chaos visible in Chua&rsquo;s
          parameter space as α is swept.
        </li>
        <li>
          <Link
            href="/tutorials/blender-tutorial-python-scipy-thomas-cyclically-symmetric-attractor-labyrinth-chaos-poi-webxr"
            className={lk}
          >
            Thomas Cyclically Symmetric Attractor
          </Link>{" "}
          — a different piecewise-style nonlinearity (sin-based) showing that
          labyrinthine chaos can also arise from very simple vector fields.
        </li>
        <li>
          <Link href="/articles/advanced-cell-shading-techniques" className={lk}>
            Advanced Cell-Shading Techniques
          </Link>{" "}
          — the vertex-colour pipeline used here (FLOAT_COLOR POINT attribute,
          Principled BSDF + emission mix) feeds directly into the studio&rsquo;s
          cel-shading workflow.
        </li>
        <li>
          <Link href="/articles/low-poly-high-facet-shading" className={lk}>
            Low-Poly, High-Facet Shading
          </Link>{" "}
          — shade_flat + holoflow:facet=True, the flags set at the end of
          the blueprint, are explained here in the wider context of the
          studio&rsquo;s visual language.
        </li>
      </ul>

      <h2>External sources</h2>
      <ul>
        <li>
          Chua L O, Komuro M, Matsumoto T (1986). <em>The Double Scroll Family</em>.
          IEEE Transactions on Circuits and Systems <strong>33</strong>(11):
          1072–1118.{" "}
          <a
            href="https://doi.org/10.1109/TCS.1986.1085869"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1109/TCS.1986.1085869
          </a>
          . Mathematical content of the equations is in the public domain.
          Related projects: IEEE Signal Processing Society curriculum;
          Chua&rsquo;s group at UC Berkeley developed the CNN (Cellular
          Neural Network) as a spatial extension of the same circuit dynamics.
        </li>
        <li>
          Matsumoto T (1984). <em>A Chaotic Attractor from Chua&rsquo;s Circuit</em>.
          IEEE Transactions on Circuits and Systems <strong>31</strong>(12):
          1055–1058. [Equations PD] Related: Sprott&rsquo;s catalogue of
          minimal chaotic systems{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/sprott.htm"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            sprott.physics.wisc.edu
          </a>{" "}
          (equations PD; software MIT) extends Chua&rsquo;s minimality programme
          to algebraically simpler systems.
        </li>
        <li>
          NumPy — BSD-3-Clause ·{" "}
          <a
            href="https://numpy.org/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            numpy.org
          </a>
          . Related: SciPy (BSD-3-Clause){" "}
          <a
            href="https://scipy.org/"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            scipy.org
          </a>{" "}
          — the <code>scipy.integrate.solve_ivp</code> adaptive solver is an
          alternative to the hand-rolled RK4 here; the fixed-step approach was
          chosen to keep N_STEPS deterministic for consistent vertex count
          across shape keys.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title:
    "Python numpy — Chua's Circuit Double-Scroll: Matsumoto 1984 Hardware Proof, Shilnikov Homoclinic Horseshoes, Piecewise-Linear Chua Diode f(x), Three Fixed Points P₀/P±, RK4 Bishop Tube & Cobalt-Amber Poi Head for WebXR (Blender 5.1)",
  category: "blender",
  tags: [
    "blender",
    "python",
    "numpy",
    "chaos",
    "Chua circuit",
    "double scroll",
    "Shilnikov",
    "strange attractor",
    "Bishop tube",
    "poi head",
    "WebXR",
    "GLB",
  ],
  date: "2026-08-22",
  Body,
  library: {
    blend:
      "public/library/blends/scripting/python-numpy-chua-circuit-double-scroll-shilnikov-chaos-piecewise-linear-bishop-tube-poi-webxr/blueprint.py",
    glb: "public/library/glbs/scripting/python-numpy-chua-circuit-double-scroll-shilnikov-chaos-piecewise-linear-bishop-tube-poi-webxr/hf_chua_doi.glb",
  },
});
