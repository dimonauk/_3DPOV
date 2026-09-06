import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-complex-ginzburg-landau-pde-spiral-turbulence-benjamin-feir-defect-height-field-stage-floor-webxr";

const TITLE =
  "Python numpy — Complex Ginzburg–Landau Equation: ∂A/∂t = A + (1+ic₁)∇²A − (1+ic₂)|A|²A, ETD1 Fourier Spectral, Benjamin–Feir Instability 1+c₁c₂<0, Spiral Turbulence, Phase Defects, 128×128 Height-Field Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "Every oscillating system — laser cavities, chemical clocks, convecting fluid — obeys the same master equation near the onset of oscillation: the Complex Ginzburg–Landau equation. One complex field A(x,y,t) encodes both amplitude and phase; a single inequality 1+c₁c₂<0 (Benjamin–Feir criterion) separates frozen spiral patterns from fully chaotic defect turbulence. This blueprint integrates it on a 128×128 periodic grid using an Exponential Time Differencing scheme that is unconditionally stable, maps |A| to vertex height, and exports a stage-floor mesh with four shape keys spanning the entire pattern phase diagram.";

function Body() {
  return (
    <>
      <p>
        The <strong>Complex Ginzburg–Landau equation</strong> (CGLE) sits at the
        intersection of three great ideas: Landau's mean-field theory of phase
        transitions, Hopf's theory of oscillating equilibria, and pattern-formation
        science à la Turing. It was written down by Ginzburg and Landau in 1950 to
        describe superconductors; Stuart and DiPrima derived it in 1978 as the
        universal amplitude equation for any spatially extended oscillating system.
        Unlike the Brusselator or Gray–Scott (which need two species), the CGLE
        needs exactly one — a <em>complex</em> field A ∈ ℂ whose modulus |A|
        measures oscillation amplitude and whose argument ∠A measures phase.
      </p>

      <h2>The equation</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`∂A/∂t = A + (1+ic₁)∇²A − (1+ic₂)|A|²A

Terms:
  A               — linear growth (supercritical bifurcation pumping)
  (1+ic₁)∇²A     — diffusion with dispersion c₁ (controls spiral wavelength)
  −(1+ic₂)|A|²A  — nonlinear saturation; c₂ shifts frequency with amplitude

Fixed points: |A|=0 (unstable), |A|=1 (uniform oscillation, marginally stable)
Plane wave solution: A(x,t) = r·exp(i(k·x − ωt))
  r² = 1 − k²,  ω = −c₂ + (c₁−c₂)k²  (nonlinear dispersion relation)`}
      </pre>

      <h2>Benjamin–Feir instability</h2>
      <p>
        Newell (1974) showed that the uniform-amplitude plane wave A = exp(−ic₂t)
        is <strong>linearly unstable</strong> when:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Benjamin–Feir criterion:  1 + c₁c₂ < 0

|c₁c₂| < 1  →  plane wave stable   → frozen spiral defects or no pattern
|c₁c₂| > 1  →  plane wave unstable → phase turbulence (mild) or defect turbulence

Phase diagram (Chaté & Manneville 1996):
  Region I    — stable, no defects (below BF)
  Region II   — phase turbulence (BF unstable, small defect density)
  Region III  — defect / amplitude turbulence (high defect density, |A|≈0 pockets)

This blueprint samples four representative points:`}
      </pre>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Shape key       c₁    c₂    c₁c₂   BF    Pattern
─────────────────────────────────────────────────────────
Basis          0.50  −1.40  −0.70  no    spiral wall lattice
SK_Turbulent   2.00  −1.50  −3.00  YES   defect turbulence
SK_PhaseTurb   0.80  −1.80  −1.44  YES   phase turbulence
SK_Frozen      0.20  −0.60  −0.12  no    frozen spiral cores`}
      </pre>

      <h2>Why ETD1 and not RK4?</h2>
      <p>
        In Fourier space the CGLE splits into a linear stiff part and a mild
        nonlinear part. The linear operator is L(k) = 1 − (1+ic₁)|k|², which for
        high wavenumbers k has large negative real part — a stiffness that forces
        explicit RK4 to use dt ≲ (Δx)²/2. On a 128-point grid that means
        dt ≈ 3×10⁻⁴. The ETD1 scheme (Cox &amp; Matthews 2002) treats L exactly:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Â_{n+1} = exp(L·dt)·Â_n + φ₁(L,dt)·N̂_n

