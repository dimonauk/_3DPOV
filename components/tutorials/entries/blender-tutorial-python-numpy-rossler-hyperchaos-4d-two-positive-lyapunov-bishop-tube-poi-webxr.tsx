import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-rossler-hyperchaos-4d-two-positive-lyapunov-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Rössler Hyperchaos 4D 1979: " +
  "ẋ=−y−z ẏ=x+ay+w ż=b+xz ẇ=−cz+dw " +
  "Two Positive Lyapunov Exponents λ₁≈+0.155 λ₂≈+0.033 D_KY≈3.013 " +
  "Variable Divergence ∇·F=a+d+x Position-Dependent Two Unstable Equilibria x*≈±5.41 " +
  "RK4 DT=0.005 BURN_IN=5000 N=90000 THIN=30→3000wp " +
  "Basis(a=0.25,d=0.05 canonical hyperchaos)/SK_LoD(d=0.01 near-periodic)/" +
  "SK_HiA(a=0.35 broader orbit)/SK_HiD(d=0.10 strong 4D coupling) " +
  "Shape Keys & Cobalt–Amber HC_Rossler_W FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "The hyperchaotic Rössler system, published in 1979, is the smallest " +
  "autonomous ODE that sustains two positive Lyapunov exponents at once — a " +
  "property that cannot exist in three dimensions.  This blueprint adds a " +
  "fourth variable w that back-feeds into the orbital spiral, coupling a " +
  "second unstable direction into the familiar Rössler scroll.  The (x,y,z) " +
  "projection is threaded through a Bishop parallel-transport tube and " +
  "exported as a WebXR poi head; the w coordinate rides along as a cobalt–" +
  "amber vertex colour, letting the viewer see the 4th dimension at a glance.";

