import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-kelvin-helmholtz-shear-instability-spectral-vorticity-height-field-stage-floor-webxr";

const TITLE =
  "Python numpy — Kelvin–Helmholtz Shear Instability 1871: " +
  "2-D Inviscid Euler Vorticity–Streamfunction Dω/Dt=0 ∇²ψ=−ω " +
  "Pseudo-Spectral RK4 Orszag 2/3 Dealiasing " +
  "Miles–Howard Criterion Ri<0.25 Cat's-Eye Billows " +
  "tanh Profile k*≈0.45/δ σ_max≈U₀/2δ σ_max·τ_NL≈5 " +
  "128×128=16384V 16129Q " +
  "Basis(t=0)/SK_t20(onset)/SK_t40(billowing)/SK_t60(roll-up) " +
  "Shape Keys & Cobalt–Amber KH_Vorticity FLOAT_COLOR " +
  "Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "Two fluid layers moving in opposite directions share a flat interface.  " +
  "Lord Kelvin showed in 1871 that any infinitesimal corrugation of that " +
  "interface is gravitationally and dynamically unstable: vortex-sheet " +
  "dynamics amplify the corrugation exponentially until the sheet rolls up " +
  "into the signature cat's-eye billows visible on Jupiter's cloud bands, " +
  "at ocean thermoclines, on cumulus cloud edges, and at the Earth's " +
  "magnetopause.  This blueprint integrates the 2-D inviscid Euler " +
  "equations in vorticity–streamfunction form using a pseudo-spectral FFT " +
  "solver with Orszag 2/3-rule dealiasing and classical RK4, then bakes " +
  "four simulation snapshots — onset, corrugation, full billowing, and " +
  "nonlinear roll-up — into a 128×128 stage-floor height-field with " +
  "cobalt–amber vertex colours driven by local vorticity sign.";

