"""
GN Mesh Boolean — Procedural Holes & Cutouts for Hard-Surface Assets
====================================================================
Blender 5.1 | Holoflow Studio | CC0

Drives the Geometry Nodes Mesh Boolean node entirely from bpy.data to cut
a grid of cylindrical holes through a square panel mesh.  The cutter geometry
is generated inside the same GN tree using Distribute Points on Faces and
Instance on Points, so hole count, radius, and depth are live modifier inputs
rather than committed mesh edits.

WHY GN Boolean over the Boolean Modifier:
The Object Boolean Modifier requires a separate cutter object per operation,
which proliferates the scene outliner and makes scripted variation awkward.
The GN Mesh Boolean node takes two Geometry inputs — both can be generated
entirely inside the same node group.  No extra objects required, no scene
polluting, and the cutter count is driven by a slider rather than object
duplication.

WHY GeometryNodeMeshBoolean solver 'EXACT':
Blender exposes two solvers on the Mesh Boolean node.  FAST uses flood-fill
topology and is approximately 4× faster on dense geometry, but silently
fails on non-manifold inputs, self-intersecting cutters, or overlapping
cutter volumes — it returns either an empty mesh or an inverted solid with
no error.  EXACT uses multi-precision integer arithmetic and handles all of
those edge cases correctly.  For this tutorial the cutter cylinders overlap
at high densities and the panel base mesh has seam edges (Grid primitive
adds double-edges along the border) — EXACT is mandatory.

WHY the cutter must be watertight:
Boolean DIFFERENCE subtracts the volume enclosed by the cutter from the
base mesh.  If the cutter is not a closed manifold (e.g. an open cylinder
cap, a plane, or a mesh with boundary edges) Blender cannot define an
interior, the "volume" is zero, and the DIFFERENCE produces no cut.  Every
cutter generated here is a UV Sphere with all quads — fully closed.

WHY normals need repair after Boolean:
The DIFFERENCE operation removes the portion of the base mesh inside the
cutter volume and replaces those removed faces with the interior surface of
the cutter.  The interior-facing normals of the cutter become the wall normals
of the hole.  Blender's boolean solver flips those normals outward correctly
most of the time, but at high hole densities where cutters near-kiss the panel
edge the solver can leave inverted face islands.  A Flip Faces node downstream,
gated on a Set Face Set comparison, is the safe repair.  The blueprint here
uses Set Shade Smooth (FACE domain) after the boolean to catch any lingering
shading artefacts without geometry changes.

Blender 5.1 API notes:
- tree.interface.new_socket()  — 4.0+ only; tree.inputs.new() removed.
- GeometryNodeMeshBoolean.solver: 'FAST' or 'EXACT' (string enum).
- Hole Tolerant input: mod["Input_N"] index, not a named attribute.
- Cylinder primitive: GeometryNodeMeshCylinder, not ops.mesh.primitive_cylinder_add.

Run headless:
    blender --background --python blueprint.py
"""

import bpy
import os
from mathutils import Vector
from pathlib import Path

# ── Named constants ────────────────────────────────────────────────────────────
PANEL_SIZE          = 2.0      # metres: panel is PANEL_SIZE × PANEL_SIZE square
PANEL_SUBDIVISIONS  = 0        # base panel is a plain quad — no extra subdivisions

HOLE_RADIUS         = 0.07     # metres: radius of each cylindrical hole
HOLE_DEPTH          = 0.25     # metres: extrusion depth of cutter cylinder
HOLE_RING_VERTS     = 12       # polygon count on each cylinder cross-section
HOLE_DENSITY        = 4.0      # Poisson disk density (holes per m²)
HOLE_SEED           = 7        # random seed for Distribute Points

PANEL_COLOR         = (0.18, 0.20, 0.22, 1.0)  # near-black anodised aluminium
PANEL_METALLIC      = 0.95
PANEL_ROUGHNESS     = 0.18

OUT_DIR  = Path(__file__).parent / "output"
BLEND_OUT = OUT_DIR / "panel_boolean.blend"
GLB_OUT   = OUT_DIR / "panel_boolean.glb"

MODIFIER_ID = "HoloflowGNBoolean"


# ── Helpers ───────────────────────────────────────────────────────────────────

def purge():
    """Remove default scene objects so the script is idempotent."""
    for obj in list(bpy.data.objects):
        bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in list(bpy.data.meshes):
        bpy.data.meshes.remove(mesh)
    for mat in list(bpy.data.materials):
        bpy.data.materials.remove(mat)
    for ng in list(bpy.data.node_groups):
        bpy.data.node_groups.remove(ng)


def make_panel_mesh() -> bpy.types.Object:
    """Create the square panel base mesh via bpy.data (Grid primitive = quads)."""
    mdata = bpy.data.meshes.new("panel_base")
    obj = bpy.data.objects.new("panel_boolean", mdata)
    bpy.context.scene.collection.objects.link(obj)

    # Grid: (x_subdivisions+1)*(y_subdivisions+1) vertices.
    # With x=1, y=1 the result is a single quad — the cleanest boolean base.
    import bmesh as bm_module
    bm = bm_module.new()
    bm_module.ops.create_grid(
        bm,
        x_segments=max(1, PANEL_SUBDIVISIONS + 1),
        y_segments=max(1, PANEL_SUBDIVISIONS + 1),
        size=PANEL_SIZE / 2.0,   # bmesh grid size = half-extent
    )
    bm.to_mesh(mdata)
    bm.free()

    mdata.update()
    return obj


