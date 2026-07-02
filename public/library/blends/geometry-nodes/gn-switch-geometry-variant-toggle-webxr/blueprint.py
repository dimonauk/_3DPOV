"""
GN Switch (Geometry) — Pristine / Damaged Wall Panel Variant Toggle (Blender 5.1)
Holoflow Studio | CC0

TECHNIQUE: GeometryNodeSwitch with input_type='GEOMETRY' selects between two
complete geometry branches based on a single boolean socket. Unlike field-aware
nodes, Switch evaluates BOTH branches on every depsgraph update regardless of
the boolean value — a critical performance consideration for real-time WebXR.

Expert pattern: heavy variant branches go in nested GN node groups so Blender's
group-level result cache limits redundant evaluation when the state is stable.
"""

import bpy, bmesh, math
from mathutils import Vector
from pathlib import Path

# ── Parameters exposed on the modifier ──────────────────────────────────────
PANEL_W       = 2.0    # metres
PANEL_H       = 2.6    # metres
PANEL_D       = 0.08   # depth metres
GROOVE_STEP   = 0.3    # distance between horizontal maintenance grooves
GROOVE_DEPTH  = 0.005  # extrude depth for clean grooves
DAMAGE_SCALE  = 0.045  # maximum vertex displacement on damaged branch
MAT_CLEAN     = "panel_clean_steel"
MAT_DAMAGED   = "panel_rust_cracked"
OBJ_NAME      = "wall_panel_switch"
GN_NAME       = "HS_SwitchVariantToggle"


def purge(name, col):
    if name in col:
        col.remove(col[name])


def make_pbr(name, rgb, rough, metal=0.0):
    purge(name, bpy.data.materials)
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
    bsdf.inputs["Roughness"].default_value  = rough
    bsdf.inputs["Metallic"].default_value   = metal
    return mat


def build_base_mesh():
    """Flat subdivided panel — both variant branches start from this."""
    purge(OBJ_NAME, bpy.data.objects)
    purge(OBJ_NAME, bpy.data.meshes)
    me = bpy.data.meshes.new(OBJ_NAME)
    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(ob)

    bm = bmesh.new()
    # 10 × 13 face grid gives ~one face per 20 cm — fine enough for
    # per-face displacement and coarse enough for real-time WebXR poly budgets.
    bmesh.ops.create_grid(bm, x_segments=10, y_segments=13, size=1.0)
    bmesh.ops.scale(bm, vec=Vector((PANEL_W / 2, PANEL_H / 2, 1.0)), verts=bm.verts)
    res = bmesh.ops.extrude_face_region(bm, geom=bm.faces[:])
    ext_v = [e for e in res["geom"] if isinstance(e, bmesh.types.BMVert)]
    bmesh.ops.translate(bm, vec=Vector((0.0, 0.0, PANEL_D)), verts=ext_v)
    bm.to_mesh(me)
    bm.free()

    ob.data.materials.append(make_pbr(MAT_CLEAN,   (0.48, 0.52, 0.55), 0.60, 0.10))
    ob.data.materials.append(make_pbr(MAT_DAMAGED, (0.30, 0.17, 0.10), 0.88, 0.00))
    return ob


def lk(ng, fn, fs, tn, ts):
    ng.links.new(fn.outputs[fs], tn.inputs[ts])


def build_clean_subgroup(nodes_ref):
    """
    Pristine branch: horizontal groove lines via Extrude Mesh.
    Wrapped in a node group so the GN evaluator can cache its result
    when the Switch socket holds False — avoids redundant re-eval of
    the damaged branch when the user is inspecting the clean version.
    WHY: Blender 5.1 evaluates both Switch branches unconditionally on
    every depsgraph update.  Nested node groups have an internal result
    cache keyed on input values; if the group's geometry and parameters
    are stable, the cached output is reused.
    """
    name = "HS_CleanBranch"
    purge(name, bpy.data.node_groups)
    ng = bpy.data.node_groups.new(name, "GeometryNodeTree")
    ni = ng.interface
    ni.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    ni.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    sg = ni.new_socket("Groove Step",  in_out="INPUT", socket_type="NodeSocketFloat")
    sd = ni.new_socket("Groove Depth", in_out="INPUT", socket_type="NodeSocketFloat")
    sg.default_value = GROOVE_STEP
    sd.default_value = GROOVE_DEPTH

    def N(t, x, y):
        n = ng.nodes.new(t); n.location = (x, y); return n

    g_in  = N("NodeGroupInput",  -800, 0)
    g_out = N("NodeGroupOutput",  800, 0)

    # Select horizontal edges via edge normal: edges whose normal Y-component
    # is close to 1.0 are the horizontal cuts in a vertical-wall grid.
    n_normal = N("GeometryNodeInputNormal",   -600, 200)
    n_sep_n  = N("ShaderNodeSeparateXYZ",     -400, 200)
    n_cmp    = N("FunctionNodeCompare",       -200, 200)
    n_cmp.data_type = "FLOAT"
    n_cmp.operation = "GREATER_THAN"
    n_cmp.inputs["B"].default_value = 0.85  # near-horizontal edge threshold

    # Extrude selected horizontal edges to create groove lines
    n_ext = N("GeometryNodeExtrudeMesh",  100, 0)
    n_ext.mode = "EDGES"

    n_smi = N("GeometryNodeSetMaterialIndex", 400, 0)
    n_smi.inputs["Material Index"].default_value = 0

    lk(ng, n_normal, "Normal",    n_sep_n, "Vector")
    lk(ng, n_sep_n,  "Y",         n_cmp,   "A")
    lk(ng, g_in,     "Geometry",  n_ext,   "Mesh")
    lk(ng, n_cmp,    "Result",    n_ext,   "Selection")
    lk(ng, g_in,     "Groove Depth", n_ext, "Offset Scale")
    lk(ng, n_ext,    "Mesh",      n_smi,   "Geometry")
    lk(ng, n_smi,    "Geometry",  g_out,   "Geometry")
    return ng


