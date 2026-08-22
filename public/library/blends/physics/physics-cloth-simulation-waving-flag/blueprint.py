"""
Physics — Cloth Simulation: Stylised Waving Flag on a Mast
Blender 5.1 · CC0 · Holoflow Studio

Technique: Blender's cloth solver uses implicit Backwards Euler integration
(Baraff & Witkin, SIGGRAPH 1998) with three spring types per edge: structural
(vertex-to-adjacent, resists stretch), shear (vertex-to-diagonal, resists skew),
and bending (vertex two hops apart, resists fold).  Pinning a left-edge vertex
group to strength 1.0 applies a per-step position target, letting the solver
flex fabric near the attachment rather than using a rigid constraint.  A WIND
force field with NOISE drives flutter through differential loading: turbulent
gusts apply asymmetric impulses across flag quads, seeding the standing-wave
instability that structural stiffness then propagates across the mesh.
Low-poly (20 × 12) mesh is deliberate — the studio faceted aesthetic wants
discrete visible quads, not a smooth drape.  CLOTH_QUALITY = 10 prevents the
coarse mesh from self-penetrating (each sub-step is full_frame / QUALITY,
so 10 steps ≈ 0.4 ms sub-step at 24 fps).

Outside sources:
  Blender Manual — Cloth Physics Settings
    https://docs.blender.org/manual/en/latest/physics/cloth/settings/physics.html
    CC-BY-SA 4.0 · Blender Foundation
  blender-scripting — headless bpy examples
    https://github.com/njanakiev/blender-scripting
    MIT · Nicolas Janakiev
  glTF-Blender-IO — official Khronos glTF exporter
    https://github.com/KhronosGroup/glTF-Blender-IO
    Apache-2.0 · Khronos Group
"""

import bpy
import bmesh
import math
from mathutils import Vector

# ── Parameters ────────────────────────────────────────────────────────────────
FLAG_COLS       = 20       # horizontal vertices; 19 quads across (flutter axis)
FLAG_ROWS       = 12       # vertical vertices; 11 quads tall
FLAG_WIDTH      = 2.0      # metres, left-right extent
FLAG_HEIGHT     = 1.333    # metres, vertical extent (3:2 aspect ratio)
MAST_HEIGHT     = 3.0      # metres
MAST_RADIUS     = 0.06     # metres; cylinder radius feeds Collision buffer

CLOTH_QUALITY   = 10       # sub-steps/frame: prevents coarse-mesh tunnelling
CLOTH_MASS      = 0.3      # kg/m² — light synthetic bunting
CLOTH_STRUCT    = 40.0     # N/m structural stiffness: resists edge stretch
CLOTH_SHEAR     = 20.0     # N/m shear stiffness: resists diagonal deformation
CLOTH_BEND      = 5.0      # N·m/rad bending: lower = more flutter; higher = rigid
CLOTH_DAMP      = 0.05     # velocity damping fraction per step
CLOTH_AIR       = 1.0      # air drag coefficient: slows free edge under turbulence

WIND_STRENGTH   = 4.0      # N/m² applied normal to cloth surface
WIND_NOISE      = 2.5      # turbulence amplitude relative to base strength
WIND_SEED       = 1        # noise seed for reproducible flutter pattern

SIM_FRAMES      = 120      # simulation length: 5 s at 24 fps
EXPORT_FRAME    = 72       # GLB snapshot frame (3 s — flag fully extended)

FLAG_COLOUR_A   = (0.863, 0.078, 0.235, 1.0)   # sRGB Crimson — top band
FLAG_COLOUR_B   = (0.960, 0.960, 0.870, 1.0)   # sRGB Ivory — bottom band
MAST_COLOUR     = (0.18,  0.14,  0.10,  1.0)   # dark walnut

BLEND_PATH      = "//waving_flag.blend"
EXPORT_GLB      = "//waving_flag.glb"

# Flag bottom Z: leaves 0.25 m above mast top and starts FLAG_HEIGHT below that
FLAG_Z_BOTTOM   = MAST_HEIGHT - FLAG_HEIGHT - 0.25


# ── Helpers ───────────────────────────────────────────────────────────────────
def _link(obj: bpy.types.Object) -> None:
    col = bpy.context.scene.collection
    if obj.name not in col.objects:
        col.objects.link(obj)


