import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function PhysicsRigidBodyDominoChainBody() {
  return (
    <>
      <p>
        A domino chain works because of a precise transfer of potential energy
        into kinetic energy through sequential collisions.  Each standing domino
        stores gravitational potential energy proportional to the height of its
        centre of mass above the floor; once tipped past the critical angle —
        the angle at which the centre of mass passes over the pivot edge — that
        energy converts irreversibly into angular momentum.  The falling domino
        transfers a fraction of that momentum to its neighbour through an
        impulsive contact force, and the neighbour, already close to the tipping
        threshold, begins its own fall.  Blender 5.1 models all of this using
        the{" "}
        <a
          href="https://github.com/bulletphysics/bullet3"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Bullet Physics engine
        </a>{" "}
        (zlib licence, Erwin Coumans / Google) — a sequential-impulse constraint
        solver that has been the backbone of game physics for two decades.  The
        integration scheme is symplectic Euler (velocity first, then position):
        fast, energy-conserving over long runs, and stable at the sub-step
        intervals we use here.  Compare the temporal-state-carrying logic with
        the cloth solver in the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-cloth-simulation-waving-flag"
          className={lk}
        >
          waving-flag tutorial
        </Link>
        : cloth uses implicit Backwards Euler (unconditionally stable, allows
        large timesteps) whilst rigid bodies use symplectic Euler (conditionally
        stable, demands small sub-steps but much cheaper per step for rigid
        contact).
      </p>

      <p>
        The two solver parameters you will reach for most are{" "}
        <code>substeps_per_frame</code> and <code>solver_iterations</code> —
        they sound similar but address entirely different failure modes.
        Sub-steps divide the animation frame into shorter integration intervals,
        preventing <em>tunnelling</em>: a fast-moving object crossing the full
        thickness of a thin target in one frame without registering a collision.
        For this domino geometry (12 mm thick) a typical impact velocity is
        around 2 m/s; at 24 fps one frame spans 83 ms, in which the domino tip
        would travel 166 mm — fourteen times its thickness — without sub-steps.
        With{" "}
        <code>substeps_per_frame = 20</code> each sub-step is 4 ms, in which the
        tip travels 8 mm: still larger than the thickness but the{" "}
        <em>collision margin</em> (the inward Bullet shell, set here to 2 mm)
        catches the overlap.  Solver iterations, by contrast, address constraint{" "}
        <em>drift</em>: when multiple contacts are active simultaneously (as when
        a falling domino presses on the floor while impacting the next domino),
        the Projected Gauss-Seidel solver must iterate to bring all contact
        forces into mutual consistency.  Twenty iterations is ample for
        non-stacked bodies; stacking puzzles or dense granular piles may need 40
        or more.  The third parameter worth understanding is{" "}
        <code>collision_margin</code>: Bullet&apos;s default of 0.04 m (4 cm!)
        is appropriate for large architectural elements but will cause our 12 mm
        thick dominos to appear to float or repel before touching — always set
        it to a value well below half the thinnest dimension.
      </p>

      <p>
        Choosing the right <em>collision shape</em> is an O-notation decision.
        BOX uses the axis-aligned bounding box of the mesh — for a box primitive
        this is exact, and the GJK narrow-phase check runs in constant time.
        CONVEX_HULL constructs the minimal enclosing convex polyhedron and runs
        GJK-EPA per pair; it is correct for irregular shapes but costs O(v) per
        collision test.  MESH (static only) uses a BVH over all triangles —
        exact and fast for passive floors and walls but forbidden for active
        bodies because Bullet cannot compute a mesh inertia tensor.  For our
        dominoes, BOX is both correct and optimal.  The critical tipping angle
        calculation governs the seed: a domino of height H and thickness T tips
        when its centre of mass (at H/2 above the base, T/2 from the pivot edge)
        passes the pivot, i.e., at arctan(T/2 ÷ H/2) = arctan(T/H).  For
        H = 80 mm and T = 12 mm that is arctan(0.15) ≈ 8.5°; we use 12° so the
        first domino topples immediately at frame 1 without needing an initial
        velocity injection.  The chain-reaction spacing is set to 45 mm
        centre-to-centre (33 mm face-to-face gap), giving the falling tip a reach
        of approximately{" "}
        <code>H − T/2 ≈ 74 mm</code> before it hits the floor — well beyond the
        33 mm gap, so every collision is reliable.
      </p>

      <p>
        The Python blueprint uses{" "}
        <code>bpy.ops.rigidbody.object_add(type=&apos;ACTIVE&apos;)</code> rather
        than the direct data path for a specific reason: until an object is
        registered in{" "}
        <code>scene.rigidbody_world.collection</code>, the{" "}
        <code>obj.rigid_body</code> property does not exist and cannot be
        configured.  The operator both registers the object and initialises all
        RigidBodyObject defaults in one call; we then overwrite the defaults we
        care about via the direct API.  The contrast with Geometry Nodes or the
        modifier API — where the operator is optional and direct data writes
        always work — is a deliberate design choice in the Blender source: the
        rigid body world is a separate physics scene subsystem, not a modifier
        stack.  See the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-bpy-bmesh-dodecahedron"
          className={lk}
        >
          bpy + bmesh scripting tutorial
        </Link>{" "}
        for the broader pattern of when to prefer operators versus direct data
        access.  For exporting animated rigid body simulation to GLB — useful for
        precomputed WebXR physics sequences — you must first bake to keyframes
        via Object → Rigid Body → Bake to Keyframes (or{" "}
        <code>bpy.ops.rigidbody.bake_to_keyframes(frame_start, frame_end)</code>
        with all target objects selected); this converts the point-cache
        trajectories to standard location/rotation keyframes that{" "}
        <a
          href="https://github.com/KhronosGroup/glTF-Blender-IO"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          glTF-Blender-IO
        </a>{" "}
        (Apache-2.0, Khronos Group) can write as{" "}
        <code>KHR_animation_pointer</code> channels.  See the companion{" "}
        <Link
          href="/tutorials/blender-tutorial-gn-uv-unwrap-pack-islands-glb"
          className={lk}
        >
          UV unwrap and GLB export tutorial
        </Link>{" "}
        for the full export-pipeline conventions the studio uses (Draco 6, WebP
        textures, Y-up, applied transforms).
      </p>

      <p>
        The most common failure mode is the chain stalling mid-way.  This
        happens when the gap exceeds the domino reach (increase{" "}
        <code>DOMINO_COUNT</code> or decrease <code>CHAIN_SPACING</code>) or
        when friction is so high that the struck domino cannot rotate freely
        (reduce <code>DOMINO_FRICTION</code> on the floor rather than the
        dominos; floor-to-domino friction controls the base sliding, not the
        rotation).  A subtler stall comes from the collision margin being set
        too large: Bullet sees the shells overlapping one sub-step too early,
        applies a separating impulse that decelerates the falling domino just
        enough that it deflects without pushing the next one.  Reduce{" "}
        <code>DOMINO_MARGIN</code> to 1 mm or enable{" "}
        <code>use_margin = False</code> temporarily to diagnose.  For the
        artistic side, the alternating ivory/navy palette uses two shared mesh
        data blocks (one per colour) rather than per-object material overrides;
        every even-indexed domino points to <code>domino_mesh_ivory</code> and
        every odd-indexed one to <code>domino_mesh_navy</code>.  The same
        technique applies to scene instancing in the{" "}
        <Link
          href="/tutorials/blender-tutorial-armature-ik-robot-arm"
          className={lk}
        >
          robot-arm IK tutorial
        </Link>
        , where shared mesh data for identical joint capsules keeps the blend
        file compact.  The{" "}
        <a
          href="https://docs.blender.org/manual/en/latest/physics/rigid_body/index.html"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Blender rigid body manual
        </a>{" "}
        (CC-BY-SA 4.0, Blender Foundation) documents the full constraint system —
        hinge, slider, fixed, and generic 6-DOF joints — which extend this
        tutorial into articulated mechanisms like folding bridges or
        Newton&apos;s cradles.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable({
  slug: "blender-tutorial-physics-rigid-body-domino-chain",
  title:
    "Physics: Rigid Body Dynamics — Domino Chain Topple (Blender 5.1)",
  tags: [
    "blender", "physics", "rigid-body", "bullet", "simulation",
    "domino", "chain-reaction", "bake", "glb", "webxr", "python",
  ],
  category: "tutorial",
  publishedOn: "2026-06-10",
  summary:
    "Bullet Physics rigid body simulation in Blender 5.1. A chain of 15 dominoes " +
    "with BOX collision hulls, 2 mm collision margin, friction 0.70, and " +
    "substeps_per_frame = 20 prevents tunnelling at impact velocity. Chain reaction " +
    "seeded by tilting the first domino 12° past the critical tipping angle (≈8.5° " +
    "for 80 mm × 12 mm geometry). Bake to keyframes for animated GLB / WebXR export.",
  body: PhysicsRigidBodyDominoChainBody,
  libraryPath: "blends/physics/physics-rigid-body-domino-chain",
});