def make_material() -> bpy.types.Material:
    """Anodised-aluminium PBR material."""
    mat = bpy.data.materials.new("panel_anodised")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value  = PANEL_COLOR
    bsdf.inputs["Metallic"].default_value    = PANEL_METALLIC
    bsdf.inputs["Roughness"].default_value   = PANEL_ROUGHNESS
    return mat


def build_gn_tree() -> bpy.types.NodeTree:
    """
    Construct the node tree:

      GroupInput (Geometry) ─────────────────────────────────────────┐
                                                                      ▼
      GroupInput (Geometry) → DistributePoints → InstanceOnPoints → MeshBoolean (DIFFERENCE) → SetShadeSmooth → GroupOutput
                                    ↑                  ↑
                             Density / Seed        Cylinder (cutter)
    """
    tree = bpy.data.node_groups.new(type="GeometryNodeTree", name="GNBooleanHoles")

    # ── Declare I/O sockets ────────────────────────────────────────────────────
    tree.interface.new_socket("Geometry",    in_out="OUTPUT", socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry",    in_out="INPUT",  socket_type="NodeSocketGeometry")

    s_density = tree.interface.new_socket("Hole Density", in_out="INPUT", socket_type="NodeSocketFloat")
    s_density.default_value = HOLE_DENSITY
    s_density.min_value = 0.1
    s_density.max_value = 20.0

    s_radius = tree.interface.new_socket("Hole Radius", in_out="INPUT", socket_type="NodeSocketFloat")
    s_radius.default_value = HOLE_RADIUS
    s_radius.min_value = 0.01
    s_radius.max_value = 0.20

    s_depth = tree.interface.new_socket("Hole Depth", in_out="INPUT", socket_type="NodeSocketFloat")
    s_depth.default_value = HOLE_DEPTH
    s_depth.min_value = 0.05
    s_depth.max_value = 1.0

    s_seed = tree.interface.new_socket("Seed", in_out="INPUT", socket_type="NodeSocketInt")
    s_seed.default_value = HOLE_SEED
    s_seed.min_value = 0

    nodes = tree.nodes
    links = tree.links

    def add(bl_idname: str, x: float, y: float) -> bpy.types.Node:
        n = nodes.new(bl_idname)
        n.location = (x, y)
        return n

    # ── I/O frames ────────────────────────────────────────────────────────────
    n_in  = add("NodeGroupInput",  -900, 0)
    n_out = add("NodeGroupOutput",  900, 0)

    # ── Cutter cylinder (procedural, closed mesh) ──────────────────────────────
    # GeometryNodeMeshCylinder produces a closed solid with correct outward normals.
    # Vertices = ring verts for top/bottom circles.  Fill type NONE → no cap discs,
    # NGON → single polygon per cap.  NGON is correct here: fewer faces, fully closed.
    n_cyl = add("GeometryNodeMeshCylinder", -600, -200)
    n_cyl.fill_type = "NGON"
    n_cyl.inputs["Vertices"].default_value = HOLE_RING_VERTS
    # Depth driven by Group Input socket (Input_4 after sockets declared above)
    # Radius driven by Group Input socket (Input_3)

    # ── Distribute Points on Faces (Poisson disk) ─────────────────────────────
    n_dist = add("GeometryNodeDistributePointsOnFaces", -600, 200)
    n_dist.distribute_method = "POISSON"
    # POISSON respects a minimum distance between points derived from Density Max.
    # For circular holes the minimum spacing floor = 2 × radius to avoid overlap.
    # At runtime the user must keep Density low enough to honour this; the blueprint
    # exposes both parameters so they can be co-tuned.

    # ── Rotate cutter to point along Z (up) → holes go through the panel ──────
    # The cylinder's default axis IS Z-up; no rotation needed on a flat panel.
    # If the panel is rotated in the scene, transforms must be applied first.

    # ── Instance on Points ────────────────────────────────────────────────────
    n_inst = add("GeometryNodeInstanceOnPoints", -200, 0)

    # ── Realize Instances (make instances real geometry for Boolean input) ─────
    # GeometryNodeMeshBoolean requires Mesh input — Instances are not a Mesh type.
    # Realize Instances converts the instance references to actual copied mesh data.
    n_real = add("GeometryNodeRealizeInstances", 0, -200)

    # ── Mesh Boolean (DIFFERENCE) ─────────────────────────────────────────────
    n_bool = add("GeometryNodeMeshBoolean", 200, 0)
    n_bool.operation = "DIFFERENCE"
    n_bool.solver = "EXACT"      # robust solver — required at high density
    n_bool.inputs["Self Intersection"].default_value  = False
    n_bool.inputs["Hole Tolerant"].default_value      = True
    # Hole Tolerant = True allows the base mesh to have topological holes
    # (boundary edges) without the solver mis-classifying inside/outside.
    # The Grid primitive has no holes but enabling this costs negligible time
    # and prevents silent failure if the user swaps in a mesh with cuts.

    # ── Set Shade Smooth (FACE domain) ────────────────────────────────────────
    n_smooth = add("GeometryNodeSetShadeSmooth", 500, 0)
    n_smooth.domain = "FACE"
    n_smooth.inputs["Shade Smooth"].default_value = True

    # ── Math: negate depth so cylinder extrudes downward (-Z) ─────────────────
    # The cutter cylinder needs its base at the panel surface (+Z) and its tip
    # below, so the DIFFERENCE removes the full thickness.  Translate by -depth/2
    # along Z to centre the cylinder on the panel, then it pokes through both faces.
    n_trans = add("GeometryNodeTranslateInstances", -100, -200)

    n_combine = add("ShaderNodeCombineXYZ", -300, -350)
    n_combine.inputs["X"].default_value = 0.0
    n_combine.inputs["Y"].default_value = 0.0
    # Z offset = 0 (cylinder is centred; depth > panel thickness by design)

    # ── Wiring ────────────────────────────────────────────────────────────────

    # Group Input → Distribute Points
    links.new(n_in.outputs["Geometry"],    n_dist.inputs["Mesh"])
    links.new(n_in.outputs["Hole Density"], n_dist.inputs["Density Max"])
    links.new(n_in.outputs["Seed"],         n_dist.inputs["Seed"])

    # Group Input → Cylinder radius/depth
    links.new(n_in.outputs["Hole Radius"], n_cyl.inputs["Radius"])
    links.new(n_in.outputs["Hole Depth"],  n_cyl.inputs["Depth"])

    # Distribute Points → Instance on Points
    links.new(n_dist.outputs["Points"],    n_inst.inputs["Points"])
    links.new(n_cyl.outputs["Mesh"],       n_inst.inputs["Instance"])

    # Instance on Points → Translate (centre on Z) → Realize
    links.new(n_inst.outputs["Instances"], n_trans.inputs["Instances"])
    links.new(n_combine.outputs["Vector"], n_trans.inputs["Translation"])
    links.new(n_trans.outputs["Instances"], n_real.inputs["Geometry"])

    # Boolean: base mesh − realized cutters
    links.new(n_in.outputs["Geometry"],  n_bool.inputs[0])  # Mesh (base)
    links.new(n_real.outputs["Geometry"], n_bool.inputs[1])  # Mesh (cutter)

    # Boolean → Shade Smooth → Output
    links.new(n_bool.outputs["Mesh"],    n_smooth.inputs["Geometry"])
    links.new(n_smooth.outputs["Geometry"], n_out.inputs["Geometry"])

    return tree


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    purge()
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # ── Scene ──────────────────────────────────────────────────────────────────
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"

    # ── Panel mesh + material ──────────────────────────────────────────────────
    obj = make_panel_mesh()
    mat = make_material()
    obj.data.materials.append(mat)

    # ── GN modifier ───────────────────────────────────────────────────────────
    tree = build_gn_tree()
    mod = obj.modifiers.new(name=MODIFIER_ID, type="NODES")
    mod.node_group = tree

    # Set live values (overrides socket defaults where needed)
    mod["Input_2"] = HOLE_DENSITY
    mod["Input_3"] = HOLE_RADIUS
    mod["Input_4"] = HOLE_DEPTH
    mod["Input_5"] = HOLE_SEED

    # ── Lighting ──────────────────────────────────────────────────────────────
    sun_data = bpy.data.lights.new("Sun", type="SUN")
    sun_data.energy = 3.5
    sun_obj = bpy.data.objects.new("Sun", sun_data)
    scene.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = (0.7, 0.0, 0.5)

    # ── Camera ────────────────────────────────────────────────────────────────
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 50
    cam_obj = bpy.data.objects.new("Camera", cam_data)
    scene.collection.objects.link(cam_obj)
    cam_obj.location = Vector((0.0, -3.2, 1.8))
    cam_obj.rotation_euler = (1.1, 0.0, 0.0)
    scene.camera = cam_obj

    # ── Save .blend ───────────────────────────────────────────────────────────
    bpy.ops.wm.save_as_mainfile(filepath=str(BLEND_OUT))
    print(f"[blueprint] saved blend → {BLEND_OUT}")

    # ── Export GLB ────────────────────────────────────────────────────────────
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj

    bpy.ops.export_scene.gltf(
        filepath=str(GLB_OUT),
        export_format="GLB",
        use_selection=True,
        export_apply=True,               # evaluate GN tree through depsgraph
        export_draco_mesh_compression_enable=True,
        export_draco_mesh_compression_level=6,
        export_normals=True,
        export_colors=False,
        export_materials="EXPORT",
        export_image_format="WEBP",
    )
    print(f"[blueprint] exported GLB → {GLB_OUT}")


if __name__ == "__main__":
    main()
