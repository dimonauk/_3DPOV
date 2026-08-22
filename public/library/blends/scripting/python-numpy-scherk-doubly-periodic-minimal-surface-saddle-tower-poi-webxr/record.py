"""
Scherk Doubly-Periodic Minimal Surface — Viewport Recording Script
===================================================================
Generates  public/library/videos/scripting/
           python-numpy-scherk-doubly-periodic-minimal-surface-saddle-tower-poi-webxr/
           viewport.mp4

Run AFTER blueprint.py (the poi head object must already exist in the scene).
Duration: 150 frames / 5 s @ 30 fps.

Sequence
--------
F  1 – 50  : 360° orbit at 22° elevation showing the Basis saddle shape
F 51 – 100 : shape-key morph  Basis → Scherk_Dense (period halves → denser lattice)
F101 – 150 : counter-orbit back while morphing Scherk_Dense → Scherk_Shallow
"""

import bpy, math

# ── Constants ────────────────────────────────────────────────────────────────
TOTAL_FRAMES = 150
FPS          = 30
ORBIT_R      = 0.32      # camera orbit radius in metres
ELEV_DEG     = 22        # camera elevation angle
LENS_MM      = 80        # focal length
OUT_PATH     = "//../../videos/scripting/" \
               "python-numpy-scherk-doubly-periodic-minimal-surface-saddle-tower-poi-webxr/" \
               "viewport.mp4"

def get_poi() -> bpy.types.Object:
    candidates = [o for o in bpy.data.objects if o.type == "MESH"]
    if not candidates:
        raise RuntimeError("No mesh found — run blueprint.py first.")
    return candidates[0]

def set_world_black() -> None:
    world = bpy.data.worlds.get("World") or bpy.data.worlds.new("World")
    world.use_nodes = True
    bg = world.node_tree.nodes.get("Background") or \
         world.node_tree.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = (0.0, 0.0, 0.0, 1.0)
    bg.inputs["Strength"].default_value = 0.0
    bpy.context.scene.world = world

def place_camera(frame: int, angle_deg: float) -> None:
    cam_name = "RecordCam"
    if cam_name not in bpy.data.objects:
        cam_data = bpy.data.cameras.new(cam_name)
        cam_data.lens = LENS_MM
        cam_obj = bpy.data.objects.new(cam_name, cam_data)
        bpy.context.scene.collection.objects.link(cam_obj)
        bpy.context.scene.camera = cam_obj
    cam_obj = bpy.data.objects[cam_name]
    rad = math.radians(angle_deg)
    elev = math.radians(ELEV_DEG)
    x = ORBIT_R * math.cos(rad) * math.cos(elev)
    y = -ORBIT_R * math.sin(rad) * math.cos(elev)   # Blender Y-forward
    z = ORBIT_R * math.sin(elev)
    cam_obj.location = (x, y, z)
    # Point camera at origin
    import mathutils
    direction = mathutils.Vector((0, 0, 0)) - mathutils.Vector((x, y, z))
    rot = direction.to_track_quat("-Z", "Y")
    cam_obj.rotation_euler = rot.to_euler()
    cam_obj.keyframe_insert("location", frame=frame)
    cam_obj.keyframe_insert("rotation_euler", frame=frame)

def set_shape_key_values(obj: bpy.types.Object, frame: int,
                         vals: dict) -> None:
    """
    Set shape key influence values at a given frame.
    vals: {key_name: 0.0–1.0}
    """
    if obj.data.shape_keys is None:
        return
    for kb in obj.data.shape_keys.key_blocks:
        v = vals.get(kb.name, 0.0)
        kb.value = v
        kb.keyframe_insert("value", frame=frame)

def build_keyframes(poi: bpy.types.Object) -> None:
    # ── Phase 1 (F1–50): full orbit, Basis surface ──────────────────────────
    for f in range(1, 51):
        angle = 360.0 * (f - 1) / 49
        place_camera(f, angle)
    set_shape_key_values(poi, 1,  {"Basis": 1.0})
    set_shape_key_values(poi, 50, {"Basis": 1.0})

    # ── Phase 2 (F51–100): orbit continues, morph Basis → Dense ─────────────
    for f in range(51, 101):
        angle = 360.0 + 360.0 * (f - 51) / 49
        place_camera(f, angle)
    alpha = 0.0
    for f in range(51, 101):
        alpha = (f - 51) / 49.0
        set_shape_key_values(poi, f, {
            "Basis":        max(0.0, 1.0 - 2 * alpha),
            "Scherk_Dense": min(1.0, 2 * alpha),
        })

    # ── Phase 3 (F101–150): counter-orbit, morph Dense → Shallow ────────────
    for f in range(101, 151):
        angle = 720.0 - 360.0 * (f - 101) / 49
        place_camera(f, angle)
    for f in range(101, 151):
        alpha = (f - 101) / 49.0
        set_shape_key_values(poi, f, {
            "Scherk_Dense":   max(0.0, 1.0 - 2 * alpha),
            "Scherk_Shallow": min(1.0, 2 * alpha),
        })

def setup_render() -> None:
    scene = bpy.context.scene
    scene.frame_start = 1
    scene.frame_end   = TOTAL_FRAMES
    scene.render.fps  = FPS

    # Workbench renderer — vertex colours, flat shading, fast
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light   = "FLAT"
    scene.display.shading.color_type = "VERTEX"
    scene.display.shading.show_shadows = False

    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.filepath     = OUT_PATH
    scene.render.image_settings.file_format = "FFMPEG"
    scene.render.ffmpeg.format = "MPEG4"
    scene.render.ffmpeg.codec  = "H264"
    scene.render.ffmpeg.constant_rate_factor = "MEDIUM"
    scene.render.ffmpeg.audio_codec = "NONE"

def main() -> None:
    poi = get_poi()
    set_world_black()
    build_keyframes(poi)
    setup_render()
    # Uncomment to render immediately (or run via CLI):
    # bpy.ops.render.render(animation=True)
    print("✓ Record keyframes set.  Run: bpy.ops.render.render(animation=True)")
    print(f"  Output → {OUT_PATH}")

main()
