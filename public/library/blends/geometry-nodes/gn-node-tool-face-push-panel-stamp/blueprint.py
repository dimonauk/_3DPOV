"""
GN Node Tools — Custom Mesh-Edit Toolbar Tool: Face-Push Panel Stamp
Blender 5.1 · CC0 · Holoflow Studio

Technique:
  Node Tools (introduced 4.2, fully supported 5.1) promote a Geometry
  Node tree to a first-class mesh-editing tool. When ng.is_tool = True
  the tree gains:
  - A live Selection socket bound to the edit-mode face / edge / vertex
    selection mask — no vertex-group boilerplate required.
  - Input sockets exposed in the tool header N-panel as interactive
    property fields the artist adjusts before clicking Apply.
  - Single-shot bake semantics: the tree runs once per invocation and
    immediately writes the result back to the mesh BMesh, unlike a
    modifier that re-evaluates every frame.

  This blueprint builds a 'Face Push Panel Stamp' tool that:
  1. Reads per-face Normal vectors.
  2. Scales each normal by Amount × (1 + Randomness × centered_random)
     to create an optionally varied push magnitude per face.
  3. Passes the vector as SetPosition.Offset, translating selected
     faces outward along their individual normals.
  4. Stores 'holoflow:facet' = 1.0 on the moved faces so the Holoflow
     WebXR exporter marks them as faceted panels.

  A modifier-mode clone (is_tool=False) is built in parallel so the
  demo .blend can preview the result without entering Edit Mode.

Key distinction from GN modifier approach:
  modifier — re-evaluates the tree every depsgraph update; the
    Selection socket cannot capture live edit-mode selection; acts on
    the full mesh regardless of selection unless driven by a vertex-
    group attribute.
  tool — invoked once, bakes to BMesh, respects any edit-mode
    selection domain (FACE here), and appears in the toolbar.

Outside sources:
  Blender Manual — Node Tools
    https://docs.blender.org/manual/en/5.1/modeling/meshes/editing/
      mesh/tools/node_tool.html
    CC-BY-SA 4.0 · Blender Foundation
  njanakiev/blender-scripting
    https://github.com/njanakiev/blender-scripting
    MIT · Nicolas Janakiev (GN node-tree construction patterns)
  KhronosGroup/glTF-Blender-IO
    https://github.com/KhronosGroup/glTF-Blender-IO
    Apache-2.0 · Khronos Group (export_attributes for named attrs)
"""

import bpy
import bmesh

# ── Parameters ────────────────────────────────────────────────────────────────
OBJ_NAME       = "FacePush_Demo"
NG_MODIFIER    = "GN_FacePush_Modifier"
NG_TOOL        = "GN_FacePush_Tool"
MA_BASE        = "FP_PanelBase"
AMOUNT_DEFAULT = 0.06     # metres of outward push
RANDOM_DEFAULT = 0.0
GRID_DIVS      = 4        # 4×4 subdivisions → 16 quad panels
BLEND_OUT      = "//face_push_panel_stamp.blend"
GLB_OUT        = "//face_push_panel_stamp.glb"


# ── Helpers ───────────────────────────────────────────────────────────────────
def _lk(ng, src_out, dst_inp):
    ng.links.new(src_out, dst_inp)


def _nd(ng, idname, loc=(0, 0), **props):
    n = ng.nodes.new(idname)
    n.location = loc
    for k, v in props.items():
        setattr(n, k, v)
    return n


