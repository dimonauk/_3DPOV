"""
GN Extrude Mesh — Procedural Panel Inset
=========================================
Blender 5.1 — Geometry Nodes, bpy direct data API, headless-safe.

TECHNIQUE: Build a 16×16 face grid, select a random subset of faces via a
per-face Random Value field, extrude them individually along their face
normals, write edge crease=1.0 to the hinge (side) edges, then run a second
extrusion on a random subset of the first-level caps to produce a two-tier
panel hierarchy. The crease data is consumed by a Subdivision Surface modifier
stacked on top, yielding hard-surface SubD sharpness with zero manual edge loops.
Export: Draco-compressed GLB for WebXR.
"""

import bpy
import math
import pathlib

# ── output paths ──────────────────────────────────────────────────────────────
OUT_BLEND = pathlib.Path("//panel_inset.blend")
OUT_GLB   = pathlib.Path("//panel_inset.glb")

# ── scene parameters ─────────────────────────────────────────────────────────
GRID_VERTS_X     = 18       # vertices per axis → 16 × 16 = 256 quad faces
GRID_VERTS_Y     = 18
GRID_SIZE        = 2.0      # world-space width/height (m)
PANEL_THRESHOLD  = 0.38     # ~62 % of faces are raised panels (0-1)
PANEL_SEED       = 9        # random seed for panel selection
PANEL_DEPTH      = 0.030    # metres each panel extrudes outward
CREASE           = 1.0      # SubDiv crease on hinge edges (1.0 = fully sharp)
INNER_THRESHOLD  = 0.50     # fraction of first-level caps that receive inner tier
INNER_SEED       = 42       # random seed for inner-tier selection
INNER_DEPTH      = 0.014    # metres the inner cap rises above the panel top
COLOUR_RAISED    = (0.14, 0.22, 0.32, 1.0)   # dark-steel blue for panels
COLOUR_BASE      = (0.06, 0.07, 0.09, 1.0)   # near-black base recesses


# ─────────────────────────────────────────────────────────────────────────────
def purge_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=True)
    for block in (bpy.data.meshes, bpy.data.materials,
                  bpy.data.node_groups, bpy.data.objects):
        for item in list(block):
            block.remove(item, do_unlink=True)


