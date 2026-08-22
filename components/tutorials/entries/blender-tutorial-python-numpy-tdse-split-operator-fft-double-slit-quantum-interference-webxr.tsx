import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every reaction-diffusion and fluid-simulation blueprint in this
        library evolves <em>classical</em> fields — concentrations, velocities,
        vorticity — whose governing equations follow from classical physics.
        The time-dependent Schrödinger equation (TDSE) is a different beast:
        the field ψ(x, y, t) is <em>complex-valued</em>, its squared modulus
        |ψ|² is a probability density (not a concentration), and the
        fundamental superposition principle means a wavepacket can be in
        two places simultaneously — a fact that becomes visible in the
        double-slit interference fringes this blueprint produces.
      </p>
      <p>
        The key tool is the <strong>Strang split-operator method</strong>,
        which makes the TDSE as cheap to integrate as the Gray-Scott PDE
        while being unconditionally stable at any timestep size.
      </p>

      <h2>The split-operator (Strang splitting) method</h2>
      <p>
        The exact time-evolution operator for one timestep DT is:
      </p>
      <pre>{`U(DT) = exp(−iH·DT/ℏ)   where H = T̂ + V̂

Strang splitting:
U(DT) ≈ exp(−iV·DT/2ℏ) · exp(−iT·DT/ℏ) · exp(−iV·DT/2ℏ)
       = exp_V_half · exp_T · exp_V_half`}</pre>
      <p>
        The key observation is that T̂ is diagonal in momentum space and V̂ is
        diagonal in position space, so each of the three factors is a
        pointwise complex multiplication — no matrix inversion, no Cholesky
        factorisation.  The FFT2 converts between spaces:
      </p>
      <pre>{`# One timestep (blueprint.py lines 76-83):
psi = psi * exp_V            # position space: half V-step
psi_k = np.fft.fft2(psi)    # → momentum space
psi_k = psi_k * exp_T       # momentum space: full T-step
psi = np.fft.ifft2(psi_k)   # → position space
psi = psi * exp_V            # position space: half V-step`}</pre>
      <p>
        The Strang splitting error is O(DT²||[T̂,V̂]||) per step —
        second-order accurate in time — and accumulates as O(DT²) over
        fixed total time.  More importantly, each of the three sub-steps is
        <em>exactly unitary</em>, so the total norm
        ∫|ψ|²dA is conserved to machine precision at <em>any</em> DT.
        The printed{" "}
        <code>norm</code> value (expected 1.00000000) is a built-in
        self-diagnostic: any drift indicates a bug in the propagators or
        the normalisaton step.
      </p>

      <h2>Pre-computed propagators and why they are correct</h2>
      <p>
        The propagators are computed once before the loop:
      </p>
      <pre>{`# build_propagators() — computed at startup:
kx_1d = 2π · np.fft.fftfreq(N, d=dx)    # wavenumbers [0, Δk, …, −Δk]
KX, KY = np.meshgrid(kx_1d, kx_1d, indexing="ij")
K2 = KX² + KY²

exp_T = exp(−i · K2 · DT)          # kinetic full-step  (ℏ=1, m=0.5)
exp_V = exp(−i · V · DT / 2)       # potential half-step (shape (N,N))`}</pre>
      <p>
        With natural units ℏ = 1, m = 0.5 the kinetic energy is
        Ê_kin = k² (eigenvalue of −ℏ²/(2m)∇² = −∇²).  The FFT
        wavenumber conventions require <code>np.fft.fftfreq(N, d=dx)</code>
        multiplied by 2π to convert from cycles-per-unit to
        radians-per-unit — omitting this factor produces a wave that
        travels at 1/(2π) of the intended speed.
      </p>
      <p>
        Compare the same FFT-in-time-integration pattern in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr"
          className={lk}
        >
          Cahn-Hilliard blueprint
        </Link>{" "}
        (FFT Laplacian) and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-stft-audio-spectrum-3d-bar-poi-trail-webxr"
          className={lk}
        >
          STFT audio-spectrum blueprint
        </Link>{" "}
        (FFT2 in frequency analysis).
      </p>

      <h2>Young's double-slit fringe spacing</h2>
      <p>
        The barrier is a thin vertical wall at x = L/2 with two open slits:
      </p>
      <pre>{`V[i,j] = V0   if wall[i,j] and not (slit1[i,j] or slit2[i,j])
V[i,j] = 0    otherwise

slit1: |y − (Y0 − d/2)| < w/2,    slit2: |y − (Y0 + d/2)| < w/2
d = SLIT_SEP = L/4 ≈ 1.57,  w = SLIT_W = L/12 ≈ 0.52`}</pre>
      <p>
        Young's formula for the fringe spacing at observation plane distance D:
      </p>
      <pre>{`Δy = λ · D / d

λ = 2π / K0  ≈ 0.785   (de Broglie wavelength)
D = L / 2    ≈ 3.14    (centre of domain to right edge)
d = L / 4    ≈ 1.571   (slit separation)

Δy ≈ 0.785 × 3.14 / 1.571  ≈  1.57  ≈  L/4

→ four fringes across the domain height L = 2π`}</pre>
      <p>
        The fringe spacing scales as 1/K0 (shorter wavelength → denser
        fringes) and as 1/d (closer slits → wider fringes).  Decrease
        <code>K0</code> to 4 to double the fringe spacing, or increase{" "}
        <code>SLIT_SEP</code> to L/2 to halve it.
      </p>

      <h2>Phase colouring — encoding complex amplitude visually</h2>
      <p>
        The wavefunction ψ is complex; |ψ|² is the observable (height), but
        the phase arg(ψ) carries information about momentum and interference.
        The blueprint maps it via HSV:
      </p>
      <pre>{`hue   = (arg(ψ) / 2π + 0.5) % 1.0   # [−π, π] → [0, 1]
sat   = 1.0
value = |ψ| / max|ψ|                 # amplitude as brightness

RGB   = hsv_to_rgb(hue, sat, value)  # vectorised, no colorsys import`}</pre>
      <p>
        In the transmitted pattern: adjacent bright fringes differ in phase
        by π (one is a maximum, the next a minimum), so the colour alternates
        between complementary hues (e.g. orange and blue) across each fringe
        pair.  The barrier cells are overridden to grey (value 0.35) so the
        wall position is always visible.
      </p>
      <p>
        This visualisation approach is standard in quantum-mechanics textbooks
        for plotting wavefunctions in the complex plane.  Compare the
        displacement-only approach used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-surface-rd-mesh-laplacian-turing-vrm-webxr"
          className={lk}
        >
          Surface RD Mesh Laplacian blueprint
        </Link>
        , where the field is real-valued.
      </p>

      <h2>Periodic boundary conditions and norm conservation</h2>
      <p>
        The FFT implicitly assumes periodic boundary conditions: the domain
        is treated as a torus, with the right edge connected to the left and
        the top to the bottom.  This means the transmitted wavepacket
        eventually re-enters from the left after crossing the full domain —
        producing "quantum echo" reflections when <code>N_STEPS</code> is
        large enough for the wave to wrap around.  At the default N_STEPS = 40
        with group velocity v_g = 2·K0·(ℏ/m) = 16, the packet travels
        16 × 0.40 = 6.4 domain units in total time t = 0.40, just barely
        exiting the right side before wrapping.
      </p>
      <p>
        For a clean one-shot experiment without re-entry, use absorbing
        boundary conditions: replace V[border] with V[border] − i·Γ (a
        complex potential).  The exp_V_half factor then includes
        exp(−Γ·DT/2) which damps amplitude in the absorbing layer.
        Norm is no longer conserved (by design), and the diagnostic
        log should show it decreasing monotonically as the wavepacket
        exits the domain.
      </p>
    </>
  );
}

