import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Blender&apos;s Bullet rigid-body engine is almost entirely driven
        through the Physics Properties panel — but every parameter it sets is
        stored on the object as a <code>bpy.types.RigidBodyObject</code> block,
        accessible and writable from Python. The operator{" "}
        <code>bpy.ops.rigidbody.object_add()</code> allocates that block; once
        it exists you configure <code>obj.rigid_body.type</code>,{" "}
        <code>collision_shape</code>, <code>mass</code>, and damping directly
        without touching the UI. The same is true for the{" "}
        <code>RigidBodyWorld</code>:{" "}
        <code>bpy.ops.rigidbody.world_add()</code> only polls{" "}
        <code>context.scene.rigidbody_world is None</code> — it needs no 3-D
        View context and runs cleanly from the Script Editor.
      </p>

      <p>
        The expert move in this entry is <strong>frame stepping</strong> rather
        than point-cache baking. Calling{" "}
        <code>scene.frame_set(n)</code> followed by{" "}
        <code>bpy.context.view_layer.update()</code> forces the Bullet solver to
        advance all substeps for frame <em>n</em>, writing the evaluated result
        into each object&apos;s <code>matrix_world</code>. Iterating this from{" "}
        <code>FRAME_START</code> to <code>FRAME_END</code> captures the complete
        trajectory without requiring{" "}
        <code>bpy.ops.ptcache.bake_all()</code>, which polls for a{" "}
        <code>PROPERTIES</code> space context unavailable in headless runs.
        Physics is <em>forward-only</em> — jumping to frame 60 without stepping
        1–59 yields a stale or zeroed matrix. This is the most common silent
        failure in rigid-body Python scripts. Compare the depsgraph evaluation
        pattern with the batch-export approach in the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-depsgraph-evaluated-geometry-gn-instances-batch-export"
          className={lk}
        >
          depsgraph instance export tutorial
        </Link>
        .
      </p>

      <p>
        The trajectory is exported as JSON in GLTF coordinate space (+Y up).
        Blender uses +Z up with +Y forward; the remap is{" "}
        <code>(bl_x, bl_z, -bl_y)</code> for position and the same rotation on
        the quaternion XYZ components. This matches what the GLB exporter
        applies when <code>export_yup=True</code>, so the static geometry file
        and the trajectory JSON are in the same space — a Three.js{" "}
        <code>AnimationClip</code> constructed from the JSON will replay the
        Blender simulation with no additional transform. The initial velocity
        approach here — keyframes at frames 1 and 2 — is the documented path
        because <code>bpy.types.RigidBodyObject</code> has no{" "}
        <code>initial_velocity</code> attribute in 5.1. For the broader
        animation keyframe API, see the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-fcurve-keyframe-insert-procedural-animation-turntable"
          className={lk}
        >
          FCurve keyframe tutorial
        </Link>
        .
      </p>

      <p>
        Collision shape selection is the other expert decision point.{" "}
        <code>BOX</code> on a box-shaped mesh uses an analytic axis-aligned
        bounding-box collider — the fastest possible test in Bullet.{" "}
        <code>SPHERE</code> on the projectile uses an analytic sphere — the
        second fastest. <code>MESH</code> on the ground plane gives an exact
        surface fit for zero cost because a flat quad&apos;s convex hull <em>is</em>{" "}
        an infinite plane within Bullet&apos;s detection range. Using{" "}
        <code>CONVEX_HULL</code> on cuboid objects adds vertex-set GJK overhead
        with no accuracy benefit over <code>BOX</code>.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    time: "one evening",
    difficulty: "advanced",
    cost: "free",
    software: [
      {
        name: "Blender",
        version: "5.1",
        url: "https://www.blender.org/download/",
        cost: "free",
      },
    ],
    supplies: {
      materials: [],
      tools: [],
    },
    steps: [
      {
        title: "Set up a RigidBodyWorld via Python",
        body: `"""
In Blender 5.1 the Bullet physics world is a bpy.types.RigidBodyWorld
attached to the scene.  It holds the simulation time scale, substep count,
and solver iteration limit.

bpy.ops.rigidbody.world_add() POLL requirements:
  • context.scene is not None           → True in Script Editor / headless
  • context.scene.rigidbody_world is None → True before any world exists
  No 3-D View context is required — this is one of the few rigid-body
  operators that runs outside a viewport.
"""

import bpy

def ensure_rigidbody_world() -> bpy.types.RigidBodyWorld:
    scene = bpy.context.scene
    if scene.rigidbody_world is None:
        bpy.ops.rigidbody.world_add()
    # Calling world_add() twice raises RuntimeError('Context is incorrect').
    # Guard with the None-check above.

    rbw = scene.rigidbody_world
    rbw.substeps_per_frame = 10
    # WHY 10 substeps?
    #   Each Bullet tick covers 1/(fps × substeps) = ~4 ms at 24 fps.
    #   Fast objects (v > 2 m/s) can tunnel through walls < v×4ms thick.
    #   10 substeps is the safe floor for objects larger than ~0.2 m.

    rbw.solver_iterations = 10
    rbw.time_scale        = 1.0

    scene.gravity = (0, 0, -9.81)
    # scene.gravity IS the Bullet gravity — not a separate field.
    # Changing it mid-simulation invalidates the point cache.
    return rbw

rbw = ensure_rigidbody_world()
print(f"World substeps: {rbw.substeps_per_frame}")`,
      },
      {
        title: "Add PASSIVE and ACTIVE rigid bodies",
        body: `import bpy, bmesh
from mathutils import Vector

FLOOR_SIZE    = 6.0
BOX_SIZE      = 0.4
BOX_GAP       = 0.02
SPHERE_RADIUS = 0.35

# ── Ground (PASSIVE) ─────────────────────────────────────────────────────────
mesh_g = bpy.data.meshes.new("Ground")
obj_g  = bpy.data.objects.new("Ground", mesh_g)
bpy.context.scene.collection.objects.link(obj_g)

bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=FLOOR_SIZE * 0.5)
bm.to_mesh(mesh_g); bm.free()

# bpy.ops.rigidbody.object_add() POLL requirements:
#   context.selected_objects must be non-empty
#   context.active_object must be set
# Script Editor context has neither — use temp_override to inject both.
with bpy.context.temp_override(
    selected_objects=[obj_g], active_object=obj_g
):
    bpy.ops.rigidbody.object_add()

obj_g.rigid_body.type            = 'PASSIVE'
obj_g.rigid_body.collision_shape = 'MESH'
# WHY MESH for a flat quad?
#   A flat quad's convex hull collapses to a degenerate plane with near-zero
#   height — Bullet treats it as an analytic plane within its detection range.
#   No tunnelling; zero cost.
obj_g.rigid_body.friction        = 0.6
obj_g.rigid_body.restitution     = 0.2

# ── Box stack (ACTIVE) ───────────────────────────────────────────────────────
boxes = []
z = BOX_SIZE * 0.5  # first box centre: half-edge above ground

for i in range(3):
    mesh_b = bpy.data.meshes.new(f"Box_{i}")
    obj_b  = bpy.data.objects.new(f"Box_{i}", mesh_b)
    bpy.context.scene.collection.objects.link(obj_b)

    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=BOX_SIZE)
    bm.to_mesh(mesh_b); bm.free()

    obj_b.location = (0.5, 0.0, z)  # slight +X → interesting off-axis topple
    z += BOX_SIZE + BOX_GAP

    with bpy.context.temp_override(
        selected_objects=[obj_b], active_object=obj_b
    ):
        bpy.ops.rigidbody.object_add()

    obj_b.rigid_body.type            = 'ACTIVE'
    obj_b.rigid_body.collision_shape = 'BOX'
    # WHY BOX not CONVEX_HULL for cuboid objects?
    #   BOX uses an analytic AABB — O(1) intersection test.
    #   CONVEX_HULL on the same mesh adds vertex-set GJK with no extra accuracy.
    obj_b.rigid_body.mass            = 1.0
    obj_b.rigid_body.friction        = 0.5
    obj_b.rigid_body.restitution     = 0.3
    obj_b.rigid_body.linear_damping  = 0.04
    obj_b.rigid_body.angular_damping = 0.1
    boxes.append(obj_b)

# ── Sphere projectile (ACTIVE) ───────────────────────────────────────────────
mesh_s = bpy.data.meshes.new("Sphere")
obj_s  = bpy.data.objects.new("Sphere", mesh_s)
bpy.context.scene.collection.objects.link(obj_s)

bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=16, v_segments=8, radius=SPHERE_RADIUS)
bm.to_mesh(mesh_s); bm.free()

obj_s.location = (-3.5, 0.0, BOX_SIZE * 1.5)

with bpy.context.temp_override(
    selected_objects=[obj_s], active_object=obj_s
):
    bpy.ops.rigidbody.object_add()

obj_s.rigid_body.type            = 'ACTIVE'
obj_s.rigid_body.collision_shape = 'SPHERE'
obj_s.rigid_body.mass            = 3.0
obj_s.rigid_body.restitution     = 0.6

print("Rigid bodies created:", [o.name for o in [obj_g] + boxes + [obj_s]])`,
      },
      {
        title: "Give the sphere an initial velocity via keyframes",
        body: `"""
bpy.types.RigidBodyObject has NO initial_velocity attribute in Blender 5.1.
The documented approach is to keyframe two positions one frame apart:
Bullet reads the positional delta as a velocity impulse on the first tick.

WHY two keyframes rather than one?
  With only one keyframe at frame 1, Bullet sees no previous-frame position
  and initialises velocity to zero — the sphere drops straight down.
  Two keyframes separated by one frame give Bullet a Δposition/Δtime
  velocity that persists after the keyframes end (Bullet takes over the
  transform from frame 2 onwards).
"""

import bpy

FRAME_START   = 1
LAUNCH_X      = -3.5
LAUNCH_Z      = 0.4 * 1.5   # BOX_SIZE * 1.5

scene = bpy.context.scene
scene.frame_start = FRAME_START
scene.frame_end   = 72   # 3 s @ 24 fps
scene.render.fps  = 24

obj_s = bpy.data.objects["Sphere"]

scene.frame_set(FRAME_START)
obj_s.location = (LAUNCH_X, 0.0, LAUNCH_Z)
obj_s.keyframe_insert("location", frame=FRAME_START)

# Moving 0.23 m in one frame at 24 fps → ~5.5 m/s lateral.
# Enough to topple a 1 kg box stack with a 3 kg sphere.
obj_s.location = (LAUNCH_X + 0.23, 0.0, LAUNCH_Z)
obj_s.keyframe_insert("location", frame=FRAME_START + 1)

# LINEAR interpolation so the velocity delta is exactly as authored.
for fc in obj_s.animation_data.action.fcurves:
    for kp in fc.keyframe_points:
        kp.interpolation = 'LINEAR'

# TROUBLESHOOTING — sphere falls instead of flying forward:
#   Check that the keyframe at frame 2 has a larger X value.
#   Play from frame 1 in the viewport and watch the sphere move.
#   If it still drops: ensure rigid_body.type == 'ACTIVE'.

print("Initial velocity keyframes inserted.")`,
      },
      {
        title: "Step through frames and capture trajectory",
        body: `"""
Physics evaluates FORWARD ONLY.  Jumping to frame 60 without having stepped
through frames 1–59 returns a stale (often zero) matrix_world.  Always
start from FRAME_START and advance sequentially.

bpy.context.view_layer.update() flushes the dependency graph AFTER
scene.frame_set(n).  Without it, matrix_world is read from the previous
frame's cache — the most common silent error in rigid-body Python scripts.
"""

import bpy, json

FRAME_START = 1
FRAME_END   = 72

scene         = bpy.context.scene
active_bodies = [bpy.data.objects[f"Box_{i}"] for i in range(3)] + \
                [bpy.data.objects["Sphere"]]

scene.frame_set(FRAME_START)   # rewind simulation

trajectory: dict = {obj.name: {"frames": {}} for obj in active_bodies}

for frame in range(FRAME_START, FRAME_END + 1):
    scene.frame_set(frame)
    bpy.context.view_layer.update()

    for obj in active_bodies:
        t, r, _ = obj.matrix_world.decompose()

        # Coordinate remap: Blender (+Z up, +Y fwd) → GLTF (+Y up, -Z fwd)
        #   position:   (bl_x, bl_z, -bl_y)
        #   quaternion: remap XYZ components by the same rotation; W unchanged
        trajectory[obj.name]["frames"][str(frame)] = {
            "position":   [round(t.x, 5), round(t.z, 5), round(-t.y, 5)],
            "quaternion": [round(r.x, 6), round(r.z, 6), round(-r.y, 6),
                           round(r.w, 6)],
        }

print(f"Trajectory captured: {FRAME_END - FRAME_START + 1} frames, "
      f"{len(active_bodies)} objects")

# Verify a mid-point frame looks physical (non-zero position):
mid = str((FRAME_START + FRAME_END) // 2)
sp  = trajectory["Sphere"]["frames"][mid]["position"]
print(f"Sphere at frame {mid}: {sp}")
# Expected: X should be near 0 (close to boxes), Y close to ground (≈0.35),
# Z may be negative (behind boxes in GLTF space).

path = bpy.path.abspath("//trajectory.json")
with open(path, "w", encoding="utf-8") as fh:
    json.dump(
        {
            "meta": {
                "frame_start": FRAME_START, "frame_end": FRAME_END,
                "fps": 24, "substeps": 10,
            },
            "objects": trajectory,
        },
        fh, indent=2,
    )
print(f"trajectory.json written: {path}")`,
      },
      {
        title: "Export static GLB and wire up Three.js AnimationClip",
        body: `"""
Export the rest-pose geometry (frame 1) as a GLB, then use the trajectory
JSON to build a Three.js AnimationClip that replays the Blender simulation
in WebXR without a Bullet runtime on the client.
"""

import bpy

# Rewind to rest pose before export.
bpy.context.scene.frame_set(1)
bpy.context.view_layer.update()

all_objects = (
    [bpy.data.objects["Ground"]] +
    [bpy.data.objects[f"Box_{i}"] for i in range(3)] +
    [bpy.data.objects["Sphere"]]
)

bpy.ops.object.select_all(action='DESELECT')
for obj in all_objects:
    obj.select_set(True)

bpy.ops.export_scene.gltf(
    filepath=bpy.path.abspath("//rigid_bodies_scene.glb"),
    use_selection=True,
    export_format='GLB',
    export_apply=True,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_image_format='WEBP',
)
print("[holoflow] GLB exported.")

# ── Three.js replay snippet (paste into your WebXR scene) ────────────────────
THREEJS_SNIPPET = """
// Load trajectory.json and build AnimationClips for each rigid body.
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const loader  = new GLTFLoader()
const FPS     = 24
const SCALE   = 1 / FPS   // converts frame index to seconds

loader.load('/library/rigid_bodies_scene.glb', gltf => {
  const scene = gltf.scene

  fetch('/library/trajectory.json')
    .then(r => r.json())
    .then(data => {
      const clips = []

      for (const [name, entry] of Object.entries(data.objects)) {
        const node    = scene.getObjectByName(name)
        if (!node) continue

        const frames  = Object.keys(entry.frames).map(Number).sort((a,b)=>a-b)
        const times   = new Float32Array(frames.map(f => f * SCALE))
        const posArr  = new Float32Array(frames.flatMap(f => entry.frames[f].position))
        const quatArr = new Float32Array(frames.flatMap(f => entry.frames[f].quaternion))

        clips.push(new THREE.AnimationClip(name, -1, [
          new THREE.VectorKeyframeTrack(\`\${node.uuid}.position\`, times, posArr),
          new THREE.QuaternionKeyframeTrack(\`\${node.uuid}.quaternion\`, times, quatArr),
        ]))
      }

      const mixer = new THREE.AnimationMixer(scene)
      clips.forEach(clip => mixer.clipAction(clip).play())

      // In your render loop: mixer.update(delta)
    })
})
"""
print(THREEJS_SNIPPET)

# GOTCHA — QuaternionKeyframeTrack default interpolation is SLERP.
# Rigid body rotations are not always C1-smooth (collision events cause
# discontinuities).  Use THREE.InterpolateLinear for the quaternion track
# to match Blender's per-frame sampling exactly:
#   new THREE.QuaternionKeyframeTrack(..., THREE.InterpolateLinear)`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-rigid-body-physics-bake-trajectory-webxr",
    title:
      "Python bpy.types.RigidBodyObject — Scripted Physics Scene, Frame-Stepping & Trajectory JSON for WebXR",
    date: "2026-07-10",
    kind: "tutorial",
    excerpt:
      "Script Blender 5.1's Bullet rigid-body engine entirely via Python: build a RigidBodyWorld, configure ACTIVE and PASSIVE bodies with analytic collision shapes, capture physics trajectories by frame-stepping (not ptcache.bake_all), remap transforms to GLTF +Y-up space, and export a trajectory.json for Three.js AnimationClip replay in WebXR — no Bullet runtime on the client.",
    Body,
  }
);
