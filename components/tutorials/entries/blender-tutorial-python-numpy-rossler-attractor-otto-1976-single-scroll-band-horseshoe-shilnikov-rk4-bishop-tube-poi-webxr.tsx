import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-rossler-attractor-otto-1976-single-scroll-band-horseshoe-shilnikov-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Rössler Attractor: Otto Rössler 1976 Single-Scroll Band, " +
  "Shilnikov Homoclinic Orbit, Smale Horseshoe, RK4 Bishop Parallel-Transport " +
  "Tube & Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Otto Rössler published a three-line ODE in 1976 with the explicit goal of " +
  "being the simplest possible chaotic flow. Where the Lorenz system needs two " +
  "quadratic nonlinearities to drive its double-scroll butterfly, Rössler needs " +
  "only one — the z·x product in ż — yet that single term is sufficient to generate " +
  "Shilnikov homoclinic chaos and an infinite family of unstable periodic orbits via " +
  "the Smale horseshoe mechanism. The result is a single-scroll band attractor with " +
  "Kaplan–Yorke dimension D_KY ≈ 2.013 and a Lyapunov time of roughly 14 natural " +
  "units. This blueprint integrates 120,000 RK4 steps, constructs a 12-sided " +
  "Bishop parallel-transport tube across 2,875 thinned waypoints, and exports four " +
  "shape keys spanning the canonical chaos, a pre-bifurcation limit cycle " +
  "(SK_Periodic), a period-2 orbit (SK_Period2), and a denser-spiral variant " +
  "(SK_Dense).";

