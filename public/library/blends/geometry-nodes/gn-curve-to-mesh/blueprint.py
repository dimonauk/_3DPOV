"""
GN Curve to Mesh — Procedural Cables, Pipes & Architectural Trim
================================================================
Blender 5.1 | Holoflow Studio | CC0

Converts a Bezier curve spine into a capped cylindrical mesh using
Geometry Nodes. A Curve Circle provides the cross-section profile;
Resample Curve evens out subdivision before conversion so rings stay
uniformly spaced regardless of control-point density.

WHY GN over the old Bevel Depth / Taper approach:
The legacy Curve Object Geometry panel (Bevel Depth, Bevel Resolution)
still exists in 5.1 but produces topology that glTF handles poorly —
end cap normals point inward, UV layout is non-standard, and there is no
Python handle on the generated vertex positions. The GN approach outputs
a real quad-grid cylinder mesh, caps with correct outward normals, and
exposes Radius / Ring Verts / Resample Count as typed modifier inputs
addressable from Python and from the UI slider panel.

WHY Resample Curve BEFORE Curve to Mesh:
Blender stores bezier curves as sparse control points with interpolation.
Without resampling the Curve to Mesh node places one ring per stored
sample — tight near control points, sparse across the span. Resample
Curve with mode='COUNT' forces N evenly-spaced rings regardless of source
density. For a 3-point bezier with COUNT=32 this makes the cylinder wall
perfectly uniform.

WHY Fill Caps matters:
Cables exported without caps show the hollow interior through the end
faces at grazing angles in WebGL. Fill Caps adds a planar polygon at each
end. The resulting normals face outward, so EEVEE backface culling never
shows the interior.

Blender 5.1 API:
tree.interface.new_socket() (4.0+) replaces the removed
tree.inputs.new() / tree.outputs.new() from 3.x.
Modifier input values: mod["Input_N"] where N is the socket index.
Geometry is Input_0; first user param is Input_1.

Run headless:
    blender --background --python blueprint.py
"""

import bpy
import os
from mathutils import Vector
from pathlib import Path

# ── Named constants ────────────────────────────────────────────────────────────
CABLE_RADIUS    = 0.025   # cross-section radius in metres (~2.5 cm diameter)
RING_VERTS      = 8       # vertices on profile circle — 8 for low-poly pipe look
RESAMPLE_COUNT  = 32      # spine sample rings per bezier span

MAT_COLOR     = (0.10, 0.10, 0.12, 1.0)   # near-black stainless
MAT_METALLIC  = 1.0
MAT_ROUGHNESS = 0.22

MODIFIER_ID = "HoloflowCableCtM"

OUT_DIR   = Path(__file__).parent / "output"
BLEND_OUT = Path(__file__).parent / "cable_pipe.blend"
GLB_OUT   = OUT_DIR / "cable_pipe.glb"


# ── Scene utilities ────────────────────────────────────────────────────────────

def reset_scene() -> None:
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)


def link(obj: bpy.types.Object) -> None:
    if obj.name not in bpy.context.scene.collection.objects:
        bpy.context.scene.collection.objects.link(obj)


# ── Bezier spine ───────────────────────────────────────────────────────────────

def build_cable_spine() -> bpy.types.Object:
    """
    A 3-point Bezier curve shaped like a drooping cable between two poles.

    WHY bpy.data, not bpy.ops.curve.primitive_bezier_curve_add():
    The operator repositions the cursor and requires an active 3D viewport
    context. In --background mode (headless) there is no viewport and the
    operator silently does nothing. The bpy.data path works in all contexts.

    Handle types are FREE to allow asymmetric tangents at the inflection point,
    which is what creates the slight S-bend as the cable dips.
    """
    cdata = bpy.data.curves.new(name="cable_spine", type="CURVE")
    cdata.dimensions = "3D"
    cdata.resolution_u = 12   # viewport display only — GN uses its own sampling

    sp = cdata.splines.new("BEZIER")
    sp.bezier_points.add(2)   # default has 1; add 2 more = 3 total
    pts = sp.bezier_points

    # Anchor left — elevated pole attachment
    pts[0].co             = Vector((-1.5,  0.0,  0.5))
    pts[0].handle_left    = Vector((-2.0,  0.0,  0.5))
    pts[0].handle_right   = Vector((-0.7,  0.0,  0.1))
    pts[0].handle_left_type  = "FREE"
    pts[0].handle_right_type = "FREE"

    # Catenary sag — mid-point hangs below the poles
    pts[1].co             = Vector(( 0.0,  0.0, -0.45))
    pts[1].handle_left    = Vector((-0.8,  0.0, -0.45))
    pts[1].handle_right   = Vector(( 0.8,  0.0, -0.45))
    pts[1].handle_left_type  = "FREE"
    pts[1].handle_right_type = "FREE"

    # Anchor right — symmetric with left
    pts[2].co             = Vector(( 1.5,  0.0,  0.5))
    pts[2].handle_left    = Vector(( 0.7,  0.0,  0.1))
    pts[2].handle_right   = Vector(( 2.0,  0.0,  0.5))
    pts[2].handle_left_type  = "FREE"
    pts[2].handle_right_type = "FREE"

    obj = bpy.data.objects.new("cable_pipe", cdata)
    link(obj)
    return obj


