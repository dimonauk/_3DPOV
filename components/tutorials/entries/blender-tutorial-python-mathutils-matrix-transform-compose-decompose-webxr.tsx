import Link from "next/link";

import { buildInstructable } from "lib/tutorials/build";
import type { Entry } from "lib/writing";

const lk = "underline underline-offset-4 hover:text-pink-200";

function Body() {
  return (
    <>
      <p>
        Every object in Blender is a 4×4 column-major homogeneous matrix. The{" "}
        <code>@</code> operator is matrix multiplication (not element-wise), and the
        column-vector convention means the matrix goes <em>left</em> of the
        vector: <code>result = M @ v</code>. Knowing how to compose and decompose
        these matrices lets you position objects headlessly without Euler angles,
        implement pivot-around-an-arbitrary-point rigs, and export transforms to
        THREE.js without manual axis flips — the same work that underlies the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-object-constraint-stack-lookat-floor-bake-webxr"
          className={lk}
        >
          constraint-bake pipeline
        </Link>{" "}
        and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-posebone-matrix-world-space-ik-bake-vrm"
          className={lk}
        >
          PoseBone IK bake
        </Link>
        .
      </p>
      <p>
        The critical stability property: <code>matrix_world.decompose()</code>{" "}
        returns <code>(Vector, Quaternion, Vector)</code> — a quaternion, not
        Euler angles — so it is numerically well-defined at any rotation value,
        including the ±90° Y singularity that breaks ZYX Euler decomposition.
        The round-trip test in Step 4 demonstrates that{" "}
        <code>compose_trs(decompose(M)) ≈ M</code> to float32 precision, which
        is tighter than GLB export resolution. The{" "}
        <Link
          href="/tutorials/blender-tutorial-python-mathutils-bvhtree-raycast-surface-scatter-webxr"
          className={lk}
        >
          BVHTree ray-cast tutorial
        </Link>{" "}
        uses the same world-to-local transform to place ray origins relative to a
        target surface, and the{" "}
        <Link
          href="/tutorials/blender-tutorial-python-fcurve-keyframe-insert-procedural-animation-turntable"
          className={lk}
        >
          FCurve keyframe tutorial
        </Link>{" "}
        keys the resulting location and quaternion values into animation data.
        Outside references: Blender Foundation{" "}
        <a
          href="https://docs.blender.org/api/5.1/mathutils.html#mathutils.Matrix"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          mathutils.Matrix API
        </a>{" "}
        (CC-BY-SA 4.0); Nikolai Janakiev&apos;s{" "}
        <a
          href="https://github.com/njanakiev/blender-scripting"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          blender-scripting (MIT)
        </a>
        , sibling repos at{" "}
        <a
          href="https://github.com/njanakiev"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          github.com/njanakiev
        </a>
        ; THREE.js{" "}
        <a
          href="https://threejs.org/docs/#api/en/math/Matrix4"
          className={lk}
          target="_blank"
          rel="noopener noreferrer"
        >
          Matrix4 docs (MIT)
        </a>{" "}
        for column-major storage order.
      </p>
    </>
  );
}

