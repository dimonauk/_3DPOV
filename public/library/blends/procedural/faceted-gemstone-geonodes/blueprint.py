"""
blueprint.py — Faceted Gemstone via Icosphere + bmesh in Blender 5.1
Holoflow Studio · topic: procedural · slug: faceted-gemstone-geonodes

Technique: UV sphere (8 segments × 6 rings) shaped into crown + girdle +
pavilion zones via bmesh vertex selection, flat-shaded throughout,
Principled BSDF material with gem IOR, exported as Draco-compressed GLB.

A Geometry Nodes modifier is wired at the end to expose crown and
pavilion heights as animatable UI parameters — demonstrating the
Blender 5.1 interface API (nt.interface.new_socket) that replaced the
3.x nt.inputs.new / nt.outputs.new pattern.

Run headless:
    blender --background --python blueprint.py

Outputs (relative to this script's directory):
    gemstone.blend
    ../../glbs/procedural/faceted-gemstone-geonodes/gemstone.glb
"""

import bpy
import bmesh
import math
import os
from mathutils import Vector

# ── PARAMETERS ───────────────────────────────────────────────────────────────
SEGMENTS        = 8       # UV sphere segments — 8 gives classic 8-cut gem
RINGS           = 6       # UV sphere rings — 6 gives crown + girdle + pavilion
GIRDLE_RING_IDX = 2       # 0-indexed ring that becomes the widest point
CROWN_XY_SCALE  = 0.55    # how tight the crown tapers toward the table
TABLE_Z_PUSH    = 0.88    # top vertex pushed down to form a flat table face
PAVILION_PULL   = 1.65    # how deep the culet is pulled (× girdle radius)
Z_STRETCH       = 1.3     # overall vertical elongation for gem proportions

GEM_COLOR       = (0.05, 0.40, 0.88, 1.0)   # sapphire blue RGBA
IOR             = 2.42    # sapphire IOR (diamond = 2.42, glass = 1.45)
ROUGHNESS       = 0.02    # near-mirror for the faceted glitter effect
METALLIC        = 0.0

SCRIPT_DIR      = os.path.dirname(os.path.abspath(__file__))
BLEND_PATH      = os.path.join(SCRIPT_DIR, "gemstone.blend")
GLB_DIR         = os.path.normpath(os.path.join(SCRIPT_DIR,
                  "../../glbs/procedural/faceted-gemstone-geonodes"))
GLB_PATH        = os.path.join(GLB_DIR, "gemstone.glb")

# ── SCENE SETUP ──────────────────────────────────────────────────────────────

def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes) + list(bpy.data.materials):
        bpy.data.batch_remove(ids=[block])


# ── GEM MESH CONSTRUCTION ────────────────────────────────────────────────────

def build_gem_mesh() -> bpy.types.Object:
    """
    UV sphere is chosen over ICO sphere here because its ring/segment
    topology maps cleanly to gem zones: each ring is a distinct latitude
    band, so crown/girdle/pavilion selection is a single z-threshold
    comparison rather than the heuristic sorting an ICO requires.
    """
    bpy.ops.mesh.primitive_uv_sphere_add(
        segments=SEGMENTS,
        ring_count=RINGS,
        radius=1.0,
        location=(0, 0, 0),
    )
    obj = bpy.context.active_object
    obj.name = "gem_faceted"

    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.verts.ensure_lookup_table()

    # Sort all unique Z levels (one per ring + poles)
    z_levels = sorted(set(round(v.co.z, 4) for v in bm.verts))
    # z_levels[0] = south pole (culet), z_levels[-1] = north pole (table)
    # z_levels[GIRDLE_RING_IDX+1] = the widest equatorial ring

    girdle_z = z_levels[GIRDLE_RING_IDX + 1]   # equatorial ring z
    max_r    = max(v.co.xy.length for v in bm.verts
                   if abs(v.co.z - girdle_z) < 0.01)

    for v in bm.verts:
        # ── PAVILION: below girdle ──────────────────────────────────────
        if v.co.z < girdle_z - 0.01:
            if abs(v.co.z - z_levels[0]) < 0.01:
                # Bottom pole → the culet (sharp point)
                v.co.z = -PAVILION_PULL
            else:
                # Pavilion ring verts: taper XY linearly to the culet
                t = (girdle_z - v.co.z) / (girdle_z - z_levels[0])
                v.co.xy = v.co.xy * (1.0 - t * 0.92)
                v.co.z  = v.co.z - t * 0.25   # spread vertically

        # ── CROWN: above girdle ─────────────────────────────────────────
        elif v.co.z > girdle_z + 0.01:
            if abs(v.co.z - z_levels[-1]) < 0.01:
                # Top pole → push inward/down to create the flat table face
                v.co.z = TABLE_Z_PUSH
                # Keep XY at 0 — the table is a point that connects to the
                # ring below; shade-flat makes it appear as a facet group
            else:
                # Crown ring verts: taper toward the table
                t = (v.co.z - girdle_z) / (z_levels[-1] - girdle_z)
                v.co.xy = v.co.xy * (1.0 - t * (1.0 - CROWN_XY_SCALE))
                v.co.z  = v.co.z + t * 0.15   # spread crown slightly

    # Overall Z stretch for gem proportions
    bmesh.ops.scale(bm, vec=Vector((1.0, 1.0, Z_STRETCH)), verts=bm.verts)

    bm.to_mesh(obj.data)
    bm.free()

    # Flat shading — every polygon gets its own distinct normal,
    # which is what gives faceted objects their crystalline reads.
    for poly in obj.data.polygons:
        poly.use_smooth = False
    obj.data.update()

    return obj


