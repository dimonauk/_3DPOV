"""
Python mathutils.Matrix — Transform Composition, Decomposition & Coordinate-Space Conversion
Blender 5.1 | Holoflow Studio Library
CC0 — No rights reserved.

WHY mathutils.Matrix?
  Every object's position in Blender is a 4×4 column-major homogeneous matrix stored as
  matrix_world (parent-relative transforms chain through matrix_local).  The @ operator is
  matrix multiplication (not element-wise); column-vector convention means the matrix goes
  LEFT of the vector: result = M @ v.  Understanding this lets you: position objects
  numerically without touching the UI, bake parent hierarchies, build pivot-point rigs,
  and export transforms to THREE.js — which uses the same convention but a different
  coordinate frame (+Z forward vs Blender's −Y forward).

  Key invariant: ob.matrix_world = parent.matrix_world @ ob.matrix_local
  Decompose yields (translation Vector, Quaternion, scale Vector) — quaternion avoids the
  gimbal singularities that plague Euler decompositions near ±90° on the Y axis.
"""

import bpy, json, math
from mathutils import Matrix, Vector, Quaternion

# ── Constants ─────────────────────────────────────────────────────────────────
ORBIT_RADIUS  = 2.5
ORBIT_COUNT   = 6
CHILD_OFFSET  = Vector((0.6, 0.0, 0.0))    # local to each satellite
EXPORT_PATH   = "//matrix_manifest.json"

# Blender (+Y up, −Y forward) → THREE.js (+Y up, +Z forward)
# A 90° CCW rotation around X maps Blender's −Y forward to THREE.js's +Z forward.
# This is the same transform used by Blender's built-in GLB exporter (export_yup=True).
BLENDER_TO_THREEJS: Matrix = Matrix.Rotation(math.radians(90), 4, 'X')


# ── Helpers ───────────────────────────────────────────────────────────────────

def clear_scene() -> None:
    """Remove every object and mesh from the startup blend."""
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh, do_unlink=True)


def add_ico(name: str, subdivisions: int = 2, radius: float = 1.0) -> bpy.types.Object:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=subdivisions, radius=radius)
    ob = bpy.context.active_object
    ob.name = ob.data.name = name
    return ob


def compose_trs(t: Vector, r: Quaternion, s: Vector) -> Matrix:
    """
    Build a 4×4 TRS matrix without touching object.location/rotation/scale.
    WHY avoid location/rotation/scale: those setters drive through Euler angles
    internally; at values near ±90° on the Y axis the mapping is degenerate
    (gimbal lock) and floating-point error accumulates over repeated read-write
    cycles.  Working in matrix space is numerically stable and composable.
    """
    T = Matrix.Translation(t)
    R = r.to_matrix().to_4x4()
    # Matrix.Diagonal builds a 4×4 with the given values on the diagonal.
    # The homogeneous W component must be 1.0 — hence (*s, 1.0).
    S = Matrix.Diagonal((*s, 1.0))
    # Column-major convention: T applied last (outermost), S applied first.
    return T @ R @ S


def pivot_rotate(ob: bpy.types.Object,
                 pivot: Vector,
                 axis: Vector,
                 angle_rad: float) -> None:
    """
    Rotate *ob* in world space around an arbitrary pivot point.
    WHY pivot math: ob.rotation_euler rotates around the object's own origin.
    To orbit around a scene point P you must: shift the world so P is at the
    origin, apply the rotation, shift back.  The resulting combined matrix is:
        M_orbit = T(+P) @ R @ T(−P)
    Applied as: ob.matrix_world = M_orbit @ ob.matrix_world.
    """
    R          = Matrix.Rotation(angle_rad, 4, axis.normalized())
    T_to_org   = Matrix.Translation(-pivot)
    T_from_org = Matrix.Translation(pivot)
    M_orbit    = T_from_org @ R @ T_to_org
    ob.matrix_world = M_orbit @ ob.matrix_world


def mat_to_threejs(mat: Matrix) -> list:
    """
    Convert a Blender matrix to a THREE.js-ready column-major float[16].
    THREE.js Matrix4 stores values in column-major order and uses the same
    convention, but after the +X-rotation coordinate change.
    mathutils.Matrix iterates ROW-major in Python, so .transposed() then
    flatten gives column-major storage — what THREE.js.Matrix4.fromArray() wants.
    """
    converted = BLENDER_TO_THREEJS @ mat
    return [v for row in converted.transposed() for v in row]


# ── Main ──────────────────────────────────────────────────────────────────────

