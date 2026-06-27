"""
GN Sort Elements — Sequential Face Reveal
Blender 5.1 · CC0 · Holoflow Studio

Technique: Sort Elements (GeometryNodeSortElements) reindexes all elements of
a domain by a float sort weight so that downstream InputIndex reads the rank
rather than the original mesh index. This makes index-dependent animations
(delay, stagger, sequential activation) ORDER-AWARE — you choose what ordering
principle drives the sequence without modifying the underlying mesh.

Here, an icosphere's 80 triangular faces are sorted by centroid Z (ascending)
so bottom faces receive index 0 and top faces receive index 79. A per-face
delay timer uses `face_rank × DELAY_FRAMES` to stagger activation. As
SceneTime.Frame increases, faces peel outward along their normals in strict
bottom-to-top order, producing a 'shell unfurl' reveal animation.

Key distinction from related patterns:
  - AccumulateField.Sort Index: local reorder affecting only that node's
    prefix sum. Sort Elements is GLOBAL — it changes ALL downstream indices.
  - InstanceOnPoints pick order: controlled by Sort Index per element.
    Sort Elements removes the need to pipe sort-aware index into every node.
  - Repeat Zone iterative approach: re-evaluates body N times per frame;
    Sort Elements is O(1) per modifier evaluation regardless of face count.

Outside sources:
  Blender Manual — Sort Elements Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/geometry/sort_elements.html
    CC-BY-SA 4.0 · Blender Documentation Team
  njanakiev/blender-scripting
    https://github.com/njanakiev/blender-scripting
    MIT · Nicolas Janakiev (bpy GN node-tree construction patterns)
  KhronosGroup/glTF-Blender-IO
    https://github.com/KhronosGroup/glTF-Blender-IO
    Apache-2.0 · Khronos Group (export_colors, export_attributes for FLOAT_COLOR)
"""

import bpy
import bmesh
import os

# ── Parameters ────────────────────────────────────────────────────────────────
ICO_SUBDIVISIONS    = 2       # 80 triangular faces
ICO_RADIUS          = 1.5     # sphere radius in metres
DELAY_FRAMES        = 1.5     # frames between adjacent face activations (float)
RAMP_FRAMES         = 8.0     # frames for each face to go from 0 to full extrusion
EXTRUDE_HEIGHT      = 0.55    # maximum outward extrusion per face in metres
EXPORT_FRAME        = 70      # GLB snapshot at partial-reveal state (~58 % of faces active)
OBJ_NAME            = "SR_Sphere"
NG_NAME             = "GN_SortElements_SequentialReveal"
MA_NAME             = "SR_FaceReveal"
BLEND_OUT           = "//sequential_face_reveal.blend"
GLB_OUT             = "//sequential_face_reveal.glb"


def _lk(ng: bpy.types.NodeTree, out, inp) -> None:
    ng.links.new(out, inp)


def _cleanup() -> None:
    for ob in list(bpy.data.objects):
        if ob.name.startswith("SR_"):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.name.startswith("SR_"):
            bpy.data.meshes.remove(me)
    for ng in list(bpy.data.node_groups):
        if ng.name.startswith("GN_SortElements"):
            bpy.data.node_groups.remove(ng)
    for ma in list(bpy.data.materials):
        if ma.name.startswith("SR_"):
            bpy.data.materials.remove(ma)


def _build_sphere() -> bpy.types.Object:
    """Icosphere via bmesh.ops — no operator context required."""
    me = bpy.data.meshes.new(OBJ_NAME)
    bm = bmesh.new()
    # bmesh.ops.create_icosphere: subdivisions controls recursion depth.
    # depth=1 → 20 tris, depth=2 → 80 tris, depth=3 → 320 tris.
    bmesh.ops.create_icosphere(bm, subdivisions=ICO_SUBDIVISIONS, radius=ICO_RADIUS)
    bm.to_mesh(me)
    bm.free()
    me.update()
    ob = bpy.data.objects.new(OBJ_NAME, me)
    bpy.context.collection.objects.link(ob)
    bpy.context.view_layer.objects.active = ob
    return ob


def _make_material() -> bpy.types.Material:
    """Emission reading 'face_color' FLOAT_COLOR attribute."""
    ma = bpy.data.materials.new(MA_NAME)
    ma.use_nodes = True
    nt = ma.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial"); out.location  = (300, 0)
    emit = nt.nodes.new("ShaderNodeEmission");       emit.location = (100, 0)
    vc   = nt.nodes.new("ShaderNodeVertexColor");    vc.location   = (-150, 0)
    vc.layer_name = "face_color"
    nt.links.new(vc.outputs["Color"],      emit.inputs["Color"])
    nt.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return ma