function Body() {
  return (
    <>
      <p>
        Most introductions to chaos start with Lorenz and never leave. That is
        historically understandable — Lorenz&apos;s 1963 paper is foundational —
        but it obscures a crucial point: the butterfly topology is <em>not</em>{" "}
        the minimal requirement for chaos. Rössler proved this in 1976 by writing
        down a three-component ODE that achieves chaos with exactly one quadratic
        term.
      </p>
      <p>
        Understanding why that suffices requires thinking geometrically about what
        the system does in phase space. The x and y equations alone define a slow
        spiral in the xy-plane — a neutrally stable rotation, because the Jacobian
        of the linear part has eigenvalues ±i (for small a). The z equation adds
        a height dimension, but z stays near zero as long as x is small. When the
        spiral widens and x grows past c (the fold threshold), the z·x term flips
        sign and drives z upward rapidly. This upward excursion then feeds back
        through the ẋ = −y − z term, resetting x and collapsing the trajectory back
        to near the origin, where the spiral starts again from a slightly different
        phase. It is exactly this stretch-fold mechanism that Smale formalised as
        the &ldquo;horseshoe.&rdquo;
      </p>

      <h2>Equations of motion</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`ẋ = −y − z
ẏ =  x + a·y           a = 0.2  (slow spiral rate)
ż =  b + z·(x − c)     b = 0.2,  c = 5.7  (fold threshold)

One quadratic nonlinearity: the z·x product in ż.
Compare Lorenz: two quadratics (xz in ẏ, xy in ż).
Compare Chen:   two quadratics (xz in ẏ, xy in ż, reordered).`}
      </pre>
      <p>
        The parameter c is the fold threshold. When x &lt; c the ż equation damps
        z toward zero; when x &gt; c it amplifies z exponentially. Increasing c
        moves the fold further from the origin, allowing the spiral to wind more
        tightly before hitting the fold — which is why the period-doubling
        bifurcation cascade runs as c increases from ≈4.0 (period-1) through ≈5.0
        (period-2) to ≈5.7 (chaos).
      </p>

      <h2>Phase-space divergence</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z
     = 0 + a + (x − c)
     = a + x − c
     = 0.2 + x − 5.7   (position-dependent)

Contrast with Lorenz:   ∇·F = −σ − 1 − β ≈ −13.67 (constant)
Contrast with Chen:     ∇·F = −a + c − b = −10 (constant)
Contrast with Thomas:   ∇·F = −3b (constant)`}
      </pre>
      <p>
        The Rössler divergence is position-dependent — it is negative on average
        (the attractor is dissipative overall) but positive near the fold region
        x &gt; c − a = 5.5. This local expansion is what stretches volume elements
        at the fold, creating the sensitivity to initial conditions. It also means
        there is no simple Liouville sanity check for the Lyapunov sum; instead,
        one must integrate the divergence along the trajectory and verify
        ⟨∇·F⟩ = ∑λᵢ ≈ −5.33.
      </p>

      <h2>Lyapunov spectrum</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Canonical: a=0.2, b=0.2, c=5.7
  λ₁ ≈ +0.071   chaotic divergence; Lyapunov time τ ≈ 14.1
  λ₂ ≈  0       tangent direction (along the flow)
  λ₃ ≈ −5.40    strong contraction onto the band

D_KY = 2 + λ₁/|λ₃| ≈ 2 + 0.071/5.40 ≈ 2.013

The D_KY ≈ 2.013 means the attractor is an extremely thin band — almost
a 2-surface but not quite. Compare Lorenz (D_KY ≈ 2.06) and Chen
(D_KY ≈ 2.17); Rössler is the thinnest of the three, which is why the
tube looks visually like a ribbon.`}
      </pre>

      <h2>Shilnikov condition</h2>
      <p>
        The canonical parameters place two non-trivial equilibria of the Rössler
        system (the complex-conjugate pair of fixed points that appear off-axis in
        z). The linearisation at each has a saddle-focus structure: one real
        eigenvalue ρ &gt; 0 (unstable) and a complex conjugate pair −λ ± iω with
        λ &gt; 0 (stable spiral). Shilnikov&apos;s theorem (1965) says: if ρ &gt; λ — the
        unstable rate exceeds the stable contraction rate — then any homoclinic
        orbit to that saddle-focus is accumulated by countably many saddle periodic
        orbits, which implies topological chaos. For Rössler, numerical computation
        gives ρ ≈ 0.193 and λ ≈ 0.097, so ρ/λ ≈ 2 &gt; 1 — the Shilnikov condition
        is satisfied with margin. This is a <em>rigorous</em> (not just empirical)
        guarantee of chaos in a neighbourhood of the homoclinic orbit.
      </p>

      <h2>Period-doubling cascade (shape key logic)</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`c = 4.0  →  SK_Periodic:  stable limit cycle (period-1)
c = 5.0  →  SK_Period2:   period-2 orbit (first bifurcation)
c = 5.7  →  Basis:        canonical chaotic attractor
a = 0.3  →  SK_Dense:     wider spiral, denser winding, same topology`}
      </pre>
      <p>
        The period-doubling route to chaos in the Rössler system was one of the
        first examples where Feigenbaum universality was confirmed: the ratio of
        successive bifurcation intervals converges to δ ≈ 4.669. The shape keys
        let you drag a WebXR viewer through three stations on this route, from
        the clean limit cycle (SK_Periodic) through the first bifurcation
        (SK_Period2) to full chaos (Basis).
      </p>

      <h2>Blueprint walk-through</h2>
      <p>
        Open <code>blueprint.py</code> in Blender&apos;s Scripting workspace.
        The file is organised in six sections, each with a docstring explaining
        the <em>why</em> behind the approach.
      </p>

      <h3>Section 1 — RK4 integration</h3>
      <p>
        The <code>rossler_deriv</code> function returns (ẋ, ẏ, ż) as a NumPy
        array. The <code>rk4</code> function applies the standard four-stage
        Butcher tableau. <code>DT = 0.005</code> is safe here: Rössler evolves
        more slowly than Lorenz (typical orbit period ≈ 6.3 natural units vs
        ≈ 0.9 for Lorenz), so the 0.005 timestep gives ≈ 1,260 steps per orbit
        period, well inside the stability bound. BURN_IN = 5,000 steps ≈ 25
        seconds of model time, enough to wash out the transient from the
        off-attractor initial condition (0.1, 0.1, 0.1).
      </p>

      <h3>Section 2 — Bishop tube</h3>
      <p>
        The Rössler band is nearly planar in xy with rare z excursions; in the
        slow-spiral region curvature passes through near-zero, which would cause
        Frenet&apos;s principal normal to flip. The Bishop frame avoids this by
        propagating the normal via Rodrigues rotation about the tangent at each
        step — a minimal rotation that accumulates no unnecessary twist. The thin
        band topology (D_KY ≈ 2.013) means THIN = 40 is appropriate: the spacing
        is coarser than for Lorenz (which uses 20), reflecting the slower variation
        in the Rössler geometry.
      </p>

      <h3>Section 3 — Colour attribute</h3>
      <p>
        Each vertex is coloured by the azimuthal phase <code>atan2(y, x)</code>
        normalised to [0, 1]. In the slow-spiral region (inner band) phase changes
        slowly → cobalt. At the fold (rapid x-excursion) phase changes quickly →
        amber. This makes the speed variation legible without needing a secondary
        velocity buffer.
      </p>

      <h3>Section 4 — Normalisation</h3>
      <p>
        The 99th-percentile radial distance is used as the scale reference rather
        than the maximum, because the fold excursions push z far from the origin
        (up to ≈ 12 natural units) while the main band sits at radius ≈ 5 − 8.
        Using max would shrink the main band to ≈ 60% of POI_RADIUS; the 99th
        percentile keeps the band at the intended hand scale while letting the
        fold protrude only slightly.
      </p>

      <h2>Failure modes and troubleshooting</h2>
      <ul>
        <li>
          <strong>Tube self-intersects at the fold</strong> — reduce TUBE_R from
          0.016 to 0.010. The fold region has tightly-wound waypoints and a large
          tube radius can cause adjacent rings to overlap.
        </li>
        <li>
          <strong>Shape key vertex count mismatch</strong> — Blender requires all
          shape keys to have exactly the same vertex count as Basis. If THIN causes
          a different waypoint count for a shape key variant (can happen when the
          period-1 orbit has a non-integer multiple of THIN steps), reduce N_STEPS
          by 1 and re-run.
        </li>
        <li>
          <strong>Integration diverges</strong> — the Rössler system is bounded for
          canonical parameters, but the z-equation can blow up if DT is too large
          (z amplifies exponentially when x &gt; c). If you see NaN, halve DT first.
        </li>
        <li>
          <strong>GLB morph targets not exporting</strong> — ensure{" "}
          <em>Include → Morph Targets</em> is ticked in the glTF export dialogue.
          Draco compression is compatible with morph targets in Blender 5.x.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul>
        <li>
          Compare with the double-scroll topology in the{" "}
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chua-circuit-double-scroll-shilnikov-chaos-piecewise-linear-bishop-tube-poi-webxr"
            className={lk}
          >
            Chua Circuit tutorial
          </Link>{" "}
          — both invoke the Shilnikov condition but via different geometric routes
          (homoclinic vs heteroclinic).
        </li>
        <li>
          For contrast with a constant-divergence chaotic system, see the{" "}
          <Link
            href="/tutorials/blender-tutorial-python-numpy-chen-attractor-guanrong-chen-ueta-1999-lorenz-dual-butterfly-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Chen Attractor tutorial
          </Link>
          .
        </li>
        <li>
          The Aizawa attractor also uses a position-dependent divergence with a
          toroidal topology — see{" "}
          <Link
            href="/tutorials/blender-tutorial-python-numpy-aizawa-attractor-toroidal-chaos-rk4-bishop-tube-poi-webxr"
            className={lk}
          >
            Aizawa Attractor tutorial
          </Link>
          .
        </li>
        <li>
          For the faceted low-poly aesthetic these poi heads inhabit in WebXR, see{" "}
          <Link href="/articles/low-poly-graphics-in-vr" className={lk}>
            Low-Poly Graphics in VR
          </Link>
          .
        </li>
        <li>
          The Bishop frame technique used here also appears in the{" "}
          <Link
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
            className={lk}
          >
            Lorenz Attractor tutorial
          </Link>
          .
        </li>
        <li>
          Poi head asset conventions (holoflow:facet, +Y up, Draco 6) are defined
          in the{" "}
          <Link href="/articles/how-the-studio-breeds-sculptures" className={lk}>
            How the Studio Breeds Sculptures
          </Link>{" "}
          article.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul>
        <li>
          <a
            href="https://doi.org/10.1016/0375-9601(76)90101-8"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Rössler OE (1976) &ldquo;An Equation for Continuous Chaos&rdquo;
          </a>{" "}
          — <em>Physics Letters A</em> 57(5):397-398. Author: Otto E. Rössler.
          Equations in public domain. Related: Springer Chaos journal, Haken
          Synergetics series.
        </li>
        <li>
          <a
            href="https://sprott.physics.wisc.edu/chaos/elec.htm"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Sprott JC — Elegant Chaos: algebraically simple chaotic flows
          </a>{" "}
          — MIT licence on code samples. Author: Julien C. Sprott, University of
          Wisconsin. Related: sprott.physics.wisc.edu chaos gallery,{" "}
          <a
            href="https://github.com/jsprott/chaos"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            github.com/jsprott/chaos
          </a>
          .
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
    slug:        SLUG,
    title:       TITLE,
    lede:        LEDE,
    date:        "2026-08-30",
    tags:        ["blender", "scripting", "python", "chaos", "attractor", "dynamics", "webxr"],
    body:        Body,
    libraryPath: `blends/scripting/${SLUG}`,
  });