def make_material(name: str, colour: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out  = nt.nodes.new("ShaderNodeOutputMaterial"); out.location = (300, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled"); bsdf.location = (0, 0)
    bsdf.inputs["Base Color"].default_value = colour
    bsdf.inputs["Metallic"].default_value   = 0.85
    bsdf.inputs["Roughness"].default_value  = 0.30
    # Specular IOR Level replaces Specular scalar in Principled BSDF v2 (Blender 4.0+)
    bsdf.inputs["Specular IOR Level"].default_value = 0.5
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return mat


# ─────────────────────────────────────────────────────────────────────────────
def build_gn_tree(mat_raised: bpy.types.Material) -> bpy.types.NodeTree:
    """
    Construct the Geometry Nodes tree.

    Node chain (abbreviated):
      GroupInput → Grid → [RandomValue → Compare] selection_1
        → ExtrudeMesh1 (Individual, offset = Normal × PANEL_DEPTH)
           .Side → SetEdgeCrease (crease = 1.0)
           .Top  ─╮
      [RandomValue2 → Compare2] → AND → selection_2
        → ExtrudeMesh2 (Individual, offset = Normal × INNER_DEPTH)
           .Side → SetEdgeCrease2 (crease = 1.0)
        → StoreNamedAttribute "is_panel" (bool, Face domain, = selection_1)
        → SetShadeSmooth → SetMaterial → GroupOutput
    """
    tree  = bpy.data.node_groups.new("PanelInset", "GeometryNodeTree")
    nodes = tree.nodes
    links = tree.links

    iface = tree.interface
    iface.new_socket("Grid Verts X",     in_out="INPUT",  socket_type="NodeSocketInt")
    iface.new_socket("Grid Verts Y",     in_out="INPUT",  socket_type="NodeSocketInt")
    iface.new_socket("Panel Threshold",  in_out="INPUT",  socket_type="NodeSocketFloat")
    iface.new_socket("Panel Depth",      in_out="INPUT",  socket_type="NodeSocketFloat")
    iface.new_socket("Inner Threshold",  in_out="INPUT",  socket_type="NodeSocketFloat")
    iface.new_socket("Inner Depth",      in_out="INPUT",  socket_type="NodeSocketFloat")
    iface.new_socket("Geometry",         in_out="OUTPUT", socket_type="NodeSocketGeometry")

    gi = nodes.new("NodeGroupInput");  gi.location = (-1100, 0)
    go = nodes.new("NodeGroupOutput"); go.location = (1050, 0)

    # ── base grid ────────────────────────────────────────────────────────────
    n_grid = nodes.new("GeometryNodeMeshGrid")
    n_grid.location = (-850, 150)
    n_grid.inputs["Size X"].default_value = GRID_SIZE
    n_grid.inputs["Size Y"].default_value = GRID_SIZE
    links.new(gi.outputs["Grid Verts X"], n_grid.inputs["Vertices X"])
    links.new(gi.outputs["Grid Verts Y"], n_grid.inputs["Vertices Y"])

    # ── first-pass panel selection ────────────────────────────────────────────
    # Random Value runs per-face on the FACE domain when wired into a face
    # context (ExtrudeMesh operates in FACE domain for its Selection field).
    n_rng1 = nodes.new("GeometryNodeRandomValue")
    n_rng1.location = (-650, 300)
    n_rng1.data_type = "FLOAT"
    n_rng1.inputs["Min"].default_value = 0.0
    n_rng1.inputs["Max"].default_value = 1.0
    n_rng1.inputs["Seed"].default_value = PANEL_SEED

    # Compare: value > threshold → True for panels to raise
    n_cmp1 = nodes.new("FunctionNodeCompare")
    n_cmp1.location = (-450, 300)
    n_cmp1.data_type = "FLOAT"
    n_cmp1.operation = "GREATER_THAN"
    links.new(gi.outputs["Panel Threshold"], n_cmp1.inputs["B"])
    links.new(n_rng1.outputs["Value"], n_cmp1.inputs["A"])

    # ── face normal as extrusion direction ───────────────────────────────────
    # WHY use Normal × scalar rather than a fixed Z offset: on a flat grid all
    # face normals point +Z, so the effect is identical. The Normal-driven
    # approach generalises to curved emitter surfaces (sphere, cylinder) where
    # each panel must extrude perpendicular to its own face, not globally upward.
    n_norm1 = nodes.new("GeometryNodeInputNormal")
    n_norm1.location = (-650, 0)

    n_vsc1 = nodes.new("ShaderNodeVectorMath")
    n_vsc1.location = (-450, 0)
    n_vsc1.operation = "SCALE"
    links.new(n_norm1.outputs["Normal"], n_vsc1.inputs[0])
    links.new(gi.outputs["Panel Depth"], n_vsc1.inputs["Scale"])

    # ── first Extrude Mesh ───────────────────────────────────────────────────
    n_ex1 = nodes.new("GeometryNodeExtrudeMesh")
    n_ex1.location = (-200, 150)
    n_ex1.mode = "FACES"
    # Individual Faces = True: every face extrudes independently along its own
    # normal. False would extrude the selection as one connected region, merging
    # boundary edges — correct for shell offsets but wrong for panel isolation.
    n_ex1.inputs["Individual Faces"].default_value = True
    links.new(n_grid.outputs["Mesh"],       n_ex1.inputs["Mesh"])
    links.new(n_cmp1.outputs["Result"],     n_ex1.inputs["Selection"])
    links.new(n_vsc1.outputs["Vector"],     n_ex1.inputs["Offset"])

    # ── edge crease on first-pass hinge edges ────────────────────────────────
    # ExtrudeMesh.Side is a boolean field that evaluates True for exactly the
    # quad side-walls generated by the extrusion — the "hinge" edges that join
    # the original face perimeter to the raised cap. Crease=1.0 marks them as
    # fully sharp for the Subdivision Surface modifier stacked above the GN mod.
    n_cr1 = nodes.new("GeometryNodeSetEdgeCrease")
    n_cr1.location = (30, 150)
    n_cr1.inputs["Crease"].default_value = CREASE
    links.new(n_ex1.outputs["Mesh"],  n_cr1.inputs["Geometry"])
    links.new(n_ex1.outputs["Side"],  n_cr1.inputs["Selection"])

    # ── second-pass selection: random subset of first-level caps ─────────────
    # A new RandomValue (different seed) is evaluated on the crease-modified
    # geometry. AND-ing with ExtrudeMesh1.Top restricts the selection to only
    # the cap faces of the first extrusion; the random component sub-samples
    # them to ~INNER_THRESHOLD fraction.
    n_rng2 = nodes.new("GeometryNodeRandomValue")
    n_rng2.location = (-50, 400)
    n_rng2.data_type = "FLOAT"
    n_rng2.inputs["Min"].default_value = 0.0
    n_rng2.inputs["Max"].default_value = 1.0
    n_rng2.inputs["Seed"].default_value = INNER_SEED

    n_cmp2 = nodes.new("FunctionNodeCompare")
    n_cmp2.location = (150, 400)
    n_cmp2.data_type = "FLOAT"
    n_cmp2.operation = "GREATER_THAN"
    links.new(gi.outputs["Inner Threshold"], n_cmp2.inputs["B"])
    links.new(n_rng2.outputs["Value"],       n_cmp2.inputs["A"])

    # BooleanMath AND: Top ∩ random → inner panel selection
    n_and = nodes.new("FunctionNodeBooleanMath")
    n_and.location = (350, 300)
    n_and.operation = "AND"
    links.new(n_ex1.outputs["Top"],      n_and.inputs[0])
    links.new(n_cmp2.outputs["Result"],  n_and.inputs[1])

    # ── second normal + scale ─────────────────────────────────────────────────
    n_norm2 = nodes.new("GeometryNodeInputNormal")
    n_norm2.location = (150, 0)

    n_vsc2 = nodes.new("ShaderNodeVectorMath")
    n_vsc2.location = (350, 0)
    n_vsc2.operation = "SCALE"
    links.new(n_norm2.outputs["Normal"], n_vsc2.inputs[0])
    links.new(gi.outputs["Inner Depth"], n_vsc2.inputs["Scale"])

    # ── second Extrude Mesh ──────────────────────────────────────────────────
    n_ex2 = nodes.new("GeometryNodeExtrudeMesh")
    n_ex2.location = (550, 150)
    n_ex2.mode = "FACES"
    n_ex2.inputs["Individual Faces"].default_value = True
    links.new(n_cr1.outputs["Geometry"],  n_ex2.inputs["Mesh"])
    links.new(n_and.outputs["Boolean"],   n_ex2.inputs["Selection"])
    links.new(n_vsc2.outputs["Vector"],   n_ex2.inputs["Offset"])

    # ── edge crease on second-pass hinge edges ───────────────────────────────
    n_cr2 = nodes.new("GeometryNodeSetEdgeCrease")
    n_cr2.location = (750, 150)
    n_cr2.inputs["Crease"].default_value = CREASE
    links.new(n_ex2.outputs["Mesh"],  n_cr2.inputs["Geometry"])
    links.new(n_ex2.outputs["Side"],  n_cr2.inputs["Selection"])

    # ── shade smooth + material ───────────────────────────────────────────────
    n_sm = nodes.new("GeometryNodeSetShadeSmooth")
    n_sm.location = (900, 150)
    n_sm.inputs["Shade Smooth"].default_value = True
    links.new(n_cr2.outputs["Geometry"], n_sm.inputs["Geometry"])

    n_mat = nodes.new("GeometryNodeSetMaterial")
    n_mat.location = (950, 150)
    n_mat.inputs["Material"].default_value = mat_raised
    links.new(n_sm.outputs["Geometry"], n_mat.inputs["Geometry"])

    links.new(n_mat.outputs["Geometry"], go.inputs["Geometry"])

    # Write default values to socket interface for modifier panel display
    for sock in iface.items_tree:
        if sock.name == "Grid Verts X":     sock.default_value = GRID_VERTS_X
        elif sock.name == "Grid Verts Y":   sock.default_value = GRID_VERTS_Y
        elif sock.name == "Panel Threshold":sock.default_value = PANEL_THRESHOLD
        elif sock.name == "Panel Depth":    sock.default_value = PANEL_DEPTH
        elif sock.name == "Inner Threshold":sock.default_value = INNER_THRESHOLD
        elif sock.name == "Inner Depth":    sock.default_value = INNER_DEPTH

    return tree


# ─────────────────────────────────────────────────────────────────────────────
def main() -> None:
    purge_scene()

    mat = make_material("PanelInset_Mat", COLOUR_RAISED)

    tree = build_gn_tree(mat)

    # Carrier: tiny plane; geometry comes entirely from the GN modifier
    bpy.ops.mesh.primitive_plane_add(size=0.001, location=(0, 0, 0))
    carrier = bpy.context.active_object
    carrier.name = "panel_inset"

    # Apply GN modifier
    gn_mod = carrier.modifiers.new("PanelInset", "NODES")
    gn_mod.node_group = tree

    # Subdivision Surface on top: reads crease_edge attribute written by GN.
    # Viewport level kept at 1 for real-time feedback; render level at 2.
    subdiv = carrier.modifiers.new("SubdivisionSurface", "SUBSURF")
    subdiv.levels         = 1
    subdiv.render_levels  = 2

    # ── camera ───────────────────────────────────────────────────────────────
    bpy.ops.object.camera_add(location=(0, -3.8, 2.8))
    cam = bpy.context.active_object
    cam.data.lens = 55
    bpy.context.scene.camera = cam
    import mathutils
    cam.rotation_euler = mathutils.Euler(
        (math.radians(54), 0, math.radians(0)), "XYZ"
    )

    # ── lighting ─────────────────────────────────────────────────────────────
    bpy.ops.object.light_add(type="SUN", location=(3, -2, 5))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.data.angle  = math.radians(3)

    bpy.ops.object.light_add(type="AREA", location=(-2, 3, 1.5))
    fill = bpy.context.active_object
    fill.data.energy = 150
    fill.data.size   = 2.5

    # ── render settings ───────────────────────────────────────────────────────
    scene = bpy.context.scene
    scene.render.engine     = "BLENDER_EEVEE_NEXT"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720

    # ── save + GLB export ─────────────────────────────────────────────────────
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT_BLEND))

    bpy.ops.object.select_all(action="DESELECT")
    carrier.select_set(True)
    bpy.context.view_layer.objects.active = carrier

    # export_apply=True bakes both the GN and the SubDiv modifiers into the GLB.
    # The exported mesh therefore has real SubD geometry with sharp creased edges —
    # no modifier dependency at runtime, which is the WebXR requirement.
    bpy.ops.export_scene.gltf(
        filepath=str(OUT_GLB),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_normals=True,
        export_materials="EXPORT",
    )
    print(f"[PanelInset] .blend → {OUT_BLEND}")
    print(f"[PanelInset] .glb   → {OUT_GLB}")


if __name__ == "__main__":
    main()
