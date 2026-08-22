"""
GN Bevel Mesh Node + Edge Angle — Procedural Hard-Surface Chamfer
Blender 5.1  ·  CC0  ·  Holoflow Studio

Technique: a Geometry Nodes modifier automatically chamfers every edge
where the inter-face dihedral angle exceeds a user-controlled threshold.
The Bevel Mesh node lives entirely inside the GN tree — no Edit Mode
Ctrl+B, no Bevel modifier in the stack — so the original mesh topology
stays intact and chamfer width is a live modifier panel slider.

WHY BEVEL MESH INSTEAD OF THE BEVEL MODIFIER?
  The Bevel modifier accepts an angle limit or a vertex group but not
  a computed GN field.  The GN Bevel Mesh node receives its Selection
  input as an arbitrary boolean field: angle threshold, proximity result,
  named attribute from a simulation, or any other GN expression.  It
  also executes at a deterministic position inside a single modifier
  slot — no stack-ordering fights with Subdivision Surface.

Scene: a sci-fi junction block (1.2 × 0.6 × 0.3 m) with an inset
panel recess cut via bmesh.ops.inset_faces.  The chamfer tree bevels
every edge where unsigned_dihedral > 30°, covering the eight box
corners plus the four inset-recess edges.

Outside sources:
  Blender Manual — Bevel Mesh Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/operations/bevel_mesh.html
    CC-BY-SA 4.0 · Blender Documentation Team
  Blender Manual — Edge Angle Node
    https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/mesh/read/edge_angle.html
    CC-BY-SA 4.0 · Blender Documentation Team
  blender-scripting — Nicolas Janakiev
    https://github.com/njanakiev/blender-scripting
    MIT · https://github.com/njanakiev/blender-scripting
"""

import math
import bpy
import bmesh

# ── Parameters ─────────────────────────────────────────────────────────────
BOX_X            = 1.2     # junction block width (m)
BOX_Y            = 0.6     # depth
BOX_Z            = 0.3     # height
INSET_MARGIN     = 0.10    # panel recess edge distance from box perimeter
INSET_DEPTH      = 0.04    # panel recess push depth (positive = down into block)
CHAMFER_WIDTH    = 0.025   # default bevel offset (m)
CHAMFER_SEGMENTS = 2       # bevel loop count; 2 = one mid-edge loop added
ANGLE_THRESHOLD  = math.radians(30.0)  # bevel edges sharper than this
TREE_NAME        = "HS_Chamfer"
OBJ_NAME         = "junction_block"
MAT_PANEL_NAME   = "JB_Panel"
MAT_RECESS_NAME  = "JB_Recess"
OUTPUT_GLB       = "//junction_block.glb"


# ── Cleanup ─────────────────────────────────────────────────────────────────
def _purge() -> None:
    for ob in list(bpy.data.objects):
        if ob.name.startswith(("junction_block", "JB_")):
            bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        if me.name.startswith(("junction", "JB_")):
            bpy.data.meshes.remove(me)
    for ng in list(bpy.data.node_groups):
        if ng.name == TREE_NAME:
            bpy.data.node_groups.remove(ng)
    for ma in list(bpy.data.materials):
        if ma.name.startswith(("JB_",)):
            bpy.data.materials.remove(ma)


