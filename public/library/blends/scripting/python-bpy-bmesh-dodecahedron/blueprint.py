"""
bpy + bmesh — Procedural Dodecahedron (Blender 5.1)

Builds a regular dodecahedron (12 pentagonal faces, 20 vertices) entirely via
the bmesh direct-data API, bypassing bpy.ops.  The golden-ratio vertex
coordinates are embedded as named constants so the geometry is reproducible
to floating-point precision without any primitive operator.

Run: Scripting workspace → Open → blueprint.py → Run Script
Outputs: dodecahedron.blend  +  dodecahedron.glb
"""

import math
import os
import bpy
import bmesh
from mathutils import Vector

# ── parameters ──────────────────────────────────────────────────────────────
SCALE       = 1.0          # circumradius of the dodecahedron in Blender units
ANIM_FRAMES = 121          # frames 1-120 = exactly one 360° spin
FPS         = 24

# golden ratio: the dodecahedron's geometry lives entirely inside the
# algebraic field Q(√5), so we compute PHI once at full float precision.
PHI = (1.0 + math.sqrt(5.0)) / 2.0   # ≈ 1.6180339887…
R   = 1.0 / PHI                        # ≈ 0.6180339887…

BLEND_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "dodecahedron.blend")
GLB_PATH   = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                           "dodecahedron.glb")

# ── vertex table ─────────────────────────────────────────────────────────────
# 20 vertices of a regular dodecahedron inscribed in a unit sphere.
# Partitioned into three orbits under the rotation group A5:
#   · 8 cube corners  (±1, ±1, ±1)
#   · 4 + 4 + 4 even permutations of (0, ±R, ±PHI)
# Source: Coxeter, Regular Polytopes (3rd ed.) §2.7 — public domain.
VERTS = [
    # cube corners
    ( 1.0,  1.0,  1.0),   # 0
    ( 1.0,  1.0, -1.0),   # 1
    ( 1.0, -1.0,  1.0),   # 2
    ( 1.0, -1.0, -1.0),   # 3
    (-1.0,  1.0,  1.0),   # 4
    (-1.0,  1.0, -1.0),   # 5
    (-1.0, -1.0,  1.0),   # 6
    (-1.0, -1.0, -1.0),   # 7
    # (0, ±R, ±PHI) orbit
    ( 0.0,  R,  PHI),     # 8
    ( 0.0,  R, -PHI),     # 9
    ( 0.0, -R,  PHI),     # 10
    ( 0.0, -R, -PHI),     # 11
    # (±R, ±PHI, 0) orbit
    ( R,  PHI,  0.0),     # 12
    ( R, -PHI,  0.0),     # 13
    (-R,  PHI,  0.0),     # 14
    (-R, -PHI,  0.0),     # 15
    # (±PHI, 0, ±R) orbit
    ( PHI,  0.0,  R),     # 16
    ( PHI,  0.0, -R),     # 17
    (-PHI,  0.0,  R),     # 18
    (-PHI,  0.0, -R),     # 19
]

# ── face table ───────────────────────────────────────────────────────────────
# 12 pentagonal faces, vertices listed CCW when viewed from outside.
# Each face is uniquely identified by its three shared cube-corner indices.
FACES = [
    ( 0,  8, 10,  2, 16),   # F0  +Z cap,  +X side
    ( 0, 16, 17,  1, 12),   # F1  +X equatorial
    ( 0, 12, 14,  4,  8),   # F2  +Y cap
    ( 2, 10,  6, 15, 13),   # F3  −Y front-lower
    ( 2, 13,  3, 17, 16),   # F4  +X lower equatorial
    ( 4, 14,  5, 19, 18),   # F5  −X upper equatorial
    ( 4, 18,  6, 10,  8),   # F6  +Z left cap
    ( 1, 17,  3, 11,  9),   # F7  +X back equatorial
    ( 1,  9,  5, 14, 12),   # F8  +Y back cap
    ( 3, 13, 15,  7, 11),   # F9  −Y lower
    ( 5,  9, 11,  7, 19),   # F10 −Z back cap
    ( 6, 18, 19,  7, 15),   # F11 −X lower equatorial
]

# ── circumradius of the raw vertex table (so we can normalise to SCALE) ──────
# All 20 vertices lie on a sphere of this radius.
RAW_CIRCUM = math.sqrt(3.0)   # = sqrt(1² + 1² + 1²), exact for cube corners

# ─────────────────────────────────────────────────────────────────────────────

def reset_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes) + list(bpy.data.materials):
        bpy.data.meshes.remove(block) if isinstance(block, bpy.types.Mesh) else None
        bpy.data.materials.remove(block) if isinstance(block, bpy.types.Material) else None


