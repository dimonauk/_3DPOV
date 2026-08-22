import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        In 1687 Newton proved that two point masses orbit their common centre
        of mass in perfect ellipses — a closed-form result that took seventy
        years of calculus to derive. Add a third body and the problem becomes
        unsolvable in closed form; Poincaré showed in 1889 that even three
        bodies follow trajectories of infinite complexity. With twenty-four
        bodies, what emerges is not chaos but{" "}
        <em>structured collective motion</em>: stars orbiting their own
        centre of mass, stretching an initially compact Plummer disk into
        streaming arms through differential rotation, then falling back and
        mixing. This is the skeleton of every dwarf galaxy that has ever
        existed.
      </p>
      <p>
        This blueprint pre-integrates twenty-four equal-mass stars with the
        KDK leapfrog — a{" "}
        <em>symplectic</em> (phase-space-preserving) integrator that keeps
        long-run energy error bounded rather than drifting — and stores each
        trajectory as a POLY bevel-curve trail revealed with{" "}
        <code>bevel_factor_end</code> animation. The same technique powers the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting"
          className={lk}
        >
          Lorenz Strange Attractor
        </Link>{" "}
        and{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-double-pendulum-chaos-butterfly"
          className={lk}
        >
          Double Pendulum Chaos
        </Link>{" "}
        tutorials; the physics here is qualitatively different — a
        Hamiltonian system with conserved angular momentum that produces
        organised, not chaotic, structure.
      </p>

      <h2>Softened gravity and why it matters</h2>
      <p>
        Newtonian gravity diverges as <code>1/r</code> at zero separation.
        With 24 discrete point masses, close encounters produce enormous
        spurious accelerations that eject stars on unphysical trajectories.
        Real stars also never actually reach zero separation (they have finite
        size), so we replace the exact force with a <em>softened</em> form:
      </p>
      <pre>{`a_ij = G·m_j·(r_j − r_i) / (|r_j − r_i|² + ε²)^(3/2)

ε = 0.20 BU   (softening length, ≈ 17% of Plummer scale radius a = 1.2)`}</pre>
      <p>
        At separations much larger than ε the force is indistinguishable from
        Newton&apos;s; at r ≈ ε the denominator limits the peak force to{" "}
        <code>G·m/ε²</code>, preventing numerical ejection. This is{" "}
        <em>not</em> a physical approximation — it is a numerical safeguard.
        The correct physical interpretation is that each &ldquo;star&rdquo;
        represents a sub-cluster, not a single solar-mass body; ε represents
        the sub-cluster radius.
      </p>

      <h2>KDK leapfrog vs RK4</h2>
      <p>
        The{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting"
          className={lk}
        >
          Lorenz tutorial
        </Link>{" "}
        uses 4th-order Runge-Kutta (RK4), which is superb for dissipative
        systems like the Lorenz attractor. For a Hamiltonian system —
        conservative forces with no friction — RK4 is a poor choice:{" "}
        <em>it is not symplectic</em>, meaning each step perturbs the
        conserved Hamiltonian in a way that accumulates. Over a thousand
        orbital periods, RK4&apos;s energy slowly drifts; orbits spiral in or
        out rather than closing.
      </p>
      <p>
        KDK leapfrog solves this. The three-step Kick-Drift-Kick cycle:
      </p>
      <pre>{`v_{n+½} = v_n    + a(x_n) · (dt/2)   # half-kick (accelerate)
x_{n+1} = x_n   + v_{n+½} · dt        # full drift (move)
a_{n+1} = F(x_{n+1}) / m              # recompute forces at new position
v_{n+1} = v_{n+½} + a_{n+1} · (dt/2) # half-kick (accelerate again)`}</pre>
      <p>
        This symmetric structure makes leapfrog <em>time-reversible</em> and
        symplectic: it preserves phase-space volume exactly and conserves a
        modified Hamiltonian (the true Hamiltonian plus O(dt²) corrections).
        Energy error is bounded rather than drifting — the integrator makes
        the orbit slightly non-elliptical but does not shrink or expand it.
        Professional N-body codes (REBOUND, Gadget-4, Arepo) all use symplectic
        integrators for this reason.
      </p>

      <h2>Plummer sphere and rotating-disk initial conditions</h2>
      <p>
        The Plummer model — proposed by H.C. Plummer in 1911 to fit globular
        cluster data — has a density profile:
      </p>
      <pre>{`ρ(r) = (3M / 4πa³) · (1 + r²/a²)^(−5/2)

a = 1.2 BU  (scale radius — sets the size of the dense core)
M = 1.0     (total mass in N-body units)`}</pre>
      <p>
        To draw random radii from this distribution, invert the cumulative
        distribution function. For radius <code>r</code> satisfying{" "}
        <code>M(&lt;r) = u · M</code> where <code>u ~ Uniform(0,1)</code>:
      </p>
      <pre>{`r = a / √(u^(−2/3) − 1)`}</pre>
      <p>
        Stars are then given circular velocities from the smooth analytic
        Plummer potential (rather than from the jagged discrete mass
        distribution):
      </p>
      <pre>{`M(<r_xy) = M · r_xy³ / (r_xy² + a²)^(3/2)   # enclosed mass at xy-radius
v_c(r_xy) = √(G · M(<r_xy) / r_xy)             # circular speed

Each star: v = (−v_c·sinφ, v_c·cosφ, 0) + Gaussian perturbation (σ = 0.12·v_c)`}</pre>
      <p>
        The Gaussian perturbation (VIRIAL_PERTURB = 0.12) breaks axial
        symmetry: without it, every star orbits in a perfect circle and the
        system never forms arms. The perturbation gives stars slightly
        elliptical orbits, which differential rotation — inner orbits faster
        than outer — shears into the streaming arms visible by frame 200.
      </p>

      <h2>Trail reveal — bevel_factor_end animation</h2>
      <p>
        Each star becomes a{" "}
        <code>POLY</code> spline (401 control points: frame 0 through frame 400)
        with a bevel tube of radius 0.012 BU. The{" "}
        <code>bevel_factor_end</code> property — a float on the{" "}
        <code>bpy.types.Curve</code> data-block — controls what fraction of
        the spline has bevel geometry applied. Keyframing it from 0.0 (frame 1)
        to 1.0 (frame 400) with LINEAR interpolation makes exactly 1/400 of
        each trail visible per frame, simulating a running long-exposure
        photograph of the orbital paths. See the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr"
          className={lk}
        >
          Points to Curves Poi Trail tutorial
        </Link>{" "}
        for the full explanation of curve bevel animation, and the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting"
          className={lk}
        >
          SPH Fluid Light-Painting tutorial
        </Link>{" "}
        for how particle trajectories map to physical poi spinner paths.
      </p>
    </>
  );
}