def main() -> None:
    clear_scene()

    # ── 1  Hub sphere at the world origin ────────────────────────────────────
    hub = add_ico("hub", subdivisions=3, radius=0.35)
    hub.matrix_world = Matrix.Identity(4)   # explicit: no implicit position

    # ── 2  Six satellites via TRS composition ─────────────────────────────────
    # Place each satellite on a circle; orient its local −Y toward the hub.
    # to_track_quat(track, up) returns the quaternion that rotates local TRACK
    # axis to align with the direction vector.  '−Y' is Blender's forward.
    satellites: list[bpy.types.Object] = []
    for i in range(ORBIT_COUNT):
        angle   = (2.0 * math.pi / ORBIT_COUNT) * i
        t       = Vector((math.cos(angle) * ORBIT_RADIUS,
                           math.sin(angle) * ORBIT_RADIUS,
                           0.0))
        look_q  = (Vector((0, 0, 0)) - t).normalized().to_track_quat('-Y', 'Z')
        s       = Vector((0.28, 0.28, 0.28))
        sat     = add_ico(f"sat_{i:02d}", subdivisions=1, radius=1.0)
        sat.matrix_world = compose_trs(t, look_q, s)
        satellites.append(sat)

    # ── 3  Child knob offset in parent-local space ────────────────────────────
    # child world pos = parent.matrix_world @ local_offset (homogeneous)
    # After parenting: child.matrix_parent_inverse = parent.matrix_world.inverted()
    # restores the same world position — Blender normally computes this on
    # operators, but direct-API parenting needs it set manually.
    children: list[bpy.types.Object] = []
    for sat in satellites:
        knob = add_ico(f"knob_{sat.name}", subdivisions=0, radius=1.0)
        knob.scale = (0.12, 0.12, 0.12)
        # Homogeneous multiply: treat offset as point (w=1.0)
        world_pos       = (sat.matrix_world @ CHILD_OFFSET.to_4d()).to_3d()
        knob.matrix_world = Matrix.Translation(world_pos)
        knob.parent       = sat
        knob.matrix_parent_inverse = sat.matrix_world.inverted()
        children.append(knob)

    bpy.context.view_layer.update()

    # ── 4  Decompose + round-trip verification ────────────────────────────────
    # decompose() returns (Vector, Quaternion, Vector).  The round-trip test
    # confirms compose_trs is numerically self-consistent.  max_err < 1e-5 is
    # well below float32 export precision (≈ 1e-7), so no precision is lost.
    for sat in satellites:
        t_d, r_d, s_d = sat.matrix_world.decompose()
        recomp         = compose_trs(t_d, r_d, s_d)
        delta          = recomp @ sat.matrix_world.inverted()
        diff           = [(delta[r][c] - (1.0 if r == c else 0.0))
                          for r in range(4) for c in range(4)]
        max_err        = max(abs(v) for v in diff)
        assert max_err < 1e-5, f"Round-trip error on {sat.name}: {max_err:.2e}"
    print("[holoflow] Decompose round-trip OK on all satellites.")

    # ── 5  Pivot-orbit the entire constellation 45° around global +Z ─────────
    # Demonstrates that pivot_rotate is additive: call it N times to step
    # through arbitrary arc segments without accumulating the angle yourself.
    for sat in satellites + children:
        pivot_rotate(sat, Vector((0, 0, 0)), Vector((0, 0, 1)), math.radians(45))
    bpy.context.view_layer.update()

    # ── 6  Export THREE.js matrix manifest ───────────────────────────────────
    manifest: dict = {"format": "threejs_column_major_float16", "objects": []}
    all_obs = [hub] + satellites + children
    for ob in all_obs:
        bpy.context.view_layer.update()
        t, r, s = ob.matrix_world.decompose()
        manifest["objects"].append({
            "name"           : ob.name,
            "translation"    : list(t),
            "rotation_quat"  : [r.x, r.y, r.z, r.w],   # THREE.js order: x y z w
            "scale"          : list(s),
            "matrix_threejs" : mat_to_threejs(ob.matrix_world),
        })

    out_path = bpy.path.abspath(EXPORT_PATH)
    with open(out_path, "w") as fh:
        json.dump(manifest, fh, indent=2)
    print(f"[holoflow] Matrix manifest → {out_path}")

    # ── 7  Save .blend ────────────────────────────────────────────────────────
    bpy.ops.wm.save_as_mainfile(
        filepath=bpy.path.abspath("//matrix_demo.blend"),
        compress=True,
    )
    print("[holoflow] blueprint complete — matrix_demo.blend + matrix_manifest.json")


main()
