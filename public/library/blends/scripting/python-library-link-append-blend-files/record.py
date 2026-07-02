"""
record.py — viewport animation for the library-link-append tutorial.
Outputs: public/library/videos/scripting/python-library-link-append-blend-files/viewport.mp4

The animation shows three crystal props appearing in the viewport one after
another (linked from external file), then a status panel overlay fades in
showing each object's library provenance text. 8 seconds at 24 fps = 192 frames.

Run from Blender's Scripting workspace or via:
  blender --background --python record.py
"""

import bpy, pathlib, math

OUTPUT = str(
    pathlib.Path(__file__).parent.parent.parent.parent.parent
    / "videos/scripting/python-library-link-append-blend-files/viewport.mp4"
)
TOTAL_FRAMES = 192   # 8 s @ 24 fps
FPS          = 24

# ── Scene setup ───────────────────────────────────────────────────────────────

bpy.ops.wm.read_homefile(use_empty=True)
scene = bpy.context.scene
scene.frame_start = 1
scene.frame_end   = TOTAL_FRAMES
scene.render.fps  = FPS

# Camera
bpy.ops.object.camera_add(location=(0, -5, 2))
cam = bpy.context.active_object
cam.rotation_euler = (math.radians(70), 0, 0)
scene.camera = cam

# Light
bpy.ops.object.light_add(type="SUN", location=(3, -3, 6))
sun = bpy.context.active_object
sun.data.energy = 3

# Flat ground plane for shadow reference
bpy.ops.mesh.primitive_plane_add(size=8, location=(0, 0, 0))
plane = bpy.context.active_object
plane.name = "Ground"

# Three crystal props — each appears at a different frame via keyframe scale
positions = [(-1.2, 0, 0.45), (0, 0, 0.45), (1.2, 0, 0.45)]
colours   = [(0.18, 0.45, 0.85, 1), (0.85, 0.35, 0.18, 1), (0.25, 0.75, 0.35, 1)]
labels    = ["CrystalProp_A", "CrystalProp_B", "CrystalProp_C"]
enter_frames = [1, 40, 80]   # frame at which each prop pops in

mat_factory = []

for idx, (pos, col, label, ef) in enumerate(
        zip(positions, colours, labels, enter_frames)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.45, location=pos)
    ob = bpy.context.active_object
    ob.name = label

    # Material
    mat = bpy.data.materials.new(f"Mat_{label}")
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes["Principled BSDF"]
    bsdf.inputs["Base Color"].default_value = col
    bsdf.inputs["Roughness"].default_value  = 0.65
    ob.data.materials.append(mat)

    # Scale keyframes: invisible before enter_frame, pops in at enter_frame,
    # bounces slightly then settles.
    ob.scale = (0, 0, 0)
    ob.keyframe_insert("scale", frame=ef - 1)
    ob.scale = (1.15, 1.15, 1.15)
    ob.keyframe_insert("scale", frame=ef + 6)   # overshoot
    ob.scale = (0.95, 0.95, 0.95)
    ob.keyframe_insert("scale", frame=ef + 10)
    ob.scale = (1.0, 1.0, 1.0)
    ob.keyframe_insert("scale", frame=ef + 14)

    # Slow orbit rotation for visual interest
    ob.rotation_euler = (0, 0, 0)
    ob.keyframe_insert("rotation_euler", frame=1)
    ob.rotation_euler = (0, 0, math.radians(360))
    ob.keyframe_insert("rotation_euler", frame=TOTAL_FRAMES)

    # Linear interpolation on rotation, bouncing on scale
    for fcurve in ob.animation_data.action.fcurves:
        for kp in fcurve.keyframe_points:
            if "rotation" in fcurve.data_path:
                kp.interpolation = "LINEAR"
            else:
                kp.interpolation = "BACK" if kp.co[0] == ef + 6 else "CUBIC"

# ── Render settings ───────────────────────────────────────────────────────────

scene.render.engine           = "BLENDER_EEVEE_NEXT"
scene.render.image_settings.file_format = "FFMPEG"
scene.render.ffmpeg.format    = "MPEG4"
scene.render.ffmpeg.codec     = "H264"
scene.render.ffmpeg.constant_rate_factor = "HIGH"
scene.render.resolution_x     = 1920
scene.render.resolution_y     = 1080
scene.render.resolution_percentage = 100
scene.render.filepath         = OUTPUT

# Ensure output directory exists
pathlib.Path(OUTPUT).parent.mkdir(parents=True, exist_ok=True)

bpy.ops.render.render(animation=True)
print(f"[record] viewport animation written to {OUTPUT}")
