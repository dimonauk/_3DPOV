import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

const SLUG =
  "blender-tutorial-python-numpy-rayleigh-taylor-instability-2d-boussinesq-vorticity-streamfunction-spectral-height-field-stage-floor-webxr";

const TITLE =
  "Python numpy — Rayleigh–Taylor Instability: 2-D Boussinesq Vorticity–Streamfunction " +
  "Pseudo-Spectral Simulation, Mushroom-Cap Height-Field Stage Floor for WebXR (Blender 5.1)";

const LEDE =
  "When a denser fluid sits atop a lighter one in a gravitational field the interface is " +
  "gravitationally unstable: any small perturbation triggers a baroclinic torque that rolls " +
  "the boundary into the iconic mushroom-cap spikes and rising bubbles of the Rayleigh–Taylor " +
  "instability (RTI).  Lord Rayleigh analysed the linear regime in 1882; G.I. Taylor extended " +
  "it experimentally in 1950.  This blueprint integrates the 2-D incompressible Boussinesq " +
  "equations — vorticity–streamfunction form, pseudo-spectral FFT with Orszag 2/3-rule " +
  "dealiasing, classical RK4 — and bakes four simulation snapshots into a 64×64 stage-floor " +
  "height-field with shape keys ranging from gentle linear waves through fully developed " +
  "mushroom caps.  Vorticity colours each vertex cobalt (counter-clockwise) to amber (clockwise).";

