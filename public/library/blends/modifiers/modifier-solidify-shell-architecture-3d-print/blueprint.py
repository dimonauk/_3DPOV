"""
Modifier — Solidify: Simple vs Complex Mode
Wall Thickness for Architecture, 3D Print, and WebXR
Blender 5.1 · CC0-1.0 · Holoflow Studio
=====================================================

Technique:
  Solidify converts a zero-thickness mesh (flat plane or open shell) into a
  manifold solid with separate outer shell, inner shell, and rim (edge-fill) faces.

  Simple mode offsets every vertex along its averaged face-normal. At sharp
  concave corners — where two faces meet at < 180° inside — those offset normals
  diverge, producing a self-intersecting inner corner that is not manifold and
  fails 3D print checks.

  Complex mode ('NON_MANIFOLD' in the Python API, introduced in Blender 2.82)
  builds the offset surface using a halfedge-miter algorithm. It correctly handles
  concave corners, T-junctions, and non-planar topology by inserting a miter
  diagonal at each non-convex vertex rather than extending the offset until the
  faces intersect.

  WHY the L-shaped wall corner is the canonical test case: Wall A (facing +Y)
  and Wall B (facing +X) share a vertical corner edge. Their inner-face normals
  point inward at 90° to each other. Simple Solidify pushes those inner faces
  until they cross; Complex Solidify inserts a 45° miter strip so the joint
  closes cleanly — exactly the geometry a room wall requires.

Usage:
  blender --background --python blueprint.py
  Then Ctrl+S in Blender's scripting tab to save the .blend.

Outputs:
  • wall_corner_solidify.blend  (save manually)
  • ../../../../glbs/modifiers/modifier-solidify-shell-architecture-3d-print/
      wall_corner_solidify.glb
"""

import os
import math

import bpy
import bmesh
from mathutils import Vector

# ── Constants ─────────────────────────────────────────────────────────────────
WALL_HEIGHT    = 2.8    # m — standard residential ceiling height
WALL_A_LENGTH  = 4.0    # m — long wall runs along X axis
WALL_B_LENGTH  = 3.0    # m — short wall runs along Y axis
WALL_THICKNESS = 0.20   # m — 200 mm masonry/concrete wall

# Offset direction: -1.0 = shell grows inward from the source face
# (source face becomes exterior; inner shell is pushed toward room centre)
# 0.0 = centred; +1.0 = grows outward.
SOLIDIFY_OFFSET = -1.0

# 'SIMPLE' = fast, self-intersects at concave corners
# 'NON_MANIFOLD' = Complex mode, miter-corrected, manifold output
SOLIDIFY_MODE = 'NON_MANIFOLD'

# Non-manifold sub-options (ignored when SOLIDIFY_MODE == 'SIMPLE')
NM_THICKNESS_MODE  = 'FIXED'   # FIXED | EVEN | CONSTRAINTS
NM_BOUNDARY_MODE   = 'FLAT'    # NONE | FLAT | ROUND

# Linear-RGB material colours
COL_EXTERIOR = (0.40, 0.37, 0.34, 1.0)   # dark warm concrete
COL_RIM      = (0.55, 0.50, 0.45, 1.0)   # cut-edge reveal colour

BLEND_DIR = os.path.dirname(os.path.abspath(__file__))
GLB_OUT = os.path.normpath(os.path.join(
    BLEND_DIR,
    "..", "..", "..", "..", "glbs",
    "modifiers", "modifier-solidify-shell-architecture-3d-print",
    "wall_corner_solidify.glb",
))


# ── Scene helpers ─────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for m in list(bpy.data.meshes):
        bpy.data.meshes.remove(m)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)


def make_corner_wall() -> bpy.types.Object:
    """L-shaped flat mesh — two quads sharing a 90° corner edge.

    WHY two separate quads rather than one merged face: sharing the vertical
    corner edge means Solidify sees a concave dihedral angle. Simple mode
    fails here; Complex mode inserts a miter diagonal. This is the minimal
    repro of the real-world wall-construction problem.
    """
    mesh = bpy.data.meshes.new("wall_corner")
    obj  = bpy.data.objects.new("wall_corner", mesh)
    bpy.context.collection.objects.link(obj)

    bm = bmesh.new()

    # Wall A — flat in XZ plane, outward normal faces -Y
    v0 = bm.verts.new(Vector((0,             0, 0)))
    v1 = bm.verts.new(Vector((WALL_A_LENGTH, 0, 0)))
    v2 = bm.verts.new(Vector((WALL_A_LENGTH, 0, WALL_HEIGHT)))
    v3 = bm.verts.new(Vector((0,             0, WALL_HEIGHT)))
    bm.faces.new([v0, v1, v2, v3])

    # Wall B — flat in YZ plane, outward normal faces -X
    # v0 and v3 are shared — the corner edge
    v4 = bm.verts.new(Vector((0, WALL_B_LENGTH, 0)))
    v5 = bm.verts.new(Vector((0, WALL_B_LENGTH, WALL_HEIGHT)))
    # Winding counter-clockwise as seen from +X (outward normal = -X)
    bm.faces.new([v0, v4, v5, v3])

    bm.to_mesh(mesh)
    bm.free()

    bpy.context.view_layer.objects.active = obj
    return obj


