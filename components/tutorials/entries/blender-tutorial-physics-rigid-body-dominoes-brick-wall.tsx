import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function RigidBodyDominoesBody() {
  return (
    <>
      <p>
        Blender&rsquo;s rigid body system is a thin wrapper around the Bullet
        2.x physics library &mdash; a discrete-timestep sequential-impulse
        solver that has been the games-industry standard since 2005.  Each
        substep Bullet runs four passes: symplectic Euler velocity integration
        (position &larr; velocity &times; dt, then velocity &larr; forces), GJK/EPA
        narrow-phase contact detection to generate a collision manifold,
        projected-Gauss-Seidel impulse resolution to zero interpenetration, and
        finally a position update.  The symplectic (semi-implicit) Euler scheme
        is energy-preserving in the Hamiltonian sense: a stack of bricks given
        no initial energy stays still indefinitely, whereas explicit Euler would
        slowly drift upward.  Compare the Eulerian-grid approach of the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-mantaflow-liquid-dam-break"
          className={lk}
        >
          Mantaflow FLIP dam-break
        </Link>{" "}
        &mdash; Mantaflow solves a continuous velocity field on a voxel grid
        with no notion of discrete object identity; Bullet tracks each rigid
        object as a separate entity with mass, inertia tensor, and position
        state.  Mantaflow excels at fluids and gases; Bullet excels at
        countable discrete objects.  The domino chain is a textbook Bullet
        scenario.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Domino chain geometry — the gap condition
      </h3>
      <p>
        Not every domino spacing triggers a reliable chain.  When a domino of
        height H tips forward, its top edge sweeps a horizontal arc.  At fall
        angle &theta; the horizontal displacement of the tip is approximately
        H&thinsp;&sdot;&thinsp;sin&thinsp;&theta;.  The chain propagates only
        if the tip strikes the next domino above the floor before the falling
        domino goes horizontal; the worst-case constraint is that the gap must
        satisfy:
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`gap  <  H − D/2

With H = 0.10 m (domino height), D = 0.02 m (depth):
  max gap = 0.10 − 0.01 = 0.09 m

Blueprint uses 0.068 m — 24 % safety margin above the critical threshold.
Tighter spacing amplifies the wave (each domino imparts more impulse on the next).
Looser spacing risks "dead stops" where the falling domino misses the next CoG.

Balance-point tilt angle for the first domino:
  θ_tip = arctan( (D/2) / (H/2) ) = arctan(0.01/0.05) ≈ 11.3°
Blueprint tilts the first domino 15° — 33 % past the tipping angle.`}</pre>
      <p>
        The same geometric argument applies to any elongated-object chain: wine
        corks, pencils, standing cards.  The ratio H/D &mdash; aspect ratio
        &mdash; determines the minimum gap-to-height ratio for reliable
        propagation.  A squat domino (H/D&nbsp;=&nbsp;2) needs tighter spacing than
        a tall one (H/D&nbsp;=&nbsp;7).  The blueprint&rsquo;s dominoes use H/D&nbsp;=&nbsp;5,
        a common game domino proportion.  Compare this spatial-constraint
        thinking with the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-particle-emitter-spark-trail-wind-deflector"
          className={lk}
        >
          particle emitter spark trail
        </Link>
        , where trajectory constraints are velocity-based (effector weights)
        rather than geometric.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Collision shapes — why BOX beats CONVEX_HULL for cuboids
      </h3>
      <p>
        Bullet supports six collision primitives.  For dominoes and bricks the
        correct choice is <code>BOX</code>, not <code>CONVEX_HULL</code>:
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`BOX
  Bullet constructs an AABB (Axis-Aligned Bounding Box) in LOCAL space.
  Contact normals are exact for a rectangular object.
  Support function: O(1) — constant-time GJK query.
  No geometry sampling required.

CONVEX_HULL
  Bullet runs a full convex-hull decomposition over the mesh vertex buffer.
  For a box, this produces 8 support points — identical to BOX result,
  but with O(n log n) preprocessing and O(log n) per-substep GJK query.
  4–8× slower than BOX for the same result on cuboids.

MESH (not valid on ACTIVE bodies in Blender 5.1)
  Exact triangle-soup collision.  Only available on PASSIVE (static) bodies.
  Bullet restriction: a triangle-mesh dynamic body has undefined contact normals
  on internal faces — Blender blocks it at the UI and operator level.

Rule of thumb:
  BOX/SPHERE/CAPSULE   → axis-aligned or radially symmetric primitives
  CONVEX_HULL          → non-box convex shapes (gem facets, bolts, organic props)
  MESH                 → passive floors, walls, terrain only`}</pre>
      <p>
        The floor in the blueprint uses <code>MESH</code> collision on a passive
        plane &mdash; a flat plane&rsquo;s MESH and BOX are mathematically identical
        normal-wise, but MESH is conventional for floors and future-proofs terrain
        swaps.  See the{" "}
        <Link
          href="/tutorials/blender-tutorial-modifier-subdiv-crease-bevel-weight-hard-surface"
          className={lk}
        >
          Hard-Surface SubDiv workflow
        </Link>{" "}
        for mesh topology considerations that affect convex-hull quality on curved
        hard-surface objects.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Origin = centre of gravity
      </h3>
      <p>
        Bullet places the centre of mass at the object <strong>origin</strong>.
        An off-centre origin is the single most common rigid body debugging
        surprise: a perfectly rectangular domino spins on an invisible eccentric
        axis because its origin was left at the base.  The blueprint corrects
        this by translating mesh vertices by &minus;H/2 in Z (so the mesh spans
        &minus;H/2 to&thinsp;+H/2 around z&thinsp;=&thinsp;0) then placing the
        object at z&thinsp;=&thinsp;H/2 so its bottom face rests on the floor.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`# Shift vertex buffer so CoG is at local origin
for v in obj.data.vertices:
    v.co.z -= DOM_H / 2.0        # translate mesh, not object

# Place object at CoG height so bottom face sits on floor (z=0)
obj.location.z = DOM_H / 2.0    # object origin IS the CoG

# After this, Bullet's inertia tensor is computed correctly:
# I_xx = m*(H² + D²)/12  — correct for a rectangular box
# An origin at the base would give I_xx = m*H²/3 — triple the rotational inertia.`}</pre>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Substep accuracy and solver stability
      </h3>
      <p>
        Two settings govern simulation quality without touching the visual
        output: <code>substeps_per_frame</code> and{" "}
        <code>solver_iterations</code>.  Both are in{" "}
        <em>Scene Properties &rarr; Rigid Body World</em>.
      </p>
      <pre className="bg-zinc-900 rounded p-4 text-sm overflow-x-auto whitespace-pre">{`substeps_per_frame = 20
  Each rendered frame is divided into 20 physics substeps.
  At 24 fps: substep dt = 1/(24×20) ≈ 0.0021 s.
  Rule: substep dt should be < object_radius / max_expected_velocity.
  A domino tip moves at ~0.5 m/s; radius 0.01 m → dt < 0.02 s → substeps ≥ 2.
  We use 20 for stable stacking, not collision speed.

solver_iterations = 20
  PGS (projected Gauss-Seidel) passes per substep.
  Each pass refines the impulse solution; more = stiffer stacks.
  With 4+ bricks stacked, 10 iterations causes visible drift; 20 holds stable.
  Above 50 gives diminishing returns for mortar-gap geometry.

use_split_impulse = True
  Prevents "ghost impulses" when bricks separate slightly between substeps.
  Without it, a brick wall at rest slowly creeps upward over 100+ frames.
  Computational cost: negligible (one conditional per contact manifold).`}</pre>
      <p>
        The Mantaflow gas solver in the{" "}
        <Link
          href="/tutorials/blender-tutorial-physics-mantaflow-smoke-fire-torch"
          className={lk}
        >
          smoke &amp; fire torch tutorial
        </Link>{" "}
        uses an analogous set of accuracy knobs: grid resolution and substeps
        for the fluid solver, vorticity confinement for rotational fidelity.
        Both systems trade bake time for fidelity; both store their result in a
        point-cache file on disk for deterministic playback.
      </p>

      <h3 className="text-lg font-semibold mt-6 mb-2">
        Brick wall running bond
      </h3>
      <p>
        Even rows of the wall are offset by <code>BRICK_W / 2</code> &mdash;
        the standard running bond.  Each brick overlaps two bricks in the row
        below, distributing vertical load and interlocking courses.  For physics
        this means a front-face impact on the bottom row transfers impulse not
        only forward but also laterally via the interlocked bricks above,
        dragging corner bricks sideways and producing the characteristic
        &ldquo;fan collapse&rdquo; visible in slow-motion brick demolition footage.
        Increasing <code>BRICK_MASS</code> or <code>BRICK_ROWS</code> raises the
        wall&rsquo;s total kinetic energy budget and produces a more violent collapse
        that scatters bricks further.
      </p>
    </>
  );
}

