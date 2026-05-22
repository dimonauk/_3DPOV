"""
record.py — viewport animation for Animation Drivers / Parametric Shader
=========================================================================
Blender 5.1 | Holoflow Studio | CC0

Renders a 5-second clip where the crystal shard pulses from dormant (dark)
to full glow (bright cyan) and back, demonstrating the energy_level driver
live in the viewport. Camera orbits slowly during the pulse for depth.

Duration: 5 s (150 frames @ 30 fps)
Pulse: energy_level 0 → 1 → 0 over the 150-frame window (peak at frame 75)
Orbit: camera rotates 30° in azimuth over the clip

Run (after blueprint.py has built the scene):
    blender crystal_shard.blend --python record.py
Or standalone:
    blender --background --python record.py
"""

from pathlib import Path
import math
import bpy
import bmesh

# ─── parameters ───────────────────────────────────────────────────────────────
FPS         = 30
DURATION_S  = 5
TOTAL_F     = FPS * DURATION_S          # 150

OUT_DIR     = Path(__file__).parent.parent.parent.parent.parent / "videos" / "animation" / "animation-drivers-parametric-shader"
VIDEO_OUT   = OUT_DIR / "viewport.mp4"

BASE_COLOUR = (0.04, 0.06, 0.12, 1.0)
EMIT_COLOUR = (0.20, 0.95, 0.80, 1.0)
EMIT_SCALE  = 4.0
ENERGY_PROP = "energy_level"

CAMERA_DIST  = 3.5
CAMERA_ELEV  = 15.0   # degrees
ORBIT_RANGE  = 30.0   # degrees of azimuth sweep over clip


# ─── scene rebuild ────────────────────────────────────────────────────────────

def build_scene() -> bpy.types.Object:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.fps    = FPS
    scene.frame_start   = 1
    scene.frame_end     = TOTAL_F

    # Key light — angled to show facets
    bpy.ops.object.light_add(type="SUN", location=(5, -5, 10))
    sun = bpy.context.active_object
    sun.data.energy = 4.0
    sun.data.angle  = 0.008

    # Crystal shard
    mesh = bpy.data.meshes.new("crystal_shard")
    obj  = bpy.data.objects.new("crystal_shard", mesh)
    scene.collection.objects.link(obj)

    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=0, radius=0.55)
    bm.to_mesh(mesh)
    bm.free()
    for v in mesh.vertices:
        v.co.z *= 2.2
    mesh.update()
    for poly in mesh.polygons:
        poly.use_smooth = False

    # Material with emission
    mat = bpy.data.materials.new("CrystalEnergyMat")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    n_out  = nodes.new("ShaderNodeOutputMaterial");  n_out.location  = (400, 0)
    n_mix  = nodes.new("ShaderNodeMixShader");       n_mix.location  = (200, 0)
    n_pbr  = nodes.new("ShaderNodeBsdfPrincipled");  n_pbr.location  = (0, -120)
    n_emit = nodes.new("ShaderNodeEmission");        n_emit.location = (0, 80)

    n_pbr.inputs["Base Color"].default_value   = BASE_COLOUR
    n_pbr.inputs["Metallic"].default_value     = 0.6
    n_pbr.inputs["Roughness"].default_value    = 0.15
    n_emit.inputs["Color"].default_value       = EMIT_COLOUR
    n_emit.inputs["Strength"].default_value    = 0.0

    links.new(n_pbr.outputs["BSDF"],      n_mix.inputs[1])
    links.new(n_emit.outputs["Emission"], n_mix.inputs[2])
    links.new(n_mix.outputs["Shader"],    n_out.inputs["Surface"])
    obj.data.materials.append(mat)

    # Custom property
    obj[ENERGY_PROP] = 0.0
    ui = obj.id_properties_ui(ENERGY_PROP)
    ui.update(min=0.0, max=1.0, default=0.0)

    # Wire drivers
    def _drv(fcurve, expr):
        d = fcurve.driver
        d.type = 'SCRIPTED'
        d.expression = expr
        v = d.variables.new()
        v.name = "energy"; v.type = 'SINGLE_PROP'
        t = v.targets[0]
        t.id_type = 'OBJECT'; t.id = obj
        t.data_path = f'["{ENERGY_PROP}"]'

    _drv(n_emit.inputs["Strength"].driver_add("default_value"), f"energy * {EMIT_SCALE}")
    _drv(n_mix.inputs["Fac"].driver_add("default_value"), "energy")

    return obj


# ─── camera ───────────────────────────────────────────────────────────────────

def setup_camera() -> bpy.types.Object:
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj
    cam_data.lens = 55

    def place_cam(frame: int, azimuth_deg: float) -> None:
        bpy.context.scene.frame_set(frame)
        elev = math.radians(CAMERA_ELEV)
        azim = math.radians(azimuth_deg)
        cam_obj.location = (
            CAMERA_DIST * math.cos(elev) * math.cos(azim),
            CAMERA_DIST * math.cos(elev) * math.sin(azim),
            CAMERA_DIST * math.sin(elev) + 0.5,  # centre on tall shard
        )
        cam_obj.rotation_euler = (math.pi / 2 - elev, 0.0, math.pi + azim)
        cam_obj.keyframe_insert(data_path="location")
        cam_obj.keyframe_insert(data_path="rotation_euler")

    place_cam(1,      45.0)
    place_cam(TOTAL_F, 45.0 + ORBIT_RANGE)

    for fc in cam_obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'

    return cam_obj


# ─── energy pulse keyframes ───────────────────────────────────────────────────

def animate_pulse(obj: bpy.types.Object) -> None:
    """
    Pulse: dark (frame 1) → peak glow (frame 75) → dark (frame 150).
    The driver graph reads energy_level each frame and updates emission in
    real time — this is what the viewport animation captures.
    """
    for frame, value in [(1, 0.0), (TOTAL_F // 2, 1.0), (TOTAL_F, 0.0)]:
        obj[ENERGY_PROP] = value
        obj.keyframe_insert(data_path=f'["{ENERGY_PROP}"]', frame=frame)

    action = obj.animation_data.action
    for fc in action.fcurves:
        if fc.data_path == f'["{ENERGY_PROP}"]':
            for kp in fc.keyframe_points:
                kp.interpolation = 'BEZIER'
                kp.easing        = 'EASE_IN_OUT'


# ─── render ───────────────────────────────────────────────────────────────────

def configure_render() -> None:
    scene  = bpy.context.scene
    render = scene.render

    render.resolution_x              = 1920
    render.resolution_y              = 1080
    render.resolution_percentage     = 100
    render.image_settings.file_format = "FFMPEG"
    render.ffmpeg.format              = "MPEG4"
    render.ffmpeg.codec               = "H264"
    render.ffmpeg.constant_rate_factor = "HIGH"
    render.filepath = str(VIDEO_OUT)

    OUT_DIR.mkdir(parents=True, exist_ok=True)


# ─── main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    obj = build_scene()
    setup_camera()
    animate_pulse(obj)
    configure_render()
    bpy.ops.render.render(animation=True)
    print(f"[record] viewport.mp4 → {VIDEO_OUT}")


if __name__ == "__main__":
    main()
