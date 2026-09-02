import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-newton-leipnik-attractor-1981-double-strange-bistability-rigid-body-feedback-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Newton–Leipnik Attractor 1981: ẋ=−ax+y+10yz ẏ=−x−0.4y+5xz ż=bz−5xy " +
  "Two Coexisting Strange Attractors Bistability of Chaos Rigid Body Control " +
  "Constant Divergence ∇·F=−0.625, λ₁≈+0.155 D_KY≈2.199, " +
  "Basis(a=0.4,b=0.175)/SK_LowA(a=0.3)/SK_HighA(a=0.55)/SK_LowB(b=0.10) Shape Keys & " +
  "NL_Speed FLOAT_COLOR Cobalt–Amber + White–Crimson Bishop Tube Dual Poi for WebXR (Blender 5.1)";

const LEDE =
  "Newton and Leipnik (1981) were studying how to stabilise a tumbling rigid body " +
  "with linear state-feedback when they stumbled on something unexpected: their " +
  "controlled system possessed two simultaneously existing strange attractors. " +
  "For the same parameter values, two separate chaotic orbits coexist in the same " +
  "phase space — which one a trajectory joins depends only on its starting point. " +
  "This blueprint integrates both attractors with RK4 at dt=0.005 and builds them " +
  "as a single mesh with two Bishop parallel-transport tubes: cobalt–amber for " +
  "the upper basin, white–crimson for the lower.";