def build_damaged_subgroup():
    """
    Damaged branch: per-vertex noise displacement + dark material.
    WHY per-vertex not per-face: displacement must move individual verts
    to produce jagged surface breaks; per-face SetPosition would translate
    whole faces as rigid units, producing blocky steps not organic damage.
    """
    name = "HS_DamagedBranch"
    purge(name, bpy.data.node_groups)
    ng = bpy.data.node_groups.new(name, "GeometryNodeTree")
    ni = ng.interface
    ni.new_socket("Geometry",    in_out="OUTPUT", socket_type="NodeSocketGeometry")
    ni.new_socket("Geometry",    in_out="INPUT",  socket_type="NodeSocketGeometry")
    ss = ni.new_socket("Damage Scale", in_out="INPUT", socket_type="NodeSocketFloat")
    ss.default_value = DAMAGE_SCALE

    def N(t, x, y):
        n = ng.nodes.new(t); n.location = (x, y); return n

    g_in  = N("NodeGroupInput",  -900, 0)
    g_out = N("NodeGroupOutput",  800, 0)

    n_pos   = N("GeometryNodeInputPosition",  -700, 300)
    n_noise = N("ShaderNodeTexNoise",         -500, 300)
    n_noise.noise_dimensions = "3D"
    n_noise.inputs["Scale"].default_value     = 4.5
    n_noise.inputs["Detail"].default_value    = 10.0
    n_noise.inputs["Roughness"].default_value = 0.72

    n_nor  = N("GeometryNodeInputNormal",  -500, 550)
    n_scl  = N("ShaderNodeVectorMath",     -250, 400)
    n_scl.operation = "SCALE"
    n_scl2 = N("ShaderNodeVectorMath",      50, 400)
    n_scl2.operation = "SCALE"

    n_spos = N("GeometryNodeSetPosition",  350, 0)
    n_smi  = N("GeometryNodeSetMaterialIndex", 650, 0)
    n_smi.inputs["Material Index"].default_value = 1

    lk(ng, n_pos,   "Position",     n_noise, "Vector")
    lk(ng, n_noise, "Fac",          n_scl,   "Scale")
    lk(ng, n_nor,   "Normal",       n_scl,   "Vector")
    lk(ng, n_scl,   "Vector",       n_scl2,  "Vector")
    lk(ng, g_in,    "Damage Scale", n_scl2,  "Scale")
    lk(ng, g_in,    "Geometry",     n_spos,  "Geometry")
    lk(ng, n_scl2,  "Vector",       n_spos,  "Offset")
    lk(ng, n_spos,  "Geometry",     n_smi,   "Geometry")
    lk(ng, n_smi,   "Geometry",     g_out,   "Geometry")
    return ng


def build_main_tree(clean_ng, damaged_ng):
    purge(GN_NAME, bpy.data.node_groups)
    ng = bpy.data.node_groups.new(GN_NAME, "GeometryNodeTree")
    ni = ng.interface
    ni.new_socket("Geometry",    in_out="OUTPUT", socket_type="NodeSocketGeometry")
    ni.new_socket("Geometry",    in_out="INPUT",  socket_type="NodeSocketGeometry")
    sw = ni.new_socket("Damaged", in_out="INPUT", socket_type="NodeSocketBool")
    sw.default_value = False

    def N(t, x, y):
        n = ng.nodes.new(t); n.location = (x, y); return n

    g_in  = N("NodeGroupInput",  -800, 0)
    g_out = N("NodeGroupOutput",  900, 0)

    # Pristine variant via node group
    n_clean = N("GeometryNodeGroup", -400, 200)
    n_clean.node_tree = clean_ng

    # Damaged variant via node group
    n_dmg = N("GeometryNodeGroup", -400, -200)
    n_dmg.node_tree = damaged_ng

    # Switch — selects GEOMETRY based on boolean input_type.
    # WHY input_type must be set before linking: Blender infers socket types
    # from input_type; setting it after wiring causes the existing links to
    # be silently dropped as the socket types are recreated.
    n_sw = N("GeometryNodeSwitch", 200, 0)
    n_sw.input_type = "GEOMETRY"

    lk(ng, g_in,    "Geometry",  n_clean, "Geometry")
    lk(ng, g_in,    "Geometry",  n_dmg,   "Geometry")
    lk(ng, n_clean, "Geometry",  n_sw,    "False")
    lk(ng, n_dmg,   "Geometry",  n_sw,    "True")
    lk(ng, g_in,    "Damaged",   n_sw,    "Switch")
    lk(ng, n_sw,    "Output",    g_out,   "Geometry")
    return ng


def export_glb(ob):
    HERE = Path(bpy.data.filepath).parent if bpy.data.filepath else Path(".")
    bpy.ops.export_scene.gltf(
        filepath                             = str(HERE / "wall_panel_switch.glb"),
        export_format                        = "GLB",
        export_apply                         = True,
        export_draco_mesh_compression_enable = True,
        export_draco_mesh_compression_level  = 6,
        export_image_format                  = "WEBP",
    )
    print("[holoflow] wall_panel_switch.glb exported.")


def main():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    ob      = build_base_mesh()
    clean   = build_clean_subgroup(ob.modifiers)
    damaged = build_damaged_subgroup()
    tree    = build_main_tree(clean, damaged)

    mod = ob.modifiers.new("HS_SwitchToggle", "NODES")
    mod.node_group = tree

    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    print(f"[holoflow] {OBJ_NAME} ready. Toggle 'Damaged' in modifier panel.")


if __name__ == "__main__":
    main()
