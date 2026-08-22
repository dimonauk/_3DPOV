import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        The Lattice-Boltzmann method — covered in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-lattice-boltzmann-d2q9-lbm-karman-vortex-poi-webxr"
          className={lk}
        >
          D2Q9 LBM Kármán vortex tutorial
        </Link>{" "}
        — simulates fluid flow by tracking the statistical distribution of
        discrete particle velocities on a lattice.  The
        vorticity-streamfunction method is the opposite end of the spectrum:
        it works directly with the <em>macroscopic continuum equations</em>,
        eliminating the particle picture entirely.  Rather than tracking 9
        distribution functions per cell, you track just two scalar fields —
        vorticity ω and streamfunction ψ — and let the incompressibility
        constraint enforce itself automatically through the curl-divergence
        identity ∇·(curl A) = 0.
      </p>

      <h2>Vorticity, streamfunction and why they suffice</h2>
      <p>
        For a 2D incompressible flow (density ρ = const, velocity field u in
        the xy-plane), the continuity equation ∇·u = 0 says that mass is
        conserved everywhere.  The streamfunction ψ encodes this constraint
        directly:
      </p>
      <pre>{`u  =  ∂ψ/∂y      (x-velocity from y-gradient of ψ)
v  = −∂ψ/∂x      (y-velocity from negative x-gradient)
⟹  ∂u/∂x + ∂v/∂y  =  ∂²ψ/∂x∂y − ∂²ψ/∂y∂x  =  0  ✓`}</pre>
      <p>
        Any smooth ψ automatically yields a divergence-free velocity field.
        Pressure has vanished — it no longer appears anywhere in the
        formulation.  The vorticity ω is the third ingredient:
      </p>
      <pre>{`ω  =  ∂v/∂x − ∂u/∂y     (z-component of curl u)
∇²ψ = −ω               (Poisson equation coupling ψ and ω)`}</pre>
      <p>
        Taking the curl of the momentum equation cancels the pressure gradient
        (since curl grad P = 0) and yields the vorticity transport equation:
      </p>
      <pre>{`∂ω/∂t  +  u·∂ω/∂x  +  v·∂ω/∂y  =  ν·∇²ω

left:   rate-of-change + advection of vorticity by the flow
right:  diffusion of vorticity by viscosity ν = U·L/Re`}</pre>
      <p>
        These two equations — the Poisson problem ∇²ψ = −ω and the transport
        equation for ω — completely determine the flow.  The algorithm
        alternates between solving them: given current ω, solve for ψ; extract
        u, v from ψ; advance ω by one time step; update the wall boundary
        conditions; repeat.
      </p>

      <h2>The lid-driven cavity: a canonical benchmark</h2>
      <p>
        The simulation domain is a unit square.  Three walls are stationary
        (no-slip: u = v = 0); the top wall slides at u = U_LID, v = 0.
        The Reynolds number Re = U_LID · L / ν characterises the balance
        between inertia and viscosity.  At Re = 400 the solution is{" "}
        <em>steady</em>: after the transient dies out you are left with
        one large recirculating vortex centred slightly above mid-cavity,
        plus two small corner eddies in the lower corners.
        Ghia, Ghia & Shin (1982) published benchmark velocity profiles along
        the cavity centrelines that every NS solver is measured against —
        this blueprint reproduces those profiles at Re = 400 and 1000.
      </p>

      <h2>SOR Poisson solver</h2>
      <p>
        The Poisson equation ∇²ψ = −ω is solved on each step by Gauss-Seidel
        successive over-relaxation.  The discrete 5-point Laplacian gives:
      </p>
      <pre>{`ψ[i,j]_new  =  ¼·(ψ[i+1,j] + ψ[i−1,j] + ψ[i,j+1] + ψ[i,j−1] + h²·ω[i,j])

SOR update:
ψ[i,j]  ←  (1 − ω_SOR)·ψ_old  +  ω_SOR·ψ_new

Optimal ω_SOR ≈ 2 − π/N  →  0 < spectral_radius < 1  →  guaranteed convergence`}</pre>
      <p>
        With N = 64 and SOR_W = 1.85, 40 sweeps per transport step is enough
        to keep the Poisson residual small relative to the vorticity update.
        Increasing POISSON_IT beyond 60 gives diminishing returns; fewer than
        20 causes the streamfunction to lag behind the vorticity, destabilising
        the time march.
      </p>

      <h2>Vorticity wall boundary conditions</h2>
      <p>
        All four boundaries have ψ = 0 (closed streamlines on walls).  The
        vorticity at each wall is derived from a one-sided Taylor expansion
        of ψ around the wall node — Thom&apos;s formula (1933):
      </p>
      <pre>{`Bottom (no-slip, u_wall = 0):
  ω_bot[i]  =  −2·ψ[i, 1] / h²

Top lid (u_wall = U_LID):
  ω_top[i]  =  −2·ψ[i, N−2] / h²  −  2·U_LID / h

Left / Right (no-slip):
  ω_left[j]  =  −2·ψ[1, j]   / h²
  ω_right[j] =  −2·ψ[N−2, j] / h²`}</pre>
      <p>
        The extra term −2·U_LID/h at the top lid arises because the Taylor
        expansion of ψ around y=1 includes the non-zero wall velocity as the
        first derivative: ψ(y=1−h) ≈ ψ(1) − h·U_LID + h²/2·∂²ψ/∂y² = −h·U_LID + h²/2·∂²ψ/∂y².
        Isolating ∂²ψ/∂y² = ∂u/∂y and noting ω = −∂u/∂y at the wall gives Thom&apos;s formula.
      </p>

      <h2>Upwind advection and stability</h2>
      <p>
        Central-difference advection for the term u·∂ω/∂x is unstable at
        moderate Reynolds numbers: the modified wavenumber analysis shows that
        it introduces negative diffusion for waves shorter than 2h, causing
        spurious oscillations to grow.  First-order upwinding selects the
        backward or forward stencil based on the local velocity sign:
      </p>
      <pre>{`if u[i,j] > 0:   ∂ω/∂x ≈ (ω[i,j] − ω[i−1,j]) / h   (information from left)
if u[i,j] < 0:   ∂ω/∂x ≈ (ω[i+1,j] − ω[i,j]) / h   (information from right)`}</pre>
      <p>
        This is unconditionally stable but adds numerical diffusion proportional
        to h·|u| / 2.  At Re = 400, N = 64, the artificial diffusion is about
        3 % of the physical diffusion — negligible for visualisation purposes.
        Switch to a QUICK or MUSCL scheme if quantitative accuracy at higher Re
        is needed.
      </p>
      <p>
        The diffusion stability limit requires DT ≤ h² / (4ν).  For N = 64,
        Re = 400 this gives DT_max ≈ 0.025.  Using DT = 4×10⁻⁴ leaves a
        factor-of-60 safety margin against diffusive instability and a factor
        of ~40 against the advection CFL limit (h/U_LID ≈ 0.016).
      </p>

      <h2>Streamline tracing</h2>
      <p>
        Once the simulation converges, the velocity field (u, v) is sampled by
        bilinear interpolation at 22 seed points along x = 0.05.  Arc-length–
        normalised Euler integration advances each seed:
      </p>
      <pre>{`step_size = DS_TARGET / |vel|    (constant arc length regardless of speed)
x_new  =  x  +  u(x,y) · step_size
y_new  =  y  +  v(x,y) · step_size`}</pre>
      <p>
        Normalising by speed means the tracing algorithm naturally spends more
        steps inside the slow corner eddies (tracing their fine spiral geometry)
        and strides quickly through the fast central jet.  Each streamline
        becomes a POLY spline in a Blender curve object with a circular bevel
        profile — identical to the ribbon technique in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-curve-to-mesh-ribbon-trim-tilt-webxr"
          className={lk}
        >
          GN Curve-to-Mesh ribbon tutorial
        </Link>
        , but generated directly from simulation data rather than from a hand-placed
        curve.
      </p>
      <p>
        Compare the qualitative appearance to the Gray-Scott reaction-diffusion
        geometry in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr"
          className={lk}
        >
          Gray-Scott Reaction-Diffusion tutorial
        </Link>
        : both produce tightly wound spirals with a single dominant centre,
        but the NS cavity produces smooth, closed loops whereas Gray-Scott
        produces dendritic branching.  The shared geometry comes from the fact
        that both systems have a dominant circular attractor in phase space —
        the primary vortex and the Turing-spot nucleation site, respectively.
      </p>

      <h2>Re = 400 vs Re = 1000 vs Re = 7400</h2>
      <p>
        Ghia et al. computed benchmark profiles at Re = 100, 400, 1000, 3200,
        5000, 7500, and 10 000.  The primary vortex centre migrates toward the
        geometric centre of the cavity as Re increases; the two bottom corner
        eddies intensify and a third eddy appears in the upper-left corner at
        Re ≥ 3200.  Beyond Re ≈ 7400 the steady solution becomes unstable and
        the flow oscillates — this is a Hopf bifurcation, closely related to
        the Hopf fibration geometry explored in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-hopf-fibration-linked-tori-light-sculpture-webxr"
          className={lk}
        >
          Hopf Fibration light-sculpture tutorial
        </Link>
        .  To observe it: set RE = 8000, increase N_STEPS to 20 000, and
        watch the residual oscillate rather than decay.
      </p>

      <h2>WebXR and poi connection</h2>
      <p>
        The 22 streamline ribbons form a closed, looped spatial sculpture that
        maps directly onto a poi performance: the performer&apos;s head travels
        the outer streamlines while wrist chains follow the inner ones.
        Load the exported GLB into a Three.js scene using{" "}
        <code>GLTFLoader</code>.  The emission material renders in WebXR as
        self-illuminated ribbons — no lighting required.  Pair it with the
        spatial-audio field from the{" "}
        <Link href="/lab/poi-sculptor" className={lk}>
          Poi Sculptor project
        </Link>{" "}
        by mapping poi position to velocity magnitude: faster flow regions play
        louder tones, giving the performer audio feedback about where they are
        in the vortex field.
      </p>
    </>
  );
}