def add_materials(obj: bpy.types.Object):
    """Two material slots: index 0 = shell (exterior), index 1 = rim.

    The Solidify modifier's material_offset_rim shifts rim faces to slot 1.
    Both inner and outer shell faces occupy slot 0 — Solidify does not
    distinguish them via material index (normals distinguish them). To assign
    a distinct interior plaster material, apply the modifier and re-assign in
    Edit Mode by selecting back-facing geometry, or drive a second material
    via a GN attribute shader bridge.
    """
    for name, col, rough in [
        ("WALL_EXTERIOR", COL_EXTERIOR, 0.85),
        ("WALL_RIM",      COL_RIM,      0.60),
    ]:
        mat = bpy.data.materials.new(name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = col
        bsdf.inputs["Roughness"].default_value  = rough
        obj.data.materials.append(mat)


def add_solidify(obj: bpy.types.Object) -> bpy.types.SolidifyModifier:
    mod = obj.modifiers.new("Solidify", 'SOLIDIFY')

    mod.thickness     = WALL_THICKNESS
    mod.offset        = SOLIDIFY_OFFSET
    mod.solidify_mode = SOLIDIFY_MODE

    if SOLIDIFY_MODE == 'NON_MANIFOLD':
        # nonmanifold_thickness_mode controls how thickness is measured at joints.
        # FIXED: constant thickness along face normal — simplest, slight variation
        #        at sharp corners. EVEN: projects onto bisecting planes — uniform
        #        visual thickness but can widen corner geometry.
        mod.nonmanifold_thickness_mode = NM_THICKNESS_MODE
        # FLAT: rim edges at boundary remain flat (coplanar with source face edges).
        # ROUND: rim is bevelled into an arc — good for pipes and organic surfaces.
        mod.nonmanifold_boundary_mode  = NM_BOUNDARY_MODE

    # Rim fill: CLOSED fills the edges between outer and inner shells with quads.
    # This is mandatory for a manifold watertight solid (required for 3D printing).
    mod.use_rim          = True
    mod.use_rim_only     = False
    mod.rim_fill_mode    = 'CLOSED'

    # Shell faces get material slot 0 (EXTERIOR).
    # Rim faces get source_slot + 1 = slot 1 (RIM).
    mod.material_offset      = 0
    mod.material_offset_rim  = 1

    return mod


def add_lighting():
    sun_data = bpy.data.lights.new("Sun", 'SUN')
    sun_data.energy = 3.5
    sun_data.angle  = math.radians(5)
    sun_obj = bpy.data.objects.new("Sun", sun_data)
    bpy.context.collection.objects.link(sun_obj)
    sun_obj.location       = Vector((6, -6, 10))
    sun_obj.rotation_euler = (math.radians(45), 0, math.radians(45))

    # Interior fill — reveals the inner wall face
    fill_data = bpy.data.lights.new("Fill", 'AREA')
    fill_data.energy = 120.0
    fill_data.size   = 2.0
    fill_obj = bpy.data.objects.new("Fill", fill_data)
    bpy.context.collection.objects.link(fill_obj)
    fill_obj.location = Vector((1.5, 1.5, 2.0))


def add_camera():
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 28.0   # wide — captures both walls in frame
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    cam_obj.location       = Vector((6, -6, 3))
    cam_obj.rotation_euler = (math.radians(75), 0, math.radians(45))
    bpy.context.scene.camera = cam_obj


def export_glb(obj: bpy.types.Object):
    """Apply-on-duplicate — working object's modifier stack stays live."""
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.duplicate(linked=False)
    dup = bpy.context.active_object
    dup.name = "wall_corner_export"

    for mod in list(dup.modifiers):
        bpy.ops.object.modifier_apply(modifier=mod.name)

    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    os.makedirs(os.path.dirname(GLB_OUT), exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    dup.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=GLB_OUT,
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
    )

    bpy.data.objects.remove(dup, do_unlink=True)
    print(f"[solidify-blueprint] GLB → {GLB_OUT}")


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    clear_scene()
    obj = make_corner_wall()
    add_materials(obj)
    add_solidify(obj)
    add_lighting()
    add_camera()
    export_glb(obj)


if __name__ == "__main__":
    main()