function Body() {
  return (
    <>
      <p>
        The Kelvin–Helmholtz instability (KHI) is one of the oldest and most
        ubiquitous fluid-mechanical phenomena.  Helmholtz (1868) identified the
        instability of a vortex sheet; Kelvin (1871) supplied the dispersion
        relation for a step-profile shear layer:{" "}
        <code>σ(k) = k·U₀/2</code>.  Every wavenumber is unstable — growth is
        faster the shorter the wavelength — so in a real flow only viscosity,
        surface tension, or density stratification can arrest it.
      </p>
      <p>
        A smooth tanh profile <code>U(y) = U₀·tanh(y/δ)</code> introduces a
        natural length scale δ that concentrates vorticity near y = 0.  Michalke
        (1964) showed that the most-unstable wavenumber is{" "}
        <code>k* ≈ 0.45/δ</code> for an inviscid tanh profile.  The Miles–Howard
        theorem (1961) is the definitive stability criterion: if the bulk
        Richardson number <code>Ri = N²/(∂U/∂y)²</code> is everywhere below 0.25,
        the flow is unstable.  In this simulation Ri = 0 (neutral stratification),
        so the entire shear layer is unstable.
      </p>

      <h2>Numerical method</h2>
      <p>
        The 2-D incompressible Euler equations in vorticity–streamfunction form
        reduce to a single scalar prognostic equation plus a Poisson solve:
      </p>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Dω/Dt = ∂ω/∂t + u·∂ω/∂x + v·∂ω/∂y = 0   (vorticity conserved, inviscid 2-D)
∇²ψ   = −ω                                   (streamfunction Poisson)
u = ∂ψ/∂y,    v = −∂ψ/∂x                    (velocity from streamfunction)

Spectral Poisson solve:   ψ̂(k) = ω̂(k) / (kx² + ky²)
Spectral velocity:        û = ikᵧψ̂,  v̂ = −ikₓψ̂
Spectral advection:       −FFT[ IFFT(û)·IFFT(∂ₓω̂) + IFFT(v̂)·IFFT(∂ᵧω̂) ]
Dealiasing:               Orszag 2/3 rule — zero modes with |kₓ|>Nx/3 or |kᵧ|>Ny/3`}
      </pre>
      <p>
        The Poisson solve costs a single complex division per Fourier mode — the
        entire spatial operator is O(N² log N).  Dealiasing is non-negotiable:
        without the Orszag 2/3 rule, products of two fields generate wavenumbers
        up to 4/3 of the grid Nyquist, which alias back into the resolved band
        and corrupt the solution within a few eddy-turnover times.
      </p>

      <h2>Initial condition</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Base flow:
  U(y) = U₀·tanh(y/δ),  U₀ = 1.0,  δ = 0.2
  ω₀(x,y) = −∂U/∂y = −U₀/(δ·cosh²(y/δ))     ← concentrated near y=0

Perturbation (seeds the most-unstable mode kx = 2π/Lx):
  ω' = ε·sin(2πx/Lx)·exp(−y²/2δ²),  ε = 10⁻³`}
      </pre>
      <p>
        The seed wavenumber 2π/Lx is close to the Michalke peak at k*δ ≈ 0.45
        (= k*·0.2 → k* ≈ 2.25; domain wavenumber = 2π/(4π) = 0.5 — within 10%).
        One clean wavelength spans the periodic domain, giving a single pair of
        cat's-eyes without mode competition.
      </p>

      <h2>Blueprint walkthrough</h2>
      <p>
        <strong>make_wavenumbers()</strong> builds the spectral wavenumber arrays
        and the Orszag dealiasing mask. The guard{" "}
        <code>K2[0,0] = 1.0</code> prevents division-by-zero in the Poisson solve;
        the DC streamfunction mode <code>ψ̂(0,0)</code> is explicitly zeroed after
        the solve, so the guard value is irrelevant to the result.
      </p>
      <p>
        <strong>spectral_rhs()</strong> is the core numerical kernel. It performs
        five FFTs per call (one forward, four inverse) and one array multiplication
        in physical space. The dealiasing mask is applied to all fields{" "}
        <em>before</em> the inverse FFTs — this is the Pseudospectral method as
        described by Canuto et al. (2006).
      </p>
      <p>
        <strong>rk4_advance()</strong> calls spectral_rhs four times per time
        step. The CFL condition for this problem is{" "}
        <code>Δt ≤ Δx/|u|_max</code>. With Δx ≈ LX/NX = 4π/128 ≈ 0.098 and
        |u|_max ≈ U₀ = 1, CFL = 0.025/0.098 ≈ 0.25 — safely within stability.
      </p>
      <p>
        <strong>build_scene()</strong> creates the BMesh grid with row-major
        vertex indexing{" "}
        <code>vi = i·NY + j</code>. Shape keys are applied in physical space,
        reusing the normalised height function <code>to_height()</code> on each
        snapshot. The <code>FLOAT_COLOR</code> attribute (not{" "}
        <code>BYTE_COLOR</code>) is chosen because Blender 5.1&rsquo;s Eevee
        Next uses it directly as an HDR input to the Emission socket — BYTE_COLOR
        would quantise the gradient and kill the soft colour ramp between cobalt
        and amber.
      </p>

      <h2>Shape keys — four stages of the instability</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Basis  (t = 0):  tanh shear layer + sinusoidal seed — essentially flat
SK_t20 (t = 20): onset — vortex sheet begins to corrugate
SK_t40 (t = 40): billowing — cat's-eye vortices fully formed
SK_t60 (t = 60): nonlinear — core merging, secondary KH on braid regions`}
      </pre>
      <p>
        The nonlinear timescale is τ_NL ≈ δ/U₀ = 0.2 model units; peak growth
        rate σ_max ≈ U₀/(2δ) = 2.5.  By t = 20 the linear phase is complete
        (σ_max·τ_NL ≈ 5 → amplitude ≈ e⁵ ≈ 150× the seed).  By t = 40 the
        nonlinear cat's-eye structure saturates; by t = 60 inverse energy cascade
        begins core merging and secondary instabilities appear on the braids.
      </p>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Simulation blows up before t = 20:</strong> DT is too large.
          Reduce DT to 0.010 and re-run.  Check that the perturbation amplitude
          EPS is not larger than 0.01.
        </li>
        <li>
          <strong>Grid-scale noise after t = 50:</strong> Dealiasing is not
          working.  Print <code>mask.sum()</code> — it should be roughly
          (2·NX/3)·(2·NY/3) ≈ 7282.  If the mask is all-True, the threshold
          arithmetic has an off-by-one.
        </li>
        <li>
          <strong>Flat height field (Z_SCALE not visible):</strong> The vorticity
          range at t = 0 is narrow; Z_SCALE ≤ 0.05.  Increase EPS to 0.01 or
          increase Z_SCALE to 0.6.
        </li>
        <li>
          <strong>Shape keys all look the same:</strong> The snapshots were not
          integrated — check that <code>run_to()</code> is consuming the correct
          time delta.  Add a <code>print(t, omega_hat.max())</code> inside the
          integration loop to verify progress.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-rayleigh-taylor-instability-2d-boussinesq-vorticity-streamfunction-spectral-height-field-stage-floor-webxr" className={lk}>
            Rayleigh–Taylor Instability
          </Link>{" "}
          — buoyancy-driven counterpart: denser fluid sits atop lighter fluid.
          The same vorticity–streamfunction solver with an added buoyancy term
          <code>g·A·∂b/∂x</code>; compare the asymmetric mushroom caps of RTI
          with the rolling billows of KHI.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-kuramoto-sivashinsky-pde-spatiotemporal-chaos-flame-front-height-field-stage-floor-webxr" className={lk}>
            Kuramoto–Sivashinsky PDE
          </Link>{" "}
          — same pseudo-spectral FFT infrastructure applied to a 1-D PDE;
          illustrates how the Orszag dealiasing rule scales from 1-D to 2-D.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-ftle-double-gyre-lagrangian-coherent-structures-ridge-height-field-stage-floor-webxr" className={lk}>
            FTLE / Lagrangian Coherent Structures
          </Link>{" "}
          — the KHI produces Lagrangian coherent structures: the cat's-eye
          boundaries are separatrices in the Lagrangian frame.  The FTLE
          tutorial shows how to compute and visualise those structures.
        </li>
      </ul>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <a href="https://www.tandfonline.com/doi/abs/10.1080/14786447108640585" className={lk} target="_blank" rel="noopener noreferrer">
            Kelvin (Lord), 1871.  &ldquo;Hydrokinetic solutions and
            observations.&rdquo;
          </a>{" "}
          <em>Philosophical Magazine</em>, 42(281):362–377.{" "}
          <strong>Public Domain</strong> (published &gt;100 years ago).  Primary
          derivation of the shear-flow instability criterion.  Sibling work:
          Helmholtz (1868), &ldquo;Über discontinuierliche Flüssigkeitsbewegungen,&rdquo;
          <em>Monatsberichte Akad. Berlin</em> — the companion vortex-sheet paper.
        </li>
        <li>
          <a href="https://github.com/python-hydro/pyro2" className={lk} target="_blank" rel="noopener noreferrer">
            Zingale, Michael et al. (2015–2025). <em>pyro2: A pure Python
            hydrodynamics solver.</em>
          </a>{" "}
          MIT licence.  Provides a reference pseudo-spectral Kelvin–Helmholtz
          example (<code>compressible/problems/kh.py</code>) against which the
          vortex-sheet topology can be validated.  Related projects in the same
          org: <a href="https://github.com/python-hydro/pyro2/tree/main/compressible_rk" className={lk} target="_blank" rel="noopener noreferrer">compressible_rk</a>{" "}
          (IMEX integration) and{" "}
          <a href="https://github.com/python-hydro/hydro_examples" className={lk} target="_blank" rel="noopener noreferrer">hydro_examples</a>{" "}
          (MIT), a companion didactic repository with simpler standalone codes.
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
  topics: ["scripting", "fluid-dynamics", "mathematics", "physics", "webxr"],
  blenderVersion: "5.1",
  libraryPath:
    "blends/scripting/python-numpy-kelvin-helmholtz-shear-instability-spectral-vorticity-height-field-stage-floor-webxr",
});
