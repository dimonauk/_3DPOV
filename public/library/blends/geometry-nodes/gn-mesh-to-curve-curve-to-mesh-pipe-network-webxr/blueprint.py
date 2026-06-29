"""
GN Mesh to Curve → Curve to Mesh
Angle-Gated Edge Conduit Network for a WebXR Interior Panel

Technique
---------
GeometryNodeMeshToCurve converts selected edges of any mesh into independent
2-point POLY splines (linear segments, no curvature). GeometryNodeCurveToMesh
sweeps a circular profile along those splines to produce tube geometry. The
result is a fully procedural conduit / conduit-cable network whose layout is
driven by the source mesh topology — swap the grid, the pipes update.

Why not the Wireframe modifier?
-------------------------------
The Wireframe MODIFIER bakes ALL edges unconditionally and exists outside the
GN stack, so its output cannot feed subsequent GN nodes. Inside a GN tree,
Mesh to Curve takes a Selection socket that can be any computed edge-domain
boolean — angle threshold, named attribute, connected-region test. The tube
radius, caps, and material can all be driven from upstream sockets. That
composability is what makes it the professional choice.

Junction sealing — the expert caveat
-------------------------------------
Each edge becomes an ISOLATED 2-point spline. Adjacent tubes share no topology
at junction vertices. If Fill Caps = True, Curve to Mesh stamps a disc at both
ends of every tube; where two tubes meet, two cap discs overlap at the same
position — valid geometry but technically non-manifold and wasteful. The fix
is Merge by Distance AFTER Curve to Mesh with a small threshold that welds the
coincident cap centres without touching the rest of the tube walls.

Edge selection via Edge Angle
------------------------------
GeometryNodeEdgeAngle outputs the unsigned dihedral angle between the two face
normals sharing each edge (EDGE domain float). Boundary edges (one face only)
output π. A FunctionNodeCompare (GREATER_THAN) with ANGLE_THRESHOLD keeps only
"crease" edges — the structural junctions of the panel — and ignores near-flat
interior faces, preventing the generation of hundreds of micro-tubes on any
subdivided surface.
"""

import bpy
import math

# ── Parameters ────────────────────────────────────────────────────────────────
GRID_X: int         = 6            # structural panel columns
GRID_Y: int         = 4            # structural panel rows
GRID_SCALE: float   = 2.0          # panel dimension in metres

# Edges whose unsigned dihedral angle exceeds this become conduits.
# 20° keeps panel-join ridges; raise to 60° to keep only the outer frame.
ANGLE_THRESHOLD: float = math.radians(20.0)

TUBE_RADIUS: float      = 0.014    # conduit outer radius (metres)
TUBE_PROFILE_VERTS: int = 8        # cross-section polygon count (power of 2 → clean UVs)

# Merge threshold for junction cap welding: a fraction of tube radius is safe
# because coincident cap centres are at machine-precision zero distance apart.
MERGE_DIST: float = TUBE_RADIUS * 0.1

MATERIAL_FRAME: str   = "HF_Panel_Frame"
MATERIAL_CONDUIT: str = "HF_Conduit_Metal"

NG_NAME: str     = "ConduitNetworkGN"
MOD_NAME: str    = "ConduitNetwork"
OBJ_NAME: str    = "panel_frame"

EXPORT_GLB: str  = "//output/pipe_network_panel.glb"


# ── Utilities ─────────────────────────────────────────────────────────────────

def ensure_material(name: str, colour=(0.5, 0.5, 0.5, 1.0)) -> bpy.types.Material:
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    if not mat.use_nodes:
        mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = colour
        bsdf.inputs["Metallic"].default_value   = 0.85
        bsdf.inputs["Roughness"].default_value  = 0.35
    return mat


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for col in [bpy.data.meshes, bpy.data.curves, bpy.data.node_groups,
                bpy.data.materials]:
        for item in list(col):
            col.remove(item)


# ── Node tree ─────────────────────────────────────────────────────────────────

