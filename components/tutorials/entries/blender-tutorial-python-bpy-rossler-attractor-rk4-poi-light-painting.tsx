import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Otto Rössler, in 1976, was looking for the simplest autonomous ODE that
        could produce chaos. He found it in three equations with a single
        quadratic nonlinearity — the term z·(x − c) in the third equation.
        Below c ≈ 4.6 the flow settles to a limit cycle; above it, the
        period-doubling cascade tips the system into a strange attractor: a
        ribbon wound around an invisible torus, endlessly folded back on itself.
      </p>
      <p>
        Unlike the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting"
          className={lk}
        >
          Lorenz butterfly
        </Link>{" "}
        (two nonlinear terms, two lobes, λ₁ ≈ 0.906), the Rössler attractor has
        one lobe and a much smaller Lyapunov exponent — λ₁ ≈ 0.071.
        Divergence is twelve times slower, which means eight seeds seeded ε = 0.025
        apart stay visibly coiled for the first two or three spiral turns before
        separating.  That slow peel-apart is the light-painting's defining moment.
      </p>

      <h2>The Rössler system</h2>
      <pre>{`dx/dt = −y − z
dy/dt =  x + a·y
dz/dt =  b + z·(x − c)

a = b = 0.2  ·  c = 5.7   (classic chaotic regime)`}</pre>
      <p>
        The fold mechanism: when the spiral in the x–y plane carries a trajectory
        to large x (x ≈ c), the nonlinear term z·(x − c) turns positive and z
        begins to grow exponentially. This is the &ldquo;fold-back kick&rdquo; —
        the trajectory is flung to high z, the linear terms then drag it back
        toward the x–y plane, and the next spiral begins.  It is one geometric
        act — stretch, fold, return — repeated forever.  Each cycle is almost
        but never quite identical to the last.
      </p>

      <h2>Lyapunov exponent and seed separation</h2>
      <p>
        With λ₁ = 0.071 per time unit, an initial separation δ₀ grows as
        δ(t) = δ₀ · e^(λ₁ · t). After T = N_FRAMES × N_SUB × DT = 480 × 20 × 0.002 = 19.2
        time units:
      </p>
      <pre>{`δ(19.2) = 0.025 × e^(0.071 × 19.2) ≈ 0.025 × 3.88 ≈ 0.097 Rössler units
           = 0.097 × 0.035 ≈ 0.0034 m in Blender space`}</pre>
      <p>
        The attractor spans roughly 30 Rössler units in x and y (≈ 1.05 m at
        SCALE = 0.035). Eight seeds diverge by ≈ 0.003 m — still close at the
        attractor scale, but decorrelated enough that each trail samples a
        different band of the folded ribbon.  Increasing N_FRAMES to 960 pushes
        the divergence to ~0.013 m, at which point trails cross wing boundaries
        independently.
      </p>
      <p>
        Compare the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-nbody-gravity-star-cluster-leapfrog-light-painting"
          className={lk}
        >
          N-body gravity blueprint
        </Link>
        , where each particle&apos;s trajectory is physically independent —
        there is no shared ODE, only pairwise forces.  The Rössler seeds DO share
        the same attractor geometry; their trajectories are the same mathematical
        curve offset by a tiny initial nudge.
      </p>

      <h2>RK4 vs. Euler for a folded-band system</h2>
      <p>
        The fold region amplifies integration error: near x = c the z equation
        has a large positive coefficient z·(x − c), meaning small errors in x or
        z compound quickly.  Euler&apos;s O(h²) local error at h = 0.002 produces
        ~10⁻⁶ drift per step; accumulated over N_SKIP + N_FRAMES·N_SUB = 10 200
        steps the total drift is ~0.01 — comparable to EPSILON, completely
        corrupting the divergence demonstration.  RK4&apos;s O(h⁵) error is ~10⁻¹³
        per step, negligible against the O(0.001) physical divergence.
      </p>
      <p>
        The same RK4 pattern drives the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-spring-pendulum-poi-lissajous-light-painting"
          className={lk}
        >
          Spring-Pendulum Lissajous blueprint
        </Link>{" "}
        — there it integrates a conservative mechanical system, here a
        dissipative chaotic attractor.  The integrator is the same; the physics
        differs.
      </p>

      <h2>bevel_factor_end: the growing-tube reveal</h2>
      <p>
        Setting <code>cu.bevel_factor_end</code> from 0.0 to 1.0 over FRAME_END
        frames makes the tube grow along the spline at a constant rate — equivalent
        to a poi spinner drawing a light trail under a 16-second long exposure.
        The keyframe must be on the <strong>curve data-block</strong>{" "}
        (<code>cu.keyframe_insert(...)</code>), not the object — the Build modifier
        used in mesh-reveal tutorials is irrelevant here.
      </p>
      <p>
        Linear interpolation between the two keyframes gives constant drawing speed.
        Using BEZIER interpolation instead produces an ease-in / ease-out motion —
        the tube grows slowly at first, accelerates in the middle, then slows
        near the tip.  This can match the poi physics of a throw: slow at the peak,
        fast through the swing.  See the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr"
          className={lk}
        >
          Points to Curves Poi Trail tutorial
        </Link>{" "}
        for alternative ribbon-building approaches using Geometry Nodes.
      </p>

      <h2>Parameter space: c and the period-doubling route to chaos</h2>
      <pre>{`c = 2.5  →  stable limit cycle (period-1).  One closed loop, no divergence.
c = 3.5  →  period-2 orbit (first bifurcation).  Two-loop attractor.
c = 4.0  →  period-4 orbit.
c ≈ 4.6  →  onset of chaos via period-doubling cascade.
c = 5.7  →  standard strange attractor (this blueprint).
c = 14   →  funnel chaos: multiple fold-back points, denser coverage.`}</pre>
      <p>
        Sweeping c from 4.0 to 6.0 in 0.1 increments with a loop generates an
        animation that shows the birth of chaos — a natural companion to Dimona&apos;s{" "}
        <Link href="/tutorials/blender-tutorial-gn-simulation-zone-double-pendulum-chaos-butterfly" className={lk}>
          double-pendulum bifurcation sequence
        </Link>
        .
      </p>
    </>
  );
}

