"""
Modifier — Wireframe: Edge-Tube Neon Skeleton
Blender 5.1 · CC0-1.0 · Holoflow Studio
===========================================

Technique:
  The Wireframe modifier converts every edge of a mesh into a four-sided tube
  (a quad strip running along the edge). At each vertex the tubes from all
  incident edges meet at a joint.

  use_even_offset = False (Simple): extends each quad strip along the edge
  direction until adjacent strips collide. At high-valence vertices the strips
  overlap and produce a star-burst artefact — fine at low thickness, visually
  wrong as tube radius approaches edge length.

  use_even_offset = True (Even): computes the bisecting plane between each pair
  of incident edges and clips the quad strip precisely there. Every joint closes
  cleanly at any valence. Use Even mode as the default.

  use_replace controls what survives:
    True  — source faces removed; pure tube skeleton remains
    False — source faces + tubes coexist; material_offset separates them via slot

Two objects demonstrate both modes:
  A. wire_sphere   — ICO sphere level-1, use_replace=True, teal emission
  B. wire_panel    — 4×4 grid, use_replace=False, material_offset=1 (orange tubes)

Usage:
  blender --background --python blueprint.py

Outputs:
  wire_sphere.blend  (save manually after running in Scripting workspace)
  ../../../../glbs/modifiers/modifier-wireframe-edge-tube-neon-skeleton/
      wire_skeleton.glb  (both objects in one file)
"""

import os
import math

import bpy
import bmesh
from mathutils import Vector

# ── Constants ─────────────────────────────────────────────────────────────────
# Object A: pure wireframe skeleton (use_replace=True)
ICO_SUBDIVISIONS = 1      # 20 triangles, 12 verts, 30 edges → geodesic clarity
ICO_RADIUS       = 1.0    # metres

WIRE_A_THICKNESS = 0.040  # tube radius — visible in viewport at this scale
WIRE_A_EVEN      = True   # clean vertex joints (bisecting-plane clipping)
WIRE_A_RELATIVE  = False  # absolute thickness (same gauge on every edge)
WIRE_A_BOUNDARY  = False  # closed mesh — boundary flag irrelevant
WIRE_A_REPLACE   = True   # remove source faces: pure edge skeleton

# Object B: hybrid solid+wire (use_replace=False + material_offset)
PANEL_SEGMENTS   = 4      # 4×4 grid → 16 quad faces, 25 verts, 40+16 edges
PANEL_HALF_SIZE  = 1.2    # m — bmesh create_grid uses half-extent (total 2.4 m)

WIRE_B_THICKNESS = 0.025  # thinner tube — overlaid on opaque panel
WIRE_B_EVEN      = True
WIRE_B_REPLACE   = False  # keep original quad faces
WIRE_B_BOUNDARY  = True   # open grid perimeter has bare edges — include them
WIRE_B_MAT_OFFSET = 1     # tube faces shift to material slot 1 (PANEL_WIRE)

# Scene layout: side-by-side comparison
POS_SPHERE = Vector((-2.5, 0.0, 0.0))
POS_PANEL  = Vector(( 2.5, 0.0, 0.0))

# Linear-RGB (not sRGB) colours
COL_NEON_TEAL   = (0.00, 0.85, 0.75, 1.0)  # teal emission
COL_PANEL_BASE  = (0.08, 0.08, 0.10, 1.0)  # near-black charcoal base
COL_PANEL_WIRE  = (1.00, 0.38, 0.00, 1.0)  # orange neon edge highlight

NEON_STRENGTH   = 4.0   # emission energy W/sr
PANEL_ROUGHNESS = 0.90

BLEND_DIR = os.path.dirname(os.path.abspath(__file__))
GLB_DIR   = os.path.normpath(os.path.join(
    BLEND_DIR, "..", "..", "..", "..",
    "glbs", "modifiers", "modifier-wireframe-edge-tube-neon-skeleton",
))
GLB_OUT = os.path.join(GLB_DIR, "wire_skeleton.glb")


