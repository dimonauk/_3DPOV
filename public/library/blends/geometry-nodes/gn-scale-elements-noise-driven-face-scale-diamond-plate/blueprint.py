"""
GN Scale Elements — Noise-Driven Face-Scale Diamond Plate (Blender 5.1)

Scale Elements shrinks every face toward its own centroid by an independent
float field rather than a shared global value. The node disconnects shared
vertex ownership per-face, scales each face independently, then re-emits
the result as separate geometry per face — which is why sub-1.0 scale values
open real gaps rather than just averaging vertex positions to nothing.

Coupled with a Noise Texture field that varies spatially across the surface,
adjacent faces receive distinct (but correlated) scale values, producing the
"diamond plate" or "scale armour" read without any manual edge-loop work.

Pipeline:
  Position → NoiseTexture.Fac → MapRange(0→1 : SCALE_MIN→SCALE_MAX)
  → ScaleElements(domain=FACE).Scale → geometry out.

A named float attribute 'hs_panel_scale' (POINT domain) captures the
per-vertex noise value so the material can colour-map it and the GLB extras
carry it for runtime Three.js use (geometry.attributes.hs_panel_scale).

Licence: CC0 1.0 Universal — Holoflow Studio
Outside refs:
  Blender Manual Scale Elements CC-BY-SA-4.0 Blender Foundation
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/scale_elements.html
  njanakiev/blender-scripting MIT Nicolas Janakiev
    https://github.com/njanakiev/blender-scripting
"""

import bpy
import bmesh
import math
import os
from pathlib import Path

# ── Named constants ────────────────────────────────────────────────────────────
SLUG          = "gn-scale-elements-noise-driven-face-scale-diamond-plate"
OUTPUT_DIR    = Path(bpy.path.abspath("//")) / "output" / SLUG
GLB_NAME      = "diamond_plate.glb"
GN_TREE_NAME  = "HF_ScaleElements_DiamondPlate"
OBJ_NAME      = "diamond_plate"
MAT_NAME      = "HF_DiamondPlate"
ATTR_NAME     = "hs_panel_scale"   # written as FLOAT on POINT domain

GRID_SEGS     = 16    # 16×16 = 256 quads → ample for noise variation
NOISE_SCALE   = 3.5   # spatial frequency; higher = smaller pattern cells
NOISE_DETAIL  = 2.0   # fractional octave count — keep low for readable cells
NOISE_ROUGH   = 0.55  # amplitude decay per octave
SCALE_MIN     = 0.52  # tightest panel (deepest seam visible)
SCALE_MAX     = 0.97  # near-flush panel (barely any gap)
METALLIC      = 0.80
ROUGHNESS     = 0.22
DRACO_LEVEL   = 6
WEBP_QUALITY  = 85


# ── Geometry Nodes tree ────────────────────────────────────────────────────────

def _build_gn_tree() -> bpy.types.NodeTree:
    """
    Build the Scale Elements diamond-plate node tree programmatically.
    Exposes 'Scale Min' as a group input so the record.py animation can
    keyframe it without touching the tree internals.
    """
    # Remove stale tree from previous runs
    if GN_TREE_NAME in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[GN_TREE_NAME])

    tree = bpy.data.node_groups.new(GN_TREE_NAME, 'GeometryNodeTree')

    # ── Interface sockets (Blender 4.0+ API: tree.interface, not tree.inputs) ──
    tree.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
    tree.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
    sk_scmin = tree.interface.new_socket("Scale Min", in_out='INPUT', socket_type='NodeSocketFloat')
    sk_scmin.default_value  = SCALE_MIN
    sk_scmin.min_value      = 0.05
    sk_scmin.max_value      = 1.0
    sk_noise = tree.interface.new_socket("Noise Scale", in_out='INPUT', socket_type='NodeSocketFloat')
    sk_noise.default_value  = NOISE_SCALE
    sk_noise.min_value      = 0.1
    sk_noise.max_value      = 20.0

    nodes = tree.nodes
    links = tree.links

    def n(typ, x, y):
        nd = nodes.new(typ)
        nd.location = (x, y)
        return nd

    gi  = n('NodeGroupInput',                  -800, 0)
    go  = n('NodeGroupOutput',                  800, 0)
    pos = n('GeometryNodeInputPosition',       -800, -180)
    noi = n('ShaderNodeTexNoise',              -480, -180)
    mr  = n('ShaderNodeMapRange',              -200, -180)
    se  = n('GeometryNodeScaleElements',         80, 0)
    sna = n('GeometryNodeStoreNamedAttribute',   440, 0)

    # Noise Texture — 3D, using object-space position as Vector
    noi.noise_dimensions = '3D'
    noi.inputs['Detail'].default_value    = NOISE_DETAIL
    noi.inputs['Roughness'].default_value = NOISE_ROUGH
    noi.inputs['Distortion'].default_value = 0.0

    # Map Range: remap 0→1 noise output to SCALE_MIN→SCALE_MAX panel scale
    # 'To Min' is wired from the exposed group socket so animation works.
    mr.inputs['From Min'].default_value = 0.0
    mr.inputs['From Max'].default_value = 1.0
    mr.inputs['To Max'].default_value   = SCALE_MAX

    # Scale Elements — FACE domain disconnects+scales each face independently
    se.domain = 'FACE'

    # Store Named Attribute — writes per-vertex noise value for shader/export
    sna.data_type = 'FLOAT'
    sna.domain    = 'POINT'
    sna.inputs['Name'].default_value = ATTR_NAME

    # ── Wire ──────────────────────────────────────────────────────────────────
    links.new(gi.outputs['Geometry'],    se.inputs['Geometry'])
    links.new(pos.outputs['Position'],   noi.inputs['Vector'])
    links.new(gi.outputs['Noise Scale'], noi.inputs['Scale'])
    links.new(noi.outputs['Fac'],        mr.inputs['Value'])
    links.new(gi.outputs['Scale Min'],   mr.inputs['To Min'])
    links.new(mr.outputs['Result'],      se.inputs['Scale'])
    links.new(mr.outputs['Result'],      sna.inputs['Value'])
    links.new(se.outputs['Geometry'],    sna.inputs['Geometry'])
    links.new(sna.outputs['Geometry'],   go.inputs['Geometry'])

    return tree


