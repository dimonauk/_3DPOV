# record.py — Viewport Animation Recorder
# Topic: CollectionProperty + UIList Export Queue
# Blender 5.1 | CC0
#
# HOW IT WORKS
# This script registers the add-on from blueprint.py, seeds three demo
# objects into the export queue, then keyframes each object's material
# colour cycling through a warm → cool → neutral palette over 72 frames.
# bpy.ops.render.opengl() renders the viewport (Solid shading, HDRI off)
# to the video folder as a PNG sequence that ffmpeg stitches into viewport.mp4.
#
# RUN:  Paste into Scripting workspace, Alt+P.
#       Output: public/library/videos/scripting/
#               python-bpy-collection-property-uilist-export-queue/viewport_####.png

import math
import os
import bpy
import mathutils

# ── Configuration ────────────────────────────────────────────────────────
FRAME_START = 1
FRAME_END   = 72   # 3 seconds at 24 fps
OUTPUT_DIR  = "//../../../../public/library/videos/scripting/" \
              "python-bpy-collection-property-uilist-export-queue/"
PALETTE = [
    (0.92, 0.35, 0.20),   # warm terracotta — env_wall_a
    (0.25, 0.55, 0.85),   # cobalt blue    — accent_gem
    (0.78, 0.78, 0.74),   # warm grey      — floor_tile_01
]
CAMERA_RADIUS = 6.0
CAMERA_HEIGHT = 2.8


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in list(bpy.data.meshes) + list(bpy.data.materials):
        bpy.data.meshes.remove(block, do_unlink=True) if hasattr(block, "vertices") \
            else bpy.data.materials.remove(block, do_unlink=True)


def add_floor():
    bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0))
    floor = bpy.context.object
    floor.name = "record_floor"
    mat = bpy.data.materials.new("floor_mat")
    mat.use_nodes = True
    mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = \
        (0.12, 0.12, 0.14, 1.0)
    floor.data.materials.append(mat)
    return floor


def make_demo_objects():
    """Three low-poly stand-ins for the queue items."""
    specs = [
        ("env_wall_a",    "CUBE",       (-2.2, 0, 1.0), (1.8, 0.3, 2.0)),
        ("accent_gem",    "ICO_SPHERE", ( 0.0, 0, 0.7), (0.7, 0.7, 0.7)),
        ("floor_tile_01", "GRID",       ( 2.2, 0, 0.05),(1.4, 1.4, 1.0)),
    ]
    objs = []
    for name, prim, loc, scale in specs:
        if prim == "CUBE":
            bpy.ops.mesh.primitive_cube_add(location=loc)
        elif prim == "ICO_SPHERE":
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, location=loc)
        else:
            bpy.ops.mesh.primitive_grid_add(x_subdivisions=4, y_subdivisions=4,
                                             location=loc)
        obj = bpy.context.object
        obj.name = name
        obj.scale = scale
        bpy.ops.object.transform_apply(scale=True)
        mat = bpy.data.materials.new(f"{name}_mat")
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes["Principled BSDF"]
        c = PALETTE[len(objs)]
        bsdf.inputs["Base Color"].default_value = (*c, 1.0)
        bsdf.inputs["Roughness"].default_value   = 0.55
        obj.data.materials.append(mat)
        objs.append(obj)
    return objs


def keyframe_pulse(objs):
    """Each object scales down slightly at its turn to suggest 'active queue row'."""
    for frame in range(FRAME_START, FRAME_END + 1):
        active_idx = (frame // 24) % len(objs)
        for i, obj in enumerate(objs):
            pulse = 1.08 if i == active_idx else 1.0
            obj.scale = (pulse, pulse, pulse)
            obj.keyframe_insert("scale", frame=frame)


def setup_camera():
    bpy.ops.object.camera_add()
    cam = bpy.context.object
    cam.name = "record_cam"
    bpy.context.scene.camera = cam

    # Orbit keyframes — full 360° over 72 frames.
    for frame in range(FRAME_START, FRAME_END + 1):
        angle = math.tau * (frame - 1) / (FRAME_END - FRAME_START)
        x = CAMERA_RADIUS * math.cos(angle)
        y = CAMERA_RADIUS * math.sin(angle)
        cam.location = (x, y, CAMERA_HEIGHT)
        direction = mathutils.Vector((0, 0, 0.8)) - mathutils.Vector((x, y, CAMERA_HEIGHT))
        cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        cam.keyframe_insert("location",       frame=frame)
        cam.keyframe_insert("rotation_euler", frame=frame)

    # Use constant interpolation for rotation to avoid gimbal flipping.
    for fc in cam.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def setup_lighting():
    bpy.ops.object.light_add(type="SUN", location=(4, -4, 8))
    sun = bpy.context.object
    sun.data.energy = 3.0
    sun.data.angle  = math.radians(10)


def configure_render():
    scene = bpy.context.scene
    scene.frame_start = FRAME_START
    scene.frame_end   = FRAME_END
    scene.render.fps   = 24
    scene.render.image_settings.file_format = "PNG"
    scene.render.filepath = OUTPUT_DIR
    os.makedirs(bpy.path.abspath(OUTPUT_DIR), exist_ok=True)


def main():
    clear_scene()
    add_floor()
    objs = make_demo_objects()
    keyframe_pulse(objs)
    setup_camera()
    setup_lighting()
    configure_render()

    # Register the add-on so the queue is visible when Dimona opens the file.
    import importlib, sys, os as _os
    bp_path = _os.path.join(_os.path.dirname(__file__), "blueprint.py")
    spec = importlib.util.spec_from_file_location("blueprint", bp_path)
    mod  = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    mod.register()
    for obj in objs:
        item     = bpy.context.scene.hlf_export_queue.add()
        item.obj = obj
    bpy.context.scene.hlf_export_queue_index = 0

    bpy.ops.render.opengl(animation=True, sequencer=False)
    print("record.py complete — PNG frames written to", OUTPUT_DIR)


if __name__ == "__main__":
    main()