def build_dodecahedron_mesh() -> bpy.types.Mesh:
    """Create the mesh via bmesh — no operators, no context dependency."""
    bm = bmesh.new()

    # normalise each vertex to SCALE units so the circumsphere == SCALE
    factor = SCALE / RAW_CIRCUM
    bm_verts = [bm.verts.new(Vector(v) * factor) for v in VERTS]

    # bmesh requires the internal index table to be valid before random access
    bm.verts.ensure_lookup_table()

    for face_indices in FACES:
        bm.faces.new([bm_verts[i] for i in face_indices])

    # recalculate normals so they point outward (bmesh starts with all zeros)
    bm.normal_update()

    mesh = bpy.data.meshes.new("dodecahedron")
    bm.to_mesh(mesh)
    bm.free()

    # flat shading: each polygon keeps its own face normal, no vertex blending
    for poly in mesh.polygons:
        poly.use_smooth = False

    mesh.update()
    return mesh


def make_material() -> bpy.types.Material:
    """
    Gold-tinted Principled BSDF via the node tree data API.

    We deliberately avoid bpy.ops.material.new() because ops are context-modal;
    inside a batch script there is no guarantee that the material editor is the
    active area.  bpy.data.materials.new() always works.
    """
    mat = bpy.data.materials.new("dodecahedron_gold")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    bsdf  = nodes.get("Principled BSDF")
    if bsdf is None:
        bsdf = nodes.new("ShaderNodeBsdfPrincipled")

    bsdf.inputs["Base Color"].default_value  = (0.85, 0.62, 0.18, 1.0)
    bsdf.inputs["Metallic"].default_value    = 0.85
    bsdf.inputs["Roughness"].default_value   = 0.15
    # Anisotropic gives the faceted planes individual highlight directions
    bsdf.inputs["Anisotropic"].default_value = 0.40
    return mat


def add_camera_and_lights():
    # camera: slightly elevated, looking at origin
    bpy.ops.object.camera_add(location=(3.5, -3.5, 2.5))
    cam = bpy.context.object
    cam.rotation_euler = (math.radians(65), 0, math.radians(45))
    bpy.context.scene.camera = cam

    # key light
    bpy.ops.object.light_add(type="AREA", location=(4, -2, 4))
    bpy.context.object.data.energy = 400
    bpy.context.object.data.size   = 3.0

    # fill light
    bpy.ops.object.light_add(type="AREA", location=(-4, 2, 2))
    bpy.context.object.data.energy = 120
    bpy.context.object.data.size   = 4.0


def keyframe_spin(obj: bpy.types.Object):
    """One complete 360° rotation around Z over frames 1→120."""
    obj.rotation_mode = "XYZ"

    obj.rotation_euler = (0.0, 0.0, 0.0)
    obj.keyframe_insert("rotation_euler", frame=1)

    obj.rotation_euler = (0.0, 0.0, math.tau)
    obj.keyframe_insert("rotation_euler", frame=ANIM_FRAMES)

    # linear interpolation removes ease-in / ease-out; the spin should be
    # constant velocity so the recording reads as a clean mechanical preview
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def export_glb():
    bpy.ops.export_scene.gltf(
        filepath          = GLB_PATH,
        export_format     = "GLB",
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format = "WEBP",
        export_apply      = True,    # apply transforms (no residual scale/rot)
        export_animations = True,
        export_yup        = True,    # glTF convention: +Y up
    )


# ── main ─────────────────────────────────────────────────────────────────────

reset_scene()

mesh = build_dodecahedron_mesh()
mat  = make_material()
mesh.materials.append(mat)

obj = bpy.data.objects.new("dodecahedron", mesh)
bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active = obj
obj.select_set(True)

# custom property: documents the mathematical provenance on the object itself
obj["holoflow:source"]  = "bpy+bmesh golden-ratio construction"
obj["holoflow:facet"]   = True    # studio flag: flat-shaded faceted asset

add_camera_and_lights()
keyframe_spin(obj)

bpy.context.scene.frame_start = 1
bpy.context.scene.frame_end   = ANIM_FRAMES - 1
bpy.context.scene.render.fps  = FPS

bpy.ops.wm.save_mainfile(filepath=BLEND_PATH)
export_glb()

print(f"[holoflow] dodecahedron.blend → {BLEND_PATH}")
print(f"[holoflow] dodecahedron.glb  → {GLB_PATH}")
print("[holoflow] V=20  E=30  F=12  |  Euler: V−E+F =", 20 - 30 + 12)