φ₁ = expm1(L·dt) / L     (use numpy.expm1 for numerical safety)
N(A) = −(1+ic₂)|A|²A    (computed in physical space, FFT'd back)

When L→0 (k=0 mode): φ₁ → dt  (Taylor limit, handled by the np.where guard).

WHY this is unconditionally stable: the factor exp(L·dt) has magnitude
exp(Re(L)·dt). For all k: Re(L) = 1 − |k|² ≤ 1.  At k=0 it is +1 (growth);
at large k it is very negative (decay). The exponential keeps it bounded.
Cost: only two FFT/IFFT pairs per step. Same as explicit, far larger dt.`}
      </pre>

      <h2>Mesh and colour</h2>
      <p>
        The 128×128 grid maps to a 32 m × 32 m quad mesh (+Y-up, holoflow
        convention). Vertex Z = |A| × 4.0, so the unit-amplitude uniform state sits
        at 4 m height. Turbulent voids (|A| ≈ 0) drop to floor level. Phase defects
        — points where ∠A is undefined (|A| = 0) — appear as sharp craters
        surrounded by swirling cobalt–amber arms in the <code>CGL_Phase</code>{" "}
        FLOAT_COLOR attribute (phase ∈ [−π,π] mapped linearly).
      </p>

      <h2>Physics the mesh reveals</h2>
      <p>
        <strong>Basis (stable spirals):</strong> long-wavelength corugations with
        roughly circular ridges meeting at stable core points. The phase increases
        monotonically around each core — a winding number ±1 topological defect
        that cannot be removed without a partner annihilation. Far from BF, these
        cores barely drift.
      </p>
      <p>
        <strong>SK_Turbulent (defect turbulence):</strong> the landscape becomes
        statistically rough. New core/anti-core pairs nucleate continuously; pairs of
        opposite sign drift toward each other and annihilate. Mean defect density
        obeys a power law in (c₁c₂ + 1) above threshold. The height field has a
        broad variance.
      </p>

      <h2>Failure modes and how to fix them</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Problem: Mesh is flat / all vertices at z=0
→ Check that blueprint.py runs BEFORE record.py. bpy.ops.wm.read_factory_settings
  clears the scene; run as a single script, not two sessions.

Problem: All colours identical (cobalt or amber)
→ The phase may not have wrapped — check np.angle(A_final) range in console.
  Typical range is [−π, π]; if all ≈ 0 the integration converged prematurely
  (increase N_STEPS or reduce dt if oscillations damp out).

Problem: GLB export fails — shape keys missing
→ Blender requires object.shape_key_add() not mesh.shape_keys.new().
  The blueprint uses bpy.data.objects[OBJ_NAME].shape_key_add — verify
  OBJ_NAME matches the actual object name.

Problem: BF turbulent shape key looks identical to Basis
→ SK_Turbulent uses c₂=−1.5 which needs enough run time to develop turbulence.
  Increase N_STEPS from 600 to 1200 for SK_Turbulent only if needed.`}
      </pre>

      <h2>Cross-references</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-pattern-height-field-webxr" className={lk}>
            Gray–Scott reaction-diffusion
          </Link>{" "}
          — two-species Turing pattern by contrast, no oscillation.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-brusselator-prigogine-lefever-1968-turing-instability-hopf-dissipative-stage-floor-webxr" className={lk}>
            Brusselator — Turing + Hopf instability
          </Link>{" "}
          — the other canonical oscillatory PDE; here c₁=c₂=0 recovers ODE limit.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-kelvin-helmholtz-shear-instability-spectral-vorticity-height-field-stage-floor-webxr" className={lk}>
            Kelvin–Helmholtz vorticity — spectral PDE height field
          </Link>{" "}
          — same pseudospectral FFT approach, real vorticity field.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-kuramoto-sivashinsky-pde-spatiotemporal-chaos-flame-front-height-field-stage-floor-webxr" className={lk}>
            Kuramoto–Sivashinsky — flame-front spatiotemporal chaos
          </Link>{" "}
          — ETD scheme cousin; 4th-order vs CGLE 2nd-order stiffness.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing" className={lk}>
            GN Simulation Zone — Turing reaction-diffusion
          </Link>{" "}
          — Geometry Nodes version of the same concept, no Python.
        </li>
      </ul>

      <h2>Outside sources &amp; attribution</h2>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <strong>Aranson &amp; Kramer 2002</strong> —{" "}
          <em>"The world of the complex Ginzburg–Landau equation"</em>,{" "}
          Rev Mod Phys 74:99.{" "}
          <a href="https://arxiv.org/abs/cond-mat/0106115" className={lk} target="_blank" rel="noreferrer">
            arXiv:cond-mat/0106115
          </a>{" "}
          (open access, CC0). Canonical review; phase-diagram coordinates from Table I.
        </li>
        <li>
          <strong>Cox &amp; Matthews 2002</strong> —{" "}
          <em>"Exponential time differencing for stiff systems"</em>,{" "}
          J Comput Phys 176:430.{" "}
          DOI{" "}
          <a href="https://doi.org/10.1006/jcph.2002.6995" className={lk} target="_blank" rel="noreferrer">
            10.1006/jcph.2002.6995
          </a>
          {". "}
          ETD1/ETD2RK algorithm — public-domain numerical method.
        </li>
        <li>
          <strong>Cross &amp; Hohenberg 1993</strong> —{" "}
          <em>"Pattern formation outside of equilibrium"</em>,{" "}
          Rev Mod Phys 65:851.{" "}
          DOI 10.1103/RevModPhys.65.851. Definitive reference for amplitude equations
          and Benjamin–Feir theory (§IIID).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-06",
  topics: ["scripting", "simulation", "pde", "numpy", "stage-floor", "webxr"],
  body: Body,
  library: {
    blend:
      "public/library/blends/scripting/" +
      "python-numpy-complex-ginzburg-landau-pde-spiral-turbulence-" +
      "benjamin-feir-defect-height-field-stage-floor-webxr/" +
      "holoflow_cgl_floor.blend",
    glb:
      "public/library/glbs/scripting/" +
      "python-numpy-complex-ginzburg-landau-pde-spiral-turbulence-" +
      "benjamin-feir-defect-height-field-stage-floor-webxr/" +
      "holoflow_cgl_floor.glb",
  },
});