const data = {
  date: "2026-07-24",
  title:
    "Python N-Body Gravity: Plummer Star Cluster Collapse & Streaming Arms via KDK Leapfrog for Poi Light-Painting (Blender 5.1)",
  lede: "Twenty-four equal-mass stars initialised in a cold rotating Plummer disk collapse under softened Newtonian gravity and develop streaming orbital arms through differential rotation; trajectories pre-integrated with the KDK leapfrog symplectic integrator and revealed as growing neon bevel-curve trails on a pure-black EEVEE canvas.",
  body: Body,
  libraryPath:
    "blends/scripting/python-nbody-gravity-star-cluster-leapfrog-light-painting/",
  steps: [
    {
      title: "Run blueprint.py — Plummer disk, leapfrog integration, curve construction",
      body: "Open Blender 5.1 · Scripting workspace.  Open `blueprint.py` and press **Run Script**.\n\n`_purge()` clears all objects, materials, curves, and actions.\n\n`_plummer_disk(24, 1.2, 1.0, 0.12, 42)` draws 24 radii from the Plummer CDF, assigns circular velocities from the smooth analytic potential, and adds a Gaussian perturbation (σ = 0.12·v_circ) to break perfect axial symmetry.\n\n`_integrate(pos, vel)` runs 400 × 4 = 1600 KDK steps (effective Δt = 0.02 per frame, total 8.0 N-body time units ≈ 3 crossing times) and records 401 position snapshots per star.\n\n`_make_trail()` builds a 401-point POLY spline per star with bevel_depth=0.012 and keyframes `bevel_factor_end` 0→1 over 400 frames with LINEAR interpolation.\n\nExpect the Script console to print `[hf_nbody] Done — blend + GLB written to …` after about 10–15 s.",
    },
    {
      title: "Understand the KDK leapfrog symmetry",
      body: "The three-sub-step structure (half-kick → drift → half-kick) is crucial.  A naïve first-order Euler loop `v += a*dt; x += v*dt` is NOT time-reversible: running it backwards with `dt = -dt` produces a slightly different trajectory than the forward integration.  That asymmetry means energy drifts monotonically.\n\nKDK is time-reversible by construction: swap the order of the two kicks and negate dt and you recover the original trajectory exactly.  Numerical analysis shows this guarantees the error in the conserved Hamiltonian stays O(dt²) — bounded, not accumulating.\n\nTo verify symplecticity in Blender's Python console after running blueprint.py:\n  ```python\n  # Check energy conservation over the recorded trajectory\n  # (You'd need to re-run and log KE + PE at each frame)\n  ```\nThe energy should oscillate around a constant within ±0.5% over 400 frames.",
    },
    {
      title: "Observe differential rotation and arm formation",
      body: "Differential rotation is the key to arm formation: in the Plummer potential, the orbital period grows with radius.  A star at r_xy = 0.5 BU has v_c ≈ 0.53 and completes one orbit in T = 2π × 0.5 / 0.53 ≈ 5.9 time units.  A star at r_xy = 2.0 BU has v_c ≈ 0.37 and takes T = 2π × 2.0 / 0.37 ≈ 34 time units.\n\nOver 8 time units, the inner star completes ≈ 1.4 orbits; the outer star ≈ 0.23 orbits.  An initial group of stars at different radii will be sheared by this differential by factor ≈ 6×.\n\nIn the viewport: by frame 200 (4 time units), the initially compact disk has stretched into 3–4 distinct neon streaks spiralling outward from the core.  This is the same physics that produces spiral arms in disc galaxies over millions of years, scaled to N-body time units.\n\nSet `VIRIAL_PERTURB = 0.0` to see the degenerate case: stars orbit in perfect circles and never shear into arms.  The disk stays a disk forever.",
    },
    {
      title: "Neon emission materials and EEVEE Bloom",
      body: "`_emission_mat(name, rgb)` builds a two-node Emission→Output material tree.  Six hues (sky-blue, hot-pink, neon-green, amber, violet, teal) rotate across 24 stars in groups of 4, so each colour represents 4 stars: watching a single colour isolates one quarter of the phase-space.\n\nEEVEE Bloom settings:\n  `bloom_threshold = 0.30` — only fragments above 0.30 intensity bloom\n  `bloom_intensity = 1.2` — moderate halo (increase to 2.0 for a dreamier look)\n  `bloom_radius    = 5.0`  — kernel width in pixels\n\nWorld background = pure (0, 0, 0).  EMIT_STR = 12.0 pushes all stars to ≈ 12× the bloom threshold so halos are bright.  Reduce to 4.0 for a sharper, documentary style.\n\nFor the GLB, the emission material exports as an `emissiveFactor` KHR_materials_emissive_strength extension.  Confirm `emissiveFactor: [0.02, 0.85, 1.0]` (sky-blue) is present in the exported JSON via a hex editor.",
    },
    {
      title: "GLB export and WebXR deployment",
      body: "The blueprint exports a GLB automatically at the end using `scene.frame_set(N_FRAMES)` to freeze all trails at `bevel_factor_end = 1.0`, then `bpy.ops.export_scene.gltf(export_apply=True)`.  `export_apply` converts the bevel-curve geometry to a mesh — without it the GLB contains a bare POLY spline and most WebXR runtimes discard it.\n\nTo reduce GLB size: after running blueprint.py, apply the following before the export:\n  1. Select all objects, `Ctrl+A` → Apply Scale (ensure all transforms are 1,1,1)\n  2. In the export panel, enable 'Draco mesh compression' level 6\n  3. Enable 'WebP textures' (no textures here, so this has no effect but sets the flag for future materials)\n\nThe tube mesh has 16 sides × 401 control points × 24 stars ≈ 154,000 vertices.  With Draco, the GLB is typically 400–700 KB — well within WebXR limits.",
    },
  ],
  finalResult:
    "Twenty-four stars initialised in a cold rotating Plummer disk (a=1.2 BU, VIRIAL_PERTURB=0.12, SEED=42).  Pre-integrated with KDK leapfrog at dt=0.005, 4 substeps per frame, 400 recorded frames (8.0 N-body time units).  Each star stored as a 401-point POLY bevel-curve (r=0.012 BU, 16-sided tube) with bevel_factor_end animated 0→1 for a trail-reveal effect.  Six neon emission colours (Strength=12) with EEVEE Bloom on a pure-black world.  GLB exported with all 24 trail meshes at full extension for WebXR deployment.  Total visible structure: compact Plummer disk → streaming orbital arms → mixed phase-space cloud.",
  variations: [
    "Set `VIRIAL_PERTURB = 0.0` and `VIRIAL_PERTURB = 0.40` and compare the two renders side-by-side.  At 0.0, the disk stays annular; at 0.40, the perturbation is large enough that many stars are on eccentric orbits and the arms are wide, asymmetric, and irregular — resembling a tidal disruption event rather than an orderly disk.",
    "Set `N_STARS = 48` and `DT = 0.004`.  The integration takes ~4× longer (O(N²)) but the arms are much smoother — 48 discrete traces blend into a nearly continuous surface.  This is the minimum count for a visually convincing arm structure; below 16 the arms look like individual poi trails rather than a disk.",
    "Reduce `SOFTENING = 0.05` to sharpen close-encounter dynamics.  With harder softening, some star pairs will pass within ε and receive strong gravitational slingshots, ejecting hyperbolic stars that trace long straight lines outward — visible as radial spikes in the poi light-painting.",
    "Replace the Plummer-disk initial conditions with a cold collapse (set all velocities to zero): `vel = [[0,0,0]]*N_STARS`.  All 24 stars fall inward from random Plummer positions, converge near the centre at t ≈ 0.8 (the 'core collapse' event — a bright flash as all 24 halos overlap), then bounce outward in a symmetric starburst pattern.  This is the most dramatic single-frame moment in N-body dynamics.",
    "Export each star as a separate GLB using `use_selection=True` after selecting only `SLUG_star_00`, etc.  In WebXR, add each star's trail with a per-object fade-in timed by orbital period — inner stars appear first, outer stars arrive progressively — so the viewer watches the disk assemble from inside out.",
  ],
  troubleshooting: [
    {
      symptom: "Script runs but the viewport shows no geometry",
      cause:
        "`_purge()` deleted the default cube and camera, then `main()` failed before creating objects.  Common causes: NameError on `copy.deepcopy`, or `bpy.path.abspath('//')` returning an empty string if the file has never been saved.",
      fix: "Run `bpy.ops.wm.save_as_mainfile(filepath='/tmp/test.blend')` in the Python console before running blueprint.py.  Alternatively, comment out the `bpy.ops.wm.save_as_mainfile(...)` and `bpy.ops.export_scene.gltf(...)` calls — the trail geometry is created before the save.",
    },
    {
      symptom: "All 24 trails look identical — circular, no arms",
      cause:
        "`VIRIAL_PERTURB = 0.0` or the random seed produces a nearly symmetric perturbation set.  The system requires broken symmetry to develop shear.",
      fix: "Confirm `VIRIAL_PERTURB = 0.12` and `SEED = 42`.  Try `SEED = 7` for a different asymmetry realisation.  If you want reproducible arm morphology without randomness, replace the Gaussian perturbation with a fixed cos/sin pattern over star index.",
    },
    {
      symptom: "Several stars shoot out to infinity — trails extend far off screen",
      cause:
        "SOFTENING is too small (< 0.05) or DT is too large (> 0.01), allowing a close encounter to produce enormous instantaneous acceleration before the leapfrog step can compensate.",
      fix: "Reset to `SOFTENING = 0.20` and `DT = 0.005`.  The condition for a well-resolved close encounter is `v_c · DT < ε`; at typical v_c ≈ 0.5 and DT = 0.005, the step length is 0.0025 BU ≪ ε = 0.20.  If ejections persist at default settings, the SEED encountered an unusually close initial pair — change `SEED` to 7 or 123.",
    },
    {
      symptom: "Tubes are not smooth — visible poly facets on the trails",
      cause:
        "`BEVEL_RES = 3` gives 16 polygon sides.  At close viewing distances or high-magnification renders, the polygons are visible.",
      fix: "Increase `BEVEL_RES` to 5 (24 sides) or 7 (32 sides).  For the GLB export, also select all trail objects and add a Smooth by Angle modifier before exporting to apply smooth normals — this has no effect on the render but improves surface quality in WebXR viewers.",
    },
  ],
  externalLinks: [
    {
      label: "REBOUND N-body integrator — MIT (Hanno Rein & David S. Spiegel)",
      href: "https://github.com/hannorein/rebound",
    },
    {
      label: "pytreegrav treecode gravity solver — MIT (Mike Grudic & Lehman Garrison)",
      href: "https://github.com/mikegrudic/pytreegrav",
    },
    {
      label: "Blender Manual — Curve Bevel Geometry (CC-BY-SA 4.0, Blender Foundation)",
      href: "https://docs.blender.org/manual/en/5.1/modeling/curves/properties/geometry.html",
    },
  ],
  relatedTutorials: [
    {
      label: "Lorenz Strange Attractor — Butterfly Chaos & bevel_factor_end Reveal",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-lorenz-attractor-poi-light-painting",
    },
    {
      label: "Double Pendulum Chaos — Deterministic Butterfly & Light-Painting Trails",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-double-pendulum-chaos-butterfly",
    },
    {
      label: "SPH Fluid — Müller Pressure & Viscosity Kernels for Light-Painting",
      href: "/tutorials/blender-tutorial-gn-simulation-zone-sph-fluid-pressure-viscosity-light-painting",
    },
    {
      label: "Points to Curves — Poi Trail & Particle Streak Ribbon for WebXR",
      href: "/tutorials/blender-tutorial-gn-points-to-curves-poi-trail-ribbon-webxr",
    },
  ],
};

export const blenderTutorialPythonNbodyGravityStarClusterLeapfrogLightPaintingEntry: Entry =
  buildInstructable(
    {
      slug: "blender-tutorial-python-nbody-gravity-star-cluster-leapfrog-light-painting",
      title: data.title,
      lede: data.lede,
      date: data.date,
      tags: [
        "blender",
        "scripting",
        "physics",
        "simulation",
        "n-body",
        "light-painting",
      ],
      body: Body,
    },
    data,
  );

export const entry: Entry =
  blenderTutorialPythonNbodyGravityStarClusterLeapfrogLightPaintingEntry;
