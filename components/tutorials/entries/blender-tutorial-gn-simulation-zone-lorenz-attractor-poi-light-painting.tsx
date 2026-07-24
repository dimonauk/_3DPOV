import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        In 1963 Edward Lorenz was integrating a simplified model of atmospheric
        convection rolls on an early Royal McBee computer when he noticed that
        restarting a run from a mid-point printout — rounded to three decimal
        places — produced a completely different weather sequence after a few
        minutes of simulated time. The tiny rounding difference had grown
        exponentially. That observation became the founding observation of{" "}
        <em>deterministic chaos</em>: perfect, lawful ODEs whose trajectories
        are so sensitive to initial conditions that even floating-point rounding
        separates them on human-visible timescales.
      </p>
      <p>
        This blueprint pre-computes six Lorenz trajectories in Python using
        4th-order Runge-Kutta, stores each as a POLY curve with a bevel tube,
        and animates the trail growing via <code>bevel_factor_end</code> — the
        same curve-reveal technique used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr"
          className={lk}
        >
          Points to Curves Poi Trail tutorial
        </Link>
        . Six neon threads emerge from the same point and diverge across the
        butterfly strange attractor: a slow-exposure light-painting photograph
        of chaos.
      </p>

      <h2>The Lorenz system</h2>
      <p>
        Three coupled first-order ODEs, one nonlinear term each in Y and Z:
      </p>
      <pre>{`dX/dt = σ(Y − X)
dY/dt = X(ρ − Z) − Y
dZ/dt = XY − βZ

σ = 10   (Prandtl number — viscosity vs thermal diffusivity ratio)
ρ = 28   (normalised Rayleigh number — driving force of convection)
β = 8/3  (aspect-ratio term of the convection cell geometry)`}</pre>
      <p>
        The system has three fixed points. The origin is an unstable saddle.
        The two non-trivial fixed points C± = (±√(β(ρ−1)), ±√(β(ρ−1)), ρ−1)
        ≈ (±8.49, ±8.49, 27) are the &ldquo;eyes&rdquo; of the butterfly wings
        — each trajectory orbits one wing a few times, then jumps to the other.
        The jump timing is never periodic; the system never settles.
      </p>

      <h2>Why RK4, not Euler?</h2>
      <p>
        Explicit Euler (the simplest integrator) has local error O(h²) and
        global error O(h). For the Lorenz system at h=0.002, the Euler per-step
        error is ~10⁻⁶ — large enough to accumulate into a visible phase error
        within a few hundred steps. Coupled with the positive Lyapunov exponent
        (λ₁ ≈ 0.906), Euler&apos;s drift looks indistinguishable from physical
        chaos and makes the integration unreliable as a reference.
      </p>
      <p>
        RK4 uses four slope estimates per step, achieving local error O(h⁵) and
        global O(h⁴). At h=0.002 the per-step truncation error is ~10⁻¹³ —
        twelve orders of magnitude better than Euler at the same step size:
      </p>
      <pre>{`k1 = f(x, y, z)
k2 = f(x + h/2·k1[0], y + h/2·k1[1], z + h/2·k1[2])
k3 = f(x + h/2·k2[0], y + h/2·k2[1], z + h/2·k2[2])
k4 = f(x + h·k3[0],   y + h·k3[1],   z + h·k3[2])
x_new = x + h·(k1[0] + 2k2[0] + 2k3[0] + k4[0])/6`}</pre>
      <p>
        Compare this with the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-double-pendulum-chaos-butterfly"
          className={lk}
        >
          Double Pendulum blueprint
        </Link>
        , which uses Symplectic Euler. Symplectic Euler conserves a modified
        Hamiltonian — good for energy-conserving mechanical systems but
        irrelevant for the Lorenz system, which is dissipative (the attractor
        has zero volume in phase space despite being fractal). RK4 is the
        correct choice here.
      </p>

      <h2>The Lyapunov exponent made visible</h2>
      <p>
        The positive Lyapunov exponent λ₁ ≈ 0.906 per time unit means an
        initial separation δ₀ grows as δ(t) = δ₀ · e^(λ₁·t). With ε=0.01 and
        8 recorded time units:
      </p>
      <pre>{`δ(8) = 0.01 × e^(0.906 × 8) ≈ 0.01 × 1270 ≈ 12.7 Lorenz units`}</pre>
      <p>
        The attractor spans roughly ±20 units in X, so after 8 time units our
        six trails have separated by more than half the attractor width —
        completely decorrelated, visiting different regions of the butterfly.
        Set N_TRAJ=2 and EPSILON=1e-6 to see the transition: the two paths
        stay layered for ~2 time units (~80 frames), then abruptly diverge.
        That lag is 1/λ₁ · ln(1/ε) ≈ 15 time units to separate by 1 unit —
        but the Lorenz attractor&apos;s chaotic mixing accelerates the visible
        divergence long before that theoretical maximum.
      </p>

      <h2>bevel_factor_end: tube-growing animation</h2>
      <p>
        Blender&apos;s <code>bpy.types.Curve.bevel_factor_end</code> controls
        what fraction of the curve&apos;s length has the bevel (tube)
        cross-section applied. At 0.0 the tube has zero length; at 1.0 the
        full tube is visible. Keyframing it from 0→1 across FRAME_END frames
        makes the tube appear to grow along the spline — equivalent to a poi
        spinner drawing a light trail in a long-exposure photograph:
      </p>
      <pre>{`cu.bevel_factor_end = 0.0
cu.keyframe_insert("bevel_factor_end", frame=0)
cu.bevel_factor_end = 1.0
cu.keyframe_insert("bevel_factor_end", frame=FRAME_END)
# Force LINEAR interpolation — constant drawing speed
for fc in cu.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'`}</pre>
      <p>
        The keyframe is on the <strong>curve data-block</strong>, not the
        object — so <code>cu.keyframe_insert(...)</code>, not{" "}
        <code>ob.keyframe_insert(...)</code>. This distinction matters: the
        Build modifier (used in the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting"
          className={lk}
        >
          SPH Fluid tutorial
        </Link>
        ) operates on mesh objects and reveals faces/edges; for curves,
        bevel_factor_end is the correct reveal mechanism. The GLB exporter&apos;s{" "}
        <code>export_apply=True</code> converts the curve to a mesh at the
        current frame&apos;s bevel state — so calling{" "}
        <code>scene.frame_set(FRAME_END)</code> before export yields the
        complete butterfly.
      </p>
    </>
  );
}

