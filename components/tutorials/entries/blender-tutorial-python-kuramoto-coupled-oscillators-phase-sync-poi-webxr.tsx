import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Sixty-four poi spinners start out of phase — each rotating at its own
        idiosyncratic speed drawn from a random distribution. Then a coupling
        term is turned on: each spinner is gently nudged towards the mean phase
        of the others. Below a critical coupling K<sub>c</sub> nothing changes;
        above it the spinners spontaneously lock into a single coherent wave.
        That is the Kuramoto model, one of the cleanest demonstrations of
        emergent collective behaviour in physics, and it maps directly onto
        the studio&apos;s interest in synchronised poi performance.
      </p>
      <p>
        This tutorial implements the full simulation in Blender 5.1 Python
        using <strong>numpy</strong> (bundled) for vectorised O(N²) coupling,
        a <strong>4th-order Runge-Kutta</strong> integrator for accurate phase
        trajectories, and Blender&apos;s fast fcurve keyframe API to bake 240
        frames of location and emission-colour animation without any per-frame
        handler overhead.
      </p>

      <h2>The mathematics</h2>
      <pre>{`dθᵢ/dt = ωᵢ + (K/N)·Σⱼ sin(θⱼ − θᵢ)     i = 0…N−1

r·eⁱψ = (1/N)·Σⱼ exp(iθⱼ)    (Kuramoto order parameter)

K_c = 2γ    (exact: Ott–Antonsen ansatz, Lorentzian g(ω) half-width γ)

Animation schedule:
  Frames   1–80   K = 0           free rotation (r ≈ 1/√N ≈ 0.12)
  Frames  81–160  K ramps 0 → 4   synchronisation onset (r rises)
  Frames 161–240  K = 4           coherent wave (r → ~0.85)`}</pre>

      <h2>Why Lorentzian frequencies?</h2>
      <p>
        The natural frequency ωᵢ is drawn from a Cauchy / Lorentzian
        distribution via inverse-CDF: <code>ω = γ·tan(π(u − 0.5))</code>{" "}
        where u ~ Uniform(0, 1). The Lorentzian is the only distribution for
        which Kuramoto&apos;s mean-field self-consistency equation has a closed-form
        solution (the Ott–Antonsen ansatz). It gives K<sub>c</sub> = 2γ
        exactly. A Gaussian distribution raises K<sub>c</sub> to ~
        2/πg(0) and produces a slower, messier transition — less dramatic as
        animation.
      </p>

      <h2>Why RK4 instead of Euler or Velocity Verlet?</h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nbody-gravity-star-cluster-leapfrog-light-painting"
          className={lk}
        >
          N-body tutorial
        </Link>{" "}
        uses KDK leapfrog (a 2nd-order symplectic integrator) because it
        conserves the Hamiltonian structure of gravitational dynamics. The
        Kuramoto model is <em>not</em> Hamiltonian — it is a gradient flow on
        the torus, and energy conservation is irrelevant. What matters is
        phase accuracy over 240 frames at K = 0 (free rotation). Euler&apos;s
        global error is O(dt), which drifts the phases visibly. RK4&apos;s O(dt⁴)
        error keeps phase drift below 0.001 rad/frame at our dt = 1/(24×4).
        Velocity Verlet would require rewriting as a second-order system — not
        natural for a first-order phase equation.
      </p>

      <h2>Vectorised coupling</h2>
      <pre>{`# diff[i,j] = θ[j] − θ[i]  (all pairs, one broadcast)
diff = theta[np.newaxis, :] - theta[:, np.newaxis]   # (N, N)
coupling = (K / N) * np.sum(np.sin(diff), axis=1)    # (N,)
dtheta = omega + coupling`}</pre>
      <p>
        The outer subtraction builds the full N×N difference matrix in one
        expression. <code>np.sum(axis=1)</code> collapses it to a per-oscillator
        mean-field in O(N²) floating-point ops — numpy&apos;s BLAS back-end runs
        this at ~10 GFlop/s on a typical CPU, fast enough for N = 64 at 24
        fps without any batching. Compare the analogous pattern in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-lennard-jones-md-crystal-nucleation-berendsen"
          className={lk}
        >
          Lennard-Jones MD tutorial
        </Link>{" "}
        where the same broadcasting trick computes all-pairs distances.
      </p>

      <h2>Colour as a physics readout</h2>
      <p>
        Each oscillator&apos;s emissive hue is set to{" "}
        <code>θᵢ / (2π) mod 1</code> — a rainbow that rotates with the
        phase. In the incoherent regime (K = 0) all hues are present
        simultaneously and the ring looks like a colour wheel. As coupling
        grows the phases bunch and all 64 spheres converge to nearly the same
        hue: the ring turns one colour. This is a direct visual encoding of
        the order parameter r — the transition from spectral noise to
        monochromatic signal.
      </p>
      <p>
        The central white sphere is scaled to r(t): small and dim during
        incoherence, large and bright during full synchronisation. Watch it
        grow during frames 100–160 to pinpoint the moment K crosses K_c.
      </p>

      <h2>Comparison with GN simulation approaches</h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting"
          className={lk}
        >
          SPH fluid
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting"
          className={lk}
        >
          spring-pendulum poi
        </Link>{" "}
        tutorials live in Geometry Nodes Simulation Zones. Kuramoto is done in
        Python instead for a specific reason: the coupling term requires
        sin(θⱼ − θᵢ) summed over ALL j for each i. The GN node graph has no
        all-pairs aggregation primitive — only nearest-neighbour queries via
        IndexOfNearest, which would produce a wrong phase transition (K_c
        shifts and r never reaches 1). Python + numpy computes the exact mean
        field.
      </p>

      <h2>Troubleshooting</h2>
      <pre>{`# All spheres remain on one spot
→ SPHERE_R is too large; reduce to 0.12 or clamp RING_R up.

# Script runs but no animation plays
→ You forgot to save before pressing Space. Save first,
  then press Space; Blender needs a filepath to resolve //.

# Phases desynchronise after K_FINAL is reached
→ Your GAMMA is large: K_FINAL < 2·GAMMA. Raise K_FINAL to at
  least 3·GAMMA for visible synchronisation.

# Very slow bake (>5 min)
→ Reduce N from 64 to 32. RK4 cost is O(N²) per sub-step.`}</pre>

      <h2>Variants</h2>
      <p>
        <strong>3D ring</strong>: add a <code>z_i = 0.8·sin(2·θᵢ)</code> offset
        so oscillators trace a Lissajous torus — directly relevant to poi
        3D-spin patterns. Export as GLB for WebXR.
      </p>
      <p>
        <strong>Frustrated network</strong>: replace the full-coupling
        (K/N)·Σⱼ with a sparse adjacency matrix A where A[i,j] = K only if |i−j|
        mod N ≤ 2 (local ring coupling). The system will NOT fully synchronise —
        chimera states (partially synchronised domains) emerge instead.
      </p>
      <p>
        <strong>Noisy Kuramoto (Langevin)</strong>: add a Gaussian noise term
        η_i(t) ~ N(0, √(2D)) after each RK4 step to model environmental
        fluctuations. At strong noise D the system desynchronises even above K_c,
        producing a stochastic phase diagram.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-python-kuramoto-coupled-oscillators-phase-sync-poi-webxr",
  title:
    "Python numpy — Kuramoto Coupled Oscillators: Phase Synchronisation & Emergent Coherence for Poi Light-Painting (Blender 5.1)",
  subtitle:
    "Lorentzian frequency distribution; RK4 integrator; vectorised mean-field coupling; hue-encoded order parameter; emissive sphere animation baked to fcurves.",
  description:
    "Implement the Kuramoto model in Blender 5.1 Python: N=64 oscillators with Lorentzian-distributed natural frequencies, 4th-order Runge-Kutta integration, vectorised O(N²) sin-coupling via numpy broadcasting, and hue-encoded emission-colour keyframes that visualise the phase transition from incoherence to collective synchronisation.",
  date: "2026-07-24",
  tags: [
    "blender",
    "python",
    "physics",
    "simulation",
    "kuramoto",
    "oscillators",
    "synchronisation",
    "numpy",
    "animation",
    "light-painting",
    "poi",
    "eevee",
    "keyframes",
  ],
  body: Body,
  libraryPath:
    "blends/scripting/python-kuramoto-coupled-oscillators-phase-sync-poi-webxr",
});