# ── Node tree builder ─────────────────────────────────────────────────────────
def build_face_push_tree(name, is_tool=False):
    """
    Build the face-push GN tree.
    is_tool=True  → ng.is_tool=True; Selection socket maps to edit-mode.
    is_tool=False → explicit Geometry i/o for modifier preview.
    """
    if name in bpy.data.node_groups:
        bpy.data.node_groups.remove(bpy.data.node_groups[name])

    ng = bpy.data.node_groups.new(name, "GeometryNodeTree")
    ng.is_tool = is_tool

    # ── Interface sockets (Blender 4.0+ interface API) ────────────────────
    # In tool mode the framework injects Geometry automatically; modifier
    # mode needs an explicit Geometry input socket.
    if not is_tool:
        ng.interface.new_socket(
            "Geometry", in_out="INPUT", socket_type="NodeSocketGeometry"
        )

    sel = ng.interface.new_socket(
        "Selection", in_out="INPUT", socket_type="NodeSocketBool"
    )
    sel.attribute_domain = "FACE"
    sel.default_value = True

    amt = ng.interface.new_socket(
        "Amount", in_out="INPUT", socket_type="NodeSocketFloat"
    )
    amt.default_value = AMOUNT_DEFAULT
    amt.min_value = -0.5
    amt.max_value = 0.5
    amt.subtype = "DISTANCE"

    rnd = ng.interface.new_socket(
        "Randomness", in_out="INPUT", socket_type="NodeSocketFloat"
    )
    rnd.default_value = RANDOM_DEFAULT
    rnd.min_value = 0.0
    rnd.max_value = 1.0

    ng.interface.new_socket(
        "Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry"
    )

    # ── Nodes ─────────────────────────────────────────────────────────────
    n_in   = _nd(ng, "NodeGroupInput",            loc=(-900, 0))
    n_out  = _nd(ng, "NodeGroupOutput",           loc=(700, 0))
    n_nrm  = _nd(ng, "GeometryNodeInputNormal",   loc=(-600, -160))
    n_idx  = _nd(ng, "GeometryNodeInputIndex",    loc=(-700, -280))

    # Per-face random value centred on 0 (-0.5 … +0.5)
    n_rnd  = _nd(ng, "FunctionNodeRandomValue",   loc=(-500, -260))
    n_rnd.data_type = "FLOAT"
    n_rnd.inputs["Min"].default_value = -0.5
    n_rnd.inputs["Max"].default_value =  0.5

    # (centred_random × Randomness) + 1.0 → multiplier ∈ [1-R/2, 1+R/2]
    n_m1   = _nd(ng, "ShaderNodeMath", loc=(-260, -200), operation="MULTIPLY")
    n_add  = _nd(ng, "ShaderNodeMath", loc=( -80, -200), operation="ADD")
    n_add.inputs[0].default_value = 1.0   # constant 1.0 on socket A
    n_mamt = _nd(ng, "ShaderNodeMath", loc=(  80, -200), operation="MULTIPLY")

    # Scale Normal vector by the final per-face amount
    n_scl  = _nd(ng, "ShaderNodeVectorMath", loc=(260, -40), operation="SCALE")

    # Move selected faces outward along their normals
    n_pos  = _nd(ng, "GeometryNodeSetPosition", loc=(450, 40))

    # Flag moved faces for the Holoflow WebXR exporter
    n_attr = _nd(ng, "GeometryNodeStoreNamedAttribute", loc=(590, -80))
    n_attr.domain    = "FACE"
    n_attr.data_type = "FLOAT"
    n_attr.inputs["Name"].default_value  = "holoflow:facet"
    n_attr.inputs["Value"].default_value = 1.0

    # ── Links ─────────────────────────────────────────────────────────────
    _lk(ng, n_idx.outputs["Index"],      n_rnd.inputs["ID"])
    _lk(ng, n_rnd.outputs["Value"],      n_m1.inputs[0])
    _lk(ng, n_in.outputs["Randomness"],  n_m1.inputs[1])
    _lk(ng, n_m1.outputs["Value"],       n_add.inputs[1])
    _lk(ng, n_in.outputs["Amount"],      n_mamt.inputs[0])
    _lk(ng, n_add.outputs["Value"],      n_mamt.inputs[1])
    _lk(ng, n_nrm.outputs["Normal"],     n_scl.inputs["Vector"])
    _lk(ng, n_mamt.outputs["Value"],     n_scl.inputs["Scale"])

    geom_out = n_in.outputs[0]   # Geometry (first output of GroupInput)
    _lk(ng, geom_out,                    n_pos.inputs["Geometry"])
    _lk(ng, n_in.outputs["Selection"],   n_pos.inputs["Selection"])
    _lk(ng, n_scl.outputs["Vector"],     n_pos.inputs["Offset"])
    _lk(ng, n_pos.outputs["Geometry"],   n_attr.inputs["Geometry"])
    _lk(ng, n_in.outputs["Selection"],   n_attr.inputs["Selection"])
    _lk(ng, n_attr.outputs["Geometry"],  n_out.inputs["Geometry"])

    return ng


# ── Scene helpers ─────────────────────────────────────────────────────────────
def _create_material():
    if MA_BASE in bpy.data.materials:
        bpy.data.materials.remove(bpy.data.materials[MA_BASE])
    mat = bpy.data.materials.new(MA_BASE)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = (0.08, 0.10, 0.14, 1.0)
    bsdf.inputs["Metallic"].default_value   = 0.85
    bsdf.inputs["Roughness"].default_value  = 0.25
    return mat


def _make_checkerboard_selection(ob):
    """Select alternating faces so half the panels stamp outward."""
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bm.faces.ensure_lookup_table()
    for i, f in enumerate(bm.faces):
        f.select = (i % 2 == 0)
    bm.to_mesh(ob.data)
    bm.free()


# ── Main ──────────────────────────────────────────────────────────────────────
def _main():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()

    # Build both tree variants
    ng_tool = build_face_push_tree(NG_TOOL,     is_tool=True)   # toolbar tool
    ng_mod  = build_face_push_tree(NG_MODIFIER, is_tool=False)  # demo preview

    mat = _create_material()

    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_DIVS, y_subdivisions=GRID_DIVS, size=2.0
    )
    ob = bpy.context.active_object
    ob.name = OBJ_NAME
    ob.data.materials.append(mat)
    _make_checkerboard_selection(ob)

    # Apply modifier tree for the demo preview (all-faces, 30 % randomness)
    mod = ob.modifiers.new("FacePush", "NODES")
    mod.node_group = ng_mod
    for item in ng_mod.interface.items_tree:
        if item.name == "Amount":
            mod[item.identifier] = AMOUNT_DEFAULT
        elif item.name == "Randomness":
            mod[item.identifier] = 0.30

    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(
        filepath=bpy.path.abspath(GLB_OUT),
        export_format="GLB",
        export_apply=True,
        export_attributes=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
    )
    print(f"[FacePush] tool={NG_TOOL} mod={NG_MODIFIER}")
    print(f"[FacePush] blend → {BLEND_OUT}  glb → {GLB_OUT}")


_main()