const data = {
  date: "2026-07-25",
  title:
    "Python bpy — Rössler Strange Attractor: Folded-Band Chaos & Spiral Poi Light-Painting Trails (Blender 5.1)",
  lede: "Eight poi-spinner trajectories seeded ε=0.025 apart are integrated with 4th-order Runge–Kutta through the Rössler folded-band attractor (a=b=0.2, c=5.7) and rendered as growing neon POLY-curve tubes on a pure-black EEVEE canvas; the attractor's small Lyapunov exponent (λ₁≈0.071) makes the slow divergence of coiled trails the visual centrepiece.",
  body: Body,
  libraryPath:
    "blends/scripting/python-bpy-rossler-attractor-rk4-poi-light-painting/",
  steps: [
    {
      title: "Run blueprint.py — integration and curve construction",
      body: "Open Blender 5.1 · Scripting workspace. Open `blueprint.py` and press **Run Script**.\n\n`_purge()` clears objects, materials, curves, and actions.\n\n`_integrate(x0, y0, z0)` runs N_SKIP=600 warm-up RK4 steps (discards the transient), then records N_FRAMES=480 points using N_SUB=20 substeps each. Total simulated time: (600 + 480×20) × 0.002 = 20.4 Rössler time units.\n\nEight seeds are placed on a tiny circle of radius EPSILON=0.025 in the x–y plane. Angular spacing (2π·i/8) stagers the fold arrivals so not all trails re-enter the spiral simultaneously.",
    },
    {
      title: "Understand the fold and the Lyapunov exponent",
      body: "Open the Python console while the scene is loaded. Run:\n  `print(0.025 * 2.718**(0.071 * 19.2))`\nOutput: ≈ 0.097 Rössler units → 0.0034 m in Blender space.\n\nThis is the expected separation of two adjacent seeds after the recorded 19.2 time units. The attractor spans ≈ 1.05 m, so divergence is only 0.3 % of attractor width — the trails remain visually close but decorrelated. Compare Lorenz (λ₁=0.906): the same 19.2 time units would separate seeds by ~0.025 × e^17.4 ≈ 7 × 10⁷ Lorenz units — Lorenz divergence is astronomically faster.",
    },
    {
      title: "Inspect the bevel_factor_end animation",
      body: "In the Python console:\n  `cu = bpy.data.curves['rossler_0']`\n  `print(cu.animation_data.action.fcurves[0].keyframe_points[:])`\n\nShould report two keyframe points: frame=1, value=0.0 and frame=480, value=1.0, both with INTERPOLATION_LINEAR.\n\nTo verify the animation is on the CURVE (not the object):\n  `ob = bpy.data.objects['rossler_0']`\n  `print(ob.animation_data)`   # should be None\n  `print(cu.animation_data)`  # should be an AnimData block",
    },
    {
      title: "Neon materials and EEVEE Bloom",
      body: "`_mat(name, rgba)` builds a two-node Emission→Output tree. Eight colours span gold→amber→red→raspberry→violet→cerulean→jade→white — warm tones for the inner spiral, cool tones for the fold excursion.\n\nEEVEE Bloom settings:\n  `bloom_threshold = 0.3` — only bright emission blooms\n  `bloom_intensity = 1.5`\n  `bloom_radius    = 5.5`\n\nReduce EMIT_STR to 3.0 and bloom_intensity to 0.5 for a more technical, less painterly look — appropriate if using the GLB as a physics-visualization prop in a WebXR diagram.",
    },
    {
      title: "GLB export and record.py render",
      body: "`_export()` calls `scene.frame_set(FRAME_END)` first — all bevel_factor_end values are 1.0 at the export frame, so the full tube geometry is present. `export_apply=True` bakes the curves into static mesh geometry.\n\nFor the viewport render: open `record.py` → Run Script. Output path:\n  `public/library/videos/scripting/.../viewport.mp4`\n\nFor the screen recording: follow `SCREEN-RECORDING-NOTES.md`.",
    },
  ],
  finalResult:
    "Eight Rössler trajectories (a=b=0.2, c=5.7) integrated with RK4 at h=0.002 over 20.4 simulated time units. Each trail is a POLY curve with bevel_depth=0.009 and bevel_factor_end animated 0→1 over 480 frames. Eight emission materials (gold→white palette, strength=9) with EEVEE Bloom (threshold=0.3, intensity=1.5, radius=5.5) produce the long-exposure light-painting aesthetic. GLB exported with full tube mesh. The slow divergence (λ₁≈0.071) gives the animation its characteristic slow-peel aesthetic: trails stay coiled for the first 150 frames, then gradually split across different bands of the folded ribbon.",
  variations: [
    "Set C=14.0 for funnel chaos. The attractor widens into multiple winding rings — the fold returns to a larger annulus rather than a tight spiral. The light-painting takes on a spiderweb texture. Set N_FRAMES=600 and reduce SCALE to 0.025 to keep the wider attractor in frame.",
    "Set N_TRAJ=24 and EPSILON=0.001. With 24 near-identical seeds the attractor ribbon itself becomes visible as a dense curtain of overlapping tubes. This is mathematically equivalent to sampling the attractor's SRB (Sinai–Ruelle–Bowen) invariant measure via many ergodic trajectories.",
    "Replace the POLY spline with a NURBS spline (`cu.splines.new('NURBS')`, `order_u=4`). NURBS interpolates smoothly between control points, making the tube look organic and continuous rather than polygonal. The bevel_factor_end animation works identically — the tube still grows along the spline.",
    "Set A=0.1, B=0.1, C=14.0 and add a second set of 8 trails at C=5.7 in a different colour palette. Render both simultaneously. The two sets of trails trace different attractor geometries in the same scene — a direct visual comparison of how a single parameter (c) reshapes the invariant set.",
    "Animate C from 4.0 to 6.0 using an App Handler on frame change: set `C_global = 4.0 + frame/scene.frame_end * 2.0` and re-integrate one trail per frame. The animation shows the birth of chaos — a sweeping single-trail that first closes into a limit cycle, then begins to wander.",
  ],
  troubleshooting: [
    {
      symptom: "Tube does not grow — full trail visible at frame 1",
      cause:
        "bevel_factor_end keyframes were not inserted, or were inserted on the OBJECT rather than the CURVE data-block.",
      fix: "In the Python console: `cu = bpy.data.objects['rossler_0'].data; print(cu.animation_data)`. If None, the keyframe is missing — re-run blueprint.py. Also check `scene.frame_end == 480`: if it is 1, all keyframes collapse to a single frame and the animation appears static.",
    },
    {
      symptom: "All eight trails look identical — no visible divergence",
      cause:
        "N_SKIP is too low (warmup insufficient) so seeds are still in the transient, not on the attractor.",
      fix: "Increase N_SKIP to 1200. The Rössler transient lasts roughly 30–60 time units from a cold start; at N_SKIP=600 and DT=0.002, only 1.2 time units of warm-up occurs. N_SKIP=1200 gives 2.4 time units — usually enough. Also confirm EPSILON=0.025 and not 0.0.",
    },
    {
      symptom: "GLB export produces empty geometry",
      cause:
        "`export_apply=True` bakes the curve at the CURRENT frame. If bevel_factor_end=0 at export time, the mesh has zero faces.",
      fix: "Confirm `_export()` calls `scene.frame_set(FRAME_END)` before the GLTF export. Check TUBE_R (BEVEL_R) > 0. In the GLTF export panel, verify 'Apply Modifiers' is ticked.",
    },
    {
      symptom: "Spiral looks blocky — visible polygon edges on the tube",
      cause: "BEVEL_RES=3 gives an 8-sided tube cross-section, visible at close range.",
      fix: "Increase BEVEL_RES to 5 (12-sided) or 7 (16-sided). Add `ob.data.auto_smooth_angle = math.radians(30)` before linking to enable smooth shading on the converted mesh. Note: higher resolution increases the GLB file size linearly with tube circumference segments.",
    },
  ],
  externalLinks: [
    {
      label:
        "Rössler 1976 — 'An equation for continuous chaos' — Physics Letters A — equations are public domain",
      href: "https://doi.org/10.1016/0375-9601(76)90101-8",
    },
    {
      label:
        "Sprott's Rössler Attractor page — parameter tables & Lyapunov spectra — public domain",
      href: "https://sprott.physics.wisc.edu/chaos/rossler.htm",
    },
    {
      label:
        "Blender Python API — bpy.types.Curve — CC-BY-SA-4.0 — Blender Foundation",
      href: "https://docs.blender.org/api/5.1/bpy.types.Curve.html",
    },
  ],
  relatedTutorials: [
    {
      label:
        "Lorenz Strange Attractor — Butterfly Chaos & Sensitive Divergence",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting",
    },
    {
      label:
        "Double Pendulum Chaos — Deterministic Butterfly & Light-Painting Trails",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-double-pendulum-chaos-butterfly",
    },
    {
      label: "Points to Curves — Poi Trail & Particle Streak Ribbon for WebXR",
      href: "/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr",
    },
    {
      label:
        "N-body Gravity — Plummer Star Cluster Collapse & KDK Leapfrog Light-Painting",
      href: "/tutorials/blender-tutorial-python-nbody-gravity-star-cluster-leapfrog-light-painting",
    },
  ],
};

export const entry: Entry = buildInstructable(
  {
    slug: "blender-tutorial-python-bpy-rossler-attractor-rk4-poi-light-painting",
    title: data.title,
    lede: data.lede,
    date: data.date,
    tags: [
      "blender",
      "scripting",
      "simulation",
      "chaos",
      "physics",
      "light-painting",
      "webxr",
    ],
    body: Body,
  },
  data,
);