# ── Materials ────────────────────────────────────────────────────────────────
def _make_material(name: str, base_colour: tuple, roughness: float,
                   metallic: float = 0.0) -> bpy.types.Material:
    ma = bpy.data.materials.new(name)
    ma.use_nodes = True
    nt = ma.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.inputs["Base Color"].default_value = base_colour
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    out.location = (300, 0)
    bsdf.location = (0, 0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return ma


# ── Junction block mesh (bmesh) ──────────────────────────────────────────────
def _build_mesh(ma_panel: bpy.types.Material,
                ma_recess: bpy.types.Material) -> bpy.types.Object:
    """
    Build the junction block in bmesh.

    Strategy: create a unit cube, scale to target dimensions, then use
    inset_faces on the top face to add the panel recess.  Material slots
    0 → outer shell, 1 → inset recess face.

    bmesh.ops.inset_faces returns a dict with key 'faces' holding the
    new inner face(s).  We push that face down by INSET_DEPTH to create
    the recessed panel groove.
    """
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=2.0)

    # Scale to block proportions (create_cube produces a ±1 m unit cube)
    bmesh.ops.scale(
        bm,
        vec=(BOX_X / 2.0, BOX_Y / 2.0, BOX_Z / 2.0),
        verts=bm.verts,
    )

    bm.faces.ensure_lookup_table()
    # Top face has the highest average Z centroid
    top_face = max(bm.faces, key=lambda f: f.calc_center_median().z)

    # Inset the top face to create the recess ring
    res = bmesh.ops.inset_faces(
        bm,
        faces=[top_face],
        thickness=INSET_MARGIN,
        use_even_offset=True,
        use_relative_offset=False,
    )
    inner_faces = res["faces"]  # list with one face: the inset centre

    # Push the inset face down to create the panel groove
    for v in {v for f in inner_faces for v in f.verts}:
        v.co.z -= INSET_DEPTH

    # Assign material indices: outer = 0, recess = 1
    for f in bm.faces:
        f.material_index = 0
    for f in inner_faces:
        f.material_index = 1

    # Materialise the bmesh into a real mesh data block
    me = bpy.data.meshes.new(OBJ_NAME)
    bm.to_mesh(me)
    bm.free()

    ob = bpy.data.objects.new(OBJ_NAME, me)
    ob.data.materials.append(ma_panel)   # slot 0
    ob.data.materials.append(ma_recess)  # slot 1
    bpy.context.collection.objects.link(ob)
    return ob


# ── GN Chamfer tree ──────────────────────────────────────────────────────────
def _build_chamfer_tree() -> bpy.types.GeometryNodeTree:
    """
    Build the HS_Chamfer node tree.

    Key nodes:
      GeometryNodeInputMeshEdgeAngle → unsigned_angle (radians, per edge)
      FunctionNodeCompare (FLOAT, GREATER_THAN) → True on sharp edges
      GeometryNodeBevelMesh → chamfer selected edges with live Amount

    Edge Angle → Compare → Bevel Mesh chain is a reusable field pattern:
    swap the Compare for any other boolean field (attribute, proximity,
    curvature) to target different edge sets without touching the bevel node.
    """
    ng = bpy.data.node_groups.new(TREE_NAME, "GeometryNodeTree")
    iface = ng.interface
    nodes = ng.nodes
    links = ng.links

    # Group interface
    iface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    iface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    s_width = iface.new_socket("Chamfer Width", in_out="INPUT",
                               socket_type="NodeSocketFloat")
    s_width.default_value = CHAMFER_WIDTH
    s_width.min_value     = 0.001
    s_width.max_value     = 0.5

    s_segs = iface.new_socket("Segments", in_out="INPUT",
                              socket_type="NodeSocketInt")
    s_segs.default_value = CHAMFER_SEGMENTS
    s_segs.min_value     = 1
    s_segs.max_value     = 8

    s_angle = iface.new_socket("Angle Threshold", in_out="INPUT",
                               socket_type="NodeSocketFloat")
    s_angle.subtype       = "ANGLE"
    s_angle.default_value = ANGLE_THRESHOLD
    s_angle.min_value     = 0.0
    s_angle.max_value     = math.pi

    # Nodes
    n_in  = nodes.new("NodeGroupInput");  n_in.location  = (-600, 0)
    n_out = nodes.new("NodeGroupOutput"); n_out.location = ( 400, 0)

    # Edge Angle node — operates on edge domain; outputs per-edge angle in radians
    n_ea  = nodes.new("GeometryNodeInputMeshEdgeAngle")
    n_ea.location = (-350, -160)

    # Compare: unsigned_angle > threshold → True on hard edges
    n_cmp = nodes.new("FunctionNodeCompare")
    n_cmp.data_type = "FLOAT"
    n_cmp.operation = "GREATER_THAN"
    n_cmp.location  = (-120, -160)

    # Bevel Mesh node
    n_bvl = nodes.new("GeometryNodeBevelMesh")
    n_bvl.mode     = "EDGES"
    n_bvl.location = (150, 0)

    # Wire up
    links.new(n_in.outputs["Geometry"],        n_bvl.inputs["Mesh"])
    links.new(n_ea.outputs["Unsigned Angle"],  n_cmp.inputs["A"])
    links.new(n_in.outputs["Angle Threshold"], n_cmp.inputs["B"])
    links.new(n_cmp.outputs["Result"],         n_bvl.inputs["Selection"])
    links.new(n_in.outputs["Chamfer Width"],   n_bvl.inputs["Amount"])
    links.new(n_in.outputs["Segments"],        n_bvl.inputs["Segments"])
    links.new(n_bvl.outputs["Mesh"],           n_out.inputs["Geometry"])

    return ng


