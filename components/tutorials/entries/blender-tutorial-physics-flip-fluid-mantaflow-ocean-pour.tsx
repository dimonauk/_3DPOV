import Link from "next/link";
import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function FlipFluidMantaflowBody() {
  return (
    <>
      <p>
        Blender&rsquo;s fluid solver is Mantaflow &mdash; an Apache-2.0-licenced
        particle-grid hybrid written by Nils Thuerey&rsquo;s group at TU Munich.
        The method is FLIP (Fluid-Implicit-Particle): a dense grid of voxels
        handles the pressure solve each substep, but individual particles carry
        velocity between steps so momentum detail doesn&rsquo;t dissipate the way it
        does in a purely Eulerian (grid-only) simulation.  At each substep the
        solver transfers particle velocities to a{" "}
        <em>MAC grid</em> (Marker-And-Cell &mdash; velocities staggered to face
        centres rather than cell centres), solves a sparse pressure Poisson
        equation via conjugate gradient, then transfers corrected velocities back
        to particles (Grid-to-Particle, G→P).  The result is a solver that
        handles large domains without SPH&rsquo;s density-noise problem, while
        preserving fine vortex filaments that a pure-grid method would smear out
        within a few steps.  Compare this to the spring-mass integration in
        the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-cloth-simulation-flag-banner"
          className={lk}
        >
          cloth simulation tutorial
        </Link>
        : cloth is a deformable manifold, not a volume; FLIP treats fluid as a
        continuous 3-D field sampled by discrete particles.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">Domain, resolution and the MAC grid</h3>
      <p>
        The domain object is an axis-aligned bounding box inside which the
        entire simulation lives.  The <code>resolution_max</code> parameter sets
        the voxel count along the domain&rsquo;s longest axis; the other axes are
        subdivided proportionally so voxels remain cubic.  For this tutorial the
        domain is wider than it is tall, so a resolution of 64 gives a voxel
        edge of approximately 6.25 cm &mdash; fine enough to show the pour column
        and the splash crown but not the tiny air pockets in a fizzy drink.
        Doubling resolution (128) roughly octuples memory and bake time because
        the MAC grid scales as <em>O(r³)</em>.  The rule of thumb: use 32 for
        layout and parameter tuning, 64 for publishable preview, 128+ for
        cinematic close-ups.  The voxel size also sets the smallest resolvable
        splash feature, just as polygon edge length limits cloth ripple wavelength
        in the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-rigid-body-dominoes-brick-wall"
          className={lk}
        >
          rigid-body tutorial
        </Link>
        &rsquo;s domino planks.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">Border collision flags</h3>
      <p>
        Each face of the domain box has an independent collision toggle.  When a
        border is enabled, Mantaflow treats that face as a solid wall with a
        no-slip condition (tangential velocity zeroed, normal velocity reflected).
        Leaving the <em>top</em> border open is essential for this scene: the inflow
        sphere sits above the domain and would otherwise be clipped to the domain
        boundary before any fluid could enter.  Open borders also allow splash
        droplets to exit the simulation cleanly rather than bouncing off an
        invisible ceiling, which avoids the &ldquo;bath bomb in a box&rdquo; artefact where
        droplets pile up unrealistically at the top.  If you&rsquo;re simulating a
        closed container (a sealed bottle being shaken), enable all six borders.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">Effector collision surfaces &mdash; the BVH mesh scan</h3>
      <p>
        Any object that carries a Fluid modifier set to <code>EFFECTOR</code>{" "}
        (type = Collision) registers its surface as a solid boundary within the
        domain.  Mantaflow builds a BVH (bounding volume hierarchy) tree from
        the effector&rsquo;s triangle soup and checks each fluid cell against it every
        substep.  Cells that fall inside the solid volume are flagged as{" "}
        <em>obstacle cells</em> and excluded from the pressure solve; their normal
        velocities are set to match the moving solid.  The glass vessel uses a
        Solidify modifier before the Fluid effector so that the wall has finite
        thickness and correctly oriented inward normals.  Without the Solidify, a
        zero-thickness shell can fool the obstacle-cell test and leak fluid through
        the wall &mdash; the same root cause as the cloth tunnelling problem fixed by
        raising <code>collision_quality</code> in the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-cloth-simulation-flag-banner"
          className={lk}
        >
          cloth flag tutorial
        </Link>
        .
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">Inflow sources &mdash; INFLOW versus GEOMETRY</h3>
      <p>
        A Flow object with behaviour <code>INFLOW</code> re-seeds its volume with
        new fluid particles every frame, creating a continuous stream as long as
        the simulation runs.  Behaviour <code>GEOMETRY</code> fills the object
        volume only at frame zero; useful for pre-filling a container before the
        simulation starts (e.g. a glass already half-full of wine).{" "}
        <code>OUTFLOW</code> is the inverse: it deletes any fluid that enters the
        volume, creating a drain.  You can combine an INFLOW sphere above the
        vessel with an OUTFLOW cube at the bottom to simulate a tap running over
        a sink.  The <code>use_initial_velocity</code> flag on the INFLOW adds a
        bulk velocity vector to every seeded particle, which gives the pour stream
        its downward momentum before gravity acts.  Without it, the fluid dribbles
        straight down from the sphere surface without the column coherence of a
        real pour.  The same principle (initial momentum seed) appears in the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-particle-emitter-spark-trail-wind-deflector"
          className={lk}
        >
          particle emitter tutorial
        </Link>
        &rsquo;s <code>object_align_factor</code> on the emitter normal.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Viscosity encoding &mdash; value × 10⁻ᵉˣᵖᵒⁿᵉⁿᵗ
      </h3>
      <p>
        Mantaflow stores kinematic viscosity (&nu;) as a two-part number to avoid
        floating-point precision loss when dealing with very small values.  Water
        at 20&deg;C has &nu; = 10&sup3; mm&sup2;/s = 1&nbsp;&times;&nbsp;10&minus;3 m&sup2;/s, so{" "}
        <code>viscosity_value = 1.0</code> and{" "}
        <code>viscosity_exponent = 3</code>.  Honey is approximately
        1&nbsp;&times;&nbsp;10&minus;1 (exponent 1, value 1).  Treacle is closer to
        10&nbsp;&times;&nbsp;10&minus;1 (exponent 1, value 10).  Setting exponent too high
        for a thick fluid results in the solver treating it as near-inviscid and
        the fluid behaving like water regardless of your intent &mdash; always verify
        by checking the Combined value displayed in the Physics panel.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Fluid surface mesh reconstruction
      </h3>
      <p>
        FLIP particles define the fluid volume as a cloud of points.  To render
        them as a smooth liquid surface, Mantaflow builds an implicit level-set
        function: each particle contributes a Gaussian density kernel of radius{" "}
        <code>mesh_particle_radius × cell_size</code>.  Cells where the summed
        density exceeds a threshold (the iso-value) are considered &ldquo;inside&rdquo;;
        the boundary between inside and outside is the liquid surface.  A marching
        cubes algorithm then extracts this isosurface as a triangle mesh, which
        Blender creates as a child object named <code>fluid_surface</code>.  A
        higher <code>mesh_particle_radius</code> (2.0 in this blueprint) averages
        over more particles, producing a smoother surface at the cost of blurring
        fine splatter droplets.  A radius of 1.0 gives crisper splash tips but
        noisy inter-droplet artefacts at low resolution.  This is the same
        radius-versus-detail trade-off as the{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-points-to-volume-organic-coral"
          className={lk}
          target="_blank"
        >
          Points to Volume node in Geometry Nodes
        </Link>
        , which uses the same volumetric radius kernel for mesh-from-scatter operations.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        EEVEE Next &mdash; screen-space refraction for water
      </h3>
      <p>
        Physically accurate refraction in EEVEE is approximated via a
        screen-space pass.  When <code>use_ssr_refraction</code> is enabled on
        the scene and <code>use_screen_space_refraction</code> is set on the
        material, EEVEE warps the background render by the surface normal and
        IOR before compositing the transparent object.  The distortion is accurate
        only for geometry that is visible on screen &mdash; off-screen or occluded
        surfaces do not contribute refracted colour.  Setting water IOR to 1.333
        (physically exact) looks slightly too strong in an EEVEE viewport at small
        vessel scales; reducing to 1.2&ndash;1.25 reads more naturally.  The{" "}
        <Link
          href="/tutorials/blender-tutorial-eevee-next-ray-tracing-ssr-glossy"
          className={lk}
        >
          EEVEE Next ray-tracing SSR tutorial
        </Link>{" "}
        covers the full SSR pipeline in depth; this tutorial treats the water
        material as a consumer of that system rather than rebuilding the
        configuration from scratch.  For glass, the same{" "}
        <Link
          href="/tutorials/blender-tutorial-shader-principled-transmission-iridescence"
          className={lk}
        >
          Principled BSDF Transmission tutorial
        </Link>{" "}
        explains the physics underpinning the IOR and Transmission Weight sliders.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Cache management &mdash; REPLAY vs ALL
      </h3>
      <p>
        <code>REPLAY</code> cache re-simulates from frame 1 on every timeline scrub
        and on every playback.  It writes no files to disk and requires no disk
        space, but scrubbing backward is essentially re-baking from the beginning
        each time &mdash; painful for slow simulations.  <code>ALL</code> cache
        writes compressed binary files for every frame to{" "}
        <code>CACHE_DIR</code>.  Once baked, scrubbing reads from disk in
        milliseconds.  Switch to <code>ALL</code> before the final bake; the button
        labelled <em>Bake All</em> in the Physics panel triggers{" "}
        <code>bpy.ops.fluid.bake_all()</code>.  The cache directory must be relative
        to the <code>.blend</code> (prefix <code>//</code>) so the file pair stays
        portable.  If you move only the <code>.blend</code> without the cache folder,
        Blender shows the fluid domain as empty on playback.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">GLB snapshot for WebXR</h3>
      <p>
        glTF 2.0 cannot encode an animated Mantaflow simulation; it exports one
        static mesh per export operation.  The workflow to freeze a frame:
        advance the timeline to the desired frame (frame 40 shows a full mid-pour
        splash crown), confirm the view layer has updated (
        <code>bpy.context.view_layer.update()</code>), select only the{" "}
        <code>fluid_surface</code> object, then export with{" "}
        <code>export_apply=True</code> which collapses the fluid modifier into base
        mesh data.  Apply studio transforms (origin at world zero, Y-up, scale 1)
        and enable Draco compression level 6 for the lowest possible WebXR payload.
        A frame-35 splash at resolution 64 typically yields a 200&ndash;400 KB GLB &mdash;
        entirely practical as a static WebXR scene prop.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-physics-flip-fluid-mantaflow-ocean-pour",
  title:
    "Physics — FLIP Fluid Mantaflow: Liquid Pour into a Glass Vessel, Cache Strategy & Static GLB Snapshot (Blender 5.1)",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "Set up a Mantaflow FLIP fluid simulation of water pouring into a borosilicate glass vessel. Covers MAC-grid pressure solve, domain voxel resolution trade-offs, open-border entry for the inflow stream, effector BVH collision surfaces, viscosity two-part encoding, fluid surface mesh radius, EEVEE Next SSR refraction for water, REPLAY-vs-ALL cache strategy, and single-frame GLB snapshot export for WebXR props.",
  Body: FlipFluidMantaflowBody,
};

export const entry = buildInstructable(
  {
    time: "one long session (allow 30–60 min for the bake)",
    difficulty: "intermediate",
    prerequisites: [
      "Blender 5.1 installed. Mantaflow (fluid simulation) has been bundled since Blender 2.82; no extensions required.",
      "Familiarity with the Physics Properties panel and modifier stack. The rigid-body and cloth simulation tutorials are useful context.",
      "Disk space: resolution 64, 80 frames ≈ 300–600 MB cache. Allocate accordingly.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Mantaflow FLIP fluid solver bundled since 2.82. The bpy API (FluidDomainSettings, FluidFlowSettings, FluidEffectorSettings) is stable across 3.x → 5.x. EEVEE Next SSR refraction available from Blender 4.0 onward.",
      },
    ],
    steps: [
      {
        title: "Run blueprint.py to build the full scene",
        body:
          "# Open Blender 5.1 → Scripting workspace.\n# Open blueprint.py → Run Script (Alt+P).\n# main() runs: purge_scene → make_domain (FLIP settings) →\n# make_glass_vessel (cylinder + Solidify + EFFECTOR) →\n# make_inflow_source (INFLOW sphere) → materials → lighting → camera → render.\nprint('Blueprint complete — check Physics Properties on each object.')",
      },
      {
        title: "Configure and launch the bake",
        body:
          "import bpy\n\ndomain = bpy.data.objects['Fluid_Domain']\nmod    = domain.modifiers['Fluid']\nds     = mod.domain_settings\n\n# Switch from REPLAY to ALL so the bake is written to disk.\nds.cache_type      = 'ALL'\nds.cache_directory = '//cache/fluid/'  # relative to .blend file\n\n# Trigger the full bake (data + mesh + particles).\n# Equivalent to clicking 'Bake All' in the Physics panel.\n# Requires the domain to be the active object.\nbpy.context.view_layer.objects.active = domain\ntry:\n    bpy.ops.fluid.bake_all()\nexcept Exception as e:\n    print(f'Operator context error: {e}')\n    print('Select Fluid_Domain in viewport, then click Bake All in Physics panel.')",
      },
      {
        title: "Inspect the simulation at key frames",
        body:
          "import bpy\n\n# Frame 1  — inflow sphere begins seeding particles\n# Frame 20 — pour column forms, hits vessel rim\n# Frame 35 — mid-pour: splash crown at maximum height\n# Frame 50 — fluid settles, standing waves in vessel\n# Frame 80 — nearly static pool with gentle surface ripple\n\nfor frame in [1, 20, 35, 50, 80]:\n    bpy.context.scene.frame_set(frame)\n    bpy.context.view_layer.update()\n    fluid_obj = bpy.data.objects.get('fluid_surface')\n    if fluid_obj:\n        tri_count = len(fluid_obj.data.polygons)\n        print(f'Frame {frame:3d}: fluid_surface has {tri_count:,} polygons')\n    else:\n        print(f'Frame {frame:3d}: fluid_surface not yet created — bake incomplete?')",
      },
      {
        title: "Adjust viscosity for different liquids",
        body:
          "import bpy\n\nds = bpy.data.objects['Fluid_Domain'].modifiers['Fluid'].domain_settings\n\n# Water (default): nu = 1 × 10^-3 m²/s\nds.viscosity_value    = 1.0\nds.viscosity_exponent = 3\n\n# Honey: nu ≈ 1 × 10^-1 m²/s — flows slowly, holds surface tension shapes\n# ds.viscosity_value    = 1.0\n# ds.viscosity_exponent = 1\n\n# Treacle / heavy syrup: nu ≈ 10 × 10^-1 m²/s\n# ds.viscosity_value    = 10.0\n# ds.viscosity_exponent = 1\n\n# After changing viscosity, free the existing bake and re-bake:\n# bpy.ops.fluid.free_all()\n# bpy.ops.fluid.bake_all()\nprint(f'Viscosity set to {ds.viscosity_value} × 10^-{ds.viscosity_exponent} m²/s')",
      },
      {
        title: "Export a single frame as a static GLB for WebXR",
        body:
          "import bpy\n\nTARGET_FRAME = 40  # adjust to the frame with the best splash shape\n\nbpy.context.scene.frame_set(TARGET_FRAME)\nbpy.context.view_layer.update()\n\n# Mantaflow names the fluid mesh 'fluid_surface' by default.\nfluid_mesh = bpy.data.objects.get('fluid_surface')\nif not fluid_mesh:\n    raise RuntimeError('fluid_surface not found — ensure bake is complete.')\n\nbpy.ops.object.select_all(action='DESELECT')\nfluid_mesh.select_set(True)\nbpy.context.view_layer.objects.active = fluid_mesh\n\n# Apply transforms before export (studio convention)\nbpy.ops.object.transform_apply(location=False, rotation=False, scale=True)\n\nbpy.ops.export_scene.gltf(\n    filepath=f'//fluid_snapshot_frame{TARGET_FRAME}.glb',\n    export_format='GLB',\n    use_selection=True,\n    export_apply=True,                        # collapses the fluid modifier\n    export_draco_mesh_compression_enable=True,\n    export_draco_mesh_compression_level=6,\n    export_image_format='WEBP',\n    export_yup=True,                          # Holoflow Studio +Y-up convention\n)\nprint(f'GLB snapshot exported: fluid_snapshot_frame{TARGET_FRAME}.glb')",
      },
      {
        title: "Capture the viewport animation with record.py",
        body:
          "# Prerequisite: bake complete (cache_type='ALL').\n# Open record.py in the Scripting workspace → Run Script.\n# Outputs to public/library/videos/.../viewport.mp4 via render.opengl(animation=True).\n# If a context error is raised, click inside the 3D Viewport first, then re-run.",
      },
    ],
  },
  base,
);
