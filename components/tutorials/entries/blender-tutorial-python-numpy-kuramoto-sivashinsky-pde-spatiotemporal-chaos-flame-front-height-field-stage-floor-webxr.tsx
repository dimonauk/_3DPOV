import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-kuramoto-sivashinsky-pde-spatiotemporal-chaos-flame-front-height-field-stage-floor-webxr";

const TITLE =
  "Python numpy — Kuramoto–Sivashinsky PDE: Spatiotemporal Flame-Front Chaos, " +
  "Spectral RK4, Space-Time Height-Field Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "The Kuramoto–Sivashinsky equation — u_t + u·u_x + u_xx + u_xxxx = 0 — is the " +
  "shortest known partial differential equation that produces sustained spatiotemporal " +
  "chaos on a one-dimensional periodic domain.  Derived simultaneously by Kuramoto & Tsuzuki " +
  "(1976) studying chemical-wave propagation and by Sivashinsky (1977) analysing laminar " +
  "flame-front instability, it balances negative viscosity (energy injection) against " +
  "hyperdiffusion (energy sink), with nonlinear advection cascading energy across scales.  " +
  "This blueprint integrates the equation in Fourier space using 4th-order Runge–Kutta, " +
  "then visualises the full space-time solution as a 128×128 stage-floor height-field " +
  "with four shape keys spanning early cell formation through canonical turbulence to " +
  "large-domain multi-scale patterns.  Colour encodes wave amplitude: cobalt for troughs, " +
  "amber for crests.";

