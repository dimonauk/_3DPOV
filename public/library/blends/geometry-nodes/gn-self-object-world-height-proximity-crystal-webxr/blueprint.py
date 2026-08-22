# ============================================================
# GN Self Object — World-Height Proximity Crystal
# Blender 5.1  |  CC0  |  Holoflow Studio
# ============================================================
# GeometryNodeSelfObject is the only reliable way to read the
# modifier object's own evaluated world matrix from inside a GN
# tree.  We extract Location.Z via ObjectInfo (ORIGINAL space),
# add the local Z of each face centre from the Position field,
# and remap the sum to a "world-height proximity" gradient that
# drives face scale + emission — a self-aware crystal that glows
# brightest near the world floor and fades as it rises.
#
# Usage: open Blender 5.1 → Scripting workspace → Run Script.
# After running: File → Export → glTF 2.0 to test GLB output,
# or call export_glb() at the bottom of main().
# ============================================================

import bpy, math, os

# ---------- tuneable constants ----------
CRYSTAL_NAME  = "CrystalProximity"
MATERIAL_NAME = "CrystalProximityMat"
GN_GROUP_NAME = "CrystalProximityGN"
SUBDIVISIONS  = 2          # icosphere subdivisions → 80 faces (faceted)
WORLD_FLOOR   = -0.5       # world Z where proximity_t = 1 (hot/glowing)
WORLD_CEIL    = 3.5        # world Z where proximity_t = 0 (cool/dim)
SCALE_HOT     = 1.6        # face scale factor at max proximity (near floor)
SCALE_COOL    = 0.35       # face scale factor at min proximity (high up)
COLOUR_HOT    = (0.05, 0.80, 1.00, 1.0)   # cyan — close to world floor
COLOUR_COOL   = (0.15, 0.05, 0.35, 1.0)   # deep violet — high up
EMISSION_STR  = 4.0        # emission strength — intentionally hot for WebXR


# ------------------------------------------------------------------
def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete()
    for col in list(bpy.data.collections):
        bpy.data.collections.remove(col)
    for grp in list(bpy.data.node_groups):
        bpy.data.node_groups.remove(grp)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)


# ------------------------------------------------------------------
def make_icosphere():
    bpy.ops.mesh.primitive_ico_sphere_add(
        subdivisions=SUBDIVISIONS,
        radius=1.0,
        location=(0.0, 0.0, 0.0),
    )
    obj = bpy.context.active_object
    obj.name = CRYSTAL_NAME
    return obj


# ------------------------------------------------------------------
def make_material():
    """
    Emission shader driven by the 'proximity_t' vertex attribute
    written by the GN tree.  ShaderNodeAttribute reads GN-stored
    named attributes from GEOMETRY scope (vertex/face domain).
    """
    mat = bpy.data.materials.new(MATERIAL_NAME)
    mat.use_nodes = True
    ns = mat.node_tree.nodes
    ls = mat.node_tree.links
    for n in list(ns):
        ns.remove(n)

    attr = ns.new('ShaderNodeAttribute')
    attr.attribute_name  = 'proximity_t'
    attr.attribute_type  = 'GEOMETRY'
    attr.location        = (-500, 0)

    ramp = ns.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[0].color    = COLOUR_COOL
    ramp.color_ramp.elements[1].position = 1.0
    ramp.color_ramp.elements[1].color    = COLOUR_HOT
    ramp.location = (-280, 0)

    emis = ns.new('ShaderNodeEmission')
    emis.inputs['Strength'].default_value = EMISSION_STR
    emis.location = (0, 0)

    out = ns.new('ShaderNodeOutputMaterial')
    out.location = (220, 0)

    ls.new(attr.outputs['Fac'],      ramp.inputs['Fac'])
    ls.new(ramp.outputs['Color'],    emis.inputs['Color'])
    ls.new(emis.outputs['Emission'], out.inputs['Surface'])
    return mat


# ------------------------------------------------------------------
def L(links, a, b):
    """One-letter link helper; keeps build_gn_tree() readable."""
    links.new(a, b)


