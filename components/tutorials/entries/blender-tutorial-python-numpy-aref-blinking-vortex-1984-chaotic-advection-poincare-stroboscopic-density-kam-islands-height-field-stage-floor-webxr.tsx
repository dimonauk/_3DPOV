import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-aref-blinking-vortex-1984-chaotic-advection-poincare-stroboscopic-density-kam-islands-height-field-stage-floor-webxr";

const TITLE =
  "Python numpy — Aref Blinking Vortex 1984: Two Alternating Point Vortices " +
  "M=M₂∘M₁ Exact Rotation Map μ=ΓT/(2πa²) Area-Preserving Hamiltonian " +
  "Chaotic Advection KAM Islands Poincaré–Birkhoff Breakdown " +
  "9801 Particles 300 Periods Log-Density 120×120=14400V 14161Q " +
  "Basis(μ=4.0)/SK_Ordered(μ=1.5)/SK_Islands(μ=3.0)/SK_Turbulent(μ=7.0) " +
  "BV_Density FLOAT_COLOR Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "The Aref blinking vortex (1984) was the first system to demonstrate that a " +
  "smooth, non-turbulent, time-periodic 2-D velocity field can produce " +
  "exponentially diverging particle paths — what Aref named chaotic advection. " +
  "Two point vortices alternate with period T; each half-period every particle " +
  "rotates exactly about the active vortex (radius conserved, no RK4 needed). " +
  "The full-period map M = M₂∘M₁ is area-preserving, revealing KAM tori, " +
  "Poincaré–Birkhoff island chains, and an ergodic chaotic sea " +
  "as μ = ΓT/(2πa²) increases — all encoded as a 120×120 log-density height field.";

