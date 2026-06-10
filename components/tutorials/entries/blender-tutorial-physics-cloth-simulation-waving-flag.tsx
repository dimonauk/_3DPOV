import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PhysicsClothSimulationWavingFlagBody() {
  return (
    <>
      <p>
        A flag waves because it is simultaneously pulled in two directions at
        once: the mast attachment holds the left edge fixed whilst wind pressure
        pushes the free edge away.  The fabric in between must stretch, shear,
        and fold to reconcile those competing forces — and the solution it finds
        is not a static shape but a standing wave, a periodic travelling ripple
        that propagates from the pinned edge toward the free end.  Blender
        models this using a mass-spring system attributed to Baraff &amp; Witkin
        (SIGGRAPH 1998): every edge in the mesh is a structural spring that
        resists stretch; every face diagonal is a shear spring that resists
        skew; every vertex two hops apart shares a bending spring that resists
        fold.  The solver integrates these forces with implicit Backwards Euler
        — an unconditionally stable scheme that allows a comparatively large
        timestep without the exploding oscillations that plague explicit methods
        at coarse mesh resolution.  Compare the temporal-state-carrying logic
        here with the frame-to-frame chemical field in the{" "}
        <Link href="/tutorials/blender-tutorial-gn-simulation-zone-reaction-diffusion-turing" className={lk}>
          Grey-Scott reaction-diffusion tutorial
        </Link>
        : both systems carry state forward one discrete step at a time, but the
        cloth state is velocity + position (Newtonian mechanics) rather than
        chemical concentration (PDE diffusion).
      </p>

      <p>
        The flag mesh is built with bmesh — not{" "}
        <code>bpy.ops.mesh.primitive_grid_add</code> — because the operator
        produces a grid centred on the origin in the XY plane, and we need
        precise XZ placement with the left edge exactly at{" "}
        <code>x = MAST_RADIUS</code>.  The bmesh loop iterates{" "}
        <code>FLAG_ROWS × FLAG_COLS</code> vertices, placing each at{" "}
        <code>(MAST_RADIUS + col_fraction × FLAG_WIDTH, 0, FLAG_Z_BOTTOM + row_fraction × FLAG_HEIGHT)</code>.
        Quads are then created from four adjacent vertex indices;{" "}
        <code>bm.verts.ensure_lookup_table()</code> is called first because
        bmesh requires an explicit rebuild of its internal index table before
        integer-index random access.  Material index 0 (crimson) goes to the
        upper half of quads; index 1 (ivory) to the lower — the split at the
        midpoint row produces a simple two-band flag.  Flat shading is applied
        per-polygon rather than via <code>bpy.ops.object.shade_flat()</code>,
        which requires an active-object context that may not exist in headless
        batch mode.  The left-edge pin group is built by collecting every vertex
        index where <code>col == 0</code> — exactly <code>FLAG_ROWS</code>{" "}
        vertices — and adding them at weight 1.0 to the vertex group named{" "}
        <code>pin_left</code>.  For the cloth modifier,{" "}
        <code>cs.vertex_group_mass = &quot;pin_left&quot;</code> and{" "}
        <code>cs.pin_stiffness = 1.0</code> tell the solver to apply a
        restoring force toward the bind-pose location at each sub-step: not a
        rigid constraint (which would require rewriting the system matrix) but a
        stiff spring toward a fixed target, which the implicit solver handles
        within its normal update pass.  The practical result is identical to
        rigid pinning for <code>pin_stiffness = 1.0</code>.  See the{" "}
        <Link href="/tutorials/blender-tutorial-armature-ik-robot-arm" className={lk}>
          armature IK tutorial
        </Link>{" "}
        for a complementary approach — IK targets also apply a &ldquo;wanted
        position&rdquo; constraint that the solver resolves iteratively rather
        than kinematically locking the chain.
      </p>

      <p>
        <strong>Quality steps</strong> are the single most important parameter
        for cloth on a low-poly mesh.  Each frame of 1/24 s is divided into{" "}
        <code>CLOTH_QUALITY</code> sub-steps; the effective timestep per
        sub-step is <code>1 / (24 × CLOTH_QUALITY)</code> seconds.  With{" "}
        <code>CLOTH_QUALITY = 10</code>, each sub-step is ≈ 4.2 ms — fine
        enough that a flag vertex travelling at peak wind-driven velocity (≈
        0.5 m/s) crosses at most 2 mm per sub-step, well under the 6 cm mast
        radius.  Reducing quality to 3 lets the flag tunnel through the mast
        cylinder: the collision detection fires at the start and end of a
        12 ms sub-step but misses the 7 mm transit in between.  Increasing it
        beyond 15 seldom improves visual quality on a 20 × 12 mesh and triples
        simulation time.  The{" "}
        <strong>structural stiffness</strong> (40 N/m) is intentionally high
        for bunting — it prevents the quads from stretching more than a few
        percent under wind load, keeping the aspect ratio of the faceted quads
        stable.  If you halve it to 20 N/m the flag visibly elongates in the
        wind direction and the facets lose their crisp proportions, which
        conflicts with the studio&rsquo;s faceted-mesh aesthetic documented in
        the{" "}
        <Link href="/tutorials/blender-tutorial-shader-procedural-woven-fabric" className={lk}>
          woven fabric shader tutorial
        </Link>
        , where stable square-ish UV cells are assumed at the weave frequency.{" "}
        <strong>Bending stiffness</strong> (5 N·m/rad) is the parameter to
        tweak for visual character: set it to 0.5 and you get soft satin;
        set it to 50 and you get card stock.  The Blender default for cotton is
        ≈ 0.5; 5.0 gives slightly stiffer bunting that holds visible fold ridges
        between gusts.
      </p>

      <p>
        The Wind force field is a{" "}
        <code>bpy.ops.object.effector_add(type=&apos;WIND&apos;)</code> empty
        whose force is directed along its local <em>negative Z axis</em>.  To
        blow perpendicular to the flag face (in the world +Y direction, across
        the XZ-plane flag), the empty needs a rotation that maps its{" "}
        local &minus;Z to world +Y: a rotation of &minus;90° around the world
        X axis achieves this (<code>rotation_euler[0] = -math.pi / 2</code>).
        The{" "}
        <code>field.noise</code> parameter adds stochastic turbulence by
        evaluating a Perlin-like noise field at each vertex position per step,
        scaled by the noise value.  With{" "}
        <code>WIND_NOISE = 2.5</code> the instantaneous wind at any vertex can
        range from &minus;6 N/m² to +14 N/m², producing the large-amplitude
        irregular gusts that seed the asymmetric loading responsible for
        standing-wave flutter onset.  Setting noise to 0 gives a perfectly
        laminar breeze — the flag bows smoothly but never produces visible
        ripples because the load is symmetric about every horizontal strip.
        The{" "}
        <code>field.flow = 0.0</code> setting disables the &ldquo;flow&rdquo;
        smoothing that would damp the temporal variation of the noise: leave it
        at 0 for maximum turbulence, raise toward 1.0 to soften gusts into
        long smooth swells.  The mast&rsquo;s <code>COLLISION</code> modifier
        with <code>thickness_outer = 0.02</code> registers a 2 cm buffer around
        the 6 cm cylinder so cloth vertices repel before they reach the mesh
        surface, preventing z-fighting at the pin attachment where the left edge
        sits flush against the mast.
      </p>

      <p>
        For a WebXR-ready GLB, we want the wind-blown pose as a static mesh —
        not a playback-dependent simulation — so the asset renders correctly in
        Three.js without any physics engine.  The approach is{" "}
        <code>depsgraph.evaluated_get()</code>, which evaluates the full
        modifier stack (including the cloth solver) at the current frame and
        returns an evaluated object.  Calling{" "}
        <code>bpy.data.meshes.new_from_object(flag_eval, depsgraph=dg)</code>{" "}
        converts the evaluated result into a plain <code>Mesh</code> data-block
        with no modifiers, no cache reference, and no physics dependency.  A new
        object wrapping that mesh is then exported and immediately removed —
        it never needs to be saved.  This technique requires{" "}
        <code>bpy.context.scene.frame_set(EXPORT_FRAME)</code> first so the
        depsgraph has evaluated the cloth through all preceding frames; the
        cloth solver is incremental and cannot jump to frame 72 without computing
        frames 1–71 in order.  The alternative —{" "}
        <code>bpy.ops.ptcache.bake_all(bake=True)</code> — requires a{" "}
        <code>point_cache</code> context override that is difficult to construct
        headlessly and writes a large cache directory to disk.  The depsgraph
        path is faster for a single GLB snapshot and leaves no artefacts.  For
        the full baking workflow used in normal-map capture, see the{" "}
        <Link href="/tutorials/blender-tutorial-texture-baking-normal-ao" className={lk}>
          texture baking tutorial
        </Link>
        ; for the full WebXR export pipeline the snapshot feeds into, see the{" "}
        <Link href="/tutorials/blender-tutorial-faceted-gem-webxr" className={lk}>
          faceted gem WebXR tutorial
        </Link>
        .
      </p>

      <p>
        Outside references for this tutorial:
      </p>
      <ul>
        <li>
          <a
            href="https://docs.blender.org/manual/en/latest/physics/cloth/settings/physics.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Blender Manual — Cloth Physics Settings
          </a>{" "}
          (CC-BY-SA&nbsp;4.0, Blender Foundation) — complete parameter
          reference for the cloth modifier: quality steps, stiffness, damping,
          pinning vertex groups, and collision settings.  The sibling pages for{" "}
          <a
            href="https://docs.blender.org/manual/en/latest/physics/force_fields/types/wind.html"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            Wind force fields
          </a>{" "}
          document the strength, noise, flow, and seed parameters used in this
          blueprint.
        </li>
        <li>
          <a
            href="https://github.com/njanakiev/blender-scripting"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            njanakiev/blender-scripting
          </a>{" "}
          (MIT, Nicolas Janakiev) — practical headless bpy examples covering
          mesh construction, material assignment, and camera setup patterns
          that informed the helper structure in this blueprint.  See also the
          author&rsquo;s{" "}
          <a
            href="https://github.com/njanakiev"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            other Blender and Python projects
          </a>
          .
        </li>
        <li>
          <a
            href="https://github.com/KhronosGroup/glTF-Blender-IO"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            KhronosGroup/glTF-Blender-IO
          </a>{" "}
          (Apache-2.0, Khronos Group) — the official Blender glTF exporter
          plugin, which handles <code>export_apply=True</code> (bakes
          modifiers before writing) and Draco mesh compression at level 6.
          Related projects in the same organisation:{" "}
          <a
            href="https://github.com/KhronosGroup/glTF-Sample-Viewer"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF-Sample-Viewer
          </a>{" "}
          (WebGL reference renderer, Apache-2.0) and the core{" "}
          <a
            href="https://github.com/KhronosGroup/glTF"
            className={lk}
            target="_blank"
            rel="noopener noreferrer"
          >
            glTF specification repository
          </a>{" "}
          (Apache-2.0).
        </li>
      </ul>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-physics-cloth-simulation-waving-flag",
  title:
    "Physics: Cloth Simulation — Stylised Waving Flag on a Mast (Blender 5.1)",
  tags: [
    "blender", "physics", "cloth", "simulation", "flag",
    "force-field", "wind", "depsgraph", "glb", "webxr",
  ],
  category: "tutorial",
  publishedOn: "2026-06-10",
  summary:
    "Mass-spring cloth simulation in Blender 5.1. A 20×12 low-poly flag on an 8-sided mast " +
    "with Baraff-Witkin implicit Euler integration, left-edge vertex-group pinning, and a " +
    "turbulent Wind force field. Wind-blown static pose extracted headlessly via depsgraph " +
    "at frame 72 for GLB / WebXR export — no point-cache bake required.",
  body: PhysicsClothSimulationWavingFlagBody,
  libraryPath: "blends/physics/physics-cloth-simulation-waving-flag",
});
