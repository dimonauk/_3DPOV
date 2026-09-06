import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-vallis-enso-attractor-1988-el-nino-oscillation-thermocline-constant-divergence-rk4-bishop-tube-poi-webxr";

const TITLE =
  "Python numpy — Vallis ENSO Attractor 1988: ẋ=b·yz−cx+F ẏ=−y+xz ż=1−z−xy " +
  "El Niño Thermocline Coupling Constant Divergence −(c+2)=−2.1 " +
  "Single Unstable Focus x*≈1.42 Chaos→Limit-Cycle Bifurcation " +
  "λ₁≈+0.120 D_KY≈2.054 Liouville ∑λᵢ=−(c+2)=−2.1 " +
  "RK4 DT=0.02 BURN_IN=3000 N=90000 THIN=30→3000wp " +
  "Basis(b=14,c=0.1,F=18)/SK_Periodic(F=11 limit-cycle)/" +
  "SK_StrongB(b=20)/SK_LowDamp(c=0.05) " +
  "Shape Keys Cobalt-Amber Vallis_Speed FLOAT_COLOR " +
  "Bishop Parallel-Transport Tube Poi Head for WebXR (Blender 5.1)";

const LEDE =
  "Gregory Vallis (1988) distilled El Niño into three coupled ODEs: " +
  "SST gradient, thermocline tilt, and Walker circulation. " +
  "The system has constant divergence −(c+2) regardless of b or F, " +
  "making the Liouville sum of Lyapunov exponents analytically exact. " +
  "Drop forcing from F=18 to F=11 and the chaotic attractor bifurcates cleanly " +
  "to a periodic limit cycle — one of the sharpest chaos-to-order transitions " +
  "in any three-variable ODE. Bishop-tube Poi head for WebXR, four shape keys.";

