"""
record.py — Viewport animation: conduit tubes grow in from zero radius.

Technique
---------
Animates the profile circle's Radius socket from near-zero to TUBE_RADIUS over
FRAME_END frames. Because the modifier is NOT applied, the GN tree evaluates
live each frame and the tubes grow smoothly.

Run this script BEFORE blueprint.py (or in a fresh scene) so the GN modifier
is still active. After recording, run blueprint.py to apply and export the GLB.

Output
------
  public/library/videos/geometry-nodes/
    gn-mesh-to-curve-curve-to-mesh-pipe-network-webxr/viewport.mp4
"""

import bpy
import math

# ── Settings ─────────────────────────────────────────────────────────────────
FRAME_START: int   = 1
FRAME_END: int     = 72       # 3 s at 24 fps
TUBE_RADIUS: float = 0.014
ANGLE_THRESHOLD    = math.radians(20.0)

RENDER_FPS: int    = 24
RESOLUTION_X: int  = 1920
RESOLUTION_Y: int  = 1080

OUTPUT_PATH: str = "//../../videos/geometry-nodes/gn-mesh-to-curve-curve-to-mesh-pipe-network-webxr/viewport.mp4"

GRID_X, GRID_Y    = 6, 4
GRID_SCALE: float = 2.0

MATERIAL_FRAME    = "HF_Panel_Frame"
MATERIAL_CONDUIT  = "HF_Conduit_Metal"
NG_NAME           = "ConduitNetworkGN"
MOD_NAME          = "ConduitNetwork"
OBJ_NAME          = "panel_frame"


def ensure_material(name, colour=(0.5, 0.5, 0.5, 1.0)):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    if not mat.use_nodes:
        mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = colour
        bsdf.inputs["Metallic"].default_value   = 0.85
        bsdf.inputs["Roughness"].default_value  = 0.35
    return mat


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for col in [bpy.data.meshes, bpy.data.curves, bpy.data.node_groups,
                bpy.data.materials]:
        for item in list(col):
            col.remove(item)


def build_live_scene():
    """Build panel + GN modifier (NOT applied) ready for viewport animation."""
    clear_scene()

    mat_frame   = ensure_material(MATERIAL_FRAME,   (0.08, 0.10, 0.14, 1.0))
    mat_conduit = ensure_material(MATERIAL_CONDUIT, (0.48, 0.50, 0.54, 1.0))

    bpy.ops.mesh.primitive_grid_add(
        x_subdivisions=GRID_X,
        y_subdivisions=GRID_Y,
        size=GRID_SCALE,
        location=(0.0, 0.0, 0.0),
    )
    panel = bpy.context.active_object
    panel.name = OBJ_NAME
    panel.data.materials.append(mat_frame)

    # Import and run the node tree builder from blueprint.py.
    # If running standalone, inline the build here instead.
    import importlib, sys, os
    bp_dir = os.path.dirname(__file__)
    if bp_dir not in sys.path:
        sys.path.insert(0, bp_dir)
    import blueprint as bp
    ng  = bp.build_node_tree(mat_conduit)
    mod = panel.modifiers.new(MOD_NAME, "NODES")
    mod.node_group = ng
    return panel, ng


def setup_camera():
    bpy.ops.object.camera_add(location=(3.2, -3.2, 2.8))
    cam = bpy.context.active_object
    cam.name = "RecordCam"
    cam.rotation_euler = (1.05, 0.0, 0.785)
    bpy.context.scene.camera = cam


def animate_tube_radius(ng: bpy.types.GeometryNodeTree):
    """Keyframe the profile circle Radius from near-zero to TUBE_RADIUS."""
    profile = next(
        (nd for nd in ng.nodes if nd.bl_idname == "GeometryNodeCurvePrimitiveCircle"),
        None,
    )
    if profile is None:
        print("[HF record] Warning: profile circle node not found — no animation.")
        return

    radius_sock = profile.inputs["Radius"]
    radius_sock.default_value = 0.001
    radius_sock.keyframe_insert("default_value", frame=FRAME_START)
    radius_sock.default_value = TUBE_RADIUS
    radius_sock.keyframe_insert("default_value", frame=FRAME_END)


def setup_render():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps  = RENDER_FPS

    scene.render.resolution_x = RESOLUTION_X
    scene.render.resolution_y = RESOLUTION_Y

    scene.render.filepath = bpy.path.abspath(OUTPUT_PATH)
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format  = "MPEG4"
    scene.render.ffmpeg.codec   = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"


def add_light():
    bpy.ops.object.light_add(type="SUN", location=(4, 4, 8))
    sun = bpy.context.active_object
    sun.data.energy = 3.0
    sun.rotation_euler = (0.7, 0.0, 0.5)


if __name__ == "__main__":
    panel, ng = build_live_scene()
    setup_camera()
    add_light()
    animate_tube_radius(ng)
    setup_render()
    bpy.ops.render.opengl(animation=True)
    print(f"[HF] Viewport render complete → {OUTPUT_PATH}")
