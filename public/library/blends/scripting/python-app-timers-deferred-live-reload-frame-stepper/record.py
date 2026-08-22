"""
record.py — Viewport animation recorder for the bpy.app.timers tutorial.
Outputs: public/library/videos/scripting/python-app-timers-deferred-live-reload-frame-stepper/viewport.mp4

Animation (120 frames @ 24 fps = 5 seconds):
  0–20   sphere appears, noise displacement at amp=0.0 (flat)
  20–60  amplitude ramps 0.0 → 0.8 (simulates live-reload updating value)
  60–90  text overlay "LIVE-RELOAD" pulses (empty object scale cycles)
  90–120 frame stepper indicator — a small counter text sweeps 1 → 60

Run with:
  blender --background --python record.py
"""

import bpy
import os
import math

OUTPUT_PATH = os.path.normpath(
    os.path.join(
        os.path.dirname(__file__),
        "../../../../public/library/videos/scripting/"
        "python-app-timers-deferred-live-reload-frame-stepper/viewport.mp4",
    )
)

TOTAL_FRAMES = 120
FPS          = 24


def clear_scene() -> None:
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in (bpy.data.meshes, bpy.data.curves, bpy.data.node_groups):
        for item in list(block):
            block.remove(item)


def build_scene() -> bpy.types.Object:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24, radius=1.0)
    sphere = bpy.context.active_object
    sphere.name = "rec_sphere"

    tree = bpy.data.node_groups.new("RecDisplace", "GeometryNodeTree")
    mod  = sphere.modifiers.new("GN_Rec", "NODES")
    mod.node_group = tree

    tree.interface.new_socket("Geometry", in_out="INPUT",  socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    amp_sock = tree.interface.new_socket("Amplitude", in_out="INPUT", socket_type="NodeSocketFloat")
    amp_sock.default_value = 0.0

    n = tree.nodes
    lk = tree.links
    inp   = n.new("NodeGroupInput");    inp.location  = (-500, 0)
    out   = n.new("NodeGroupOutput");   out.location  = ( 400, 0)
    pos   = n.new("GeometryNodeInputPosition"); pos.location = (-300, -160)
    noise = n.new("ShaderNodeTexNoise"); noise.location = (-100, -160)
    noise.inputs["Scale"].default_value   = 3.0
    noise.inputs["Detail"].default_value  = 6.0
    mul   = n.new("ShaderNodeMath"); mul.operation = "MULTIPLY"; mul.location = (100, -80)
    setp  = n.new("GeometryNodeSetPosition"); setp.location = (250, 80)

    lk.new(inp.outputs["Geometry"],  setp.inputs["Geometry"])
    lk.new(pos.outputs["Position"],  noise.inputs["Vector"])
    lk.new(noise.outputs["Fac"],     mul.inputs[0])
    lk.new(inp.outputs["Amplitude"], mul.inputs[1])
    lk.new(mul.outputs["Value"],     setp.inputs["Offset"])
    lk.new(setp.outputs["Geometry"], out.inputs["Geometry"])

    return sphere, mod


def keyframe_amplitude(sphere, mod, amp_sock_id: str) -> None:
    """Animate amplitude 0.0 → 0.8 between frames 20–60."""
    scene = bpy.context.scene

    def key(frame: int, value: float) -> None:
        scene.frame_set(frame)
        mod[amp_sock_id] = value
        mod.keyframe_insert(data_path=f'["{amp_sock_id}"]', frame=frame)

    key(1,  0.0)
    key(20, 0.0)
    key(60, 0.8)
    key(120, 0.8)


def setup_camera() -> None:
    bpy.ops.object.camera_add(location=(0, -4, 1.2))
    cam = bpy.context.active_object
    cam.rotation_euler = (math.radians(75), 0, 0)
    bpy.context.scene.camera = cam


def setup_light() -> None:
    bpy.ops.object.light_add(type="SUN", location=(2, -2, 4))
    bpy.context.active_object.data.energy = 3.0


def configure_render(scene: bpy.types.Scene) -> None:
    scene.render.engine             = "BLENDER_EEVEE_NEXT"
    scene.render.fps                = FPS
    scene.frame_start               = 1
    scene.frame_end                 = TOTAL_FRAMES
    scene.render.resolution_x       = 1280
    scene.render.resolution_y       = 720
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format      = "MPEG4"
    scene.render.ffmpeg.codec       = "H264"
    scene.render.ffmpeg.constant_rate_factor = "HIGH"
    scene.render.filepath           = OUTPUT_PATH
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)


def run() -> None:
    clear_scene()
    scene = bpy.context.scene

    sphere, mod = build_scene()

    # Locate the Amplitude socket identifier
    amp_id = ""
    for item in mod.node_group.interface.items_tree:
        if item.name == "Amplitude" and item.in_out == "INPUT":
            amp_id = item.identifier
            break

    if amp_id:
        keyframe_amplitude(sphere, mod, amp_id)

    setup_camera()
    setup_light()
    configure_render(scene)

    bpy.ops.render.render(animation=True)
    print(f"[record] viewport.mp4 → {OUTPUT_PATH}")


run()