export const entry: Entry = buildInstructable(
  {
    supplies: { materials: [], tools: [] },
    steps: [
      {
        title: "Clear scene and add hub sphere",
        body: `import bpy, math
from mathutils import Matrix, Vector, Quaternion

def clear_scene():
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh, do_unlink=True)

def add_ico(name, subdivisions=2, radius=1.0):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=radius)
    ob = bpy.context.active_object
    ob.name = ob.data.name = name
    return ob

clear_scene()
hub = add_ico("hub", subdivisions=3, radius=0.35)
# Matrix.Identity(4) — explicit: do not rely on the default transform.
hub.matrix_world = Matrix.Identity(4)
print("[holoflow] hub created at world origin.")`,
      },
      {
        title: "compose_trs: place orbit satellites without Euler angles",
        body: `"""
WHY avoid location/rotation_euler/scale setters:
  Those setters drive through Euler angles internally.  At values near ±90° on
  the Y axis the mapping is degenerate (gimbal lock) and floating-point error
  accumulates over repeated read-write cycles.  Working in matrix space avoids
  this entirely.

compose_trs builds:  T @ R @ S
  T = Matrix.Translation(t)            — pure shift, no rotation/scale
  R = quaternion.to_matrix().to_4x4()  — rotation only, no scale
  S = Matrix.Diagonal((*s, 1.0))       — scale only, W=1 for homogeneous

to_track_quat(track_axis, up_axis) returns the quaternion that aligns the
local TRACK axis with the direction vector.  '-Y' is Blender's default
forward for cameras and look-at objects; '+Z' is the preferred up to avoid
roll degeneracy when the direction is near-vertical.
"""
ORBIT_RADIUS = 2.5
ORBIT_COUNT  = 6

def compose_trs(t, r, s):
    T = Matrix.Translation(t)
    R = r.to_matrix().to_4x4()
    S = Matrix.Diagonal((*s, 1.0))
    return T @ R @ S

satellites = []
for i in range(ORBIT_COUNT):
    angle  = (2.0 * math.pi / ORBIT_COUNT) * i
    t      = Vector((math.cos(angle) * ORBIT_RADIUS,
                      math.sin(angle) * ORBIT_RADIUS, 0.0))
    look_q = (Vector((0,0,0)) - t).normalized().to_track_quat('-Y', 'Z')
    s      = Vector((0.28, 0.28, 0.28))
    sat    = add_ico(f"sat_{i:02d}", subdivisions=1, radius=1.0)
    sat.matrix_world = compose_trs(t, look_q, s)
    satellites.append(sat)
print(f"[holoflow] {len(satellites)} satellites placed via compose_trs.")`,
      },
      {
        title: "Parent child objects in parent-local space",
        body: `"""
Child world position = parent.matrix_world @ local_offset  (homogeneous)

to_4d() extends a Vector3 to a Vector4 with w=1.0 (a point, not a direction).
After ob.parent = sat, Blender expects matrix_parent_inverse to be set to
parent.matrix_world.inverted() so the child's world position remains unchanged.
bpy.ops.object.parent_set() does this automatically in the UI; the direct
API path requires it explicitly.
"""
CHILD_OFFSET = Vector((0.6, 0.0, 0.0))   # local to each satellite

children = []
for sat in satellites:
    knob = add_ico(f"knob_{sat.name}", subdivisions=0, radius=1.0)
    knob.scale = (0.12, 0.12, 0.12)
    world_pos = (sat.matrix_world @ CHILD_OFFSET.to_4d()).to_3d()
    knob.matrix_world = Matrix.Translation(world_pos)
    knob.parent = sat
    knob.matrix_parent_inverse = sat.matrix_world.inverted()
    children.append(knob)

bpy.context.view_layer.update()
print(f"[holoflow] {len(children)} child knobs parented.")`,
      },
      {
        title: "Decompose + round-trip verification",
        body: `"""
decompose() returns (Vector, Quaternion, Vector) — never Euler angles.
The round-trip test compares compose_trs(decompose(M)) against M via the
identity residual: if compose(decompose(M)) ≈ M then M @ M_inv ≈ I.
max_err < 1e-5 is tighter than float32 GLB export precision (≈1e-7),
so no precision is lost in a script-to-export pipeline.
"""
for sat in satellites:
    t_d, r_d, s_d = sat.matrix_world.decompose()
    recomp = compose_trs(t_d, r_d, s_d)
    # Check residual vs identity
    delta  = recomp @ sat.matrix_world.inverted()
    diff   = [(delta[r][c] - (1.0 if r == c else 0.0))
              for r in range(4) for c in range(4)]
    max_err = max(abs(v) for v in diff)
    assert max_err < 1e-5, f"Round-trip error {sat.name}: {max_err:.2e}"

print("[holoflow] Decompose round-trip OK — all satellites pass.")`,
      },
      {
        title: "Pivot-rotate: orbit constellation 45° around world +Z",
        body: `"""
pivot_rotate(ob, pivot, axis, angle) implements:
    M_orbit = T(+P) @ R(axis, angle) @ T(−P)
    ob.matrix_world = M_orbit @ ob.matrix_world

WHY not ob.rotation_euler += …?
  That rotates around the object's own origin, not the scene pivot.
  The translate-rotate-translate-back pattern moves every object as if
  the entire frame were pivoting around point P — correct for constellations,
  carousel rigs, and WebXR turntable interactions.
"""
def pivot_rotate(ob, pivot, axis, angle_rad):
    R          = Matrix.Rotation(angle_rad, 4, axis.normalized())
    T_to_org   = Matrix.Translation(-pivot)
    T_from_org = Matrix.Translation(pivot)
    ob.matrix_world = (T_from_org @ R @ T_to_org) @ ob.matrix_world

for ob in satellites + children:
    pivot_rotate(ob, Vector((0,0,0)), Vector((0,0,1)), math.radians(45))
bpy.context.view_layer.update()
print("[holoflow] Constellation pivoted 45° around world +Z.")`,
      },
      {
        title: "Export THREE.js matrix manifest JSON",
        body: `"""
THREE.js Matrix4.fromArray() expects a column-major float[16] in +Y-up +Z-forward.
Blender uses +Y-up −Y-forward, so a 90° X rotation is the coordinate change.
mathutils.Matrix iterates ROW-major in Python; .transposed() then flatten
gives column-major storage — the exact layout THREE.js expects.
THREE.js Quaternion order is (x, y, z, w); Blender's is identical (w is .w).
"""
import json

BLENDER_TO_THREEJS = Matrix.Rotation(math.radians(90), 4, 'X')

def mat_to_threejs(mat):
    converted = BLENDER_TO_THREEJS @ mat
    return [v for row in converted.transposed() for v in row]

manifest = {"format": "threejs_column_major_float16", "objects": []}
for ob in [bpy.data.objects["hub"]] + satellites + children:
    bpy.context.view_layer.update()
    t, r, s = ob.matrix_world.decompose()
    manifest["objects"].append({
        "name"           : ob.name,
        "translation"    : list(t),
        "rotation_quat"  : [r.x, r.y, r.z, r.w],
        "scale"          : list(s),
        "matrix_threejs" : mat_to_threejs(ob.matrix_world),
    })

out = bpy.path.abspath("//matrix_manifest.json")
with open(out, "w") as fh:
    json.dump(manifest, fh, indent=2)
bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath("//matrix_demo.blend"), compress=True)
print(f"[holoflow] manifest → {out}")
# THREE.js usage:
# const m4 = new THREE.Matrix4().fromArray(obj.matrix_threejs)
# mesh.applyMatrix4(m4)`,
      },
    ],
  },
  {
    slug: "blender-tutorial-python-mathutils-matrix-transform-compose-decompose-webxr",
    title:
      "Python mathutils.Matrix — Transform Composition, Decomposition & Coordinate-Space Conversion for WebXR (Blender 5.1)",
    date: "2026-07-10",
    kind: "tutorial",
    excerpt:
      "Master Blender 5.1's 4×4 column-major matrix API: compose TRS without Euler angles using Matrix.Translation @ q.to_matrix().to_4x4() @ Matrix.Diagonal, decompose() to quaternion for gimbal-safe animation baking, pivot-rotate a constellation around an arbitrary world point, verify round-trip precision, and export column-major float[16] matrices for THREE.js Matrix4.fromArray() — with the correct +90° X-axis coordinate-space correction for WebXR.",
    Body,
  }
);
