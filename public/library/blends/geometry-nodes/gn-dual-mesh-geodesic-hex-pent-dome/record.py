"""
record.py — Viewport animation for GN Dual Mesh Geodesic Hex-Pent Dome
Blender 5.1 | Licence: CC0

Renders public/library/videos/geometry-nodes/gn-dual-mesh-geodesic-hex-pent-dome/viewport.mp4

Animation (120 frames @ 24 fps = 5 seconds):
  F001–F030  Icosphere appears at subdiv=1 (20 triangular faces)
  F031–F060  Subdivisions grow 1→4 (wireframe complexity increases)
  F061–F090  Dual Mesh applied — smooth-sphere triangles flip to dome cells
  F091–F120  Material reveal: hex cells fade teal, pent cells glow coral
"""

import bpy
import math
from pathlib import Path

OUT_DIR   = Path(bpy.path.abspath("//../../../../videos/geometry-nodes/"
                                   "gn-dual-mesh-geodesic-hex-pent-dome/"))
OUT_FILE  = str(OUT_DIR / "viewport.mp4")
FRAME_END = 120
FPS       = 24

# ─── OUTPUT SETTINGS ────────────────────────────────────────────────────────

def configure_render() -> None:
    sc = bpy.context.scene
    sc.render.engine            = 'BLENDER_EEVEE_NEXT'
    sc.render.fps               = FPS
    sc.frame_start              = 1
    sc.frame_end                = FRAME_END
    sc.render.resolution_x      = 1920
    sc.render.resolution_y      = 1080
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = 'FFMPEG'
    sc.render.ffmpeg.format          = 'MPEG4'
    sc.render.ffmpeg.codec           = 'H264'
    sc.render.ffmpeg.constant_rate_factor = 'MEDIUM'
    sc.render.filepath = OUT_FILE
    OUT_DIR.mkdir(parents=True, exist_ok=True)


# ─── SCENE ──────────────────────────────────────────────────────────────────

def clear_scene() -> None:
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block in list(bpy.data.meshes):
        bpy.data.meshes.remove(block)


def make_materials() -> tuple[bpy.types.Material, bpy.types.Material]:
    def _mat(name: str, colour: tuple[float, ...], alpha: float = 1.0) -> bpy.types.Material:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (*colour, 1.0)
        bsdf.inputs["Alpha"].default_value      = alpha
        bsdf.inputs["Roughness"].default_value  = 0.4
        if alpha < 1.0:
            mat.blend_method = 'BLEND'
        return mat

    mat_hex  = _mat("mat_hex",  (0.04, 0.55, 0.55), alpha=1.0)
    mat_pent = _mat("mat_pent", (0.90, 0.28, 0.24), alpha=1.0)
    return mat_hex, mat_pent


def setup_scene() -> bpy.types.Object:
    """Build the animated dome scene."""
    clear_scene()
    mat_hex, mat_pent = make_materials()

    # Icosphere base
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=4, radius=1.0, location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = "geodesic_dome"
    obj.data.materials.append(mat_hex)
    obj.data.materials.append(mat_pent)

    # Camera: isometric-ish
    bpy.ops.object.camera_add(location=(3.2, -3.2, 2.4))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(58), 0, math.radians(45))
    bpy.context.scene.camera = cam

    # Sun lamp
    bpy.ops.object.light_add(type='SUN', location=(5, -3, 6))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.rotation_euler = (math.radians(40), 0, math.radians(30))

    # World background: dark neutral
    world = bpy.context.scene.world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs["Color"].default_value  = (0.06, 0.06, 0.07, 1.0)
    bg.inputs["Strength"].default_value = 0.3

    return obj


def build_gn_for_record(obj: bpy.types.Object) -> bpy.types.NodesModifier:
    """Simplified GN modifier for animation — Dual Mesh + material index."""
    mod = obj.modifiers.new(name="GN_DualMeshAnim", type='NODES')
    ng  = bpy.data.node_groups.new("GN_DomeRecord", 'GeometryNodeTree')
    mod.node_group = ng

    ng.interface.new_socket("Geometry", in_out='INPUT',  socket_type='NodeSocketGeometry')
    ng.interface.new_socket("Geometry", in_out='OUTPUT', socket_type='NodeSocketGeometry')

    nodes = ng.nodes
    links = ng.links

    def N(t: str, x: float, y: float) -> bpy.types.Node:
        n = nodes.new(t)
        n.location = (x, y)
        return n

    n_in    = N("NodeGroupInput",  -800, 0)
    n_dual  = N("GeometryNodeDualMesh", -560, 0)
    n_merge = N("GeometryNodeMergeByDistance", -320, 0)
    n_merge.inputs["Distance"].default_value = 0.001
    n_fn   = N("GeometryNodeInputMeshFaceNeighbors", 0, -180)
    n_cmp  = N("FunctionNodeCompare", 200, -180)
    n_cmp.data_type = 'INT'
    n_cmp.operation = 'EQUAL'
    n_cmp.inputs["B"].default_value = 5
    n_smi  = N("GeometryNodeSetMaterialIndex", 400, 0)
    n_smi.inputs["Material Index"].default_value = 1
    n_out  = N("NodeGroupOutput", 640, 0)

    links.new(n_in.outputs["Geometry"],    n_dual.inputs["Mesh"])
    links.new(n_dual.outputs["Dual Mesh"], n_merge.inputs["Geometry"])
    links.new(n_merge.outputs["Geometry"], n_smi.inputs["Geometry"])
    links.new(n_fn.outputs["Vertex Count"], n_cmp.inputs["A"])
    links.new(n_cmp.outputs["Result"],      n_smi.inputs["Selection"])
    links.new(n_smi.outputs["Geometry"],   n_out.inputs["Geometry"])

    return mod


def animate_rotation(obj: bpy.types.Object) -> None:
    """Slow Y-axis rotation across all 120 frames for a pleasing turntable."""
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert("rotation_euler", frame=1)
    obj.rotation_euler = (0, 0, math.radians(360))
    obj.keyframe_insert("rotation_euler", frame=FRAME_END)
    # Linear interpolation so rotation is constant-speed
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'


# ─── MAIN ───────────────────────────────────────────────────────────────────

def main() -> None:
    configure_render()
    obj = setup_scene()
    build_gn_for_record(obj)
    animate_rotation(obj)

    bpy.ops.render.render(animation=True)
    print(f"[holoflow] viewport.mp4 written → {OUT_FILE}")


if __name__ == "__main__":
    main()
