"""
Blender 5.1  —  Data Transfer Modifier: Custom Split Normals, High-Poly → Low-Poly
Slug    : modifier-data-transfer-smooth-normals
Topic   : modifiers
Licence : CC0 — no rights reserved

Technique ─────────────────────────────────────────────────────────────────────
  The Data Transfer modifier copies per-loop (face-corner) normals from the
  EVALUATED surface of a source object onto the destination mesh's custom split
  normal attribute.  The destination keeps its original flat-polygon geometry —
  crisp silhouette edges, low polygon count — while the interior shading follows
  the smooth source surface.

  This is a non-destructive, UV-free alternative to normal-map baking for meshes
  where the low-poly silhouette already reads correctly.  No UV unwrap is needed:
  normals are stored as a per-corner float3 attribute, not a texture.

  Pipeline:
    1. Build an 8-sided bicone gem (destination, flat-shaded, 16 faces).
    2. Build a smooth UV sphere at the same origin (source, 32×16 segments).
    3. Add Data Transfer to the gem: loop channel, CUSTOM_NORMAL, POLYINTERP_LNORPROJ.
    4. Smooth-shade the gem polygons so Blender respects the transferred normals.
    5. Export GLB with export_apply=True — normals bake into per-corner vertex data.

Outside sources ────────────────────────────────────────────────────────────────
  Blender Manual — Data Transfer Modifier (CC-BY-SA 4.0, Blender Foundation)
  https://docs.blender.org/manual/en/latest/modeling/modifiers/modify/data_transfer.html

  Blender Python API — DataTransferModifier (CC-BY-SA 4.0, Blender Docs Team)
  https://docs.blender.org/api/5.1/bpy.types.DataTransferModifier.html
"""

import bpy
import bmesh
import math
import pathlib
from mathutils import Vector

# ── parameters ──────────────────────────────────────────────────────────────────
N_SIDES        = 8       # polygonal cross-section (8 = octagonal diamond outline)
GEM_RADIUS     = 0.22    # equatorial radius in metres
GEM_CROWN_H    = 0.10    # apex height above equator (crown)
GEM_PAVILION_H = 0.18    # apex depth below equator (culet)
SPHERE_SEGS    = 32      # source UV sphere horizontal segments
SPHERE_RINGS   = 16      # source UV sphere vertical rings
SPHERE_RADIUS  = GEM_RADIUS * 0.95  # slightly smaller so all gem verts lie outside it
OUTPUT_BLEND   = pathlib.Path("//data_transfer_gem.blend")
OUTPUT_GLB     = pathlib.Path("//data_transfer_gem.glb")


# ── 1. clean scene ──────────────────────────────────────────────────────────────
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.scene.unit_settings.system = 'METRIC'
bpy.context.scene.unit_settings.scale_length = 1.0


# ── 2. build low-poly gem (destination) ─────────────────────────────────────────
def build_gem() -> bpy.types.Object:
    """
    Bicone: N equatorial vertices → top apex (crown) + bottom apex (culet).
    N top triangles + N bottom triangles = 2N faces.
    Deliberately flat-shaded on creation — all normals from face geometry.
    """
    mesh = bpy.data.meshes.new("gem_lowpoly")
    bm   = bmesh.new()

    # equatorial ring — offset angle so a flat face points toward -Y (camera)
    angle_offset = math.pi / N_SIDES
    eq = []
    for i in range(N_SIDES):
        a = 2 * math.pi * i / N_SIDES + angle_offset
        eq.append(bm.verts.new((GEM_RADIUS * math.cos(a),
                                GEM_RADIUS * math.sin(a),
                                0.0)))

    crown = bm.verts.new((0.0, 0.0,  GEM_CROWN_H))
    culet = bm.verts.new((0.0, 0.0, -GEM_PAVILION_H))

    # crown: CCW from outside (looking down at the crown)
    for i in range(N_SIDES):
        bm.faces.new([eq[i], eq[(i + 1) % N_SIDES], crown])

    # pavilion: CCW from outside (looking up at the pavilion)
    for i in range(N_SIDES):
        bm.faces.new([eq[(i + 1) % N_SIDES], eq[i], culet])

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()

    # faces remain flat-shaded (use_smooth = False by default)
    mesh.update()

    obj = bpy.data.objects.new("gem_lowpoly", mesh)
    bpy.context.collection.objects.link(obj)
    return obj


