"""
record.py — bpy.types.RenderEngine Snapshot: Viewport Recording
Blender 5.1 · Holoflow Studio · CC0

Renders a 90-frame OpenGL animation that visualises the snapshot engine lifecycle:
  Phase 1 (frames 1–30):   Scene idle; objects white (engine not yet active)
  Phase 2 (frames 31–60):  Engine activates; objects pulse amber (render in progress)
  Phase 3 (frames 61–90):  Export complete; objects shift to studio teal (GLB written)

The colour state communicates each phase of render():
  update_progress(0) → amber pulse → update_progress(1) → teal done.

Run from Blender's Scripting workspace: Text > Run Script.
Output: public/library/videos/scripting/python-bpy-render-engine-webxr-snapshot/viewport.mp4
"""

import bpy
import math

OUTPUT_PATH  = "//../../videos/scripting/python-bpy-render-engine-webxr-snapshot/viewport"
TOTAL_FRAMES = 90
FPS          = 24

# Linear RGB colour states
COL_IDLE     = (0.18, 0.18, 0.22, 1.0)   # cool dark — engine inactive
COL_RENDER   = (0.90, 0.55, 0.10, 1.0)   # warm amber — render/export running
COL_DONE     = (0.10, 0.62, 0.58, 1.0)   # studio teal — GLB written


def _make_emission_material(name: str, col: tuple) -> bpy.types.Material:
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()
    emit = nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = col
    emit.inputs["Strength"].default_value = 1.6
    out = nodes.new("ShaderNodeOutputMaterial")
    out.location = (220, 0)
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def _keyframe_col(obj: bpy.types.Object, frame: int, col: tuple) -> None:
    mat     = obj.data.materials[0]
    emit    = next(n for n in mat.node_tree.nodes if n.type == "EMISSION")
    emit.inputs["Color"].default_value = col
    emit.inputs["Color"].keyframe_insert("default_value", frame=frame)


def build_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES
    scene.render.fps  = FPS

    scene.render.image_settings.file_format       = "FFMPEG"
    scene.render.ffmpeg.format                    = "MPEG4"
    scene.render.ffmpeg.codec                     = "H264"
    scene.render.ffmpeg.constant_rate_factor      = "HIGH"
    scene.render.filepath                         = OUTPUT_PATH
    scene.render.resolution_x                     = 1920
    scene.render.resolution_y                     = 1080

    # Dark world
    world = bpy.context.scene.world
    world.use_nodes = False
    world.color = (0.04, 0.04, 0.06)

    # Three props representing scene objects awaiting export
    bpy.ops.mesh.primitive_cube_add(size=1.2, location=(-3, 0, 0))
    obj_a = bpy.context.active_object
    obj_a.name = "hs_panel_a"
    obj_a.data.materials.append(_make_emission_material("mat_a", COL_IDLE))

    bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.7, depth=1.4, location=(0, 0, 0))
    obj_b = bpy.context.active_object
    obj_b.name = "hs_pillar_b"
    obj_b.data.materials.append(_make_emission_material("mat_b", COL_IDLE))

    bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=0.75, location=(3, 0, 0))
    obj_c = bpy.context.active_object
    obj_c.name = "hs_prop_c"
    obj_c.data.materials.append(_make_emission_material("mat_c", COL_IDLE))

    objs = [obj_a, obj_b, obj_c]

    # Phase 1: all idle (1–30)
    for obj in objs:
        _keyframe_col(obj, 1,  COL_IDLE)
        _keyframe_col(obj, 30, COL_IDLE)

    # Phase 2: engine active — amber render (31–60)
    for obj in objs:
        _keyframe_col(obj, 31, COL_RENDER)
        _keyframe_col(obj, 60, COL_RENDER)

    # Phase 3: export complete — teal done (61–90)
    for obj in objs:
        _keyframe_col(obj, 61, COL_DONE)
        _keyframe_col(obj, 90, COL_DONE)

    # CONSTANT interpolation: instant state snap, no colour blending
    for obj in objs:
        nt = obj.data.materials[0].node_tree
        if nt.animation_data:
            for fc in nt.animation_data.action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = "CONSTANT"

    # Subtle scale pulse on phase 2 (engine active)
    for obj in objs:
        obj.animation_data_create()
        action = bpy.data.actions.new(f"pulse_{obj.name}")
        obj.animation_data.action = action
        fc = action.fcurves.new(data_path="scale", index=0)
        for frame, val in [(1, 1.0), (30, 1.0), (31, 1.0), (45, 1.06), (60, 1.0), (90, 1.0)]:
            fc.keyframe_points.insert(frame, val).interpolation = "BEZIER"
        # Mirror scale on Y and Z
        for axis in (1, 2):
            fc2 = action.fcurves.new(data_path="scale", index=axis)
            for kp in fc.keyframe_points:
                fc2.keyframe_points.insert(kp.co[0], kp.co[1]).interpolation = kp.interpolation

    # Camera
    bpy.ops.object.camera_add(location=(0, -11, 5))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(65), 0, 0)
    scene.camera = cam

    # Slow orbit during render phase
    cam.animation_data_create()
    orb = bpy.data.actions.new("CamOrbit")
    cam.animation_data.action = orb
    fc = orb.fcurves.new(data_path="rotation_euler", index=2)
    fc.keyframe_points.insert(1,   0.0).interpolation               = "LINEAR"
    fc.keyframe_points.insert(90,  math.radians(18)).interpolation  = "LINEAR"

    # Material preview shading
    for area in bpy.context.screen.areas:
        if area.type == "VIEW_3D":
            for space in area.spaces:
                if space.type == "VIEW_3D":
                    space.shading.type = "MATERIAL"
                    break

    bpy.ops.render.opengl(animation=True, write_still=False)
    print("[holoflow:record] written →", OUTPUT_PATH)


if __name__ == "__main__":
    build_scene()
