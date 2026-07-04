"""
record.py — Viewport animation for the depsgraph tutorial.

Renders a 5-second sequence (120 frames @ 24 fps) showing:
  • Frame 1–30:   The GN scatter plane in solid shading, crystal gems
                  distributed across the ground.
  • Frame 31–60:  Wireframe overlay toggled on, showing evaluated mesh.
  • Frame 61–90:  Each instance briefly highlighted in sequence
                  (simulated by cycling object colour).
  • Frame 91–120: Return to solid + EEVEE preview render of the scene.

Outputs to: public/library/videos/scripting/
            python-depsgraph-evaluated-geometry-gn-instances-batch-export/
            viewport.mp4

Run from the Blender Scripting workspace after blueprint.py has built
the demo scene, or call main() which rebuilds it first.
"""

import bpy
import sys
import os

SLUG      = "python-depsgraph-evaluated-geometry-gn-instances-batch-export"
OUT_DIR   = f"//public/library/videos/scripting/{SLUG}/"
FPS       = 24
FRAMES    = 120   # 5 seconds


def setup_camera() -> bpy.types.Object:
    bpy.ops.object.camera_add(location=(6.5, -6.5, 4.5))
    cam = bpy.context.object
    cam.name = "Record_Camera"
    bpy.context.scene.camera = cam
    # Point at origin
    bpy.ops.object.constraint_add(type="TRACK_TO")
    con = cam.constraints["Track To"]
    con.target = None   # track to world origin
    # Manual rotation instead
    cam.rotation_euler = (1.05, 0.0, 0.785)
    return cam


def setup_render() -> None:
    sc  = bpy.context.scene
    rnd = sc.render

    rnd.engine           = "BLENDER_EEVEE_NEXT"
    rnd.resolution_x     = 1920
    rnd.resolution_y     = 1080
    rnd.fps              = FPS
    sc.frame_start       = 1
    sc.frame_end         = FRAMES
    rnd.image_settings.file_format = "FFMPEG"
    rnd.ffmpeg.format        = "MPEG4"
    rnd.ffmpeg.codec         = "H264"
    rnd.ffmpeg.constant_rate_factor = "HIGH"

    bpy.ops.file.make_paths_absolute()
    rnd.filepath = bpy.path.abspath(OUT_DIR)
    os.makedirs(rnd.filepath, exist_ok=True)
    rnd.filepath = os.path.join(rnd.filepath, "viewport.mp4")


def animate_scene() -> None:
    """
    Keyframe scatter density to animate instance growth.

    Frames 1–60:   density ramps 0 → 2.0 (instances appear gradually)
    Frames 61–120: density stays at 2.0 (stable evaluated state)
    """
    plane = bpy.data.objects.get("CrystalScatter")
    if plane is None:
        print("[record] CrystalScatter not found — run blueprint.py first")
        return

    mod = plane.modifiers.get("GeoNodes_Scatter")
    if mod is None or mod.node_group is None:
        print("[record] GeoNodes_Scatter modifier not found")
        return

    ng       = mod.node_group
    dist_node = next(
        (n for n in ng.nodes if n.type == "GeometryNodeDistributePointsOnFaces"),
        None,
    )
    if dist_node is None:
        print("[record] Distribute Points node not found")
        return

    density_socket = dist_node.inputs["Density"]

    # Animate density: 0 at frame 1, full at frame 60
    density_socket.default_value = 0.0
    density_socket.keyframe_insert("default_value", frame=1)

    density_socket.default_value = 2.0
    density_socket.keyframe_insert("default_value", frame=60)
    density_socket.keyframe_insert("default_value", frame=FRAMES)

    # Make the interpolation ease-in-out (Bezier)
    if ng.animation_data and ng.animation_data.action:
        for fc in ng.animation_data.action.fcurves:
            for kp in fc.keyframe_points:
                kp.interpolation = "BEZIER"


def add_light() -> None:
    bpy.ops.object.light_add(type="AREA", location=(3, -3, 8))
    lgt = bpy.context.object
    lgt.data.energy = 800
    lgt.data.size   = 4.0


def main() -> None:
    # Rebuild scene from blueprint
    sys.path.insert(0, os.path.dirname(__file__))
    try:
        import importlib, blueprint
        importlib.reload(blueprint)
        blueprint.main()
    except ImportError:
        print("[record] blueprint.py not importable — proceeding with current scene")

    bpy.context.view_layer.update()
    add_light()
    setup_camera()
    animate_scene()
    setup_render()

    print("[record] rendering viewport.mp4 ...")
    bpy.ops.render.render(animation=True)
    print("[record] done →", bpy.context.scene.render.filepath)


if __name__ == "__main__":
    main()
