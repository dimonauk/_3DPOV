"""
record.py — bpy.msgbus Reactive Property Subscriptions: Viewport Render
Blender 5.1 · Holoflow Studio · CC0

Renders a 90-frame sequence showing three objects transitioning colour as their
holoflow.dirty flag toggles on (via msgbus callback) and off (after export).
Run from Blender's Scripting workspace: Text > Run Script.
Output: public/library/videos/scripting/python-msgbus-reactive-property-subscriptions/viewport.mp4

The recording technique:
  Frame 1-30   — all objects grey (dirty=False, facet=False)
  Frame 31-60  — sphere + cylinder orange (dirty=True after facet=True set)
  Frame 61-90  — all objects back to grey (dirty cleared after export flush)
Colour is baked into vertex colours per frame via a shape-key-less approach:
  we keyframe the material emission colour directly on the object's material.
"""

import bpy
import math

OUTPUT_PATH   = "//../../videos/scripting/python-msgbus-reactive-property-subscriptions/viewport"
TOTAL_FRAMES  = 90
FPS           = 24

# Colour palette (linear RGB)
COL_IDLE      = (0.18, 0.18, 0.22, 1.0)   # dark grey — not dirty
COL_DIRTY     = (0.85, 0.42, 0.05, 1.0)   # warm orange — dirty, queued
COL_FACET     = (0.12, 0.55, 0.82, 1.0)   # studio blue — facet=True


def _make_emission_material(name: str, col: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = col
    emit.inputs["Strength"].default_value = 1.5
    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (200, 0)
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def _keyframe_colour(obj: bpy.types.Object, frame: int, col: tuple) -> None:
    """Insert emission colour keyframe on frame for obj's first material."""
    mat = obj.data.materials[0]
    emit_node = next(n for n in mat.node_tree.nodes if n.type == "EMISSION")
    emit_node.inputs["Color"].default_value = col
    emit_node.inputs["Color"].keyframe_insert("default_value", frame=frame)


def build_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES
    scene.render.fps  = FPS

    # Output settings for opengl animation capture
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format              = "MPEG4"
    scene.render.ffmpeg.codec               = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath                   = OUTPUT_PATH
    scene.render.resolution_x              = 1920
    scene.render.resolution_y              = 1080

    # World
    bpy.data.worlds["World"].use_nodes = False
    scene.world.color = (0.05, 0.05, 0.08)

    # Objects
    positions = [(0, 0, 0), (3.0, 0, 0), (-3.0, 0, 0)]
    names     = ["hs_cube", "hs_sphere", "hs_cylinder"]
    prims     = []

    bpy.ops.mesh.primitive_cube_add(size=1.5, location=positions[0])
    cube = bpy.context.active_object
    cube.name = names[0]
    prims.append(cube)

    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6,
                                          radius=0.9, location=positions[1])
    sphere = bpy.context.active_object
    sphere.name = names[1]
    prims.append(sphere)

    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.7,
                                         depth=1.4, location=positions[2])
    cyl = bpy.context.active_object
    cyl.name = names[2]
    prims.append(cyl)

    # Assign materials
    for obj in prims:
        mat = _make_emission_material(f"mat_{obj.name}", COL_IDLE)
        obj.data.materials.clear()
        obj.data.materials.append(mat)

    # Keyframe: frames 1-30 all idle
    for obj in prims:
        _keyframe_colour(obj, 1,  COL_IDLE)
        _keyframe_colour(obj, 30, COL_IDLE)

    # Frames 31-60: sphere and cylinder become dirty (orange)
    _keyframe_colour(prims[0], 31, COL_IDLE)    # cube stays idle
    _keyframe_colour(prims[1], 31, COL_DIRTY)   # sphere: dirty
    _keyframe_colour(prims[2], 31, COL_DIRTY)   # cylinder: dirty
    _keyframe_colour(prims[0], 60, COL_IDLE)
    _keyframe_colour(prims[1], 60, COL_DIRTY)
    _keyframe_colour(prims[2], 60, COL_DIRTY)

    # Frames 61-90: cube picks up facet=True (blue), others exported → idle
    _keyframe_colour(prims[0], 61, COL_FACET)   # cube: facet active
    _keyframe_colour(prims[1], 61, COL_IDLE)    # sphere: exported, clean
    _keyframe_colour(prims[2], 61, COL_IDLE)    # cylinder: exported, clean
    _keyframe_colour(prims[0], 90, COL_FACET)
    _keyframe_colour(prims[1], 90, COL_IDLE)
    _keyframe_colour(prims[2], 90, COL_IDLE)

    # Set all fcurves to CONSTANT interpolation to snap, not blend
    for obj in prims:
        mat = obj.data.materials[0]
        if mat.node_tree.animation_data:
            for fc in mat.node_tree.animation_data.action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = "CONSTANT"

    # Camera
    bpy.ops.object.camera_add(location=(0, -10, 4))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(70), 0, 0)
    scene.camera = cam

    # Orbit rotation on camera around Z (Y-up world axis)
    cam.animation_data_create()
    action = bpy.data.actions.new("CameraOrbit")
    cam.animation_data.action = action
    fc = action.fcurves.new(data_path="rotation_euler", index=2)
    fc.keyframe_points.insert(1,   0.0).interpolation = "LINEAR"
    fc.keyframe_points.insert(90,  math.radians(20)).interpolation = "LINEAR"

    # Render shading: Material Preview shows emission correctly
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            for space in area.spaces:
                if space.type == "VIEW_3D":
                    space.shading.type = "MATERIAL"

    # Render
    bpy.ops.render.opengl(animation=True, write_still=False)
    print("[holoflow:record] viewport.mp4 written to:", OUTPUT_PATH)


if __name__ == "__main__":
    build_scene()