def _build_gn_tree(ob: bpy.types.Object, ma: bpy.types.Material) -> None:
    """
    Node graph:
      Sort Elements (FACE by centroid Z) → face rank 0..79
      face_rank × DELAY_FRAMES → delay
      SceneTime.Frame - delay → t_raw
      t_raw / RAMP_FRAMES → t (clamped 0..1)
      t → StoreNamedAttribute('face_t', FLOAT, FACE)
      t → ColorRamp → StoreNamedAttribute('face_color', FLOAT_COLOR, FACE)
      NamedAttribute('face_t') on POINT × InputNormal × EXTRUDE_HEIGHT
        → SetPosition offset
    """
    ng    = bpy.data.node_groups.new(NG_NAME, 'GeometryNodeTree')
    nodes = ng.nodes

    gi = nodes.new("NodeGroupInput");  gi.location  = (-1000, 0)
    go = nodes.new("NodeGroupOutput"); go.location  = (1800, 0)

    # ── Sort faces by centroid Z (ascending: bottom = index 0) ────────────────
    # WHY Sort Elements not AccumulateField.Sort Index: AccumulateField's Sort Index
    # reorders within one node's prefix sum; Sort Elements rewrites the DOMAIN
    # element order globally — every downstream InputIndex, FieldAtIndex, and
    # per-element enumeration sees the sorted order, not the original mesh order.
    sort = nodes.new("GeometryNodeSortElements"); sort.location = (-700, 0)
    sort.domain = 'FACE'
    # Sort Weight field: centroid Z of each face (InputPosition evaluated in FACE
    # context = face centroid = average of face vertex positions).
    inp_pos = nodes.new("GeometryNodeInputPosition"); inp_pos.location = (-950, -250)
    sep_xyz = nodes.new("ShaderNodeSeparateXYZ");     sep_xyz.location = (-750, -250)

    _lk(ng, gi.outputs[0],             sort.inputs["Geometry"])
    _lk(ng, inp_pos.outputs["Position"], sep_xyz.inputs["Vector"])
    _lk(ng, sep_xyz.outputs["Z"],       sort.inputs["Sort Weight"])

    # ── Face rank: InputIndex on FACE domain post-sort = sort rank 0..79 ──────
    inp_idx = nodes.new("GeometryNodeInputIndex"); inp_idx.location = (-400, -200)

    # delay = face_rank × DELAY_FRAMES (float)
    m_delay = nodes.new("ShaderNodeMath"); m_delay.location = (-200, -200)
    m_delay.operation = 'MULTIPLY'
    m_delay.inputs[1].default_value = DELAY_FRAMES
    _lk(ng, inp_idx.outputs[0], m_delay.inputs[0])

    # ── SceneTime.Frame as float ───────────────────────────────────────────────
    # SceneTime.Frame is INT; ShaderNodeMath implicitly converts INT to FLOAT.
    ftime = nodes.new("GeometryNodeInputSceneTime"); ftime.location = (-200, -50)

    # t_raw = Frame - delay
    m_sub = nodes.new("ShaderNodeMath"); m_sub.location = (0, -150)
    m_sub.operation = 'SUBTRACT'
    _lk(ng, ftime.outputs["Frame"],    m_sub.inputs[0])
    _lk(ng, m_delay.outputs["Value"],  m_sub.inputs[1])

    # t = t_raw / RAMP_FRAMES
    m_div = nodes.new("ShaderNodeMath"); m_div.location = (200, -150)
    m_div.operation = 'DIVIDE'
    m_div.inputs[1].default_value = RAMP_FRAMES
    _lk(ng, m_sub.outputs["Value"], m_div.inputs[0])

    # Clamp t to [0, 1]
    m_max = nodes.new("ShaderNodeMath"); m_max.location = (400, -150)
    m_max.operation = 'MAXIMUM'; m_max.inputs[1].default_value = 0.0
    m_min = nodes.new("ShaderNodeMath"); m_min.location = (550, -150)
    m_min.operation = 'MINIMUM'; m_min.inputs[1].default_value = 1.0
    _lk(ng, m_div.outputs["Value"],  m_max.inputs[0])
    _lk(ng, m_max.outputs["Value"],  m_min.inputs[0])

    # ── Store face_t (FLOAT, FACE domain) ─────────────────────────────────────
    # WHY store before using: face_t is a FACE-domain field; SetPosition operates
    # on POINT domain. StoreNamedAttribute materialises face_t so that
    # NamedAttribute('face_t') in POINT context returns the per-vertex average
    # of adjacent face_t values — a topology-aware smooth interpolation.
    store_ft = nodes.new("GeometryNodeStoreNamedAttribute"); store_ft.location = (-300, 0)
    store_ft.data_type = 'FLOAT'; store_ft.domain = 'FACE'
    store_ft.inputs["Name"].default_value = "face_t"
    _lk(ng, sort.outputs["Geometry"],    store_ft.inputs["Geometry"])
    _lk(ng, m_min.outputs["Value"],      store_ft.inputs["Value"])

    # ── ColorRamp: inactive=dark-blue, mid=cyan, active=white ─────────────────
    cramp = nodes.new("ShaderNodeValToRGB"); cramp.location = (550, -350)
    cr    = cramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = (0.02, 0.08, 0.30, 1.0)
    cr.elements[1].position = 1.0; cr.elements[1].color = (0.95, 1.00, 1.00, 1.0)
    mid = cr.elements.new(0.5);    mid.color            = (0.00, 0.65, 0.85, 1.0)
    _lk(ng, m_min.outputs["Value"], cramp.inputs[0])

    # ── Store face_color (FLOAT_COLOR, FACE domain) ───────────────────────────
    store_fc = nodes.new("GeometryNodeStoreNamedAttribute"); store_fc.location = (100, 0)
    store_fc.data_type = 'FLOAT_COLOR'; store_fc.domain = 'FACE'
    store_fc.inputs["Name"].default_value = "face_color"
    _lk(ng, store_ft.outputs["Geometry"], store_fc.inputs["Geometry"])
    _lk(ng, cramp.outputs["Color"],       store_fc.inputs["Value"])

    # ── Read face_t on POINT domain for SetPosition ───────────────────────────
    # NamedAttribute('face_t') in POINT context = per-vertex average of adjacent
    # FACE-domain face_t values. This avoids sharp per-face stepping on the
    # extruded surface — each vertex smoothly interpolates between its surrounding
    # faces' activation levels.
    na_ft = nodes.new("GeometryNodeInputNamedAttribute"); na_ft.location = (600, -150)
    na_ft.data_type = 'FLOAT'
    na_ft.inputs["Name"].default_value = "face_t"

    # Offset magnitude: face_t × EXTRUDE_HEIGHT
    m_ht = nodes.new("ShaderNodeMath"); m_ht.location = (750, -150)
    m_ht.operation = 'MULTIPLY'; m_ht.inputs[1].default_value = EXTRUDE_HEIGHT
    _lk(ng, na_ft.outputs["Attribute"], m_ht.inputs[0])

    # Scale InputNormal by offset magnitude → displacement vector
    inp_norm = nodes.new("GeometryNodeInputNormal"); inp_norm.location = (600, -300)
    v_scale  = nodes.new("ShaderNodeVectorMath");    v_scale.location  = (900, -200)
    v_scale.operation = 'SCALE'
    _lk(ng, inp_norm.outputs["Normal"], v_scale.inputs["Vector"])
    _lk(ng, m_ht.outputs["Value"],      v_scale.inputs["Scale"])

    # ── SetPosition with normal-aligned extrusion ─────────────────────────────
    setpos = nodes.new("GeometryNodeSetPosition"); setpos.location = (1150, 0)
    _lk(ng, store_fc.outputs["Geometry"], setpos.inputs["Geometry"])
    _lk(ng, v_scale.outputs["Vector"],    setpos.inputs["Offset"])

    # ── SetMaterial + output ───────────────────────────────────────────────────
    setmat = nodes.new("GeometryNodeSetMaterial"); setmat.location = (1400, 0)
    setmat.inputs["Material"].default_value = ma
    _lk(ng, setpos.outputs["Geometry"],  setmat.inputs["Geometry"])
    _lk(ng, setmat.outputs["Geometry"],  go.inputs[0])

    mod = ob.modifiers.new("GN_SequentialReveal", 'NODES')
    mod.node_group = ng


def _export_glb(ob: bpy.types.Object) -> None:
    bpy.context.scene.frame_set(EXPORT_FRAME)
    bpy.context.view_layer.update()
    path = bpy.path.abspath(GLB_OUT)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action='DESELECT')
    ob.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_colors=True,
        export_attributes=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
    )


def main() -> None:
    _cleanup()
    bpy.context.scene.render.engine = 'BLENDER_EEVEE_NEXT'
    bpy.context.scene.frame_start = 1
    bpy.context.scene.frame_end   = 130
    ob = _build_sphere()
    ma = _make_material()
    ob.data.materials.append(ma)
    _build_gn_tree(ob, ma)
    bpy.ops.wm.save_as_mainfile(filepath=bpy.path.abspath(BLEND_OUT))
    _export_glb(ob)
    print(f"[sort_elements] done — {BLEND_OUT}, {GLB_OUT}")


main()
