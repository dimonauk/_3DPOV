import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        A double pendulum is two rigid rods joined at the lower tip of the
        upper rod. Write down Newton&apos;s second law in generalised
        co-ordinates — that is, apply Lagrange&apos;s method — and you get a
        pair of coupled second-order ODEs with no closed-form solution. The
        system is fully deterministic: the same initial condition always
        produces the same trajectory. Yet two pendulums started 0.001 rad
        apart trace completely different paths within 120 frames. That is{" "}
        <em>deterministic chaos</em>: sensitivity so extreme that floating-point
        rounding alone is enough to separate nearby trajectories on human-visible
        timescales.
      </p>
      <p>
        This blueprint runs five pendulums in parallel via a Python{" "}
        <code>frame_change_pre</code> handler and reveals their lower-bob
        light-painting trails frame-by-frame using Blender&apos;s{" "}
        <strong>Build modifier</strong> — the same temporal reveal technique
        used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting"
          className={lk}
        >
          Spring-Pendulum Poi tutorial
        </Link>
        . The result is a slow-exposure photograph of chaos: five neon threads
        that begin layered on top of each other and separate like light
        diffracting through a prism.
      </p>

      <h2>The equations of motion</h2>
      <p>
        Let θ₁ be the upper-arm angle from the downward vertical, ω₁ its time
        derivative; θ₂ and ω₂ the same for the lower arm. The angular
        accelerations are:
      </p>
      <pre>{`Δ = θ₂ − θ₁
D = 2M₁ + M₂ − M₂·cos(2Δ)

α₁ = [−(2M₁+M₂)g sinθ₁ − M₂g sin(θ₁−2θ₂) − 2 sinΔ·M₂(ω₂²L₂ + ω₁²L₁cosΔ)]
     ÷ (L₁·D)

α₂ = 2 sinΔ·[(M₁+M₂)ω₁²L₁ + (M₁+M₂)g cosθ₁ + M₂ω₂²L₂cosΔ]
     ÷ (L₂·D)`}</pre>
      <p>
        <code>D</code> is the shared denominator. It approaches zero when{" "}
        <code>Δ ≈ π/2</code> (arms at right angles). The blueprint clamps it to{" "}
        <code>1e-10</code> to avoid division by zero during initialisation.
      </p>
      <p>
        These equations come from the Lagrangian derivation first formalised by
        Lagrange in 1788 (see the credited Public Domain source below). The
        Matplotlib <code>double_pendulum.py</code> example (BSD-3-Clause)
        implements the same equations using SciPy&apos;s <code>odeint</code>;
        this blueprint solves them with a simpler{" "}
        <strong>Symplectic Euler</strong> step instead.
      </p>

      <h2>Why Symplectic Euler?</h2>
      <p>
        Naïve (explicit) Euler updates position with the{" "}
        <em>old</em> velocity and velocity with the{" "}
        <em>old</em> acceleration. It adds a small amount of energy each step,
        so a pendulum slowly gains amplitude and eventually explodes. Symplectic
        Euler updates velocity <em>first</em>, then position using the{" "}
        <em>new</em> velocity:
      </p>
      <pre>{`ω₁ += α₁·dt    # velocity update (new)
ω₂ += α₂·dt
θ₁ += ω₁·dt    # position uses NEW velocity
θ₂ += ω₂·dt`}</pre>
      <p>
        This one-line change preserves a modified Hamiltonian: the energy
        oscillates by O(dt²) per step rather than drifting monotonically. For a
        250-frame visual demo at 60 fps (dt = 1/60 s) the difference is
        invisible; for longer runs it keeps the pendulum from gaining or losing
        amplitude. The same integrator drives the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-coupled-pendulums-mathieu-resonance"
          className={lk}
        >
          Coupled Pendulums
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting"
          className={lk}
        >
          SPH Fluid
        </Link>{" "}
        tutorials for the same reason.
      </p>

      <h2>Build modifier as a light-painting shutter</h2>
      <p>
        Every frame, the lower bob&apos;s world position is known from the
        precomputed trajectory. Rather than spawning new vertices at runtime,
        the blueprint creates the full trail mesh up front (FRAME_END + 1
        vertices in a single edge chain) and uses the{" "}
        <strong>Build modifier</strong> to unmask one additional edge per frame:
      </p>
      <pre>{`mod = ob.modifiers.new("Build", 'BUILD')
mod.frame_start    = 1
mod.frame_duration = 250.0
mod.use_random_order = False`}</pre>
      <p>
        <code>use_random_order = False</code> is critical: it forces the modifier
        to reveal edges in index order (chronological trajectory order). With{" "}
        <code>True</code> the trail appears as random confetti rather than a
        growing neon thread. Compare this with the poi-spinner technique in{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr"
          className={lk}
        >
          Points to Curves Poi Trail
        </Link>
        , which builds the ribbon in real-time inside a Simulation Zone instead.
        Build modifier is cheaper for pre-baked trajectories; the Simulation Zone
        approach is necessary when the path cannot be known in advance.
      </p>

      <h2>Chaos visualised: the divergence test</h2>
      <p>
        Set <code>N_PEND = 2</code> and <code>EPSILON = 1e-6</code> (one
        microradian). The two pendulums are indistinguishable for the first 30
        frames. By frame 60 they have diverged by several centimetres. By frame
        120 they are on completely different sections of the attractor. This is
        the <em>Lyapunov exponent</em> made visible: the separation grows as{" "}
        <code>e^{`{λt}`}</code> where <code>λ ≈ 3 bits/s</code> for a typical
        double pendulum configuration. Halving the initial separation buys you
        roughly 0.33 s of synchronisation at these parameters.
      </p>
    </>
  );
}

