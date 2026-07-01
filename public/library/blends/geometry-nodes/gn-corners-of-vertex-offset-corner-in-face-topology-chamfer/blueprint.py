"""
GN Corners of Vertex + Offset Corner in Face — Three-Zone Panel Trim (Blender 5.1)
Topology navigation nodes classify mesh faces from vertex connectivity alone —
no UV, no world-position test, no Bevel node.

CornersOfVertex.Total  → vertex valence (2=grid-corner, 3=grid-edge, 4=interior)
Average valence per face (POINT→FACE via EvaluateOnDomain) → zone index 0/1/2
OffsetCornerInFace(delta=1) → directed edge tangent per corner → stored per face
Three materials + ScaleElements + ExtrudeMesh produce physically distinct trim rings.

External references
  njanakiev/blender-scripting  MIT  Nicolas Janakiev
    https://github.com/njanakiev/blender-scripting
  BrendanParmer/NodeToPython   MIT  Brendan Parmer
    https://github.com/BrendanParmer/NodeToPython
"""

import bpy, os

# ── constants ─────────────────────────────────────────────────────────────────
GRID_X       = 6        # columns
GRID_Y       = 4        # rows
GRID_SIZE    = 3.0      # world-space XY span (metres)
TRIM_SCALE   = 0.78     # isotropic face scale for edge-trim zone
CORNER_SCALE = 0.55     # tighter scale for corner-trim zone
TRIM_DEPTH   = -0.015   # extrusion Z for edge trim (negative = recessed)
CORNER_DEPTH = -0.028   # deeper recess for corner trim
OBJ_NAME     = "topology_trim_panel"
NG_NAME      = "PanelTrimTopologyWalk"


def purge():
    for ob in list(bpy.data.objects):
        if ob.name == OBJ_NAME:
            bpy.data.objects.remove(ob, do_unlink=True)
    for ng in list(bpy.data.node_groups):
        if ng.name == NG_NAME:
            bpy.data.node_groups.remove(ng)
    for mat in list(bpy.data.materials):
        if mat.name.startswith("hs_panel_"):
            bpy.data.materials.remove(mat)


def _emit_mat(name, rgba):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    t = m.node_tree
    t.nodes.clear()
    e = t.nodes.new('ShaderNodeEmission')
    e.inputs['Color'].default_value = rgba
    o = t.nodes.new('ShaderNodeOutputMaterial')
    t.links.new(e.outputs['Emission'], o.inputs['Surface'])
    return m


def make_materials():
    return [
        _emit_mat("hs_panel_centre", (0.06, 0.38, 0.72, 1.0)),
        _emit_mat("hs_panel_edge",   (0.04, 0.16, 0.28, 1.0)),
        _emit_mat("hs_panel_corner", (0.82, 0.34, 0.04, 1.0)),
    ]


def make_grid(mats):
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_X - 1,
        y_subdivisions=GRID_Y - 1,
        size=GRID_SIZE,
        location=(0, 0, 0),
    )
    ob = bpy.context.active_object
    ob.name = OBJ_NAME
    for m in mats:
        ob.data.materials.append(m)
    return ob