function Body() {
  return (
    <>
      <p>
        Imagine lighting a Bunsen burner and watching the flame edge from
        the side.  Instead of a clean line, the front wrinkles into cells —
        each a local eruption of burning gas — that drift sideways, merge
        with neighbours, and occasionally split.  The pattern is not random
        noise and not periodic repetition: it is <em>spatiotemporal chaos</em>,
        and the Kuramoto–Sivashinsky equation is its mathematical fingerprint.
      </p>
      <p>
        Four terms cooperate to produce this behaviour.  The{" "}
        <code>−u_xx</code> term acts like <em>negative viscosity</em>: it
        pumps energy into modes near the most-unstable wavenumber
        k<sub>*</sub>&nbsp;=&nbsp;1/√2, destabilising any flat interface.
        The <code>+u_xxxx</code> term is a hyperdiffusion that damps modes
        with k&nbsp;&gt;&nbsp;1, preventing the instability from cascading
        to infinitely small scales — it plays the role of surface tension in
        flame models.  The nonlinear <code>u·u_x</code> advection term
        shuffles energy between wavenumbers, breaking the linear superposition
        and producing the chaotic long-time dynamics.  Remove any one of the
        four terms and the chaos disappears.
      </p>

      <h2>Linear stability and the most-unstable wavenumber</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Linearise: u = exp(σt + ikx)

Growth rate:   σ(k) = k² − k⁴

Unstable for:  0 < k < 1          (modes with wavelength > 2π)
Most unstable: k* = 1/√2          σ(k*) = 1/4
Stable:        k > 1              hyperdiffusion wins

Dominant cell spacing:  λ* = 2π/k* = 2π√2 ≈ 8.886  [problem units]

Number of active modes in domain L:
  n_active ≈ floor(L / (2π))

For L = 36π:  n_active ≈ 18   →  fully turbulent
For L = 16π:  n_active ≈ 8    →  near-onset, quasi-periodic
For L = 72π:  n_active ≈ 36   →  multi-scale, higher attractor dimension`}
      </pre>
      <p>
        The attractor dimension of KS chaos grows linearly with L (Manneville
        1985; Hyman & Nicolaenko 1986).  This is the distinguishing feature of
        spatiotemporal chaos compared with classical low-dimensional chaos: the
        number of degrees of freedom is extensive — it scales with the system
        size.
      </p>

      <h2>Spectral RK4 — why Fourier space and pseudo-spectral nonlinearity</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Represent u(x,t) by its real FFT:  û_k(t) = rfft(u)[k]

KS ODE in Fourier space:
  dû_k / dt  =  (k² − k⁴) · û_k  −  ik · rfft(u² / 2)
                ─────────────────    ───────────────────
                exact linear term    pseudo-spectral nonlinear

WHY u·u_x = ∂(u²/2)/∂x (conservative form):
  Writing the advection as a total derivative means the FFT of u² avoids
  the aliased convolution.  The ik factor then gives the x-derivative
  exactly in Fourier space.  This is the Orszag (1971) 2/3-dealiasing
  philosophy, here using the conservative form instead of explicit padding.

CFL timestep constraint for explicit RK4:
  max|Lk| = max|k⁴ − k²| ≈ k_max⁴  for k_max = π·N/L
  For N=128, L=36π:  k_max ≈ 3.56   max|Lk| ≈ 160
  RK4 A-stability radius ≈ 2.79:    Δt < 2.79 / 160 ≈ 0.0174

Blueprint uses Δt = 0.015  (12% safety margin).`}
      </pre>
      <p>
        The blueprint uses the same spectral RK4 strategy as the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-rayleigh-taylor-instability-2d-boussinesq-vorticity-streamfunction-spectral-height-field-stage-floor-webxr" className={lk}>
          Rayleigh–Taylor spectral simulation
        </Link>{" "}
        — Fourier representation, pseudo-spectral nonlinearity, classical
        RK4 — though the KS equation is one-dimensional rather than two,
        making the simulation far cheaper per timestep.  For production
        workloads where L is large and the stiffest mode is expensive,
        the ETDRK4 scheme of{" "}
        <a
          href="https://doi.org/10.1137/S1064827502410633"
          rel="noopener noreferrer"
          target="_blank"
          className={lk}
        >
          Kassam &amp; Trefethen (2005)
        </a>{" "}
        handles the linear stiff part exactly via matrix exponentials
        and allows Δt ≈ 0.5 — roughly 30× larger steps.
      </p>

      <h2>The space-time height-field mesh</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`Mesh layout (128 × 128 = 16 384 vertices, 16 129 quads):

  Column index j  →  x position = j · CELL_X  (space axis)
  Row    index i  →  t position = i · CELL_T  (time  axis)
  Vertex height   →  u(x_j, t_i) · HEIGHT_SC

Colour (FLOAT_COLOR POINT attribute "KS_Value"):
  t = clip((u − p2) / (p98 − p2), 0, 1)
  colour = (1−t)·cobalt + t·amber
  Cobalt (0.02, 0.10, 0.55) → troughs, slow cells
  Amber  (0.95, 0.60, 0.00) → crests,  fast fronts

Shape keys:
  Basis   L=36π   t_rec=100  canonical turbulence
  SK_Early L=36π  t_rec=30   cells just forming from noise
  SK_SmL  L=16π   t_rec=100  near-onset modulated travelling wave
  SK_LgL  L=72π   t_rec=100  large-domain multi-scale chaos`}
      </pre>
      <p>
        The diagonal streaks visible on the height field are flame cells
        drifting in space as time advances — the same "phase velocity" you
        would see in a kymograph of a real combustion experiment.  Sudden
        vertical discontinuities in the streak pattern mark cell-merging or
        cell-splitting events, where the KS turbulence coarsens or refines
        its cell size.
      </p>
      <p>
        Compare this space-time visualisation with the purely spatial pattern
        formation of the{" "}
        <Link href="/tutorials/blender-tutorial-python-numpy-swift-hohenberg-pde-hexagonal-rolls-benard-convection-stage-floor-webxr" className={lk}>
          Swift–Hohenberg PDE
        </Link>
        : that 2-D equation also has the k²−k⁴ linear term but lacks
        nonlinear advection, producing steady hexagonal rolls rather than
        temporal chaos.  The KS equation is the minimal extension that
        produces genuine temporal disorder.
      </p>

      <h2>Troubleshooting and failure modes</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`PROBLEM: Solution blows up immediately
  CAUSE: DT too large for chosen L / N.
  FIX: Reduce DT.  Check max|k_max⁴ − k_max²| · DT < 2.79.

PROBLEM: Solution looks like a standing wave, not chaotic
  CAUSE: L is too small (L < 2π).  Only one unstable mode exists.
  FIX: Increase L or examine SK_SmL which shows this near-onset regime.

PROBLEM: Shape key mesh looks identical to Basis
  CAUSE: Simulation converged to same periodic orbit for same seed.
  FIX: Change the seed parameter in simulate() for SK_LgL already uses 7.

PROBLEM: GLB export fails with "operator context" error
  CAUSE: obj is not selected / active when bpy.ops.export_scene.gltf runs.
  FIX: Call obj.select_set(True) and set view_layer.objects.active = obj
       before the export operator (blueprint already does this).

PROBLEM: Very slow execution (> 5 min)
  CAUSE: numpy not using BLAS-accelerated FFT (rare in bundled Blender).
  FIX: Accept the wait; 4 simulations × ~7000 RK4 steps each is the cost.
       Alternatively reduce N to 64 and T_WARMUP to 50.`}
      </pre>

      <h2>Outside sources and attribution</h2>
      <p>
        The equation derives from two independent 1976–1977 papers whose
        mathematics are public-domain facts:
      </p>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <a
            href="https://doi.org/10.1143/PTP.55.356"
            rel="noopener noreferrer"
            target="_blank"
            className={lk}
          >
            Kuramoto Y &amp; Tsuzuki T (1976)
          </a>
          {" "}— &ldquo;Persistent propagation of concentration waves in
          dissipative media far from thermal equilibrium.&rdquo;{" "}
          <em>Progress of Theoretical Physics</em> 55(2):356–369.  Derived
          the equation studying Belousov–Zhabotinsky-type reaction–diffusion
          waves. Related OSS:{" "}
          <a
            href="https://github.com/chebfun/chebfun"
            rel="noopener noreferrer"
            target="_blank"
            className={lk}
          >
            chebfun (MIT)
          </a>{" "}
          and{" "}
          <a
            href="https://github.com/spectralDNS/spectralDNS"
            rel="noopener noreferrer"
            target="_blank"
            className={lk}
          >
            spectralDNS (MIT)
          </a>.
        </li>
        <li>
          <a
            href="https://doi.org/10.1016/0094-5765(77)90096-0"
            rel="noopener noreferrer"
            target="_blank"
            className={lk}
          >
            Sivashinsky GI (1977)
          </a>
          {" "}— &ldquo;Nonlinear analysis of hydrodynamic instability in
          laminar flames I — Derivation of basic equations.&rdquo;{" "}
          <em>Acta Astronautica</em> 4(11-12):1177–1206.  Derived the same
          equation from first principles for thin premixed-flame sheets.
          Related OSS:{" "}
          <a
            href="https://github.com/spectralDNS/shenfun"
            rel="noopener noreferrer"
            target="_blank"
            className={lk}
          >
            shenfun (MIT)
          </a>{" "}
          and{" "}
          <a
            href="https://github.com/spectralDNS/mpi4py-fft"
            rel="noopener noreferrer"
            target="_blank"
            className={lk}
          >
            mpi4py-fft (MIT)
          </a>.
        </li>
        <li>
          <a
            href="https://doi.org/10.1137/S1064827502410633"
            rel="noopener noreferrer"
            target="_blank"
            className={lk}
          >
            Kassam AK &amp; Trefethen LN (2005)
          </a>
          {" "}— &ldquo;Fourth-order time-stepping for stiff PDEs.&rdquo;{" "}
          <em>SIAM J. Sci. Comput.</em> 26(4):1214–1233.  The ETDRK4 method
          referenced in the blueprint comments for larger-L production runs.
          Reference implementation in{" "}
          <a
            href="https://github.com/chebfun/chebfun"
            rel="noopener noreferrer"
            target="_blank"
            className={lk}
          >
            chebfun (MIT)
          </a>.
        </li>
      </ul>

      <h2>Studio cross-references</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-swift-hohenberg-pde-hexagonal-rolls-benard-convection-stage-floor-webxr" className={lk}>
            Swift–Hohenberg PDE — hexagonal rolls and Bénard convection
          </Link>{" "}
          — shares the k²−k⁴ linear term but produces steady 2-D patterns
          rather than 1-D temporal chaos.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-rayleigh-taylor-instability-2d-boussinesq-vorticity-streamfunction-spectral-height-field-stage-floor-webxr" className={lk}>
            Rayleigh–Taylor instability — pseudo-spectral Boussinesq stage floor
          </Link>{" "}
          — 2-D spectral RK4 with the same height-field mesh strategy applied
          to a two-component fluid simulation.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-kdv-soliton-hirota-tau-phase-shift-height-field-webxr" className={lk}>
            KdV soliton — Hirota tau-function, phase-shift height field
          </Link>{" "}
          — the Korteweg–de Vries equation is KS without the negative-viscosity
          term and without advection coupling; it produces stable solitons
          rather than chaos.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-turing-spots-stripes-sphere-poi-webxr" className={lk}>
            Gray–Scott reaction diffusion — Turing spots and stripes
          </Link>{" "}
          — a 2-component reaction–diffusion PDE that shares the spirit of
          Kuramoto's original chemical-wave derivation.
        </li>
        <li>
          <Link href="/tutorials/blender-tutorial-python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr" className={lk}>
            Cahn–Hilliard phase separation — spinodal decomposition
          </Link>{" "}
          — another 4th-order parabolic PDE with a similar balance between
          negative diffusion and hyperdiffusion.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug:  SLUG,
  title: TITLE,
  lede:  LEDE,
  date:  "2026-09-02",
  topic: "scripting",
  body:  Body,
});