# ── Material helpers ───────────────────────────────────────────────────────────

def make_neon_mat(name: str, col: tuple, strength: float) -> bpy.types.Material:
    """Emission-only material — no diffuse, pure light emitter for neon look.

    WHY no Principled BSDF: a BSDF under a dark EEVEE environment returns
    near-black for any GI that misses the emissive tube. Plugging the Emission
    node directly into Output::Surface maximises luminance regardless of HDRI
    brightness, giving a 'neon in darkness' look with zero world-light setup.
    """
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    emit = nt.nodes.new('ShaderNodeEmission')
    emit.inputs['Color'].default_value    = col
    emit.inputs['Strength'].default_value = strength
    nt.links.new(emit.outputs['Emission'], out.inputs['Surface'])
    return mat


def make_pbr_mat(name: str, col: tuple, roughness: float) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs['Base Color'].default_value = col
    bsdf.inputs['Roughness'].default_value  = roughness
    return mat


# ── Object builders ────────────────────────────────────────────────────────────

def build_wire_sphere() -> bpy.types.Object:
    """ICO sphere level-1 + Wireframe (use_replace=True) = pure edge skeleton.

    WHY subdivisions=1 rather than higher: level-1 has exactly 30 edges. The
    Wireframe produces 30 tubes with 12 clean 5-valent joints — visually iconic
    and immediately readable as a geodesic structure. Level-2 (320 faces) makes
    individual tubes indistinct; the mesh reads as a lattice.

    WHY flat-shade the source mesh before Wireframe: the modifier reads face
    normals from the source to orient tube quads. A smooth-shaded source adds
    per-vertex normal interpolation that subtly twists tube walls. Flat-shaded
    source → exactly perpendicular tube walls on every triangular panel face.
    """
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=ICO_SUBDIVISIONS,
        radius=ICO_RADIUS,
        location=POS_SPHERE,
    )
    obj = bpy.context.active_object
    obj.name = "wire_sphere"

    # Flat shading on the source mesh (Wireframe respects this for tube normals)
    for poly in obj.data.polygons:
        poly.use_smooth = False

    obj.data.materials.append(
        make_neon_mat("NEON_TEAL", COL_NEON_TEAL, NEON_STRENGTH)
    )

    mod = obj.modifiers.new("Wireframe", 'WIREFRAME')
    mod.thickness       = WIRE_A_THICKNESS
    mod.use_even_offset = WIRE_A_EVEN
    mod.use_relative    = WIRE_A_RELATIVE
    mod.use_boundary    = WIRE_A_BOUNDARY
    mod.use_replace     = WIRE_A_REPLACE
    # material_offset=0: tube faces share slot 0 — the only slot on a
    # use_replace=True skeleton (source faces removed, so slot count is moot).
    mod.material_offset = 0
    return obj


def build_wire_panel() -> bpy.types.Object:
    """Subdivided plane + Wireframe (use_replace=False) = hybrid solid+wire.

    WHY a flat grid for this demo: flat topology makes tube geometry readable
    in screenshots — viewers can distinguish opaque panel quads from orange
    emissive tube caps at each grid crossing. The open perimeter demonstrates
    use_boundary=True: without it the four outer edges have no tubes.

    WHY material_offset=1 rather than separate UV-mapped textures: the modifier
    handles slot assignment automatically from topology — no face selection in
    Edit Mode required. This scales to any mesh topology without manual cleanup.
    """
    mesh = bpy.data.meshes.new("wire_panel_mesh")
    obj  = bpy.data.objects.new("wire_panel", mesh)
    obj.location = POS_PANEL
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj

    bm = bmesh.new()
    # create_grid: x_segments/y_segments = edges per axis; size = half-extent
    # → 4×4 grid = 16 quad faces, 25 verts, 40 interior + 16 boundary edges
    bmesh.ops.create_grid(
        bm,
        x_segments=PANEL_SEGMENTS,
        y_segments=PANEL_SEGMENTS,
        size=PANEL_HALF_SIZE,
    )
    bm.to_mesh(mesh)
    bm.free()

    # Slot 0: opaque charcoal PBR (panel face geometry)
    obj.data.materials.append(
        make_pbr_mat("PANEL_BASE", COL_PANEL_BASE, PANEL_ROUGHNESS)
    )
    # Slot 1: orange emission (Wireframe tube geometry via material_offset=1)
    obj.data.materials.append(
        make_neon_mat("PANEL_WIRE", COL_PANEL_WIRE, NEON_STRENGTH)
    )

    mod = obj.modifiers.new("Wireframe", 'WIREFRAME')
    mod.thickness       = WIRE_B_THICKNESS
    mod.use_even_offset = WIRE_B_EVEN
    mod.use_replace     = WIRE_B_REPLACE
    mod.use_boundary    = WIRE_B_BOUNDARY
    mod.material_offset = WIRE_B_MAT_OFFSET  # tubes → slot 1 (PANEL_WIRE)
    return obj