# ── Geometry Nodes tree ────────────────────────────────────────────────────────

def build_gn_tree() -> bpy.types.GeometryNodeTree:
    """
    Node graph:
        Group Input (Geometry, Radius, Ring Verts, Resample Count)
          └─ Geometry ──► Resample Curve (COUNT) ──► Curve to Mesh ──► Set Shade Smooth ──► Group Output
                                                            │
                         Curve Circle (Resolution, Radius) ─┘
    """
    tree = bpy.data.node_groups.new(type="GeometryNodeTree", name="CurveToMeshCable")
    nodes = tree.nodes
    links = tree.links

    # ── Interface sockets (4.0+ API) ──
    tree.interface.new_socket("Geometry",       in_out="OUTPUT", socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry",       in_out="INPUT",  socket_type="NodeSocketGeometry")

    s_rad = tree.interface.new_socket("Radius",         in_out="INPUT",  socket_type="NodeSocketFloat")
    s_rad.default_value = CABLE_RADIUS
    s_rad.min_value = 0.001
    s_rad.max_value = 0.5

    s_rv = tree.interface.new_socket("Ring Verts",      in_out="INPUT",  socket_type="NodeSocketInt")
    s_rv.default_value = RING_VERTS
    s_rv.min_value = 3
    s_rv.max_value = 32

    s_rc = tree.interface.new_socket("Resample Count",  in_out="INPUT",  socket_type="NodeSocketInt")
    s_rc.default_value = RESAMPLE_COUNT
    s_rc.min_value = 4
    s_rc.max_value = 128

    # ── Nodes ──
    n_in  = nodes.new("NodeGroupInput");   n_in.location  = (-600, 0)
    n_out = nodes.new("NodeGroupOutput");  n_out.location = ( 600, 0)

    n_resample = nodes.new("GeometryNodeResampleCurve")
    n_resample.mode = "COUNT"
    n_resample.location = (-320, 80)

    n_profile = nodes.new("GeometryNodeCurvePrimitiveCircle")
    n_profile.mode = "RADIUS"
    n_profile.location = (-320, -140)

    n_ctm = nodes.new("GeometryNodeCurveToMesh")
    n_ctm.location = (0, 0)
    # Fill Caps closes the tube ends — index 2 (Curve=0, Profile=1, FillCaps=2)
    n_ctm.inputs[2].default_value = True

    n_smooth = nodes.new("GeometryNodeSetShadeSmooth")
    n_smooth.domain = "FACE"
    n_smooth.inputs["Shade Smooth"].default_value = True
    n_smooth.location = (260, 0)

    # ── Links ──
    links.new(n_in.outputs["Geometry"],         n_resample.inputs["Curve"])
    links.new(n_in.outputs["Resample Count"],   n_resample.inputs["Count"])
    links.new(n_in.outputs["Radius"],           n_profile.inputs["Radius"])
    links.new(n_in.outputs["Ring Verts"],       n_profile.inputs["Resolution"])
    links.new(n_resample.outputs["Curve"],      n_ctm.inputs["Curve"])
    links.new(n_profile.outputs["Curve"],       n_ctm.inputs["Profile Curve"])
    links.new(n_ctm.outputs["Mesh"],            n_smooth.inputs["Geometry"])
    links.new(n_smooth.outputs["Geometry"],     n_out.inputs["Geometry"])

    return tree


# ── Modifier + material ────────────────────────────────────────────────────────

def apply_modifier(obj: bpy.types.Object, tree: bpy.types.GeometryNodeTree) -> None:
    mod = obj.modifiers.new(name=MODIFIER_ID, type="NODES")
    mod.node_group = tree


def add_cable_material(obj: bpy.types.Object) -> None:
    mat = bpy.data.materials.new(name="cable_metal")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value  = MAT_COLOR
    bsdf.inputs["Metallic"].default_value    = MAT_METALLIC
    bsdf.inputs["Roughness"].default_value   = MAT_ROUGHNESS
    obj.data.materials.append(mat)


# ── Export ─────────────────────────────────────────────────────────────────────

def export_assets(obj: bpy.types.Object) -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Select only the cable object for export
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    # export_apply=True converts the GN-evaluated mesh to real geometry.
    # Without it the exporter sees the raw Bezier curve data and exports
    # a line primitive (or nothing) rather than the cylindrical mesh.
    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_normals=True,
        export_materials="EXPORT",
    )

    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
    print(f"[blueprint] GLB → {GLB_OUT}")
    print(f"[blueprint] blend → {BLEND_OUT}")


# ── Entry point ────────────────────────────────────────────────────────────────

def main() -> None:
    reset_scene()
    obj  = build_cable_spine()
    tree = build_gn_tree()
    apply_modifier(obj, tree)
    add_cable_material(obj)
    export_assets(obj)


if __name__ == "__main__":
    main()