const base: Entry = {
  slug: "blender-tutorial-physics-rigid-body-dominoes-brick-wall",
  title:
    "Physics — Rigid Body Dynamics: Domino Chain + Brick-Wall Collapse (Blender 5.1)",
  date: "2026-06-19",
  kind: "tutorial",
  excerpt:
    "Build a 16-domino chain and running-bond brick wall using Blender 5.1's Bullet-backed rigid body system. Covers the domino gap condition (gap < H − D/2), BOX vs CONVEX_HULL collision shape selection, origin-at-CoG requirement, substep and solver accuracy settings, and the use_split_impulse flag that prevents ghost forces in stacked geometry.",
  Body: RigidBodyDominoesBody,
};

export const entry = buildInstructable(
  {
    time: "one session",
    difficulty: "beginner",
    prerequisites: [
      "Blender 5.1 installed. Rigid body simulation has been stable since Blender 2.7x; no extensions required.",
      "Basic 3D viewport navigation: orbit, zoom, select. The UV Unwrap tutorial covers this if you are new.",
    ],
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "open-source",
        platforms: ["windows", "macos", "linux"],
        note:
          "Rigid body simulation uses the Bullet 2.x physics library bundled with Blender. No extensions required. The bpy API surface (scene.rigidbody_world, obj.rigid_body) has been stable since Blender 2.8.",
      },
    ],
    steps: [
      {
        title: "Ensure the Rigid Body World exists and configure accuracy",
        body:
          "  import bpy\n  scene = bpy.context.scene\n\n  # Create the world if absent\n  if scene.rigidbody_world is None:\n      bpy.ops.rigidbody.world_add()\n\n  rbw = scene.rigidbody_world\n  rbw.substeps_per_frame = 20   # 20 physics substeps per rendered frame\n  rbw.solver_iterations  = 20   # PGS constraint solver passes per substep\n  rbw.use_split_impulse  = True # prevents ghost forces in stacked geometry\n  rbw.time_scale         = 1.0  # 1.0 = real time; 0.5 = slow motion\n\n  scene.gravity = (0.0, 0.0, -9.81)  # ensure gravity is enabled",
      },
      {
        title: "Create and configure the floor as a passive body",
        body:
          "  bpy.ops.mesh.primitive_plane_add(size=6.0)\n  floor = bpy.context.active_object\n  floor.name = 'floor'\n\n  # Add passive rigid body (static collision surface)\n  with bpy.context.temp_override(selected_objects=[floor], active_object=floor):\n      bpy.ops.rigidbody.object_add()\n  floor.rigid_body.type            = 'PASSIVE'\n  floor.rigid_body.collision_shape = 'MESH'   # exact flat-plane collision\n  floor.rigid_body.friction        = 0.75     # rough concrete\n  floor.rigid_body.restitution     = 0.05     # minimal bounce",
      },
      {
        title: "Build and place the domino chain",
        body:
          "  DOM_H, DOM_W, DOM_D = 0.10, 0.04, 0.02\n  DOM_SPACING = 0.068\n\n  # Build mesh with CoG at local origin\n  verts = [\n      (-DOM_W/2, -DOM_D/2, -DOM_H/2), ( DOM_W/2, -DOM_D/2, -DOM_H/2),\n      ( DOM_W/2,  DOM_D/2, -DOM_H/2), (-DOM_W/2,  DOM_D/2, -DOM_H/2),\n      (-DOM_W/2, -DOM_D/2,  DOM_H/2), ( DOM_W/2, -DOM_D/2,  DOM_H/2),\n      ( DOM_W/2,  DOM_D/2,  DOM_H/2), (-DOM_W/2,  DOM_D/2,  DOM_H/2),\n  ]\n  faces = [(0,1,2,3),(4,5,6,7),(0,1,5,4),(2,3,7,6),(0,3,7,4),(1,2,6,5)]\n  mesh = bpy.data.meshes.new('domino')\n  mesh.from_pydata(verts, [], faces)\n  mesh.update()\n\n  import math\n  from mathutils import Vector\n\n  for i in range(16):\n      obj = bpy.data.objects.new(f'domino_{i:02d}', mesh)\n      bpy.context.scene.collection.objects.link(obj)\n      obj.location = Vector((i * DOM_SPACING, 0.0, DOM_H / 2.0))\n\n      if i == 0:\n          # Tilt 15° past the 11.3° balance point\n          obj.rotation_euler.x = math.radians(15)\n\n      with bpy.context.temp_override(selected_objects=[obj], active_object=obj):\n          bpy.ops.rigidbody.object_add()\n      rb = obj.rigid_body\n      rb.type             = 'ACTIVE'\n      rb.collision_shape  = 'BOX'\n      rb.mass             = 0.025    # 25 g plastic domino\n      rb.friction         = 0.45\n      rb.restitution      = 0.08\n      rb.linear_damping   = 0.04\n      rb.angular_damping  = 0.10",
      },
      {
        title: "Build the running-bond brick wall",
        body:
          "  BRICK_H, BRICK_W, BRICK_D = 0.025, 0.06, 0.03\n  BRICK_ROWS, BRICK_COLS    = 4, 6\n  WALL_X = DOM_SPACING * 16 + 0.04 + BRICK_D / 2.0\n\n  hw, hd, hh = BRICK_W/2, BRICK_D/2, BRICK_H/2\n  bverts = [\n      (-hw,-hd,-hh),( hw,-hd,-hh),( hw, hd,-hh),(-hw, hd,-hh),\n      (-hw,-hd, hh),( hw,-hd, hh),( hw, hd, hh),(-hw, hd, hh),\n  ]\n  bfaces = [(0,1,2,3),(4,5,6,7),(0,1,5,4),(2,3,7,6),(0,3,7,4),(1,2,6,5)]\n  bmesh = bpy.data.meshes.new('brick')\n  bmesh.from_pydata(bverts, [], bfaces)\n  bmesh.update()\n\n  for row in range(BRICK_ROWS):\n      offset = (BRICK_W / 2.0) if (row % 2 == 1) else 0.0\n      z      = BRICK_H / 2.0 + row * BRICK_H\n      for col in range(BRICK_COLS):\n          bx  = col * BRICK_W + offset - (BRICK_COLS * BRICK_W) / 2.0 + BRICK_W/2.0\n          obj = bpy.data.objects.new(f'brick_r{row}_c{col}', bmesh)\n          bpy.context.scene.collection.objects.link(obj)\n          obj.location = Vector((WALL_X, bx, z))\n          with bpy.context.temp_override(selected_objects=[obj], active_object=obj):\n              bpy.ops.rigidbody.object_add()\n          rb = obj.rigid_body\n          rb.type            = 'ACTIVE'\n          rb.collision_shape = 'BOX'\n          rb.mass            = 0.4\n          rb.friction        = 0.60\n          rb.restitution     = 0.02",
      },
      {
        title: "Bake and play back the simulation",
        body:
          "  # Bake via UI: Scene Properties → Rigid Body World → Cache → Bake All\n  # Or from a script after saving the .blend:\n  #\n  #   with bpy.context.temp_override(scene=scene):\n  #       bpy.ops.ptcache.bake_all(bake=True)\n  #\n  # Baking writes a .bphys cache file alongside the .blend.\n  # Without a bake, physics only simulates during Timeline playback from frame 1;\n  # scrubbing backward re-simulates from the beginning (slow and non-deterministic\n  # due to floating-point accumulation).\n  #\n  # After baking, scrub freely — positions are read from the cache, not re-solved.\n  # To rebuild (e.g. after changing mass or friction):\n  #   Scene Properties → Rigid Body World → Cache → Delete All Bakes",
      },
    ],
  },
  base,
);