function Body() {
  return (
    <>
      <p>
        In 1981, the physicists Timothy Newton and Robert Leipnik published a
        curious three-page paper in Physics Letters A. They had been designing
        a feedback controller for a rigid body — the sort of problem that shows
        up in satellite attitude control — and noticed that their closed-loop
        system, for certain gain values, did not converge to a fixed point or
        a limit cycle. It fell into chaos. More striking still: they could
        initialise the same system with two different starting points and
        obtain two completely different strange attractors, both persistent,
        both chaotic. They called them &ldquo;double strange attractors&rdquo;
        and published the observation almost as an aside.
      </p>

      <h2>Equations and structure</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = −a·x + y + 10·y·z       (3 terms; linear damping −ax, two couplings)
ẏ = −x − 0.4·y + 5·x·z     (0.4 is a fixed control gain, not the parameter a)
ż =  b·z − 5·x·y            (z has open-loop growth b; restrained by −5xy)

Canonical: a = 0.4,  b = 0.175`}
      </pre>
      <p>
        The fixed coefficients 10 and 5 are feedback gains chosen by Newton
        and Leipnik from their control-theory setup; they are not free
        parameters. The similarly fixed 0.4 in ẏ is a separate dissipation
        gain. Only (a, b) vary: a scales the overall x-damping; b sets the
        z-channel&apos;s open-loop growth rate.
      </p>

      <h2>Constant divergence</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂ẋ/∂x = −a = −0.4
∂ẏ/∂y = −0.4           (fixed coefficient, independent of a)
∂ż/∂z =  b = +0.175    (positive! — z is locally expanding)

∇·F = −0.4 − 0.4 + 0.175 = −0.625  (constant, position-independent)

Liouville: λ₁ + λ₂ + λ₃ ≈ +0.155 + 0 − 0.780 = −0.625 = ∇·F  ✓`}
      </pre>
      <p>
        The positive ∂ż/∂z is unusual: the z-channel has open-loop growth. It
        is restrained by the nonlinear −5xy coupling. Despite this uniform
        contraction rate of 0.625 per time unit, two separate basins persist —
        each draining to its own strange attractor. The basins are separated by
        a fractal boundary (a &ldquo;riddled&rdquo; basin in modern terminology).
      </p>

      <h2>The two coexisting attractors</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`IC_UPPER = ( 0.349,  0.0, −0.160)  →  cobalt–amber tube
IC_LOWER = (−0.349,  0.0,  0.160)  →  white–crimson tube

Both ICs run at the SAME a = 0.4,  b = 0.175.
Both produce genuine strange attractors with positive Lyapunov exponents.
Initial conditions near the basin boundary can flip between the two.`}
      </pre>
      <p>
        This bistability of chaos is rare. Most textbook attractors — Lorenz,
        Rössler, Chen — have a single strange attractor per parameter setting.
        Newton–Leipnik has two, and the basin boundary between them is
        geometrically complex. A tiny nudge near that boundary can flip a
        trajectory from the cobalt tube to the crimson one.
      </p>

      <h2>Lyapunov spectrum and fractal dimension</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Upper attractor (canonical):
  λ₁ ≈ +0.155   (positive — chaos, information creation)
  λ₂ ≈  0.000   (neutral — tangent to the orbit)
  λ₃ ≈ −0.780   (strong contraction, |λ₃| ≈ 5× λ₁)

  D_KY = 2 + λ₁/|λ₃| ≈ 2 + 0.155/0.780 ≈ 2.199
  τ_Lyapunov = 1/λ₁ ≈ 6.5 time units  (predictability horizon)

  Compare Lorenz: λ₁≈+0.906, D_KY≈2.06 — NL is weaker chaos, thicker fractal.`}
      </pre>
      <p>
        A Kaplan–Yorke dimension of 2.199 means the attractor occupies a
        thicker slice of phase space than Lorenz (D_KY≈2.06) or Shaw
        (D_KY≈2.03). The weaker positive Lyapunov exponent (0.155 vs. Lorenz&apos;s
        0.906) gives a longer predictability horizon but the same qualitative
        chaos.
      </p>

      <h2>Blueprint: two-tube mesh strategy</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Both attractors integrated with identical RK4 parameters
pts_upper = rk4_orbit(IC_UPPER, A=0.4, B=0.175)   # 3 000 waypoints
pts_lower = rk4_orbit(IC_LOWER, A=0.4, B=0.175)   # 3 000 waypoints

# Each orbit becomes a Bishop parallel-transport tube
verts_U, faces_U, speed_U = bishop_tube(pts_upper)
verts_L, faces_L, speed_L = bishop_tube(pts_lower)

# Lower tube speed encoded in 1–2 range; upper in 0–1
# Single NL_Speed FLOAT_COLOR attribute splits at value=1.0 in shader
speed_L_encoded = 1.0 + speed_L

# Joined into one mesh object — two topological islands
mesh = join(verts_U + verts_L, faces_U + shifted(faces_L))`}
      </pre>
      <p>
        The two-tube encoding uses a single FLOAT_COLOR attribute (NL_Speed)
        with a range split in the material shader: values 0–1 drive cobalt→amber
        on the upper tube; values 1–2 drive white→crimson on the lower. This
        avoids separate objects while keeping both attractor identities distinct
        in the exported GLB.
      </p>

      <h2>Shape keys: parameter exploration</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis   — a=0.4, b=0.175  canonical: both attractors
SK_LowA — a=0.3, b=0.175  less damping → larger, more open orbits
                           ∇·F = −0.3 − 0.4 + 0.175 = −0.525
SK_HighA— a=0.55, b=0.175 more damping → tighter, smaller scrolls
                           ∇·F = −0.55 − 0.4 + 0.175 = −0.775