const data = {
  date: "2026-07-24",
  title:
    "GN Simulation Zone — Double Pendulum Chaos: Deterministic Butterfly & Light-Painting Trails (Blender 5.1)",
  lede: "Five pendulums offset by ε = 0.001 rad diverge to completely different trajectories within 120 frames; their lower-bob trails are revealed frame-by-frame via Build modifiers as neon light-painting calligraphy on a black EEVEE canvas.",
  body: Body,
  libraryPath:
    "blends/geometry-nodes/gn-simulation-zone-double-pendulum-chaos-butterfly/",
  steps: [
    {
      title: "Run blueprint.py — scene setup and trajectory precomputation",
      body: "Open Blender 5.1 · Scripting workspace. Open `blueprint.py` and press **Run Script**.\n\n`_purge()` clears all objects, meshes, materials, and node groups from the startup scene.\n\n`_precompute()` integrates the equations of motion for N_PEND=5 pendulums × FRAME_END=250 frames using Symplectic Euler at dt=1/60 s. It returns `_traj[f][i]` = (θ₁, ω₁, θ₂, ω₂) for frame f, pendulum i. All 5 × 251 states are computed in under a second in Python.",
    },
    {
      title: "Build the pre-baked trail meshes",
      body: "`_make_trail(idx, traj, mat)` builds a mesh with FRAME_END+1 vertices positioned at the lower-bob world position for each frame:\n  `x2 = x1 + L2·sin(θ₂)`, `y2 = y1 − L2·cos(θ₂)`\n  (pivot at origin; angles measured from downward vertical)\n\nA single edge chain connects sequential vertices chronologically. Build modifier settings:\n  `frame_start = 1, frame_duration = 250, use_random_order = False`\n\nThe result: one new edge (one new step of the trail) becomes visible each frame. No per-frame mesh update is needed for the trail — the Build modifier handles the reveal entirely.",
    },
    {
      title: "Arm objects and the frame_change_pre handler",
      body: "`_make_arm(idx, mat)` creates a 3-vertex, 2-edge mesh: vertices 0→1 are the upper arm, 1→2 the lower arm.\n\n`@persistent _on_frame(scene, _depsgraph)` runs before every frame evaluates:\n  `verts[0].co = (0,0,0)`  — pivot, always at origin\n  `verts[1].co = b1`       — upper bob = (L1·sinθ₁, −L1·cosθ₁, 0)\n  `verts[2].co = b2`       — lower bob = b1 + (L2·sinθ₂, −L2·cosθ₂, 0)\n\nThe `@persistent` decorator keeps the handler alive after file reload. Remove it in production exports: `bpy.app.handlers.frame_change_pre.remove(_on_frame)`.",
    },
    {
      title: "Neon emission materials and EEVEE Bloom",
      body: "`_emission_mat(name, rgb, strength)` builds a two-node tree: `ShaderNodeEmission → ShaderNodeOutputMaterial`.\n\nFive hues (constants `NEON`):\n  cyan (0.02, 0.85, 1.00) · magenta (1.00, 0.20, 0.90) · green (0.15, 1.00, 0.30)\n  amber (1.00, 0.65, 0.05) · violet (0.55, 0.15, 1.00)\n\nBloom settings in `scene.eevee`:\n  `bloom_threshold = 0.25`  — only bright emission blooms\n  `bloom_intensity = 1.5`\n  `bloom_radius    = 6.0`   — wide halo matches physical lens flare\n\nWorld colour is set to pure black (0,0,0) so unlit areas render as absolute black, making the emission trails read as long-exposure light-painting.",
    },
    {
      title: "Run record.py to render viewport.mp4",
      body: "Open `record.py` and press **Run Script** in the same session.\n\nThe script sets EEVEE Next as render engine, 1280×720, 60 fps, H.264 output. It verifies all Build modifiers are configured correctly, then calls `bpy.ops.render.render(animation=True)`.\n\nOutput path (relative to the .blend file location):\n  `public/library/videos/geometry-nodes/gn-simulation-zone-double-pendulum-chaos-butterfly/viewport.mp4`\n\nRendering 250 frames at 1280×720 in EEVEE Next takes approximately 2–4 minutes on a mid-range GPU.",
    },
  ],
  finalResult:
    "Five double pendulums with θ₁ offset by 0.001 rad, integrated for 250 frames at 60 fps using Symplectic Euler. Lower-bob trails precomputed and stored as edge-chain meshes; Build modifier reveals one edge per frame producing real-time light-painting calligraphy. Neon emission materials (five hues) + EEVEE Next Bloom render on a pure-black world for a long-exposure photograph aesthetic. The chaos manifests visibly: the five trails are identical for the first 30 frames, then diverge progressively until they fill the frame with uncorrelated neon calligraphy.",
  variations: [
    "Increase N_PEND to 20 with EPSILON = 0.0001. The initial frames show a single thick line that fans out like a neon flower. At frame 250 the attractor looks fully sampled — all the chaotic trajectories together trace the strange attractor.",
    "Set TH1_0 = TH2_0 = math.radians(5). Near-vertical initial conditions produce near-periodic oscillation for the first 200 frames before the system finds the chaotic regime. This demonstrates that chaos has an onset — it is not present for all initial conditions.",
    "Replace the Symplectic Euler integrator with RK4 (Runge-Kutta 4th order). Use SciPy in a Blender Python session: `from scipy.integrate import odeint`. RK4 is more accurate but slower; the visual difference between integrators is negligible at dt=1/60 s but meaningful at dt=1/24 s.",
    "Export the five trail meshes as separate GLBs: loop `bpy.context.scene.frame_set(FRAME_END); bpy.ops.export_scene.gltf(filepath=f'trail_{i}.glb')` per pendulum. Each GLB is a static snapshot of the full chaos trail — usable as a decoration mesh in WebXR without any runtime simulation.",
    "Add a thin translucent material to the arm edges and use a ShaderToRGB node in EEVEE to get a toon outline. The pendulum rods then read as black ink strokes against the neon trails — a brushwork aesthetic.",
  ],
  troubleshooting: [
    {
      symptom: "Trails do not grow — all trail geometry is visible at frame 1",
      cause:
        "The Build modifier `frame_start` is 0 instead of 1, or `frame_duration` is too small, so the full reveal happens before any animation plays.",
      fix: "Check `mod.frame_start = 1` and `mod.frame_duration = 250` in `_make_trail`. In the modifier panel, confirm Build Start = 1 and Length = 250. If you changed FRAME_END, update both `frame_duration` and `scene.frame_end`.",
    },
    {
      symptom: "All five trails are identical — no divergence visible",
      cause:
        "EPSILON is set to 0.0. The five pendulums share the exact same initial conditions and therefore produce identical trajectories.",
      fix: "Set `EPSILON = 0.001` (the default). Values below 1e-6 may diverge too slowly to be visible within 250 frames at these parameters.",
    },
    {
      symptom: "Arm edges do not update — pendulum appears frozen at frame 1",
      cause:
        "The `_on_frame` handler was not registered, or was removed by a file reload without the `@persistent` decorator reattaching it.",
      fix: "Re-run blueprint.py. Check `bpy.app.handlers.frame_change_pre` in the Python console: `print(bpy.app.handlers.frame_change_pre)` should list `_on_frame`. If not, call `bpy.app.handlers.frame_change_pre.append(_on_frame)` manually.",
    },
    {
      symptom: "Division by zero error at frame 1",
      cause:
        "The denominator `D = 2M₁ + M₂ − M₂·cos(2Δ)` is exactly zero for some initial condition. This happens when `Δ = θ₂ − θ₁ = ±90°` — the arms are perpendicular.",
      fix: "Avoid initial conditions where `TH2_0 − TH1_0 = ±π/2`. The blueprint already clamps `denom` to `1e-10` as a safety measure, which turns the division into a very large (but finite) acceleration that effectively acts as a repulsive force, preventing the singularity in practice.",
    },
    {
      symptom: "Render is completely black — no trails visible in viewport.mp4",
      cause:
        "World colour is set to white, washing out the emission. Or the Build modifier reveals all geometry at frame 0, and the camera is not pointed at the scene.",
      fix: "Verify `scene.world.color = (0,0,0)` and camera at `(0, −5.5, −0.5)` pointing toward origin. In record.py, `bpy.context.scene.camera` should return the 'Cam' object from blueprint.py.",
    },
  ],
  externalLinks: [
    {
      label:
        "Matplotlib double_pendulum.py — BSD-3-Clause (The Matplotlib Contributors)",
      href: "https://github.com/matplotlib/matplotlib/blob/main/galleries/examples/animation/double_pendulum.py",
    },
    {
      label:
        "Lagrange — Mécanique analytique 1788 — Public Domain (Internet Archive)",
      href: "https://archive.org/details/mcaniqueanalytiq00lagr",
    },
    {
      label:
        "Blender Manual — Build Modifier (CC-BY-SA 4.0, Blender Foundation)",
      href: "https://docs.blender.org/manual/en/5.1/modeling/modifiers/generate/build.html",
    },
  ],
  relatedTutorials: [
    {
      label: "Spring-Pendulum Poi — Elastic Orbit & Lissajous Light-Painting",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting",
    },
    {
      label: "Coupled Pendulums — Mathieu Parametric Resonance & Standing Waves",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-coupled-pendulums-mathieu-resonance",
    },
    {
      label: "Points to Curves — Poi Trail & Particle Streak Ribbon for WebXR",
      href: "/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr",
    },
    {
      label:
        "SPH Fluid — Müller Pressure & Viscosity Kernels for Light-Painting Trails",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting",
    },
    {
      label: "BZ Oregonator — Deterministic Spiral Waves (another chaos-adjacent system)",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-bz-oregonator-spiral-waves",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-gn-simulation-zone-double-pendulum-chaos-butterfly",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "geometry-nodes",
      "simulation",
      "physics",
      "chaos",
      "light-painting",
    ],
    body: Body,
  },
  data,
);