const data = {
  date: "2026-07-24",
  title:
    "GN Simulation Zone — Lorenz Strange Attractor: Butterfly Chaos & Sensitive Divergence for Poi Light-Painting (Blender 5.1)",
  lede: "Six Lorenz trajectories (σ=10, ρ=28, β=8/3) start within ε=0.01 of each other and diverge exponentially across the butterfly strange attractor; pre-computed with RK4 and revealed as growing neon tube curves via bevel_factor_end animation on a pure-black EEVEE canvas.",
  body: Body,
  libraryPath:
    "blends/geometry-nodes/gn-simulation-zone-lorenz-attractor-poi-light-painting/",
  steps: [
    {
      title: "Run blueprint.py — RK4 integration and curve construction",
      body: "Open Blender 5.1 · Scripting workspace. Open `blueprint.py` and press **Run Script**.\n\n`_purge()` clears all objects, materials, curves, and actions from the scene.\n\n`_integrate(x0, y0, z0)` runs N_SKIP=800 warm-up steps then records N_FRAMES=400 points (each averaged over N_SUBSTEPS=10 RK4 steps at DT=0.002). Total simulation time: (800+400×10)×0.002 = 9.6 time units — 1.6 transient + 8.0 recorded.\n\n`_make_trail(idx, pts, mat)` creates a POLY spline from the 400 recorded points, sets bevel_depth=0.013 (26 mm diameter tube), and keyframes bevel_factor_end 0→1 over 400 frames.",
    },
    {
      title: "Understand the curve bevel_factor_end animation",
      body: "`bevel_factor_end` is a float property on `bpy.types.Curve` (not the object). It controls what fraction of the spline length has bevel geometry applied:\n  0.0 = no tube visible\n  0.5 = tube runs to the midpoint of the spline\n  1.0 = full tube\n\nWith LINEAR interpolation between frame=0 (value=0.0) and frame=400 (value=1.0), exactly 1/400 of the tube becomes visible per frame — simulating the rate at which a poi spinner would draw this trail under a 13-second long exposure.\n\nCRITICAL: `cu.keyframe_insert('bevel_factor_end', frame=N)` must be called on the CURVE data-block (`cu`), not the OBJECT (`ob`). The animation data is stored on `cu.animation_data`, not `ob.animation_data`.",
    },
    {
      title: "Inspect the Lyapunov divergence",
      body: "To see the divergence directly: open `blueprint.py`, set N_TRAJ=2 and EPSILON=1e-9. Reload the script. In the viewport (Rendered shading), pause at:\n  frame 50 — both trails overlap perfectly\n  frame 150 — a gap appears as one trail crosses to the left wing first\n  frame 300 — the two trails are completely separated, often on opposite wings simultaneously\n\nThe blueprint prints the expected divergence at runtime:\n  `ε·e^(λ₁·T) ≈ ...` where T is the total recorded time in time units.\n\nFor EPSILON=1e-9 and T=8.0: divergence ≈ 1e-9 × e^7.25 ≈ 0.014 Lorenz units = 0.0007 Blender units — still small. Set N_FRAMES=600 to push into the fully-decorrelated regime.",
    },
    {
      title: "Neon emission materials and EEVEE Bloom",
      body: "`_emission_mat(name, rgb, strength)` builds a two-node Emission→Output tree.\n\nSix hues (NEON palette):\n  sky-blue · hot-pink · neon-green · amber · violet · cyan-teal\n\nEEVEE Bloom settings:\n  `bloom_threshold = 0.25` — only bright emission blooms\n  `bloom_intensity = 1.4`\n  `bloom_radius    = 6.0`  — wide halo approximates lens glow\n\nWorld colour = (0, 0, 0) pure black. Emission Strength=10 pushes all six curves well above the bloom threshold so the glow halos are prominent. Reducing EMIT_STR to 2.0 gives sharper, less-bloomed trails for a more technical illustration style.",
    },
    {
      title: "GLB export and record.py render",
      body: "The blueprint exports a GLB automatically at the end:\n  1. `scene.frame_set(FRAME_END)` → all curves at bevel_factor_end=1.0\n  2. `bpy.ops.export_scene.gltf(export_apply=True)` — converts curves to mesh\n  3. Output: `public/library/glbs/geometry-nodes/.../hf_lorenz.glb`\n\nFor the viewport render, open `record.py` and press **Run Script** in the same session.\n\nThe render sweeps frames 1–400 at 30 fps (≈ 13.3 s) in EEVEE Next with Bloom. Output path:\n  `public/library/videos/geometry-nodes/.../viewport.mp4`",
    },
  ],
  finalResult:
    "Six Lorenz trajectories at σ=10, ρ=28, β=8/3, integrated with 4th-order Runge-Kutta at h=0.002. Each trajectory sampled at 400 frames (10 substeps each → 0.02 effective Δt per frame → 8 time units recorded). Trails rendered as POLY curves with bevel_depth=0.013, bevel_factor_end animated 0→1 for a growing-tube reveal. Six neon emission materials with EEVEE Bloom on a pure-black world produce long-exposure light-painting aesthetics. The chaos becomes visible: six identical starting trails diverge across the two-wing butterfly by frame 400. GLB exported with full tube geometry for WebXR deployment.",
  variations: [
    "Set RHO=24.74 (just below the chaotic regime onset at ρ_c ≈ 24.74). Trajectories collapse to one of the two fixed points C± instead of circling between wings. The trail becomes a damped spiral into the attractor's eye — a completely different aesthetic from chaos. This is the period-doubling route to chaos: increase RHO from 24 to 28 in small steps and observe the transition.",
    "Set N_TRAJ=20 and EPSILON=1e-4. With 20 trails, the attractor surface itself becomes visible — the butterfly outline appears as a dense cloud of neon threads, each sampling a different region. This is mathematically equivalent to sampling the invariant measure of the Lorenz system.",
    "Replace the POLY spline with a NURBS spline (change `cu.splines.new('POLY')` to `cu.splines.new('NURBS')`) and set the `order_u` to 4. NURBS produces smoother, organic-looking tubes — better for VRM accessory decoration but computationally heavier. The bevel_factor_end animation still works identically.",
    "Change the camera to an orthographic top-down view (cam_data.type = 'ORTHO', cam_ob.location = (0, 0, 5), cam_ob.rotation_euler = (0, 0, 0)). The top-down Lorenz attractor projects as the classic X-Y oval-of-figure-eight shape — recognisable as a chaos icon and suitable for print or fabric pattern work.",
    "Export each trajectory as a separate GLB: loop over the curve objects, hide all others, export one at a time. Load them in WebXR with per-object reveal timing — animate one curve's visibility starting 2 seconds after the previous, so the butterfly assembles progressively in real time.",
  ],
  troubleshooting: [
    {
      symptom: "The tube does not grow — the full trail is visible at frame 1",
      cause:
        "The bevel_factor_end keyframes were not inserted correctly, or the animation data is on the OBJECT rather than the CURVE data-block.",
      fix: "In the Python console: `ob = bpy.data.objects['lorenz_0']; cu = ob.data; print(cu.animation_data)`. If it returns None, the keyframe is missing. Re-run blueprint.py and confirm `cu.keyframe_insert('bevel_factor_end', frame=0)` executes without error. Also confirm `scene.frame_end = 400` — if it is 1, the animation appears static.",
    },
    {
      symptom: "All six trails are identical — no divergence visible",
      cause:
        "EPSILON is 0.0, or N_SKIP is insufficient to escape the transient and the trajectories have not yet settled onto the attractor.",
      fix: "Check `EPSILON = 0.01` and `N_SKIP = 800`. Increase N_FRAMES to 600 if divergence is still subtle — at 8 time units and ε=0.01 the divergence is ~12.7 Lorenz units (0.64 Blender units), which is clearly visible. If N_SKIP is too small, all six trajectories spiral inward together and the attractor structure is not yet sampled.",
    },
    {
      symptom: "GLB export is empty — no geometry",
      cause:
        "`export_apply=True` attempts to convert the curve to a mesh at the CURRENT frame. If bevel_depth is 0 or bevel_factor_end is 0 at the export frame, the mesh has no faces.",
      fix: "Ensure `scene.frame_set(FRAME_END)` is called before the export. Check `TUBE_R = 0.013` is non-zero. In the GLTF export panel, confirm 'Apply Modifiers' is ticked.",
    },
    {
      symptom: "Tubes are faceted / not smooth — visible polygon edges",
      cause:
        "`bevel_resolution` is too low for the tube diameter. At TUBE_R=0.013 and RES=3, the tube has 4×(3+1)=16 sides — adequate at normal viewing distance but visible up close.",
      fix: "Increase `BEVEL_RES` to 5 (24-sided) or 7 (32-sided). Add `ob.data.use_auto_smooth = True; ob.data.auto_smooth_angle = math.radians(30)` before linking the object to the collection to enable smooth shading on the converted mesh at export.",
    },
  ],
  externalLinks: [
    {
      label:
        "Matplotlib lorenz_attractor.py — BSD-3-Clause (The Matplotlib Contributors)",
      href: "https://github.com/matplotlib/matplotlib/blob/main/galleries/examples/lines_bars_and_markers/lorenz_attractor.py",
    },
    {
      label:
        "Lorenz 1963 — Deterministic Nonperiodic Flow — Public Domain equations (AMS J. Atmos. Sci.)",
      href: "https://journals.ametsoc.org/view/journals/atsc/20/2/1520-0469_1963_020_0130_dnf_2_0_co_2.xml",
    },
    {
      label:
        "Blender Manual — Curve Bevel (CC-BY-SA 4.0, Blender Foundation)",
      href: "https://docs.blender.org/manual/en/5.1/modeling/curves/properties/geometry.html",
    },
  ],
  relatedTutorials: [
    {
      label: "Double Pendulum Chaos — Deterministic Butterfly & Light-Painting Trails",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-double-pendulum-chaos-butterfly",
    },
    {
      label: "BZ Oregonator — Chemical Spiral Waves & Excitable Media",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-bz-oregonator-spiral-waves",
    },
    {
      label: "Points to Curves — Poi Trail & Particle Streak Ribbon for WebXR",
      href: "/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr",
    },
    {
      label: "SPH Fluid — Müller Pressure & Viscosity Kernels for Light-Painting",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting",
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