# ── Scene setup ────────────────────────────────────────────────────────────────

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for c in list(bpy.data.collections): bpy.data.collections.remove(c)
    for m in list(bpy.data.meshes):      bpy.data.meshes.remove(m)
    for mat in list(bpy.data.materials): bpy.data.materials.remove(mat)


def add_lighting():
    sun = bpy.data.lights.new("Sun", 'SUN')
    sun.energy = 2.5
    sun_obj = bpy.data.objects.new("Sun", sun)
    bpy.context.collection.objects.link(sun_obj)
    sun_obj.location       = Vector((4, -7, 10))
    sun_obj.rotation_euler = (math.radians(40), 0, math.radians(25))

    # Black world — emission-only neon look
    world = bpy.context.scene.world
    if world and world.node_tree:
        bg = world.node_tree.nodes.get("Background")
        if bg:
            bg.inputs['Color'].default_value    = (0.0, 0.0, 0.0, 1.0)
            bg.inputs['Strength'].default_value = 0.0


def add_camera():
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 35.0
    cam_obj  = bpy.data.objects.new("Camera", cam_data)
    bpy.context.collection.objects.link(cam_obj)
    # Position: slightly elevated, looking along −Y, centred between objects
    cam_obj.location       = Vector((0, -8, 2.0))
    cam_obj.rotation_euler = (math.radians(82), 0, 0)
    bpy.context.scene.camera = cam_obj


# ── Export ─────────────────────────────────────────────────────────────────────

def export_glb(objs: list):
    """Apply-on-duplicate — source modifier stacks remain live for editing.

    WHY duplicate rather than apply in-place: the blueprint is the source of
    truth. Keeping the modifier live means Dimona can open the .blend, adjust
    WIRE_A_THICKNESS, and see the change without re-running the script. The
    duplicate is disposable — it is deleted after the GLB is written.
    """
    dups = []
    for obj in objs:
        bpy.ops.object.select_all(action='DESELECT')
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.duplicate(linked=False)
        dup = bpy.context.active_object
        dup.name = obj.name + "_export"
        dups.append(dup)

    for dup in dups:
        bpy.ops.object.select_all(action='DESELECT')
        dup.select_set(True)
        bpy.context.view_layer.objects.active = dup
        for mod in list(dup.modifiers):
            bpy.ops.object.modifier_apply(modifier=mod.name)
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    bpy.ops.object.select_all(action='DESELECT')
    for dup in dups:
        dup.select_set(True)
    bpy.context.view_layer.objects.active = dups[0]

    os.makedirs(GLB_DIR, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=GLB_OUT,
        use_selection=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
    )
    for dup in dups:
        bpy.data.objects.remove(dup, do_unlink=True)
    print(f"[wireframe-blueprint] GLB → {GLB_OUT}")


# ── Entry point ────────────────────────────────────────────────────────────────

def main():
    clear_scene()
    sphere = build_wire_sphere()
    panel  = build_wire_panel()
    add_lighting()
    add_camera()
    export_glb([sphere, panel])


if __name__ == "__main__":
    main()