function Body() {
  return (
    <>
      <h2 className="mt-6 text-lg font-semibold">
        Chaotic advection — the discovery
      </h2>
      <p>
        In 1984 Hassan Aref published a paper that changed fluid mechanics: he
        showed that a perfectly smooth, time-periodic, two-dimensional velocity
        field — one that a physicist of the time would have called{" "}
        <em>laminar</em> — could produce{" "}
        <strong>chaotic particle trajectories</strong>. The velocity field
        itself is not turbulent; the Eulerian description is periodic and
        deterministic. It is the <em>Lagrangian</em> (particle-following) view
        that becomes chaotic. Aref coined the term{" "}
        <em>chaotic advection</em> for this phenomenon.
      </p>
      <p className="mt-3">
        The key insight: a time-periodic 2-D flow is formally equivalent to a
        Hamiltonian system with 1½ degrees of freedom. Such systems generically
        exhibit KAM structure — islands of regular motion embedded in a chaotic
        sea — exactly as in the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr"
        >
          Chirikov standard map
        </Link>{" "}
        or the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-zaslavsky-stochastic-web-kicked-oscillator-qfold-quasicrystal-stage-floor-webxr"
        >
          Zaslavsky stochastic web
        </Link>
        . The blinking vortex is the simplest physically motivated example.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        The exact map — why no RK4 is needed
      </h2>
      <p>
        Unlike the continuous attractors elsewhere in this library (Lorenz,
        Rössler, Sprott families), the blinking vortex admits an{" "}
        <strong>exact closed-form step map</strong>. During each half-period
        only one vortex is active; the induced velocity field is purely
        azimuthal — particles rotate about the active vortex with no radial
        drift. The half-period map M₁ is therefore:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-3 text-sm text-green-300">
        {`r² = (x − a)² + y²               # distance to vortex at (+a, 0)
ΔΘ = Γ · (T/2) / (2π · r²)       # angle advance
x′ = a + r·cos(θ + ΔΘ)
y′ =     r·sin(θ + ΔΘ)`}
      </pre>
      <p className="mt-3">
        M₂ is identical with vortex at (−a, 0). The full map M = M₂∘M₁ is
        computed exactly with numpy trigonometry — no integration error
        accumulates over 300 periods. This is the same philosophy as the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-chirikov-standard-map-kam-breakdown-greene-critical-threshold-stage-floor-webxr"
        >
          Chirikov map
        </Link>
        , where the area-preserving structure makes exact arithmetic both
        possible and preferable.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        The dimensionless parameter μ and the KAM cascade
      </h2>
      <p>
        The entire behaviour of the blinking vortex depends on a single
        number:
      </p>
      <pre className="mt-2 overflow-x-auto rounded bg-zinc-900 p-3 text-sm text-green-300">
        {`μ = ΓT / (2π a²)

  Γ = circulation of each vortex
  T = full blinking period
  a = half-separation between vortices`}
      </pre>
      <p className="mt-3">
        At small μ the system is near-integrable: particles stay on closed
        curves (KAM tori) and the density map shows concentric rings around
        each vortex site. As μ grows the tori break by the Poincaré–Birkhoff
        theorem — a period-n torus splits into n elliptic islands plus n
        hyperbolic points surrounded by a thin chaotic layer. Further
        increases erode the islands from the outside in (the KAM cascade)
        until only a few high-order resonance islands survive in a broadly
        ergodic sea.
      </p>
      <p className="mt-3">
        Compare this with the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-ftle-double-gyre-lagrangian-coherent-structures-ridge-height-field-stage-floor-webxr"
        >
          FTLE / Lagrangian coherent structures tutorial
        </Link>
        , which visualises the <em>boundaries</em> between chaotic and regular
        regions using finite-time Lyapunov exponents. The density map here is
        a complementary view: it shows <em>where particles accumulate</em>
        rather than where they diverge.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Four shape keys — μ scan
      </h2>
      <ul className="ml-5 mt-2 list-disc space-y-2">
        <li>
          <strong>Basis (μ = 4.0)</strong> — canonical chaos. Clear island
          chains survive (especially period-2 and period-3 resonances) within
          a broad chaotic sea. The height field shows sharp ridges where
          particles crowd onto surviving tori, surrounded by flatter chaotic
          zones.
        </li>
        <li>
          <strong>SK_Ordered (μ = 1.5)</strong> — near-integrable. The map is
          close to two independent rotations; most particles stay on smooth
          closed curves. The density map shows high narrow ridges (invariant
          curves) with very low inter-ring density.
        </li>
        <li>
          <strong>SK_Islands (μ = 3.0)</strong> — Poincaré–Birkhoff regime.
          The primary period-1 islands are breaking up; higher-order island
          chains (period-3, 4, 5) appear around them. The mesh shows a
          hierarchical ridge structure — the signature of the Birkhoff
          construction.
        </li>
        <li>
          <strong>SK_Turbulent (μ = 7.0)</strong> — nearly ergodic. The
          density is close to uniform across the chaotic sea; only
          high-period resonance islands (very small) survive. The mesh is
          nearly flat with slight residual ridges.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">
        Blender implementation notes
      </h2>
      <p>
        The script uses pure numpy vectorised operations: all 9 801 particles
        are propagated simultaneously each period with no Python loop over
        particles. Escaped particles (r &gt; 3.5) are masked out before
        density accumulation using{" "}
        <code className="rounded bg-zinc-800 px-1 text-xs">np.add.at</code>.
        The four density maps are computed sequentially, normalised to a
        common global maximum (so shape-key morphs are metrically comparable),
        and applied as vertex-z shape keys. The{" "}
        <code className="rounded bg-zinc-800 px-1 text-xs">BV_Density</code>{" "}
        FLOAT_COLOR attribute on each vertex encodes the Basis density as a
        cobalt-to-amber ramp, compatible with the studio&rsquo;s standard
        WebXR material pipeline — the same technique used in the{" "}
        <Link
          className={lk}
          href="/tutorials/blender-tutorial-python-numpy-kelvin-helmholtz-shear-instability-spectral-vorticity-height-field-stage-floor-webxr"
        >
          Kelvin–Helmholtz vorticity floor
        </Link>
        .
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Outside sources &amp; licence
      </h2>
      <ul className="ml-5 mt-2 list-disc space-y-2">
        <li>
          Hassan Aref,{" "}
          <em>Stirring by chaotic advection</em>, J. Fluid Mech.{" "}
          <strong>143</strong>, 1–21 (1984).{" "}
          <a
            className={lk}
            href="https://doi.org/10.1017/S0022112084001233"
            target="_blank"
            rel="noopener noreferrer"
          >
            DOI:10.1017/S0022112084001233
          </a>
          {" "}— foundational paper; mathematical formulation is public domain.
          Related sibling work: Ottino, J.M. (1989){" "}
          <em>The Kinematics of Mixing</em>, Cambridge University Press.
        </li>
        <li>
          Hassan Aref,{" "}
          <em>The development of chaotic advection</em>, Phys. Fluids{" "}
          <strong>14</strong>(4), 1315–1325 (2002).{" "}
          <a
            className={lk}
            href="https://doi.org/10.1063/1.1458932"
            target="_blank"
            rel="noopener noreferrer"
          >
            DOI:10.1063/1.1458932
          </a>
          {" "}— free-to-read historical review (AIP open access). Upstream
          community:{" "}
          <a
            className={lk}
            href="https://github.com/williamgilpin/dysts"
            target="_blank"
            rel="noopener noreferrer"
          >
            dysts benchmarks (MIT)
          </a>
          .
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">Troubleshooting</h2>
      <ul className="ml-5 mt-2 list-disc space-y-1">
        <li>
          <strong>Flat mesh / all zeros</strong> — all particles escaped before
          density accumulated. Reduce <code>R_ESCAPE</code> to 4.0 or increase{" "}
          <code>N_PERIODS</code>.
        </li>
        <li>
          <strong>Density dominated by a single peak</strong> — μ may be too
          small (near-periodic regime). Try μ = 3.5–5.0.
        </li>
        <li>
          <strong>Shape-key morph looks wrong</strong> — verify the four density
          maps were normalised to the same global maximum before writing vertex
          z-coordinates; without this, morphs between μ values are not
          comparable in height.
        </li>
        <li>
          <strong>Slow computation</strong> — reduce <code>N_PARTICLES</code>{" "}
          to 2 500 (50×50) for a quick preview; 9 801 × 300 × 4 is the
          production quality setting.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
    slug: SLUG,
    title: TITLE,
    lede: LEDE,
    date: "2026-09-05",
    topics: ["python", "numpy", "chaos", "fluid-mechanics", "height-field", "webxr"],
    body: Body,
  });