def build_node_tree(mat_conduit: bpy.types.Material) -> bpy.types.GeometryNodeTree:
    """
    Construct the GN tree.

    Node order (left → right):
      GroupInput ──→ MeshToCurve ──→ CurveToMesh ──→ MergeByDistance
                  ↑ EdgeAngle → Compare (Selection)    ↓
                  └─────────────────────────────────── SetShadeSmooth
                                                       → SetMaterial
                                                       → JoinGeometry ──→ GroupOutput
                                                            ↑ GroupInput (panel pass-through)
      CurvePrimitiveCircle (profile) ──→ CurveToMesh
    """
    ng    = bpy.data.node_groups.new(NG_NAME, "GeometryNodeTree")
    nodes = ng.nodes
    links = ng.links

    ng.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    ng.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")

    def n(t: str, x: float, y: float) -> bpy.types.Node:
        nd = nodes.new(t)
        nd.location = (x, y)
        return nd

    def lk(src, dst) -> None:
        links.new(src, dst)

    gi = n("NodeGroupInput",  -900, 0)
    go = n("NodeGroupOutput",  1500, 0)

    # Edge Angle — evaluates on EDGE domain automatically.
    # "Unsigned Angle" = always 0..π, correct for boundary detection.
    edge_angle = n("GeometryNodeEdgeAngle", -600, 250)

    # Compare: angle > ANGLE_THRESHOLD → True on structural crease edges.
    cmp = n("FunctionNodeCompare", -360, 250)
    cmp.data_type = "FLOAT"
    cmp.operation = "GREATER_THAN"
    cmp.inputs["B"].default_value = ANGLE_THRESHOLD

    # Mesh to Curve: selected edges → isolated 2-point POLY splines.
    m2c = n("GeometryNodeMeshToCurve", -100, 0)

    # Profile circle: cross-section for the tube sweep.
    # RADIUS mode gives a uniform circle; POINTS mode gives arbitrary 3-point arcs.
    profile = n("GeometryNodeCurvePrimitiveCircle", -100, -280)
    profile.mode = "RADIUS"
    profile.inputs["Resolution"].default_value = TUBE_PROFILE_VERTS
    profile.inputs["Radius"].default_value     = TUBE_RADIUS

    # Curve to Mesh: sweep profile along each spline → tube mesh.
    # Fill Caps = True adds disc faces at every tube end (including junctions).
    ctm = n("GeometryNodeCurveToMesh", 160, 0)
    ctm.inputs["Fill Caps"].default_value = True

    # Merge by Distance: weld coincident junction cap centres.
    # threshold << TUBE_RADIUS keeps the cap discs intact while collapsing
    # the doubled centre vertices at each junction into one shared vertex.
    mbd = n("GeometryNodeMergeByDistance", 420, 0)
    mbd.mode = "ALL"
    mbd.inputs["Distance"].default_value = MERGE_DIST

    # Set Shade Smooth: smooth normals on the tube walls; per-face FACE domain.
    shade = n("GeometryNodeSetShadeSmooth", 660, 0)
    shade.domain = "FACE"
    shade.inputs["Shade Smooth"].default_value = True

    # Set Material: assign conduit material to the tube overlay geometry.
    set_mat = n("GeometryNodeSetMaterial", 900, 0)
    set_mat.inputs["Material"].default_value = mat_conduit

    # Join Geometry: combine original panel mesh with the tube overlay.
    join = n("GeometryNodeJoinGeometry", 1200, 0)

    # ── Wiring ────────────────────────────────────────────────────────────────
    lk(edge_angle.outputs["Unsigned Angle"], cmp.inputs["A"])
    lk(cmp.outputs["Result"],               m2c.inputs["Selection"])
    lk(gi.outputs["Geometry"],              m2c.inputs["Mesh"])
    lk(m2c.outputs["Curve"],                ctm.inputs["Curve"])
    lk(profile.outputs["Curve"],            ctm.inputs["Profile Curve"])
    lk(ctm.outputs["Mesh"],                 mbd.inputs["Geometry"])
    lk(mbd.outputs["Geometry"],             shade.inputs["Geometry"])
    lk(shade.outputs["Geometry"],           set_mat.inputs["Geometry"])
    lk(set_mat.outputs["Geometry"],         join.inputs["Geometry"])
    lk(gi.outputs["Geometry"],              join.inputs["Geometry"])  # panel pass-through
    lk(join.outputs["Geometry"],            go.inputs["Geometry"])

    return ng


# ── Scene assembly ─────────────────────────────────────────────────────────────

def build_scene() -> bpy.types.Object:
    clear_scene()

    mat_frame   = ensure_material(MATERIAL_FRAME,   (0.08, 0.10, 0.14, 1.0))
    mat_conduit = ensure_material(MATERIAL_CONDUIT, (0.48, 0.50, 0.54, 1.0))

    # Structural grid panel: each face becomes a panel bay; every internal edge
    # is a grid ridge that, at ANGLE_THRESHOLD=20°, will become a conduit tube.
    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_X,
        y_subdivisions=GRID_Y,
        size=GRID_SCALE,
        location=(0.0, 0.0, 0.0),
    )
    panel = bpy.context.active_object
    panel.name = OBJ_NAME
    panel.data.materials.append(mat_frame)

    ng  = build_node_tree(mat_conduit)
    mod = panel.modifiers.new(MOD_NAME, "NODES")
    mod.node_group = ng

    return panel


def export_glb(panel: bpy.types.Object) -> None:
    """Apply GN modifier and export the combined mesh as GLB."""
    with bpy.context.temp_override(
        object=panel, active_object=panel, selected_objects=[panel]
    ):
        bpy.ops.object.modifier_apply(modifier=MOD_NAME)

    import os
    export_path = bpy.path.abspath(EXPORT_GLB)
    os.makedirs(os.path.dirname(export_path), exist_ok=True)

    bpy.ops.export_scene.gltf(
        filepath=export_path,
        export_format="GLB",
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_image_format="WEBP",
        export_yup=True,
    )
    print(f"[HF] GLB exported → {export_path}")


if __name__ == "__main__":
    panel = build_scene()
    export_glb(panel)