def _make_mat(name: str, colour: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    if bsdf:
        bsdf.inputs['Base Color'].default_value = colour
        bsdf.inputs['Roughness'].default_value  = 0.72
    return mat


def _cleanup() -> None:
    prefixes = ("waving_flag", "flag_static", "mast", "wind_field",
                "FlagMesh", "MastMesh", "FlagStatic",
                "Flag_", "Mast_", "Camera", "Key", "key_light")
    for ob in list(bpy.data.objects):
        if any(ob.name.startswith(p) for p in prefixes):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if any(me.name.startswith(p) for p in ("FlagMesh", "MastMesh", "FlagStatic")):
            bpy.data.meshes.remove(me)
    for ma in list(bpy.data.materials):
        if any(ma.name.startswith(p) for p in ("Flag_", "Mast_")):
            bpy.data.materials.remove(ma)


# ── Scene builders ────────────────────────────────────────────────────────────
def _build_flag() -> bpy.types.Object:
    """Precise FLAG_COLS × FLAG_ROWS quad grid in the XZ plane via bmesh."""
    bm = bmesh.new()
    verts = []
    for row in range(FLAG_ROWS):
        for col in range(FLAG_COLS):
            x = MAST_RADIUS + (col / (FLAG_COLS - 1)) * FLAG_WIDTH
            z = FLAG_Z_BOTTOM + (row / (FLAG_ROWS - 1)) * FLAG_HEIGHT
            verts.append(bm.verts.new(Vector((x, 0.0, z))))

    bm.verts.ensure_lookup_table()

    mid_row = FLAG_ROWS // 2  # material split: top half crimson, bottom ivory

    for row in range(FLAG_ROWS - 1):
        for col in range(FLAG_COLS - 1):
            i = row * FLAG_COLS + col
            f = bm.faces.new([
                verts[i], verts[i + 1],
                verts[i + FLAG_COLS + 1], verts[i + FLAG_COLS],
            ])
            f.material_index = 0 if row >= mid_row else 1  # 0=crimson, 1=ivory

    bm.normal_update()

    mesh = bpy.data.meshes.new("FlagMesh")
    obj  = bpy.data.objects.new("waving_flag", mesh)
    _link(obj)

    bm.to_mesh(mesh)
    bm.free()

    mesh.materials.append(_make_mat("Flag_A", FLAG_COLOUR_A))
    mesh.materials.append(_make_mat("Flag_B", FLAG_COLOUR_B))

    for poly in mesh.polygons:
        poly.use_smooth = False  # flat-shaded faceted look

    # Vertex group: col == 0 (left edge) pinned to the mast
    vg = obj.vertex_groups.new(name="pin_left")
    vg.add([row * FLAG_COLS for row in range(FLAG_ROWS)], 1.0, 'REPLACE')

    return obj


def _build_mast() -> bpy.types.Object:
    bpy.ops.mesh.primitive_cylinder_add(
        radius=MAST_RADIUS, depth=MAST_HEIGHT,
        vertices=8, location=(0, 0, MAST_HEIGHT / 2)
    )
    mast = bpy.context.active_object
    mast.name = "mast"
    # Collision modifier: cloth vertices test against this mesh each sub-step
    coll = mast.modifiers.new(name='Collision', type='COLLISION')
    coll.settings.thickness_outer = 0.02   # 2 cm buffer prevents z-fighting
    mast.data.materials.append(_make_mat("Mast_Wood", MAST_COLOUR))
    for poly in mast.data.polygons:
        poly.use_smooth = False
    return mast


def _setup_wind() -> bpy.types.Object:
    """Wind empty: Rx(-90°) maps local -Z → world +Y (perpendicular to flag face)."""
    bpy.ops.object.effector_add(
        type='WIND', location=(0.0, -4.0, MAST_HEIGHT / 2)
    )
    wind = bpy.context.active_object
    wind.name             = "wind_field"
    wind.rotation_euler[0] = -math.pi / 2  # -Z axis now points +Y
    wind.field.strength   = WIND_STRENGTH
    wind.field.noise      = WIND_NOISE
    wind.field.seed       = WIND_SEED
    wind.field.flow       = 0.0    # 0 = fully turbulent; 1 = laminar
    return wind


def _setup_cloth(obj: bpy.types.Object) -> None:
    """Cloth modifier with Baraff-Witkin implicit solver parameters."""
    bpy.context.view_layer.objects.active = obj
    mod = obj.modifiers.new(name='Cloth', type='CLOTH')
    cs  = mod.settings

    cs.quality               = CLOTH_QUALITY
    cs.mass                  = CLOTH_MASS
    cs.tension_stiffness     = CLOTH_STRUCT
    cs.compression_stiffness = CLOTH_STRUCT  # same as tension for woven fabric
    cs.shear_stiffness       = CLOTH_SHEAR
    cs.bending_stiffness     = CLOTH_BEND
    cs.tension_damping       = CLOTH_DAMP
    cs.compression_damping   = CLOTH_DAMP
    cs.shear_damping         = CLOTH_DAMP
    cs.bending_damping       = CLOTH_DAMP
    cs.air_damping           = CLOTH_AIR
    # Pinning: hold pin_left vertices at their bind-pose location each sub-step
    cs.vertex_group_mass     = "pin_left"
    cs.pin_stiffness         = 1.0   # 1.0 = fully pinned; 0 = no hold force

    mod.point_cache.frame_start = 1
    mod.point_cache.frame_end   = SIM_FRAMES


def _setup_camera_lighting() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = SIM_FRAMES

    cam_d = bpy.data.cameras.new("Cam")
    cam_o = bpy.data.objects.new("Camera", cam_d)
    _link(cam_o)
    cam_o.location = Vector((1.2, 4.5, MAST_HEIGHT / 2 + 0.4))
    target = Vector((1.2, 0.0, MAST_HEIGHT / 2 + 0.2))
    cam_o.rotation_euler = (target - cam_o.location).normalized().to_track_quat('-Z', 'Y').to_euler()
    scene.camera = cam_o

    key_d = bpy.data.lights.new("Key", type='AREA')
    key_d.energy = 600
    key_d.color  = (1.0, 0.92, 0.78)
    key_d.size   = 2.0
    key_o = bpy.data.objects.new("key_light", key_d)
    _link(key_o)
    key_o.location = Vector((-2.0, 3.0, MAST_HEIGHT))
    key_o.rotation_euler = (Vector((0, 0, 0)) - key_o.location).normalized().to_track_quat('-Z', 'Y').to_euler()

    scene.render.engine       = 'BLENDER_EEVEE_NEXT'
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.fps          = 24


# ── GLB export ────────────────────────────────────────────────────────────────
def export_glb(flag_obj: bpy.types.Object) -> None:
    """Snapshot wind-blown pose at EXPORT_FRAME via depsgraph — no bake needed."""
    bpy.context.scene.frame_set(EXPORT_FRAME)

    dg        = bpy.context.evaluated_depsgraph_get()
    flag_eval = flag_obj.evaluated_get(dg)
    # new_from_object captures the full modifier stack result as a plain Mesh
    mesh_s    = bpy.data.meshes.new_from_object(
        flag_eval, preserve_all_data_layers=True, depsgraph=dg
    )
    static    = bpy.data.objects.new("flag_static", mesh_s)
    bpy.context.scene.collection.objects.link(static)
    for mat in flag_obj.data.materials:
        mesh_s.materials.append(mat)
    for poly in mesh_s.polygons:
        poly.use_smooth = False

    flag_obj.hide_render = True  # export only the baked snapshot

    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(EXPORT_GLB),
        export_format='GLB',
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        use_selection=False,
    )

    flag_obj.hide_render = False
    bpy.data.objects.remove(static, do_unlink=True)
    bpy.data.meshes.remove(mesh_s)


# ── Entry point ───────────────────────────────────────────────────────────────
def build_scene() -> None:
    _cleanup()
    flag = _build_flag()
    _build_mast()
    _setup_wind()
    _setup_cloth(flag)
    _setup_camera_lighting()
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_PATH))
    export_glb(flag)
    print("✓ waving_flag.blend + waving_flag.glb written")


if __name__ == '__main__':
    build_scene()