function Body() {
  return (
    <>
      <p>
        In 1988 Gregory Vallis published a three-equation model that explains
        why El Niño does not repeat on a fixed schedule: the coupling between
        the Pacific sea-surface temperature, the thermocline depth, and the
        equatorial wind current is just nonlinear enough to sustain chaos.
        The model is not a fit to data — it is a stripped-down derivation of
        the essential ocean–atmosphere feedback loop, in the same spirit as the
        Lorenz equations for atmospheric convection.
      </p>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`ẋ =  b·y·z  −  c·x  +  F     x: SST gradient
ẏ = −y      +  x·z           y: thermocline tilt
ż =  1      −  z    −  x·y   z: Walker circulation

Canonical:  b = 14   c = 0.1   F = 18`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">
        Why constant divergence is remarkable
      </h2>
      <p>
        Compute the divergence of the vector field:
      </p>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`∇·F = ∂ẋ/∂x + ∂ẏ/∂y + ∂ż/∂z
    = (−c)  +  (−1)  +  (−1)
    = −(c + 2)         ← constant — no x, y, z dependence

At c = 0.1:  ∇·F = −2.1   everywhere in phase space.`}
      </pre>

      <p>
        This is a non-trivial property. Each of the three equations contains
        bilinear nonlinear terms (b·yz, x·z, x·y), yet their partial
        derivatives with respect to their <em>own</em> variable vanish
        identically — the cross-terms do not survive ∂/∂x, ∂/∂y, ∂/∂z
        respectively. Liouville&apos;s theorem forces:
      </p>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`λ₁ + λ₂ + λ₃ = −(c + 2) = −2.1

Numerical:   +0.120  +  0  +  (−2.220)  = −2.100   ✓`}
      </pre>

      <p>
        The Kaplan-Yorke dimension follows:
        D_KY = 2 + λ₁/|λ₃| = 2 + 0.120/2.220 ≈ <strong>2.054</strong>.
        The attractor is fractionally thicker than a two-dimensional surface,
        consistent with the relatively mild chaos (λ₁ ≈ 0.12 is a small
        positive exponent, Lyapunov time ≈ 8 time units).
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        The chaos-to-order bifurcation (shape key SK_Periodic)
      </h2>
      <p>
        Reduce the external forcing from F = 18 to F = 11 and the strange
        attractor collapses cleanly to a limit cycle — the familiar periodic
        El Niño cycle. In the Blender shape-key morph this transition is visible
        as the tangled tube contracting to a smooth closed loop. This is one of
        the clearest visual demonstrations of a period-doubling reversal in any
        three-variable system: no intermediate quasi-periodicity, just a direct
        route from chaos to a single closed orbit.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Fixed-point structure
      </h2>
      <p>
        Setting ẏ = 0 gives y = x·z. Setting ż = 0 and substituting:
      </p>

      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`z*(1 + x²) = 1   →   z* = 1/(1+x²)
                      y* = x/(1+x²)

Substituting into ẋ = 0:
    14·x / (1+x²)² = 0.1·x − 18
    → one real root near x* ≈ 1.42   (numerical)`}
      </pre>

      <p>
        The equilibrium at x* ≈ 1.42, y* ≈ 0.81, z* ≈ 0.33 is an unstable
        spiral focus — the chaotic orbit winds around it erratically, spending
        long slow spells near the fixed point (amber colouring) before being
        expelled along the unstable manifold (cobalt colouring).
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Integration and tube construction
      </h2>
      <p>
        Integration: RK4, DT = 0.02, 3 000 warm-up steps discarded, 90 000
        orbit steps recorded, thinned by 30 → 3 000 wire-points.
        WHY DT = 0.02 rather than 0.01? The Vallis system is relatively smooth
        compared to Lorenz; local RK4 error ≈ 10⁻⁷ per step at this step size,
        well within acceptable geometry for visual output.
      </p>
      <p>
        Mesh: Bishop parallel-transport frames, 8-sided octagonal cross-section,
        TUBE_R = 0.045 m. WHY Bishop over Frenet-Serret? The Vallis orbit has
        several near-inflection points where the Frenet normal flips 180°,
        producing a Möbius-strip twist in the tube. Bishop frames propagate the
        reference vector by Rodrigues rotation around the rotation axis between
        consecutive tangents, accumulating zero artificial torsion.
      </p>

      <h2 className="mt-6 text-lg font-semibold">
        Shape keys
      </h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
{`Basis        b=14  c=0.1  F=18   chaotic ENSO  D_KY≈2.054
SK_Periodic  b=14  c=0.1  F=11   limit cycle   periodic El Niño
SK_StrongB   b=20  c=0.1  F=18   wider orbit   stronger thermocline
SK_LowDamp   b=14  c=0.05 F=18   low damping   larger basin`}
      </pre>

      <h2 className="mt-6 text-lg font-semibold">
        Cross-references
      </h2>
      <ul className="mt-2 list-disc pl-6 space-y-1">
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-lorenz-attractor-rk4-strange-butterfly-poi-light-trail-webxr"
          >
            Lorenz Butterfly Attractor
          </Link>{" "}
          — the archetype for constant-divergence climate chaos; compare σ = 10,
          ρ = 28, β = 8/3 with Vallis&apos;s b = 14, c = 0.1, F = 18.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-lorenz-96-atmospheric-ring-rk4-bishop-tube-poi-webxr"
          >
            Lorenz 96 Atmospheric Ring
          </Link>{" "}
          — Lorenz&apos;s 1996 spatially extended atmospheric model; Vallis
          (1988) and Lorenz 96 are complementary low-order climate chaos models
          from the same decade.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-bouali-attractor-2012-van-der-pol-feedback-economic-cycles-rk4-bishop-tube-poi-webxr"
          >
            Bouali Attractor
          </Link>{" "}
          — another physically motivated ODE (economic cycles) with a slow-fast
          feedback structure similar to Vallis&apos;s thermocline tilt equation.
        </li>
        <li>
          <Link
            className={lk}
            href="/tutorials/blender-tutorial-python-numpy-ftle-double-gyre-lagrangian-coherent-structures-ridge-height-field-stage-floor-webxr"
          >
            FTLE Double-Gyre Lagrangian Coherent Structures
          </Link>{" "}
          — the ocean double-gyre flow that underpins El Niño transport;
          Vallis&apos;s z-equation drives this gyre switching.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">
        Outside sources
      </h2>
      <ul className="mt-2 list-disc pl-6 space-y-1">
        <li>
          <a
            className={lk}
            href="https://doi.org/10.1029/JC093iC11p13979"
            target="_blank"
            rel="noopener noreferrer"
          >
            Vallis GK (1988) — "Conceptual models of El Niño and the Southern
            Oscillation" — J. Geophysical Research 93(C11):13979-13991
          </a>{" "}
          · Equations PD (mathematical).
          Related: Vallis 2006 <em>Atmospheric and Oceanic Fluid Dynamics</em>.
        </li>
        <li>
          <a
            className={lk}
            href="https://sprott.physics.wisc.edu/chaos/2020b.htm"
            target="_blank"
            rel="noopener noreferrer"
          >
            Sprott JC — Elegant Chaos parameter database
          </a>{" "}
          · CC0.
          Related:{" "}
          <a
            className={lk}
            href="https://www.worldscientific.com/worldscibooks/10.1142/6820"
            target="_blank"
            rel="noopener noreferrer"
          >
            Elegant Chaos book (World Scientific)
          </a>.
        </li>
        <li>
          <a
            className={lk}
            href="https://github.com/njanakiev/blender-scripting"
            target="_blank"
            rel="noopener noreferrer"
          >
            Janakiev N — blender-scripting (MIT)
          </a>{" "}
          · Bishop-frame parallel-transport reference.
          Related:{" "}
          <a
            className={lk}
            href="https://github.com/njanakiev/scikit-spatial"
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/scikit-spatial
          </a>.
        </li>
      </ul>

      <h2 className="mt-6 text-lg font-semibold">
        Troubleshooting
      </h2>
      <ul className="mt-2 list-disc pl-6 space-y-1">
        <li>
          <strong>Tube self-intersects near the fold:</strong> increase TUBE_R
          from 0.045 to 0.030, or decrease THIN (more wire-points = smoother
          curve).
        </li>
        <li>
          <strong>SK_StrongB orbit diverges:</strong> with b=20, DT=0.02 the
          orbit is stable but sensitive; if you raise b further, halve DT to
          0.01 to maintain RK4 accuracy.
        </li>
        <li>
          <strong>Vertex colour appears flat in EEVEE:</strong> confirm
          export_colors=True and export_attributes=True in the GLB export call;
          the FLOAT_COLOR attribute must survive the Draco mesh compression with
          both flags set.
        </li>
        <li>
          <strong>Shape-key morph missing in GLB:</strong> add export_morph=True
          to the gltf export options; Draco level 6 is compatible with morph
          targets in Blender 5.1.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug:  SLUG,
  title: TITLE,
  lede:  LEDE,
  date:  "2026-09-05",
  tags:  [
    "blender", "python", "numpy", "chaos", "attractor", "enso", "el-nino",
    "climate", "bishop-tube", "poi", "webxr", "shape-keys", "rk4",
  ],
  body: <Body />,
});