# ------------------------------------------------------------------
def build_gn_tree(obj, mat):
    """
    Node graph — left to right:

    GeoIn ──────────────────────────────────────── StoreAttr → Shade → ScaleEl → SetMat → GeoOut
    SelfObject → ObjectInfo → SepXYZ (loc.Z) ──┐
    InputPosition → SepXYZ (pos.Z) ─────────────┴─ MathADD → MapRange(prox) ──┬→ StoreAttr.Value
                                                                                └→ MapRange(scale) → ScaleEl.Scale
    """
    ng = bpy.data.node_groups.new(GN_GROUP_NAME, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')

    nodes = ng.nodes
    links = ng.links

    def N(t, x=0, y=0):
        n = nodes.new(t)
        n.location = (x, y)
        return n

    gin  = N('NodeGroupInput',  -900,   0)
    gout = N('NodeGroupOutput', 1200,   0)

    # --- Self Object → Object Info → world Location ---
    # WHY ORIGINAL not RELATIVE: 'RELATIVE' would return Location=(0,0,0)
    # because the object is being evaluated relative to itself.
    # 'ORIGINAL' returns the world-space matrix at depsgraph eval time.
    self_nd = N('GeometryNodeSelfObject',  -700, 300)
    info    = N('GeometryNodeObjectInfo',  -500, 300)
    info.transform_space = 'ORIGINAL'
    L(links, self_nd.outputs[0], info.inputs['Object'])

    sep_loc = N('ShaderNodeSeparateXYZ', -280, 300)
    L(links, info.outputs['Location'], sep_loc.inputs['Vector'])

    # --- Position field → local Z per point ---
    pos     = N('GeometryNodeInputPosition', -700,  0)
    sep_pos = N('ShaderNodeSeparateXYZ',     -500,  0)
    L(links, pos.outputs[0], sep_pos.inputs['Vector'])

    # --- Approximate world Z per face centre ---
    # world_z ≈ local_pos.Z + obj.location.Z
    # Valid for objects with zero rotation.  A fully general solution
    # requires FunctionNodeTransformPoint(pos, matrix) — see README.
    add_z = N('ShaderNodeMath', -80, 150)
    add_z.operation = 'ADD'
    L(links, sep_pos.outputs['Z'], add_z.inputs[0])
    L(links, sep_loc.outputs['Z'], add_z.inputs[1])

    # --- Remap world Z → proximity_t [0,1] ---
    # Low Z (near floor) → proximity_t 1  (hot / glowing)
    # High Z (in the air) → proximity_t 0  (cool / dim)
    remap_p = N('ShaderNodeMapRange', 150, 150)
    remap_p.clamp = True
    remap_p.inputs['From Min'].default_value = WORLD_FLOOR
    remap_p.inputs['From Max'].default_value = WORLD_CEIL
    remap_p.inputs['To Min'].default_value   = 1.0
    remap_p.inputs['To Max'].default_value   = 0.0
    L(links, add_z.outputs[0], remap_p.inputs['Value'])

    # --- Store proximity_t as POINT-domain named attribute ---
    # ShaderNodeAttribute in material reads this as 'GEOMETRY' type.
    store = N('GeometryNodeStoreNamedAttribute', 400, 0)
    store.domain    = 'POINT'
    store.data_type = 'FLOAT'
    store.inputs['Name'].default_value = 'proximity_t'
    L(links, gin.outputs[0],              store.inputs['Geometry'])
    L(links, remap_p.outputs['Result'],   store.inputs['Value'])

    # --- Flat-shade: faceted aesthetic matches the studio's low-poly style ---
    shade = N('GeometryNodeSetShadeSmooth', 600, 0)
    shade.domain = 'FACE'
    shade.inputs['Shade Smooth'].default_value = False
    L(links, store.outputs['Geometry'], shade.inputs['Geometry'])

    # --- Remap proximity_t → face scale factor ---
    # hot (low) → SCALE_HOT (big faces open like petals)
    # cool (high) → SCALE_COOL (small faces retract)
    remap_s = N('ShaderNodeMapRange', 150, -200)
    remap_s.clamp = True
    remap_s.inputs['From Min'].default_value = 0.0
    remap_s.inputs['From Max'].default_value = 1.0
    remap_s.inputs['To Min'].default_value   = SCALE_COOL
    remap_s.inputs['To Max'].default_value   = SCALE_HOT
    L(links, remap_p.outputs['Result'], remap_s.inputs['Value'])

    # --- Scale each face about its own centroid (UNIFORM mode) ---
    # ScaleElements domain='FACE', scale_mode='UNIFORM' scales each
    # face independently about its centroid — exactly the per-petal
    # effect we want without translating the mesh.
    scale_el = N('GeometryNodeScaleElements', 800, 0)
    scale_el.domain     = 'FACE'
    scale_el.scale_mode = 'UNIFORM'
    L(links, shade.outputs['Geometry'],    scale_el.inputs['Geometry'])
    L(links, remap_s.outputs['Result'],    scale_el.inputs['Scale'])

    # --- Apply material and wire to output ---
    set_mat = N('GeometryNodeSetMaterial', 1000, 0)
    set_mat.inputs['Material'].default_value = mat
    L(links, scale_el.outputs['Geometry'], set_mat.inputs['Geometry'])
    L(links, set_mat.outputs['Geometry'],  gout.inputs[0])

    # --- Attach GN modifier to object ---
    mod = obj.modifiers.new('CrystalGN', 'NODES')
    mod.node_group = ng
    return ng


# ------------------------------------------------------------------
def setup_scene_lighting_camera():
    bpy.ops.object.light_add(type='SUN', location=(4, -4, 8))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(45), 0, math.radians(45))

    bpy.ops.object.camera_add(location=(4.5, -4.5, 3.0))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(64), 0, math.radians(45))
    bpy.context.scene.camera = cam


# ------------------------------------------------------------------
def setup_render():
    sc = bpy.context.scene
    sc.render.engine            = 'BLENDER_EEVEE_NEXT'
    sc.render.resolution_x      = 1920
    sc.render.resolution_y      = 1080
    sc.eevee.use_bloom          = True
    sc.eevee.bloom_threshold    = 0.8
    out_dir = ('//../../videos/geometry-nodes/'
               'gn-self-object-world-height-proximity-crystal-webxr/')
    sc.render.filepath = out_dir + 'viewport'


# ------------------------------------------------------------------
def export_glb():
    out = bpy.path.abspath(
        '//../../glbs/geometry-nodes/'
        'gn-self-object-world-height-proximity-crystal-webxr/'
        'crystal_proximity.glb'
    )
    bpy.ops.export_scene.gltf(
        filepath=out,
        export_format='GLB',
        export_apply=True,            # bake GN modifier before pack
        export_yup=True,              # Holoflow convention: +Y up
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format='WEBP',
        export_materials='EXPORT',
        export_attributes=True,       # preserves proximity_t attribute in GLB
    )
    print(f"GLB written: {out}")


# ------------------------------------------------------------------
def main():
    clear_scene()
    obj = make_icosphere()
    mat = make_material()
    build_gn_tree(obj, mat)
    setup_scene_lighting_camera()
    setup_render()
    print("Scene built.  Call export_glb() to write crystal_proximity.glb.")
    print("Run record.py for the viewport animation render.")


if __name__ == '__main__':
    main()