def build_gn_tree():
    ng = bpy.data.node_groups.new(NG_NAME, 'GeometryNodeTree')
    ng.interface.new_socket('Geometry', in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket('Geometry', in_out='OUTPUT', socket_type='NodeSocketGeometry')
    n  = ng.nodes
    lk = ng.links

    gin  = n.new('NodeGroupInput');  gin.location  = (-1600, 0)
    gout = n.new('NodeGroupOutput'); gout.location  = (1800, 0)

    # ── STEP 1: bake per-vertex valence ──────────────────────────────────────
    # CornersOfVertex.Total = how many face-corners (= faces) touch each vertex.
    # Leaving 'Vertex Index' unconnected → node defaults to InputIndex in POINT
    # domain, giving one Total per vertex when StoreNamedAttribute uses domain=POINT.
    # WHY store before reading: materialising the attribute lets EvaluateOnDomain
    # correctly interpolate POINT→FACE without domain-context confusion.
    cov = n.new('GeometryNodeCornersOfVertex'); cov.location = (-1400, 300)

    sav = n.new('GeometryNodeStoreNamedAttribute'); sav.location = (-1200, 0)
    sav.domain    = 'POINT'
    sav.data_type = 'INT'
    sav.inputs['Name'].default_value = 'vtx_valence'
    lk.new(gin.outputs['Geometry'],  sav.inputs['Geometry'])
    lk.new(cov.outputs['Total'],     sav.inputs['Value'])

    # ── STEP 2: bake per-corner edge tangent via OffsetCornerInFace ──────────
    # iidx evaluates to current CORNER index when StoreNamedAttribute is in
    # CORNER domain — every node downstream of iidx evaluates per-corner.
    iidx = n.new('GeometryNodeInputIndex'); iidx.location = (-1400, -100)

    # OffsetCornerInFace(corner_idx, delta=1) → next corner CCW around the face.
    # WHY delta=+1: Blender stores corners in CCW order in object space; +1 steps
    # forward in the winding, defining a directed edge (current_vtx → next_vtx).
    ocif = n.new('GeometryNodeOffsetCornerInFace'); ocif.location = (-1200, -200)
    ocif.inputs['Delta'].default_value = 1
    lk.new(iidx.outputs['Index'], ocif.inputs['Corner Index'])

    # Vertex indices for current and offset corners
    voc_c = n.new('GeometryNodeVertexOfCorner'); voc_c.location = (-1000, -100)
    voc_n = n.new('GeometryNodeVertexOfCorner'); voc_n.location = (-1000, -280)
    lk.new(iidx.outputs['Index'],          voc_c.inputs['Corner Index'])
    lk.new(ocif.outputs['Corner Index'],   voc_n.inputs['Corner Index'])

    # FieldAtIndex(POINT, FLOAT_VECTOR): read Position at a specific vertex.
    # WHY FieldAtIndex: Position is a POINT-domain field; we need it at a
    # particular vertex index (given by VertexOfCorner), not the current element.
    pos_n = n.new('GeometryNodeInputPosition'); pos_n.location = (-1200, -420)
    fai_c = n.new('GeometryNodeFieldAtIndex'); fai_c.location = (-780, -100)
    fai_nx = n.new('GeometryNodeFieldAtIndex'); fai_nx.location = (-780, -280)
    for fi, vc in ((fai_c, voc_c), (fai_nx, voc_n)):
        fi.domain    = 'POINT'
        fi.data_type = 'FLOAT_VECTOR'
        lk.new(pos_n.outputs['Position'],  fi.inputs['Value'])
        lk.new(vc.outputs['Vertex Index'], fi.inputs['Index'])

    # Directed edge vector and unit tangent
    vsub = n.new('ShaderNodeVectorMath'); vsub.location = (-560, -190)
    vsub.operation = 'SUBTRACT'
    lk.new(fai_nx.outputs['Value'], vsub.inputs[0])
    lk.new(fai_c.outputs['Value'],  vsub.inputs[1])
    vnrm = n.new('ShaderNodeVectorMath'); vnrm.location = (-350, -190)
    vnrm.operation = 'NORMALIZE'
    lk.new(vsub.outputs['Vector'], vnrm.inputs[0])

    # Store per-corner unit tangents; domain=CORNER forces iidx = corner index
    sac = n.new('GeometryNodeStoreNamedAttribute'); sac.location = (-950, 0)
    sac.domain    = 'CORNER'
    sac.data_type = 'FLOAT_VECTOR'
    sac.inputs['Name'].default_value = 'corner_tangent'
    lk.new(sav.outputs['Geometry'], sac.inputs['Geometry'])
    lk.new(vnrm.outputs['Vector'],  sac.inputs['Value'])

    # ── STEP 3: materialise per-face average tangent ──────────────────────────
    na_e = n.new('GeometryNodeNamedAttribute'); na_e.location = (-150, -250)
    na_e.data_type = 'FLOAT_VECTOR'
    na_e.inputs['Name'].default_value = 'corner_tangent'

    eod_t = n.new('GeometryNodeEvaluateOnDomain'); eod_t.location = (80, -250)
    eod_t.domain    = 'FACE'
    eod_t.data_type = 'FLOAT_VECTOR'
    lk.new(na_e.outputs['Attribute'], eod_t.inputs['Value'])

    sat = n.new('GeometryNodeStoreNamedAttribute'); sat.location = (-700, 0)
    sat.domain    = 'FACE'
    sat.data_type = 'FLOAT_VECTOR'
    sat.inputs['Name'].default_value = 'edge_tangent'
    lk.new(sac.outputs['Geometry'],  sat.inputs['Geometry'])
    lk.new(eod_t.outputs['Value'],   sat.inputs['Value'])

    # ── STEP 4: zone classification from average valence ─────────────────────
    # Read stored per-vertex valence and average over each face's vertices.
    # avg = 4.0 (interior), 3.5 (edge face), 3.0 (corner face).
    na_v = n.new('GeometryNodeNamedAttribute'); na_v.location = (-150, 300)
    na_v.data_type = 'INT'
    na_v.inputs['Name'].default_value = 'vtx_valence'

    eod_z = n.new('GeometryNodeEvaluateOnDomain'); eod_z.location = (80, 300)
    eod_z.domain    = 'FACE'
    eod_z.data_type = 'FLOAT'
    lk.new(na_v.outputs['Attribute'], eod_z.inputs['Value'])

    # MapRange [4.0→3.0] → [0→2]; clamp prevents out-of-range zones on
    # non-uniform grids. WHY invert: higher avg valence = more interior = zone 0.
    mran = n.new('ShaderNodeMapRange'); mran.location = (300, 300)
    mran.data_type = 'FLOAT'; mran.clamp = True
    mran.inputs[1].default_value = 4.0
    mran.inputs[2].default_value = 3.0
    mran.inputs[3].default_value = 0.0
    mran.inputs[4].default_value = 2.0
    lk.new(eod_z.outputs['Value'], mran.inputs[0])

    mrd = n.new('ShaderNodeMath'); mrd.location = (500, 300)
    mrd.operation = 'ROUND'
    lk.new(mran.outputs['Result'], mrd.inputs[0])

    # ── STEP 5: selections — edge zone [0.75, 1.25], corner zone ≥ 1.75 ──────
    ce1 = n.new('FunctionNodeCompare'); ce1.location = (300, 100)
    ce1.data_type = 'FLOAT'; ce1.operation = 'GREATER_EQUAL'
    ce1.inputs['B'].default_value = 0.75
    lk.new(mran.outputs['Result'], ce1.inputs['A'])
    ce2 = n.new('FunctionNodeCompare'); ce2.location = (300, 0)
    ce2.data_type = 'FLOAT'; ce2.operation = 'LESS_EQUAL'
    ce2.inputs['B'].default_value = 1.25
    lk.new(mran.outputs['Result'], ce2.inputs['A'])
    sel_e = n.new('FunctionNodeBooleanMath'); sel_e.location = (500, 50)
    sel_e.operation = 'AND'
    lk.new(ce1.outputs['Result'], sel_e.inputs[0])
    lk.new(ce2.outputs['Result'], sel_e.inputs[1])

    sel_c = n.new('FunctionNodeCompare'); sel_c.location = (300, -100)
    sel_c.data_type = 'FLOAT'; sel_c.operation = 'GREATER_EQUAL'
    sel_c.inputs['B'].default_value = 1.75
    lk.new(mran.outputs['Result'], sel_c.inputs['A'])

    # ── STEP 6: geometry operations ──────────────────────────────────────────
    smi = n.new('GeometryNodeSetMaterialIndex'); smi.location = (700, 0)
    lk.new(sat.outputs['Geometry'], smi.inputs['Geometry'])
    lk.new(mrd.outputs['Value'],    smi.inputs['Material Index'])

    scl_e = n.new('GeometryNodeScaleElements'); scl_e.location = (950, 0)
    scl_e.domain = 'FACE'
    scl_e.inputs['Scale'].default_value = TRIM_SCALE
    lk.new(smi.outputs['Geometry'],   scl_e.inputs['Geometry'])
    lk.new(sel_e.outputs['Boolean'],  scl_e.inputs['Selection'])

    scl_c = n.new('GeometryNodeScaleElements'); scl_c.location = (1200, 0)
    scl_c.domain = 'FACE'
    scl_c.inputs['Scale'].default_value = CORNER_SCALE
    lk.new(scl_e.outputs['Geometry'],  scl_c.inputs['Geometry'])
    lk.new(sel_c.outputs['Result'],    scl_c.inputs['Selection'])

    # Individual Faces = True: each face extrudes from its own plane, preventing
    # shared edges between adjacent trim faces from yanking each other's borders.
    ext_e = n.new('GeometryNodeExtrudeMesh'); ext_e.location = (1430, 0)
    ext_e.mode = 'FACES'
    ext_e.inputs['Individual Faces'].default_value = True
    ext_e.inputs['Offset Scale'].default_value     = TRIM_DEPTH
    lk.new(scl_c.outputs['Geometry'],  ext_e.inputs['Mesh'])
    lk.new(sel_e.outputs['Boolean'],   ext_e.inputs['Selection'])

    ext_c = n.new('GeometryNodeExtrudeMesh'); ext_c.location = (1620, 0)
    ext_c.mode = 'FACES'
    ext_c.inputs['Individual Faces'].default_value = True
    ext_c.inputs['Offset Scale'].default_value     = CORNER_DEPTH
    lk.new(ext_e.outputs['Mesh'],     ext_c.inputs['Mesh'])
    lk.new(sel_c.outputs['Result'],   ext_c.inputs['Selection'])

    lk.new(ext_c.outputs['Mesh'], gout.inputs['Geometry'])
    return ng


# ── MAIN ─────────────────────────────────────────────────────────────────────
purge()
mats = make_materials()
ob   = make_grid(mats)
ng   = build_gn_tree()

mod = ob.modifiers.new('PanelTrim', 'NODES')
mod.node_group = ng
bpy.context.view_layer.update()
print("✓ topology_trim_panel ready — 3 zones, vtx_valence + edge_tangent stored.")

out_dir = bpy.path.abspath("//output")
os.makedirs(out_dir, exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=os.path.join(out_dir, "topology_trim_panel.glb"),
    export_format='GLB',
    export_apply=True,
    export_attributes=True,
    export_materials='EXPORT',
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_yup=True,
    use_active_scene=True,
)
print("✓ GLB exported → output/topology_trim_panel.glb")