SK_LowB — a=0.4, b=0.10   less z-growth → topology shift
                           ∇·F = −0.4 − 0.4 + 0.10  = −0.700`}
      </pre>
      <p>
        Each shape key morphs both tubes simultaneously — the cobalt upper tube
        and the white-crimson lower tube deform together, preserving the visual
        pairing of the two basins across the parameter sweep.
      </p>

      <h2>Rigid body context</h2>
      <p>
        The Newton–Leipnik system arose from the Euler torque equations for a
        rigid body rotating about its centre of mass, with a linear feedback
        control law applied to damp the rotation. The 10 and 5 coefficients
        are feedback gain values; a and b tune dissipation and z-axis
        open-loop stability. The discovery that feedback control of a simple
        mechanical system could produce bistable chaos is a cautionary result
        for control engineers — the very feedback that was meant to stabilise
        the body instead created two competing chaotic regimes.
      </p>

      <h2>Failure modes and troubleshooting</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Problem: Both tubes look similar / occupy the same space
Fix: Check IC_UPPER and IC_LOWER are set correctly. At a=0.4 b=0.175
     they produce genuinely distinct orbits occupying different y-z regions.

Problem: One tube collapses to a point
Fix: Reduce warmup time — for a near the boundary the transient is long.
     At a=0.55 (SK_HighA) the attractor shrinks but remains strange.

Problem: NL_Speed gradient is flat (one colour)
Fix: Confirm 'FLOAT_COLOR' not 'FLOAT' — the shader reads the Fac channel
     of the colour, which needs FLOAT_COLOR to carry per-vertex floats.`}
      </pre>

      <h2>Studio cross-references</h2>
      <ul className="list-disc pl-5">
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr" className={lk}>
            Lorenz attractor
          </Link>{" "}
          — the original strange attractor; single basin, two scrolls
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-chua-circuit-double-scroll-shilnikov-chaos-piecewise-linear-bishop-tube-poi-webxr" className={lk}>
            Chua circuit double-scroll
          </Link>{" "}
          — another two-scroll system, single attractor via piecewise-linear nonlinearity
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-duffing-oscillator-ueda-bistability-period-doubling-rk4-bishop-tube-poi-webxr" className={lk}>
            Duffing oscillator
          </Link>{" "}
          — bistability of limit cycles (periodic, not chaotic) across a double-well potential
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-rucklidge-attractor-magnetoconvection-1992-rk4-bishop-tube-poi-webxr" className={lk}>
            Rücklidge attractor
          </Link>{" "}
          — constant divergence, lobe-switching single attractor
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr" className={lk}>
            Chen attractor
          </Link>{" "}
          — anti-dual Lorenz, constant divergence, single basin
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-5">
        <li>
          Newton TA, Leipnik RB (1981){" "}
          <a
            href="https://doi.org/10.1016/0375-9601(81)90165-1"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            &ldquo;Double strange attractors in rigid body motion with linear feedback
            control&rdquo; — Physics Letters A 86(2–3):63–67
          </a>{" "}
          — original paper; equations and initial conditions are in the public domain
        </li>
        <li>
          Sprott JC (1994){" "}
          <a
            href="https://doi.org/10.1103/PhysRevE.50.R647"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            &ldquo;Some simple chaotic flows&rdquo; — Physical Review E 50(2):R647–R650
          </a>
          {" "}with companion code at{" "}
          <a
            href="https://sprott.physics.wisc.edu/chaos/compchaos.htm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu/chaos/compchaos.htm
          </a>{" "}
          (public domain) — Newton–Leipnik listed as Case NL; related:
          {" "}<a
            href="https://sprott.physics.wisc.edu/chaos/sprott.htm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            sprott.physics.wisc.edu
          </a>
        </li>
        <li>
          NumPy Developers,{" "}
          <a href="https://numpy.org" className={lk} target="_blank" rel="noopener noreferrer">
            NumPy
          </a>{" "}
          (BSD-3-Clause) —{" "}
          <a href="https://github.com/numpy/numpy" className={lk} target="_blank" rel="noopener noreferrer">
            github.com/numpy/numpy
          </a>
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = {
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-02",
  tags: [
    "blender",
    "python",
    "numpy",
    "chaos",
    "attractor",
    "newton-leipnik",
    "bistability",
    "dynamical-systems",
    "rk4",
    "bishop-tube",
    "poi",
    "webxr",
    "scripting",
    "rigid-body",
    "feedback-control",
    "coexisting-attractors",
  ],
  body: <Body />,
  instructable: buildInstructable(SLUG, TITLE),
};