# ── 3. build smooth UV sphere (source) ─────────────────────────────────────────
def build_sphere() -> bpy.types.Object:
    """
    UV sphere built with bmesh so no UI context is required.
    Smooth-shaded so its EVALUATED normals point radially outward at every ring.
    Those evaluated normals are what Data Transfer reads.
    """
    mesh = bpy.data.meshes.new("sphere_highpoly")
    bm   = bmesh.new()

    R, S, RG = SPHERE_RADIUS, SPHERE_SEGS, SPHERE_RINGS
    verts: list[bmesh.types.BMVert] = []

    # top pole
    verts.append(bm.verts.new((0.0, 0.0, R)))

    # latitude rings: r = 1 … RG-1
    for r in range(1, RG):
        phi = math.pi * r / RG
        rz  = R * math.cos(phi)
        rr  = R * math.sin(phi)
        for s in range(S):
            theta = 2 * math.pi * s / S
            verts.append(bm.verts.new((rr * math.cos(theta),
                                       rr * math.sin(theta),
                                       rz)))
    # bottom pole
    verts.append(bm.verts.new((0.0, 0.0, -R)))

    bm.verts.ensure_lookup_table()

    # top cap triangles
    for s in range(S):
        bm.faces.new([bm.verts[0],
                      bm.verts[1 + s],
                      bm.verts[1 + (s + 1) % S]])

    # middle quad rings
    for r in range(RG - 2):
        for s in range(S):
            a = 1 + r * S + s
            b = 1 + r * S + (s + 1) % S
            c = 1 + (r + 1) * S + (s + 1) % S
            d = 1 + (r + 1) * S + s
            bm.faces.new([bm.verts[a], bm.verts[b],
                          bm.verts[c], bm.verts[d]])

    # bottom cap triangles
    bot = len(verts) - 1
    last = 1 + (RG - 2) * S
    for s in range(S):
        bm.faces.new([bm.verts[last + (s + 1) % S],
                      bm.verts[last + s],
                      bm.verts[bot]])

    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()

    # smooth shading: Data Transfer reads these evaluated face-corner normals
    for face in mesh.polygons:
        face.use_smooth = True
    mesh.update()

    obj = bpy.data.objects.new("sphere_highpoly", mesh)
    bpy.context.collection.objects.link(obj)
    return obj


# ── 4. Data Transfer modifier ───────────────────────────────────────────────────
def add_data_transfer(dst: bpy.types.Object,
                      src: bpy.types.Object) -> bpy.types.DataTransferModifier:
    mod = dst.modifiers.new("DataTransfer", "DATA_TRANSFER")
    mod.object = src

    # channel: face-corner custom normals
    mod.use_loop_data      = True
    mod.data_types_loops   = {'CUSTOM_NORMAL'}

    # POLYINTERP_LNORPROJ: project each gem face-corner normal (flat, pointing outward)
    # toward the sphere surface, find the hit polygon, then weight-interpolate that
    # polygon's four loop normals by barycentric distance.
    # Result: each gem corner gets a normal that smoothly interpolates across the sphere.
    # NEAREST_POLYNOR (alternative) snaps to the nearest polygon's single normal —
    # fast but still faceted because one source polygon covers a band of gem corners.
    mod.loop_mapping = 'POLYINTERP_LNORPROJ'

    mod.mix_mode       = 'REPLACE'
    mod.mix_factor     = 1.0
    mod.use_max_distance = False  # no distance cutoff — gem sits inside sphere

    return mod


# ── 5. smooth-shade destination so transferred normals apply ────────────────────
def enable_smooth_shading(obj: bpy.types.Object) -> None:
    """
    Custom split normals are respected only when face.use_smooth is True.
    Flat-shaded faces have Blender override per-loop normals with the face normal.
    Setting smooth here does NOT change geometry — edges are still hard in silhouette
    because the polygons are physically flat, not because of a shading flag.
    """
    for face in obj.data.polygons:
        face.use_smooth = True
    obj.data.update()


# ── 6. gem material ─────────────────────────────────────────────────────────────
def add_gem_material(obj: bpy.types.Object) -> None:
    mat = bpy.data.materials.new("GemCrystal")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out  = nt.nodes.new('ShaderNodeOutputMaterial')
    bsdf = nt.nodes.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Base Color'].default_value            = (0.08, 0.55, 0.92, 1.0)
    bsdf.inputs['Roughness'].default_value             = 0.04
    bsdf.inputs['IOR'].default_value                   = 1.77
    bsdf.inputs['Transmission Weight'].default_value   = 0.95

    nt.links.new(bsdf.outputs['BSDF'], out.inputs['Surface'])
    out.location  = (300, 0)
    bsdf.location = (0, 0)

    obj.data.materials.append(mat)


# ── 7. scene, camera, export ────────────────────────────────────────────────────
def setup_and_export(gem: bpy.types.Object,
                     sphere: bpy.types.Object) -> None:
    scene = bpy.context.scene
    scene.render.engine = 'CYCLES'

    # sphere is a reference helper — invisible in viewport and render
    sphere.hide_viewport = True
    sphere.hide_render   = True

    world = bpy.data.worlds.new("World")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs['Color'].default_value    = (0.5, 0.5, 0.5, 1.0)
        bg.inputs['Strength'].default_value = 2.5
    scene.world = world

    bpy.ops.object.light_add(type='AREA', location=(1.0, -1.0, 1.2))
    key          = bpy.context.active_object
    key.data.energy = 150
    key.data.size   = 0.6

    bpy.ops.object.camera_add(location=(0.0, -0.65, 0.06))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(82), 0.0, 0.0)
    scene.camera = cam

    bpy.ops.wm.save_as_mainfile(filepath=str(OUTPUT_BLEND.resolve()))

    # export_apply=True applies the Data Transfer modifier at export time:
    # the GLB carries explicit per-corner normals derived from the sphere,
    # even though the .blend source retains the non-destructive modifier stack.
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT_GLB.resolve()),
        export_format='GLB',
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_yup=True,
        use_selection=False,
        export_cameras=False,
        export_lights=False,
    )
    print("✓  data_transfer_gem.blend + data_transfer_gem.glb written")


# ── main ────────────────────────────────────────────────────────────────────────
gem    = build_gem()
sphere = build_sphere()
add_data_transfer(gem, sphere)
enable_smooth_shading(gem)
add_gem_material(gem)
setup_and_export(gem, sphere)