function Body() {
  return (
    <>
      <p>
        Gravity points down.  Heavy fluid sits on top.  The interface is flat —
        and yet the configuration is <em>unstable</em>.  An infinitesimal dimple
        in the interface creates a horizontal density gradient, which in turn
        creates a horizontal pressure gradient that drives flow, which deepens
        the dimple, which amplifies the gradient.  The positive feedback is the
        Rayleigh–Taylor instability (RTI), and its hallmark is the mushroom cap:
        the dense fluid forms narrow sinking spikes while the light fluid rises
        in broad rounded bubbles — because terminal bubble velocity is slower
        than terminal spike velocity by a factor of about √3 in the potential-flow
        limit, an asymmetry that sharpens into the characteristic asymmetric
        fingers of the nonlinear regime.
      </p>
      <p>
        The RTI appears wherever a fluid acceleration acts against a density
        gradient: during inertial-confinement laser fusion (the ablation surface),
        in supernovae ejecta, in the Crab Nebula filaments, and on the underside
        of cumulus clouds.  Chandrasekhar&rsquo;s 1961 monograph lists the
        surface-tension stabilisation length (now called the capillary length),
        which sets the shortest unstable wavelength in real fluids; in the
        inviscid, tension-free 2-D case here, all wavenumbers are equally
        unstable and the linear growth rate is simply <code>σ(k) = √(Agk)</code>.
      </p>

      <h2>Atwood number and the growth rate</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`A = (ρ₂ − ρ₁) / (ρ₂ + ρ₁)    ∈ (0, 1)

Linear growth rate (inviscid, no surface tension):
  σ(k) = √(A · g · k)          where k = 2π/λ is wavenumber

Bubble terminal velocity (Davies & Taylor 1950):
  U_b ≈ 0.511 · √(A · g · λ)

Spike terminal velocity (Layzer model):
  U_s ≈ √(A·g·λ) / √(1 + A)  → faster for A → 1`}
      </pre>
      <p>
        The Basis shape key (A = 0.50, t = 2) sits firmly in the linear regime:
        the interface oscillates sinusoidally at the two injected wavenumbers, and
        the amplitude grows as <code>exp(σt)</code>.  By t = 4.5 (SK_Fingers)
        nonlinearity has promoted higher harmonics and a clear competition between
        fingers emerges — wider bubbles absorb narrower ones in the classic
        &ldquo;bubble merger&rdquo; cascade described by Alon et al. (1994).
        At t = 7 (SK_Mushroom) the mushroom-cap geometry is fully developed:
        each spike head has curled sideways, and the vortex sheet at the neck
        is visible in the cobalt–amber colour map.
      </p>

      <h2>Governing equations and spectral method</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`2-D incompressible Boussinesq RTI (gravity in −y direction):

  Dω/Dt = g · A · ∂b/∂x          baroclinic vorticity source
  Db/Dt = 0                       buoyancy b ∈ [−1,+1] passively advected
  ∇²ψ   = −ω                     Poisson eq for streamfunction ψ
  u = ∂ψ/∂y,  v = −∂ψ/∂x

Spectral solve of Poisson eq:    ψ̂(k) = ω̂(k) / |k|²
Velocities in spectral space:    û = i·ky·ψ̂,   v̂ = −i·kx·ψ̂
Dealiasing: Orszag 2/3-rule — zero all modes |kindex| > N/3 (N = 64).
Time advance: classical RK4, Δt = 0.025 simulation units.`}
      </pre>

      <h2>Baroclinic mechanism — why the sign matters</h2>
      <p>
        The baroclinic vorticity generation term is{" "}
        <code>+g·A·∂b/∂x</code> (not negative).  Physically: where the
        perturbed interface tilts so that heavy fluid is transitioning to light
        fluid in the <em>positive</em>-x direction, <code>∂b/∂x&nbsp;&gt;&nbsp;0</code>,
        and the baroclinic torque is positive (counter-clockwise, cobalt).  That
        CCW vortex sits on the flank of a rising bubble and drives further upward
        motion, amplifying the perturbation.  The sign determines whether the
        simulation explodes instantly (wrong sign) or captures the correct mushroom
        physics — and it is easily confused when mixing conventions for b, for
        gravity direction, and for vorticity sign.
      </p>

      <h2>Blueprint: key code sections</h2>
      <pre className="overflow-x-auto rounded bg-black/30 p-3 text-sm">
        {`# Dealiasing mask — Orszag 1971
ki   = np.abs(np.fft.fftfreq(N) * N).astype(int)   # integer mode index
DE   = np.outer(ki <= N//3, ki <= N//3)              # True = kept mode

# Poisson solve (exact in spectral space)
K2[0,0] = 1.0               # prevent /0 at DC
psi_hat  = w_hat / K2
psi_hat[0,0] = 0.0          # zero-mean stream function

# Shape-key positions via vectorised numpy
i_idx = np.repeat(np.arange(N), N)
j_idx = np.tile(np.arange(N), N)
co    = np.column_stack([i_idx*CELL_M, j_idx*CELL_M,
                         b_field.ravel()*HEIGHT_M]).ravel()
sk.data.foreach_set("co", co.astype(np.float32).tolist())`}
      </pre>

      <h2>Cross-references</h2>
      <p>
        The pseudo-spectral approach shares its FFT infrastructure with the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-swift-hohenberg-pde-hexagonal-rolls-benard-convection-stage-floor-webxr"
          className={lk}
        >
          Swift–Hohenberg PDE tutorial
        </Link>{" "}
        (Bénard convection onset — also a fluid-layer instability, but driven
        by temperature rather than density).  The height-field stage-floor mesh
        construction exactly mirrors the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-ising-model-metropolis-monte-carlo-phase-transition-critical-height-field-webxr"
          className={lk}
        >
          Ising model tutorial
        </Link>
        .  The Brusselator tutorial shows a complementary PDE pattern-formation
        system where Turing instability (not RT) generates the structure — see{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-brusselator-prigogine-lefever-1968-turing-instability-hopf-dissipative-stage-floor-webxr"
          className={lk}
        >
          Brusselator — Turing Instability Stage Floor
        </Link>
        .
      </p>

      <h2>Outside sources</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Lord Rayleigh (1882).{" "}
          <em>
            Investigation of the character of the equilibrium of an
            incompressible heavy fluid of variable density.
          </em>{" "}
          <em>Proc London Math Soc</em> 14:170–177.{" "}
          <a
            href="https://doi.org/10.1112/plms/s1-14.1.170"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1112/plms/s1-14.1.170
          </a>{" "}
          — <strong>Public Domain</strong>.  Original linear-stability analysis
          for the sinusoidal interface.  Related: Taylor (1950) below;
          Kelvin–Helmholtz instability (Proc London Math Soc 13:141, 1882).
        </li>
        <li>
          G. I. Taylor (1950).{" "}
          <em>
            The instability of liquid surfaces when accelerated in a direction
            perpendicular to their planes.
          </em>{" "}
          <em>Proc R Soc Lond A</em> 201:192–196.{" "}
          <a
            href="https://doi.org/10.1098/rspa.1950.0052"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            doi:10.1098/rspa.1950.0052
          </a>{" "}
          — <strong>Public Domain — equations only</strong>.  Experimental
          confirmation and extension; introduced Atwood number convention.
          Related:{" "}
          <a
            href="https://github.com/spectralDNS/spectralDNS"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            spectralDNS (MIT)
          </a>{" "}
          — Python pseudo-spectral Navier–Stokes library used as reference for
          the dealiasing pattern; sibling repos:{" "}
          <a
            href="https://github.com/spectralDNS/shenfun"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            shenfun (MIT)
          </a>
          ,{" "}
          <a
            href="https://github.com/spectralDNS/mpi4py-fft"
            className={lk}
            target="_blank"
            rel="noreferrer"
          >
            mpi4py-fft (MIT)
          </a>
          .
        </li>
      </ul>

      <h2>Troubleshooting</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Simulation diverges (NaN after ~t=5).</strong> Reduce{" "}
          <code>DT</code> to 0.015 or increase dealiasing strictness ({" "}
          <code>N//3</code> → <code>N//4</code>).  The pseudo-spectral method
          is spectrally accurate but unstable above the CFL limit; at N=64 and
          Δt=0.025 there is comfortable headroom, but high-A runs can push
          velocity fields harder.
        </li>
        <li>
          <strong>Height field looks flat at Basis (t=2).</strong> Expected —
          the linear-regime amplitude is only ε·L/(2·N_MODE) ≈ 0.25 simulation
          units → 0.14 m in Blender.  Increase <code>HEIGHT_M</code> or run to
          a later time.
        </li>
        <li>
          <strong>Vertex colour all one tone.</strong> The vorticity is near
          zero at t=2; colour is from SK_Mushroom vorticity.  Confirm{" "}
          <code>add_vertex_color(ob, omega2)</code> is called (not{" "}
          <code>omega0</code>).
        </li>
        <li>
          <strong>Shape key co array wrong length.</strong> Ensure{" "}
          <code>N×N×3 = 12288</code> floats are passed to{" "}
          <code>foreach_set</code>.  The{" "}
          <code>np.column_stack([X,Y,Z]).ravel()</code> idiom produces exactly
          this.
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: SLUG,
  title: TITLE,
  lede: LEDE,
  date: "2026-09-01",
  topic: "scripting",
  body: Body,
});