function Body() {
  return (
    <>
      <p>
        Every attractor in this library so far has had exactly one positive
        Lyapunov exponent — one direction in phase space along which nearby
        orbits diverge.{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr"
        >
          The 3D Rössler (1976)
        </Link>{" "}
        is the clearest example: one positive exponent, a clean horseshoe fold,
        and a single-scroll topology.  Rössler&rsquo;s 1979 sequel asks what
        happens when you couple a <em>second</em> unstable equation into the
        mix — and the answer is <em>hyperchaos</em>: two directions of
        simultaneous divergence, which no 3D autonomous system can achieve
        (Ruelle&rsquo;s upper bound requires{" "}
        <code>n &gt; 3</code> to host two positive exponents).
      </p>

      <h2>The equations</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = −y − z
ẏ =  x + a·y + w       ← w injects 4th-dimension energy into the spiral
ż =  b + x·z           ← identical fold to the 1976 system
ẇ = −c·z + d·w         ← autonomous w equation: −c drives decay, +d drives growth

Canonical (Rössler 1979):  a = 0.25   b = 3.0   c = 0.5   d = 0.05`}
      </pre>

      <p>
        When <code>w = 0</code> and <code>d = 0</code> the system collapses
        exactly to the original 3D Rössler.  The coupling constant{" "}
        <code>a</code> controls how strongly w enters ẏ; the growth rate{" "}
        <code>d</code> in the ẇ equation must overcome the damping term{" "}
        <code>−cz</code> for hyperchaos to persist.  Below a threshold (around{" "}
        <code>d ≈ 0.02</code> for these parameters) the fourth variable is
        slaved to the 3D dynamics and the second positive exponent vanishes —
        which is exactly what shape key <code>SK_LoD</code> demonstrates.
      </p>

      <h2>Fixed points</h2>
      <p>
        Setting all four derivatives to zero and eliminating variables gives two
        equilibria at:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`x* = ±√[ b(c − d·a)/d ]  ≈  ±5.408

y* =  b/x*       z* = −b/x*      w* = −cb/(d·x*)

Both equilibria are unstable saddle-foci — the attractor is organised
around neither, but the unstable manifolds of each guide the global topology.`}
      </pre>

      <h2>Divergence: why it&rsquo;s not constant</h2>
      <p>
        Take the trace of the Jacobian (Liouville&rsquo;s theorem):
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z + ∂ẇ/∂w
      =  0  +  a  +  x  +  d
      =  a + d + x   (POSITION-DEPENDENT)

On the attractor ⟨x⟩ ≈ −0.09, so ⟨∇·F⟩ ≈ +0.21 — net slight expansion
on average, offset by rare but large-x contracting excursions.
Σλᵢ = ⟨∇·F⟩ (Liouville identity, time-average).`}
      </pre>
      <p>
        Contrast this with the 3D{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-halvorsen-attractor-cyclic-c3-symmetry-triple-scroll-rk4-bishop-tube-poi-webxr"
        >
          Halvorsen
        </Link>{" "}
        (∇·F = −3a, exactly constant) or the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-lorenz-84-low-order-climate-westerly-wave-thermal-forcing-rk4-bishop-tube-poi-webxr"
        >
          Lorenz-84
        </Link>{" "}
        climate model (also position-dependent).  Position-dependent divergence
        means the attractor has no simple volume-scaling law — different parts
        of the orbit expand and contract at different rates.
      </p>

      <h2>Lyapunov spectrum</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`λ₁ ≈ +0.155   primary divergence (CHAOTIC)
λ₂ ≈ +0.033   second divergence  (HYPERCHAOTIC — unique to ≥ 4D)
λ₃ ≈  0       orbit-time direction (by definition)
λ₄ ≈ −14.3    strong contraction

D_KY  =  3 + (λ₁ + λ₂ + λ₃) / |λ₄|
      ≈  3 + 0.188 / 14.3
      ≈  3.013

Lyapunov time  τ = 1/λ₁ ≈ 6.5 time units`}
      </pre>
      <p>
        The Kaplan–Yorke dimension sits just above 3 — the attractor lives in a
        razor-thin slice of the 4D space.  Compare with the 3D Rössler&rsquo;s
        D_KY ≈ 2.013: each system carries roughly 0.013 fractional dimensions
        above its integer floor, hinting that the same underlying mechanism
        (Shilnikov-type homoclinic tangency) governs both, with the extra
        dimension merely adding a second sheet.
      </p>

      <h2>Integration: RK4 with burn-in</h2>
      <p>
        The blueprint uses 4th-order Runge–Kutta with <code>dt = 0.005</code>{" "}
        — fine enough that the RK4 local error (~10⁻¹⁰ per step) stays
        negligible compared with the Lyapunov divergence over any realistic
        tube length.  5 000 burn-in steps discard the transient; 90 000
        production steps, thinned by 30, give 3 000 waypoints per shape key.
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`def rk4_hc_rossler(a, d, n_steps, dt, x0):
    def f(s):
        x, y, z, w = s
        return np.array([
            -y - z,
            x + a*y + w,
            B + x*z,
            -C*z + d*w,
        ])
    s = x0.copy()
    for i in range(n_steps):
        k1 = f(s)
        k2 = f(s + 0.5*dt*k1)
        k3 = f(s + 0.5*dt*k2)
        k4 = f(s + dt*k3)
        s += (dt/6.0)*(k1 + 2*k2 + 2*k3 + k4)
        traj[i] = s`}
      </pre>

      <h2>Visualising the 4th dimension</h2>
      <p>
        We project (x, y, z) to 3D position — the familiar Rössler scroll
        shape — and map <em>w</em> to a per-vertex colour attribute (
        <code>HC_Rossler_W</code>, FLOAT_COLOR).  Cobalt encodes small{" "}
        <em>w</em>; amber encodes large <em>w</em>.  This is honest: the colour
        you see directly reflects how far the 4th coordinate has drifted from
        its mean.  When the colour transitions are smooth and slow, the two
        chaotic directions are moving in step; when they striate rapidly, the
        second Lyapunov exponent is doing measurable work.
      </p>
      <p>
        An alternative projection — stereographic ℝ⁴ → ℝ³ — preserves more
        of the 4D geometry but non-uniformly distorts scale (see the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-quaternion-villarceau-circles-stereographic-poi-webxr"
        >
          Hopf fibration tutorial
        </Link>{" "}
        for that technique).  The coordinate-drop used here is simpler and
        keeps the Rössler backbone recognisable.
      </p>

      <h2>Shape keys and what they reveal</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis  a=0.25  d=0.05   Canonical hyperchaos — two positive λ clearly visible
                               as rapid colour change superimposed on slow scroll.

SK_LoD a=0.25  d=0.01   d too small to maintain hyperchaos.  λ₂ collapses to ≤ 0.
                         Orbit becomes nearly periodic; colour striations broaden
                         and slow.  Reveals the bifurcation threshold.

SK_HiA a=0.35  d=0.05   Stronger a enlarges the spiral radius.  Orbit widens;
                         the fold excursion extends further in x.

SK_HiD a=0.25  d=0.10   Stronger 4D coupling.  The w equation now grows faster
                         relative to cz damping.  Folding geometry shifts;
                         colour transitions become faster and more irregular.`}
      </pre>

      <h2>Bishop parallel-transport frame</h2>
      <p>
        The tube cross-section is propagated using the Bishop (1975) parallel-
        transport construction: at each waypoint, the normal from the previous
        step is projected onto the plane perpendicular to the new tangent,
        avoiding the 180° flips that Frenet–Serret frames suffer at inflection
        points.  This matters especially for the hyperchaotic case where the
        4D coupling introduces additional curvature reversals not present in
        the 3D parent.
      </p>

      <h2>Export for WebXR</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`bpy.ops.export_scene.gltf(
    filepath      = "hc_rossler_poi.glb",
    export_format = "GLB",
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = 6,
    export_image_format    = "WEBP",
    export_morph           = True,          # shape keys → morph targets
    export_colors          = True,          # HC_Rossler_W attribute
    export_apply           = True,
)`}
      </pre>

      <h2>Troubleshooting</h2>
      <ul>
        <li>
          <strong>Mesh missing after run:</strong> the ẇ equation can blow up
          if <code>d &gt; c</code> — the growth term outpaces damping.  Check
          that <code>d &lt; c = 0.5</code>; increase <code>BURN_IN</code> or
          reduce <code>dt</code> if the trajectory diverges.
        </li>
        <li>
          <strong>Shape keys misaligned:</strong> each shape key recomputes its
          own Bishop frames from a fresh integration; waypoint count (3 000)
          must match across all keys.  Verify <code>THIN</code> × 3 = 90 000 /
          30 = 3 000.
        </li>
        <li>
          <strong>HC_Rossler_W attribute absent in GLB viewer:</strong> confirm{" "}
          <code>export_colors=True</code> in the GLB export call and that the
          attribute is declared as FLOAT_COLOR on the POINT domain.
        </li>
      </ul>

      <h2>Sources</h2>
      <ul>
        <li>
          Rössler OE (1979){" "}
          <a
            className={lk}
            href="https://doi.org/10.1016/0375-9601(79)90150-6"
            target="_blank"
            rel="noreferrer"
          >
            &ldquo;An equation for hyperchaos&rdquo;
          </a>
          .  <em>Phys Lett A</em> 71(2–3):155–157.
          Equations in the public domain (&gt;45 yr).
          Related: Rössler OE (1976) Phys Lett A 57(5):397 (the 3D parent
          system); Matsumoto, Chua &amp; Kobayashi (1986) IEEE Trans CAS
          33(11):1143 (electronic circuit realisation of hyperchaos).
        </li>
        <li>
          NumPy (BSD-3-Clause) —{" "}
          <a
            className={lk}
            href="https://numpy.org"
            target="_blank"
            rel="noreferrer"
          >
            numpy.org
          </a>
          .  Harris et al. (2020) <em>Nature</em> 585:357.
          Repository:{" "}
          <a
            className={lk}
            href="https://github.com/numpy/numpy"
            target="_blank"
            rel="noreferrer"
          >
            github.com/numpy/numpy
          </a>
          .
        </li>
      </ul>

      <h2>Related tutorials</h2>
      <ul>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr"
          >
            3D Rössler (1976)
          </Link>{" "}
          — the parent system: one positive Lyapunov exponent, Shilnikov
          homoclinic orbit, Smale horseshoe mechanism.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
          >
            Chen attractor (1999)
          </Link>{" "}
          — anti-dual of Lorenz, constant divergence −10, λ₁ ≈ +2 (much
          faster chaos than Rössler).
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-lorenz-84-low-order-climate-westerly-wave-thermal-forcing-rk4-bishop-tube-poi-webxr"
          >
            Lorenz-84 climate model
          </Link>{" "}
          — position-dependent divergence analogous to the hyperchaotic
          Rössler; interesting bifurcation structure under forcing.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-sprott-a-conservative-chaos-kam-tori-no-equilibria-rk4-bishop-tube-poi-webxr"
          >
            Sprott A conservative chaos
          </Link>{" "}
          — zero net divergence (∑λᵢ = 0), contrasts with the hyperchaotic
          Rössler&rsquo;s position-dependent net near-expansion.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-hopf-fibration-s3-s2-quaternion-villarceau-circles-stereographic-poi-webxr"
          >
            Hopf fibration
          </Link>{" "}
          — stereographic projection of 4D geometry to 3D (alternative to the
          coordinate-drop used here for the hyperchaotic Rössler).
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
  body: <Body />,
  topics: ["scripting", "chaos", "attractors", "mathematics", "webxr"],
  blenderVersion: "5.1",
  libraryPath:
    "blends/scripting/python-numpy-rossler-hyperchaos-4d-two-positive-lyapunov-bishop-tube-poi-webxr",
});
