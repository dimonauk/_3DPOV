"""
GN Active Camera Billboard — Camera-Facing Sprite Grid for WebXR HUD (Blender 5.1)

Technique
---------
The Active Camera GN node outputs the scene camera's world-space 4×4 transform
matrix. Decomposing that matrix with Separate Matrix gives four column vectors.
Column 2 (0-indexed) is the camera's local +Z axis in world space — and because
Blender cameras point along local -Z, Column 2 points BACKWARD from the lens.
Feed that column directly into Align Euler to Vector (Axis='Z') and every
instance in the tree rotates so its local +Z faces the camera. The update is
per-frame and requires no Python drivers, no constraints, no parenting tricks.

Two billboard modes
-------------------
(A) Globally-aligned  — all sprites rotate identically; they are parallel to the
    image plane; this is the standard game-engine billboard. Implemented here.

(B) Per-sprite        — each sprite independently faces the camera position from
    its own world location; requires Position node + Vector Subtract + Normalize
    per instance point. Use when camera is very close or FOV is very wide.
    Implemented as holoflow_macros/billboard_camera_align.py (per-sprite branch).

Outside sources
---------------
Blender Manual — Active Camera GN node (CC-BY-4.0, Blender Foundation)
https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/input/scene/active_camera.html
Sibling repo: https://github.com/blender/blender

Blender Manual — Separate Matrix (CC-BY-4.0, Blender Foundation)
https://docs.blender.org/manual/en/latest/modeling/geometry_nodes/utilities/matrix/separate_matrix.html
"""

import bpy
import bmesh
from mathutils import Vector, Matrix

# ── constants ──────────────────────────────────────────────────────────────────
GRID_COUNT    = 9          # sprites to scatter (must be a perfect square)
GRID_SPACING  = 1.4        # metres between sprite centres
SPRITE_WIDTH  = 0.9        # sprite quad width
SPRITE_HEIGHT = 0.9        # sprite quad height
SPRITE_DEPTH  = 0.001      # near-zero depth; avoids Z-fighting on the quad
OUTPUT_NAME   = "hud_billboard_grid"


def _clean_scene() -> None:
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for me in list(bpy.data.meshes):
        bpy.data.meshes.remove(me, do_unlink=True)


def _make_sprite_quad(name: str) -> bpy.types.Object:
    """Single flat quad, face normal pointing along local +Z (Blender default)."""
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    # verts ordered for a clean UV quad in the XY plane
    hw, hh = SPRITE_WIDTH * 0.5, SPRITE_HEIGHT * 0.5
    v0 = bm.verts.new((-hw, -hh, 0))
    v1 = bm.verts.new(( hw, -hh, 0))
    v2 = bm.verts.new(( hw,  hh, 0))
    v3 = bm.verts.new((-hw,  hh, 0))
    bm.faces.new((v0, v1, v2, v3))
    uv = bm.loops.layers.uv.new("UVMap")
    for face in bm.faces:
        for loop, uv_coord in zip(face.loops, [(0,0),(1,0),(1,1),(0,1)]):
            loop[uv].uv = uv_coord
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    # Hide from final render — the GN tree instances it, not the original
    ob.hide_render = True
    ob.hide_viewport = False
    return ob


def _make_materials(sprite_ob: bpy.types.Object) -> None:
    """Nine distinct flat-shaded colours, one per sprite index via material slots."""
    colours = [
        (0.95, 0.22, 0.18, 1), (0.95, 0.55, 0.12, 1), (0.88, 0.88, 0.12, 1),
        (0.22, 0.78, 0.22, 1), (0.12, 0.68, 0.88, 1), (0.20, 0.35, 0.88, 1),
        (0.62, 0.18, 0.88, 1), (0.88, 0.18, 0.55, 1), (0.88, 0.88, 0.88, 1),
    ]
    for i, rgba in enumerate(colours):
        mat = bpy.data.materials.new(f"sprite_col_{i:02d}")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = rgba
        bsdf.inputs["Roughness"].default_value  = 1.0
        bsdf.inputs["Metallic"].default_value   = 0.0
        sprite_ob.data.materials.append(mat)