# ── Camera & scene setup ─────────────────────────────────────────────────────
def _scene_setup(ob: bpy.types.Object) -> None:
    scene = bpy.context.scene
    scene.render.engine    = "BLENDER_EEVEE_NEXT"
    scene.frame_start      = 1
    scene.frame_end        = 1

    # Camera
    bpy.ops.object.camera_add(location=(2.2, -2.0, 1.5))
    cam_ob = bpy.context.object
    cam_ob.rotation_euler = (math.radians(60), 0.0, math.radians(45))
    scene.camera = cam_ob

    # World
    world = bpy.data.worlds["World"]
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background")
    if bg:
        bg.inputs["Color"].default_value  = (0.07, 0.07, 0.09, 1.0)
        bg.inputs["Strength"].default_value = 0.6

    # Three-point light rig (area lights — EEVEE)
    lights = [
        ("JB_Key",  ( 2.5,  1.5, 3.0), 180.0),
        ("JB_Fill", (-2.5,  2.0, 1.5),  60.0),
        ("JB_Rim",  ( 0.0, -3.0, 2.0),  80.0),
    ]
    for name, loc, pwr in lights:
        bpy.ops.object.light_add(type="AREA", location=loc)
        li = bpy.context.object
        li.name = name
        li.data.energy = pwr
        li.data.size   = 1.5


# ── Export ───────────────────────────────────────────────────────────────────
def _export(ob: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    ob.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.export_scene.gltf(
        filepath                              = bpy.path.abspath(OUTPUT_GLB),
        use_selection                         = True,
        export_apply                          = True,    # materialises GN modifier
        export_draco_mesh_compression_enable  = True,
        export_draco_mesh_compression_level   = 6,
        export_image_format                   = "WEBP",
    )
    print(f"[Holoflow] Exported → {OUTPUT_GLB}")


# ── Main ─────────────────────────────────────────────────────────────────────
def main() -> None:
    _purge()

    ma_panel  = _make_material(MAT_PANEL_NAME,  (0.55, 0.58, 0.60, 1.0), 0.35, 0.85)
    ma_recess = _make_material(MAT_RECESS_NAME, (0.08, 0.08, 0.10, 1.0), 0.70, 0.10)

    ob = _build_mesh(ma_panel, ma_recess)
    ng = _build_chamfer_tree()

    mod = ob.modifiers.new("Chamfer", "NODES")
    mod.node_group = ng
    # Expose defaults through modifier (Blender 5.1 auto-resolves via interface)

    _scene_setup(ob)
    _export(ob)
    print("[Holoflow] blueprint.py complete — junction_block with GN chamfer ready.")


main()