# ── Mesh ───────────────────────────────────────────────────────────────────────

def _build_grid() -> bpy.types.Object:
    bm = bmesh.new()
    # create_grid: GRID_SEGS×GRID_SEGS faces in XY plane, ±size on each axis
    bmesh.ops.create_grid(bm, x_segments=GRID_SEGS, y_segments=GRID_SEGS, size=1.0)
    mesh = bpy.data.meshes.new(OBJ_NAME + "_mesh")
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(OBJ_NAME, mesh)
    bpy.context.scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    return obj


# ── Material ───────────────────────────────────────────────────────────────────

def _build_material() -> bpy.types.Material:
    """
    Reads 'hs_panel_scale' via ShaderNodeAttribute to colour-map panel depth.
    Dark edges (low scale) read as charcoal; raised panel faces as pale steel.
    """
    mat = bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt  = mat.node_tree

    bsdf = nt.nodes["Principled BSDF"]
    bsdf.inputs['Roughness'].default_value = ROUGHNESS
    bsdf.inputs['Metallic'].default_value  = METALLIC

    attr = nt.nodes.new('ShaderNodeAttribute')
    attr.attribute_name = ATTR_NAME
    attr.attribute_type = 'GEOMETRY'
    attr.location = (-600, 200)

    cr = nt.nodes.new('ShaderNodeValToRGB')
    cr.location = (-300, 200)
    cr.color_ramp.elements[0].position = 0.0
    cr.color_ramp.elements[0].color    = (0.04, 0.04, 0.045, 1.0)   # seam: near-black
    cr.color_ramp.elements[1].position = 1.0
    cr.color_ramp.elements[1].color    = (0.42, 0.44, 0.47, 1.0)   # panel: pale steel

    nt.links.new(attr.outputs['Fac'],   cr.inputs['Fac'])
    nt.links.new(cr.outputs['Color'],   bsdf.inputs['Base Color'])

    return mat


# ── Export ─────────────────────────────────────────────────────────────────────

def _export_glb(obj: bpy.types.Object):
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    glb_path = str(OUTPUT_DIR / GLB_NAME)
    bpy.ops.export_scene.gltf(
        filepath             = glb_path,
        export_format        = 'GLB',
        use_selection        = True,
        export_apply         = True,   # realises GN modifier at export frame
        export_colors        = True,   # includes hs_panel_scale as vertex attribute
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = DRACO_LEVEL,
        export_image_format  = 'WEBP',
        export_jpeg_quality  = WEBP_QUALITY,
    )
    print(f"[blueprint] GLB → {glb_path}")


# ── Main ───────────────────────────────────────────────────────────────────────

def run():
    bpy.ops.wm.read_factory_settings(use_empty=True)

    # Lighting — HDRI-style sun for clear facet reads
    bpy.ops.object.light_add(type='SUN', location=(3, -3, 5))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.data.angle  = math.radians(3)

    # Camera at 45° isometric-ish angle
    bpy.ops.object.camera_add(location=(2.8, -2.8, 2.5))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(55), 0, math.radians(45))
    bpy.context.scene.camera = cam

    # Grid mesh
    grid = _build_grid()

    # GN modifier
    tree = _build_gn_tree()
    mod  = grid.modifiers.new("diamond_plate_gn", 'NODES')
    mod.node_group = tree

    # Material
    mat = _build_material()
    grid.data.materials.append(mat)

    # Select only the grid for export
    bpy.ops.object.select_all(action='DESELECT')
    grid.select_set(True)

    _export_glb(grid)

    # Save .blend alongside the GLB
    blend_path = str(OUTPUT_DIR / "diamond_plate.blend")
    bpy.ops.wm.save_as_mainfile(filepath=blend_path, check_existing=False)
    print(f"[blueprint] .blend → {blend_path}")
    print("[blueprint] Done. hs_panel_scale attribute exported as GLB extra.")


if __name__ == "__main__":
    run()