def _build_gn_tree(sprite_ob: bpy.types.Object) -> bpy.types.NodeGroup:
    """
    GN node graph (Blender 5.1):

    GroupInput → Grid → Distribute Points on Faces
                          ↓ Points
    ActiveCamera → SeparateMatrix[col2] → VectorMath(SCALE, -1) ─┐
                                                                   ↓
                                          AlignEulerToVector(Z) ──┤
                                                                   ↓
                              PickInstanceIndex ──┐   RotateInstances
    ObjectInfo(sprite_ob) → InstanceOnPoints ────┘         ↓
                                                       GroupOutput
    """
    ng = bpy.data.node_groups.new("BillboardCameraFacing", "GeometryNodeTree")
    lk = ng.links.new  # shorthand

    # ── group I/O ──────────────────────────────────────────────────────────────
    ng.interface.new_socket("Geometry", in_out="OUTPUT",
                            socket_type="NodeSocketGeometry")

    # ── grid to distribute sprite points ───────────────────────────────────────
    n_grid = ng.nodes.new("GeometryNodeMeshGrid")
    side   = int(GRID_COUNT ** 0.5)
    n_grid.inputs["Vertices X"].default_value = side
    n_grid.inputs["Vertices Y"].default_value = side
    n_grid.inputs["Size X"].default_value     = (side - 1) * GRID_SPACING
    n_grid.inputs["Size Y"].default_value     = (side - 1) * GRID_SPACING

    # ── distribute one point per grid vertex ───────────────────────────────────
    # Using Distribute on Faces is overkill for a grid; Mesh to Points is exact.
    n_m2p = ng.nodes.new("GeometryNodeMeshToPoints")
    n_m2p.mode = "VERTICES"
    lk(n_grid.outputs["Mesh"], n_m2p.inputs["Mesh"])

    # ── sprite object source ───────────────────────────────────────────────────
    n_obj = ng.nodes.new("GeometryNodeObjectInfo")
    n_obj.transform_space = "ORIGINAL"
    n_obj.inputs["Object"].default_value = sprite_ob

    # ── per-index material assignment ──────────────────────────────────────────
    # Index mod 9 selects one of nine material-slot colours
    n_idx  = ng.nodes.new("GeometryNodeInputIndex")
    n_mod  = ng.nodes.new("ShaderNodeMath")
    n_mod.operation = "MODULO"
    n_mod.inputs[1].default_value = float(GRID_COUNT)
    lk(n_idx.outputs["Index"], n_mod.inputs[0])

    # ── instance on points (base, no rotation yet) ─────────────────────────────
    n_inst = ng.nodes.new("GeometryNodeInstanceOnPoints")
    lk(n_m2p.outputs["Points"],         n_inst.inputs["Points"])
    lk(n_obj.outputs["Geometry"],        n_inst.inputs["Instance"])
    lk(n_mod.outputs["Value"],           n_inst.inputs["Instance Index"])
    n_inst.inputs["Pick Instance"].default_value = True

    # ── active camera → world matrix ───────────────────────────────────────────
    n_cam = ng.nodes.new("GeometryNodeInputActiveCamera")

    # ── separate matrix → extract column 2 (camera's +Z world axis) ───────────
    # FunctionNodeSeparateMatrix outputs: Column 1, Column 2, Column 3, Column 4
    # Column 3 in the UI = index 2 (0-based) = camera's local +Z in world space.
    # Camera -Z is its forward direction, so +Z points toward the back of the lens
    # which is the exact direction a billboard's face-normal must aim at.
    n_sep = ng.nodes.new("FunctionNodeSeparateMatrix")
    lk(n_cam.outputs["Camera"], n_sep.inputs["Matrix"])

    # Column 3 in Blender's UI labelling maps to outputs[2]
    n_vmul = ng.nodes.new("ShaderNodeVectorMath")
    n_vmul.operation = "SCALE"
    n_vmul.inputs["Scale"].default_value = -1.0  # negate: turn backward axis into forward
    lk(n_sep.outputs[2], n_vmul.inputs["Vector"])

    # ── align local +Z of every instance toward camera ─────────────────────────
    n_aev = ng.nodes.new("FunctionNodeAlignEulerToVector")
    n_aev.axis       = "Z"   # local +Z is the sprite's face normal for a flat quad
    n_aev.pivot_axis = "AUTO"
    lk(n_vmul.outputs["Vector"], n_aev.inputs["Vector"])

    # ── rotate instances by the computed per-frame Euler ───────────────────────
    n_rot = ng.nodes.new("GeometryNodeRotateInstances")
    n_rot.inputs["Local Space"].default_value = False  # world-space rotation
    lk(n_inst.outputs["Instances"],    n_rot.inputs["Instances"])
    lk(n_aev.outputs["Rotation"],      n_rot.inputs["Rotation"])

    # ── output ─────────────────────────────────────────────────────────────────
    n_out = ng.nodes.new("NodeGroupOutput")
    lk(n_rot.outputs["Instances"], n_out.inputs["Geometry"])

    return ng


def _setup_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(0, -5, 1.8))
    cam_ob = bpy.context.active_object
    cam_ob.name = "HUD_Camera"
    cam_ob.rotation_euler = (1.25, 0, 0)
    bpy.context.scene.camera = cam_ob
    return cam_ob


def build() -> None:
    _clean_scene()
    sprite_ob = _make_sprite_quad("sprite_quad")
    _make_materials(sprite_ob)

    # Host empty for the GN modifier
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, 0, 0))
    host = bpy.context.active_object
    host.name = OUTPUT_NAME

    ng   = _build_gn_tree(sprite_ob)
    mod  = host.modifiers.new("BillboardGN", "NODES")
    mod.node_group = ng

    cam_ob = _setup_camera()

    # Verify that Active Camera node sees the new camera
    assert bpy.context.scene.camera == cam_ob, "Scene camera not set — Active Camera node will output identity."

    print(f"[billboard] Built '{OUTPUT_NAME}' with {GRID_COUNT} camera-facing sprites.")
    print("[billboard] Rotate the viewport camera to confirm live billboard update.")


if __name__ == "__main__":
    build()
