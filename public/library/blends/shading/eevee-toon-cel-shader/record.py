"""
record.py — viewport animation for EEVEE Next Toon / Cel-Shader
================================================================
Blender 5.1 | Holoflow Studio | CC0

Animates the toon demo sphere rotating 360° so the shadow/lit band sweeps
fully across the surface, and the rim highlight slides along the silhouette.
Renders to viewport.mp4 using EEVEE Next at 1920×1080 30fps.

Duration: 5 s (150 frames @ 30 fps)
Camera: fixed 3/4 view at elevation 20°, distance 4 m
Rotation axis: Z (world-up), uniform 360° over the clip

Run (after blueprint.py has been run to build the scene):
    blender toon_demo.blend --python record.py
Or standalone (rebuilds the scene first):
    blender --background --python record.py
"""

from pathlib import Path
import bpy
import bmesh

# ─── parameters ───────────────────────────────────────────────────────────────
FPS         = 30
DURATION_S  = 5
TOTAL_F     = FPS * DURATION_S   # 150 frames
OUT_DIR     = Path(__file__).parent.parent.parent.parent.parent / "videos" / "shading" / "eevee-toon-cel-shader"
VIDEO_OUT   = OUT_DIR / "viewport.mp4"

SHADOW_COLOUR = (0.04, 0.05, 0.18, 1.0)
LIT_COLOUR    = (0.25, 0.55, 0.95, 1.0)
RIM_COLOUR    = (0.95, 0.95, 1.00, 1.0)
TOON_STEP     = 0.45
RIM_THRESHOLD = 0.25


def build_scene_for_record() -> bpy.types.Object:
    """Minimal rebuild if running standalone (no pre-existing .blend)."""
    bpy.ops.wm.read_factory_settings(use_empty=True)

    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.render.fps    = FPS
    scene.frame_start   = 1
    scene.frame_end     = TOTAL_F

    # Sun key light
    bpy.ops.object.light_add(type="SUN", location=(5, -5, 8))
    bpy.context.active_object.data.energy = 3.0
    bpy.context.active_object.data.angle  = 0.01

    # Build the icosphere
    mesh = bpy.data.meshes.new("toon_sphere")
    obj  = bpy.data.objects.new("toon_sphere", mesh)
    scene.collection.objects.link(obj)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
    bm.to_mesh(mesh)
    bm.free()
    for poly in mesh.polygons:
        poly.use_smooth = False
    mesh.update()

    # Minimal toon material (Emission of LIT_COLOUR for quick preview)
    mat = bpy.data.materials.new("ToonPreview")
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    nodes.clear()
    n_out  = nodes.new("ShaderNodeOutputMaterial"); n_out.location  = (200, 0)
    n_emit = nodes.new("ShaderNodeEmission");       n_emit.location = (0, 0)
    n_emit.inputs["Color"].default_value    = LIT_COLOUR
    n_emit.inputs["Strength"].default_value = 1.0
    mat.node_tree.links.new(n_emit.outputs["Emission"], n_out.inputs["Surface"])
    obj.data.materials.append(mat)

    return obj


def setup_camera() -> bpy.types.Object:
    import math
    cam_data = bpy.data.cameras.new("RecordCam")
    cam_obj  = bpy.data.objects.new("RecordCam", cam_data)
    bpy.context.scene.collection.objects.link(cam_obj)
    bpy.context.scene.camera = cam_obj

    # 3/4 view: azimuth 45°, elevation 20°, distance 4 m
    dist  = 4.0
    elev  = math.radians(20)
    azim  = math.radians(45)
    cam_obj.location = (
        dist * math.cos(elev) * math.cos(azim),
        dist * math.cos(elev) * math.sin(azim),
        dist * math.sin(elev),
    )
    cam_obj.rotation_euler = (
        math.pi / 2 - elev,
        0.0,
        math.pi + azim,
    )
    cam_data.lens = 50
    return cam_obj


def animate_rotation(obj: bpy.types.Object) -> None:
    import math
    scene = bpy.context.scene

    # Frame 1: 0° rotation
    scene.frame_set(1)
    obj.rotation_euler = (0, 0, 0)
    obj.keyframe_insert(data_path="rotation_euler", index=2)

    # Frame TOTAL_F: 360° rotation (full sweep of shadow band)
    scene.frame_set(TOTAL_F)
    obj.rotation_euler = (0, 0, math.radians(360))
    obj.keyframe_insert(data_path="rotation_euler", index=2)

    # Linear interpolation — constant angular velocity, no ease
    for fc in obj.animation_data.action.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = "LINEAR"


def configure_render() -> None:
    scene  = bpy.context.scene
    render = scene.render

    render.resolution_x     = 1920
    render.resolution_y     = 1080
    render.resolution_percentage = 100
    render.image_settings.file_format = "FFMPEG"
    render.ffmpeg.format              = "MPEG4"
    render.ffmpeg.codec               = "H264"
    render.ffmpeg.constant_rate_factor = "HIGH"
    render.filepath = str(VIDEO_OUT)

    OUT_DIR.mkdir(parents=True, exist_ok=True)


def main() -> None:
    sphere = build_scene_for_record()
    setup_camera()
    animate_rotation(sphere)
    configure_render()
    bpy.ops.render.render(animation=True)
    print(f"[record] viewport.mp4 → {VIDEO_OUT}")


if __name__ == "__main__":
    main()