const data = {
  title:
    "Python numpy — 2D Navier-Stokes Vorticity-Streamfunction: Lid-Driven Cavity & Steady-State Streamlines as Poi Ribbons",
  lede:
    "Solve the incompressible Navier-Stokes equations in vorticity-streamfunction form, computing the lid-driven cavity benchmark via SOR Poisson iteration and upwind transport, then trace steady streamlines into poi-ribbon curves for WebXR.",
  date: "2026-07-25",
  steps: [
    {
      title: "Open Blender 5.1 — Scripting workspace",
      body: "New General file. Switch to the Scripting workspace (top header). Click New in the text editor to open a blank script buffer. Numpy is bundled with Blender 5.1 — confirm with: import numpy; print(numpy.__version__).",
    },
    {
      title: "Paste and run blueprint.py",
      body: "Copy blueprint.py into the text editor. Press Alt+P (Run Script). The System Console (Window → Toggle System Console on Windows) prints solver progress every 1 000 steps — |ω|_max should fall from ~2 to a stable value around 0.3–0.6. Total time ~20–30 s on a modern CPU.",
    },
    {
      title: "Inspect the streamline ribbons",
      body: "After the script finishes, the 3D Viewport shows 22 ribbon curves. Press Numpad 7 for top-view orthographic — the classic lid-cavity view. Press Z → Material Preview to see the electric-blue emission ribbons. Tumble the view to appreciate the bevel depth.",
    },
    {
      title: "Identify physics features",
      body: "In top view, trace the large counter-clockwise vortex that fills most of the cavity. Look for the two tight spirals in the lower-left and lower-right corners — these are the secondary eddies. At Re = 400 all streamlines are closed loops; none escape.",
    },
    {
      title: "Vary Reynolds number",
      body: "Change RE = 1000 in the parameters block and re-run. The primary vortex centre shifts toward the geometric centre; the corner eddies grow visibly larger. At RE = 3200 a faint upper-left eddy appears. Above RE = 7400 the simulation will not converge to steady state — oscillations persist.",
    },
    {
      title: "Export GLB",
      body: "File → Export → glTF 2.0. Filename: hf_lid_cavity.glb. In the exporter panel: enable Draco compression level 6, disable Animation, enable Mesh. The GLB contains the curve-converted ribbons as triangle meshes. File size is typically 80–200 KB with Draco.",
    },
    {
      title: "Record viewport animation",
      body: "Open record.py in a second text editor tab. Press Alt+P. The script sets up a 360° orbit over 120 frames and renders viewport.mp4 at 1920×1080 to the library videos directory. Rendering takes ~3–5 minutes depending on GPU.",
    },
    {
      title: "Record screen tutorial with OBS",
      body: "Follow SCREEN-RECORDING-NOTES.md. Capture the full workflow from script-paste to 3D result. Total tutorial recording length is approximately 4 minutes.",
    },
  ],
  troubleshooting: [
    {
      symptom: "Solver produces NaN or blows up after a few hundred steps",
      cause:
        "DT is too large relative to grid spacing and viscosity. Diffusion stability requires DT ≤ h²/(4ν) = h²·Re/(4·U_LID).",
      fix: "Reduce DT to 2e-4 or lower, or reduce RE to 200. The current defaults (N=64, RE=400, DT=4e-4) have a 60× safety margin; if you increase N or RE you must reduce DT accordingly.",
    },
    {
      symptom: "|ω|_max does not converge — oscillates between two values",
      cause:
        "Reynolds number is near or above the steady-state stability limit (~7400). Alternatively, POISSON_IT is too low and ψ lags behind ω.",
      fix: "Reduce RE below 5000, or increase POISSON_IT to 80. If RE > 7 000 is intentional, increase N_STEPS to 40 000 and add a residual convergence check (store ω_old, compare |ω − ω_old|).",
    },
    {
      symptom: "All streamlines exit the domain immediately — no closed loops",
      cause:
        "The velocity field is nearly zero — the simulation has not run long enough for the lid to drive the flow, or POISSON_IT is so low that ψ is effectively zero.",
      fix: "Confirm N_STEPS ≥ 4 000. Print u.max() after the time march — it should be approximately U_LID = 1. If u.max() is near zero, increase POISSON_IT to 60 and restart.",
    },
    {
      symptom: "Corner eddies are missing — only one large vortex visible",
      cause:
        "N = 64 is borderline for resolving the corner eddies at Re = 400. They have low vorticity and need sufficient resolution.",
      fix: "Increase N to 96 or 128 (adjust DT downward to maintain stability). The Ghia et al. reference used a 129×129 grid to compute their benchmark values.",
    },
    {
      symptom: "GLB export produces no geometry (empty file)",
      cause:
        "The curve object's splines are POLY type and bpy.ops.export_scene.gltf does not auto-convert POLY curves to mesh — they need an explicit Convert step.",
      fix: "Before exporting, select the ns_poi object, press F3, search for Convert To Mesh, and apply. Then export. Alternatively, call bpy.ops.object.convert(target='MESH') in the script before the export step.",
    },
  ],
  externalLinks: [
    {
      label:
        "Ghia, Ghia & Shin (1982) — High-Re Solutions for Incompressible Flow Using the Navier-Stokes Equations and a Multigrid Method — Computers & Fluids 10(4):319–328",
      href: "https://www.sciencedirect.com/science/article/pii/0021999182900584",
    },
    {
      label:
        "Barba & Forsyth — CFDPython: 12 Steps to Navier-Stokes — MIT licence — barbagroup",
      href: "https://github.com/barbagroup/CFDPython",
    },
    {
      label:
        "NumPy Developers — Array indexing and slicing reference — BSD-3-Clause — numpy.org",
      href: "https://numpy.org/doc/stable/user/basics.indexing.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "Python bpy — Lattice-Boltzmann D2Q9: BGK Streaming-Collision for Kármán Vortex Street & Poi Wake Visualisation",
      href: "/tutorials/blender-tutorial-python-bpy-lattice-boltzmann-d2q9-lbm-karman-vortex-poi-webxr",
    },
    {
      label:
        "Python numpy — Gray-Scott Reaction-Diffusion: Turing Spots, Stripe Labyrinths & Displaced WebXR Mesh",
      href: "/tutorials/blender-tutorial-python-numpy-gray-scott-reaction-diffusion-spot-stripe-webxr",
    },
    {
      label:
        "GN Curve to Mesh — Trim, Tilt & Radius Ramp: Light Ribbon Prop for WebXR",
      href: "/tutorials/blender-tutorial-gn-curve-to-mesh-ribbon-trim-tilt-webxr",
    },
    {
      label:
        "Python mathutils — Hopf Fibration: Stereographic S³ Fibres as Linked-Torus Light Sculpture for WebXR",
      href: "/tutorials/blender-tutorial-python-hopf-fibration-linked-tori-light-sculpture-webxr",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-numpy-navier-stokes-vorticity-streamfunction-lid-cavity-poi",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "simulation",
      "physics",
      "fluid",
      "webxr",
    ],
    body: Body,
  },
  data,
);