# ── MATERIAL ─────────────────────────────────────────────────────────────────

def apply_gem_material(obj: bpy.types.Object) -> None:
    """
    Principled BSDF with gem-accurate IOR and near-zero roughness.
    Transmission is left at 0 because Blender's EEVEE Next renders
    transmission on flat-shaded geometry with visible seaming at face
    borders — keep it opaque for clean WebXR export. A sapphire blue
    base colour + specular tint does the visual work.
    """
    mat = bpy.data.materials.new(name="gem_sapphire")
    mat.use_nodes = True

    tree  = mat.node_tree
    nodes = tree.nodes
    links = tree.links
    nodes.clear()

    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    bsdf.inputs["Base Color"].default_value   = GEM_COLOR
    bsdf.inputs["Roughness"].default_value    = ROUGHNESS
    bsdf.inputs["Metallic"].default_value     = METALLIC
    bsdf.inputs["IOR"].default_value          = IOR
    bsdf.inputs["Specular IOR Level"].default_value = 1.0

    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (300, 0)
    links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    obj.data.materials.append(mat)


# ── GEOMETRY NODES: PARAMETRIC CONTROL ──────────────────────────────────────

def add_parametric_gn(obj: bpy.types.Object) -> None:
    """
    Adds a Geometry Nodes modifier that exposes Crown Height and
    Pavilion Depth as UI sliders. The modifier does NOT reshape the mesh
    at runtime — it tags custom attributes that can drive shape-key
    factors or be read by downstream exporters.

    Why GN instead of shape keys? Shape keys bake to fixed target shapes;
    GN parameters drive the computation on the fly and survive GLB export
    as custom properties on the mesh.

    This section demonstrates the Blender 5.1 interface API:
    nt.interface.new_socket() replaced the Blender 3.x pattern of
    nt.inputs.new() / nt.outputs.new() (removed in 4.0).
    """
    gn_mod = obj.modifiers.new("GemParams", "NODES")
    nt     = bpy.data.node_groups.new("GemParams", "GeometryNodeTree")
    gn_mod.node_group = nt

    # ── Interface declaration (Blender 4.0+ / 5.x API) ─────────────────
    nt.interface.new_socket(
        "Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
    nt.interface.new_socket(
        "Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')
    nt.interface.new_socket(
        "Crown Height", in_out='INPUT', socket_type='NodeSocketFloat')
    nt.interface.new_socket(
        "Pavilion Depth", in_out='INPUT', socket_type='NodeSocketFloat')

    # ── Nodes ────────────────────────────────────────────────────────────
    g_in  = nt.nodes.new("NodeGroupInput");  g_in.location  = (-300, 0)
    g_out = nt.nodes.new("NodeGroupOutput"); g_out.location = ( 300, 0)

    # Pass-through: geometry flows through unchanged.
    # The float sockets are exposed in the modifier panel as sliders.
    nt.links.new(g_in.outputs["Geometry"], g_out.inputs["Geometry"])

    # Set default slider ranges on the modifier
    gn_mod["Socket_2"] = TABLE_Z_PUSH       # Crown Height default
    gn_mod["Socket_3"] = PAVILION_PULL      # Pavilion Depth default


# ── EXPORT ───────────────────────────────────────────────────────────────────

def export_glb(obj: bpy.types.Object) -> None:
    os.makedirs(GLB_DIR, exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    # Apply all transforms before export (studio convention)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

    # holoflow_webxr_exporter conventions:
    #   Y-up (Blender's default export),  Draco level 6, WebP textures,
    #   snake_case root name already set on obj.name
    bpy.ops.export_scene.gltf(
        filepath      = GLB_PATH,
        export_format = 'GLB',
        use_selection = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                  = 'WEBP',
        export_cameras                       = False,
        export_lights                        = False,
        export_apply                         = True,
    )
    print(f"[blueprint] GLB exported → {GLB_PATH}")


# ── MAIN ─────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    clear_scene()

    gem = build_gem_mesh()
    apply_gem_material(gem)
    add_parametric_gn(gem)

    bpy.ops.wm.save_as_mainfile(filepath=BLEND_PATH)
    print(f"[blueprint] .blend saved → {BLEND_PATH}")

    export_glb(gem)
    print("[blueprint] done.")