const data = {
  title:
    "Python numpy — TDSE Split-Operator FFT: Double-Slit Quantum Interference & Phase Portrait as a WebXR Displacement Map (Blender 5.1)",
  lede:
    "Propagate a 2D Gaussian wavepacket through a double-slit barrier by solving the TDSE with the Strang split-operator method — alternating FFT2 kinetic steps in momentum space with position-space potential half-steps — then map probability density |ψ|² to vertex height and phase arg(ψ) to HSV vertex colour for a WebXR poi prop.",
  date: "2026-07-26",
  steps: [
    {
      title: "Run blueprint.py",
      body: "Open Blender Scripting workspace, load blueprint.py, click ▶ Run Script. The terminal logs norm (should read 1.00000xxx) and peak|ψ|² at every 10 steps. Runtime: < 5 s on any modern CPU (40 steps × 2 FFT2 calls on 64×64 complex array).",
    },
    {
      title: "Inspect the interference pattern",
      body: "Switch to 3D Viewport → Material Preview. Orbit to look down at the mesh. You should see: a grey vertical strip (the barrier) at the domain centre; two small open gaps (the slits); and a horizontal banded pattern of raised peaks and valleys on the right side — the quantum interference fringes. Toggle Material Preview off and on to compare uncoloured height vs. phase-coloured height.",
    },
    {
      title: "Adjust fringe spacing",
      body: "Change K0 from 8.0 to 4.0 and re-run. Fringe spacing doubles (Δy ≈ L/2 → two fringes). Change SLIT_SEP from L/4 to L/2 and re-run with original K0: fringe spacing halves. Both results confirm Young's formula Δy = λD/d.",
    },
    {
      title: "Watch norm conservation",
      body: "The printed norm values should be ≈ 1.00000000 at every log step. If you introduce a bug — for example, change exp_T to exp(+i·K2·DT) (wrong sign) — the wavepacket disperses incorrectly but norm still holds. If norm drifts, the bug is in the propagator exponential or the normalisation in init_wavepacket.",
    },
    {
      title: "Run record.py for animation",
      body: "Load record.py and run. It captures 10 snapshots (every 4 steps) and builds shape keys on a second mesh hf_tdse_anim. Phase colour is fixed from snapshot 5. Press Ctrl+F12 to render viewport.mp4 — the animation shows the Gaussian blob approaching the barrier, splitting at the two slits, and forming the fringe pattern over 300 frames.",
    },
    {
      title: "Export and use in WebXR",
      body: "The auto-exported hf_tdse.glb contains vertex positions (height = |ψ|²) and vertex colours (phase HSV). In Three.js: const mat = new THREE.MeshStandardMaterial({ vertexColors: true }); — the interference pattern appears directly. The displacement is baked into vertex Z positions; no displacement map is needed.",
    },
  ],
  troubleshooting: [
    {
      symptom: "Mesh is completely flat — no visible fringes",
      cause:
        "N_STEPS is too low: the wavepacket has not yet reached the barrier and diffracted. At DT=0.01, K0=8, the packet reaches x=L/2 at step ≈ (L/4)/(2·K0) / DT = π/(64·0.01) ≈ 15 steps.",
      fix: "Increase N_STEPS to at least 20. At N_STEPS=40 the packet has fully passed through the slits and the diffraction pattern is visible. If still flat, check that BARRIER_X equals L/2 and that the barrier mask is non-empty: add print((V > 0).sum()) to verify barrier cells.",
    },
    {
      symptom: "norm drifts from 1.0 — values like 0.9995 or 1.0010",
      cause:
        "There is a sign error or scaling error in exp_T or exp_V. The Strang splitting with periodic BCs should conserve norm to floating-point precision (< 1e-13 drift per step).",
      fix: "Check: (1) exp_T = exp(−i·K2·DT), NOT exp(+i·K2·DT). (2) exp_V = exp(−i·V·DT/2), NOT exp(−i·V·DT). (3) The wavenumber uses np.fft.fftfreq multiplied by 2π. Add assert abs(norm - 1.0) < 1e-6 after the first step to catch drift early.",
    },
    {
      symptom: "Fringes are at the wrong position / in the reflected wave only",
      cause:
        "X0 = L/4 starts the packet on the left. If the packet is moving left (K0 < 0 or the exponential sign is wrong), it will reflect off the left periodic boundary instead of passing through the slits.",
      fix: "Ensure K0 > 0 and the phase factor is exp(+i·K0·XX) in init_wavepacket (positive momentum = rightward). Verify X0 < BARRIER_X: with X0=L/4 and BARRIER_X=L/2 the packet moves right into the barrier.",
    },
    {
      symptom: "Phase colours are uniform — all the same hue",
      cause:
        "The np.angle(psi) call returns a nearly constant value, meaning psi is mostly real or the phase is not rotating. This can happen if the wavepacket decayed to near zero (check peak|ψ|² > 0.001).",
      fix: "Ensure the simulation ran long enough to produce transmitted amplitude. If peak|ψ|² < 0.001 in the terminal, V0 may be too high relative to KE: lower V0 to 200 or increase K0 to 10. Also verify that SLIT_W > 0 — if slit width is zero no wave passes through.",
    },
    {
      symptom: "record.py shape keys produce additive bumps",
      cause:
        "Multiple shape keys are active simultaneously. With use_relative=True, Blender sums all active key values. The animate_shape_keys function should set value=1.0 at only one peak_frame per key with LINEAR interpolation to zero everywhere else.",
      fix: "Open the Graph Editor, select hf_tdse_anim → Shape Keys. Confirm each fcurve has exactly one peak at its own peak_frame and is zero at all other peak frames. If peaks overlap, the N_STEPS_PER_SNAP calculation differs between build_anim_mesh and animate_shape_keys — check that both use the same N_SNAPS and FRAMES_PER_SNAP values.",
    },
  ],
  externalLinks: [
    {
      label:
        "Feit, Fleck & Steiger (1982) — Solution of the Schrödinger equation by a spectral method — J. Comput. Phys. 47:412 — the original split-operator paper (PD)",
      href: "https://doi.org/10.1016/0021-9991(82)90091-2",
    },
    {
      label:
        "Split-step method — Wikipedia — CC BY-SA 4.0 — Wikipedia Contributors — derivation and stability analysis",
      href: "https://en.wikipedia.org/wiki/Split-step_method",
    },
    {
      label:
        "NumPy — numpy.fft.fft2 — BSD-3-Clause — NumPy Developers — 2D discrete Fourier transform",
      href: "https://numpy.org/doc/stable/reference/generated/numpy.fft.fft2.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "Python numpy — STFT Audio Spectrum 3D Bar Visualiser: Short-Time Fourier Transform keyed to Blender animation bars",
      href: "/tutorials/blender-tutorial-python-numpy-stft-audio-spectrum-3d-bar-poi-trail-webxr",
    },
    {
      label:
        "Python numpy — Cahn-Hilliard Phase Separation: Spinodal Decomposition → Displaced WebXR Mesh (FFT-based Laplacian)",
      href: "/tutorials/blender-tutorial-python-numpy-cahn-hilliard-phase-separation-spinodal-displacement-webxr",
    },
    {
      label:
        "Python numpy — Surface Reaction-Diffusion via Mesh Laplacian: Turing Spots on a Poi Head Sphere for VRM & WebXR",
      href: "/tutorials/blender-tutorial-python-numpy-surface-rd-mesh-laplacian-turing-vrm-webxr",
    },
    {
      label:
        "Python numpy — Gray-Scott Reaction-Diffusion on a Flat 128×128 Lattice (np.roll Laplacian)",
      href: "/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-numpy-tdse-split-operator-fft-double-slit-quantum-interference-webxr",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "simulation",
      "physics",
      "materials",
      "webxr",
    ],
    body: Body,
  },
  data,
);
